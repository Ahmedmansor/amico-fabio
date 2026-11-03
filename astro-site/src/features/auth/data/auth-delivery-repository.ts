import type {DeliveryAdmission} from './auth-send-email-handler.ts';
import {withDeadline} from './hook-transport.ts';

interface RpcResult {data: unknown; error: unknown}
interface RpcRequest extends PromiseLike<RpcResult> {abortSignal(signal: AbortSignal): PromiseLike<RpcResult>}
export function createAuthDeliveryRepository(
  backend: {rpc(name: string, args: Record<string, unknown>): RpcRequest},
  limits: {hourly: number; daily: number; perEmail: number; cooldownSeconds: number},
) {
  if (![limits.hourly, limits.daily].every(value => Number.isInteger(value) && value >= 1 && value <= 300)
    || !Number.isInteger(limits.perEmail) || limits.perEmail < 1 || limits.perEmail > 20
    || !Number.isInteger(limits.cooldownSeconds) || limits.cooldownSeconds < 60 || limits.cooldownSeconds > 3600) throw new Error('Invalid limits');
  const call = async (name: string, args: Record<string, unknown>) => {
    const result = await withDeadline(async signal => await backend.rpc(name, args).abortSignal(signal), 600);
    if (result.error) throw new Error('Ledger unavailable');
    return result.data;
  };
  return {
    async reserve(input: {email: string; deliveryKey: string}): Promise<DeliveryAdmission> {
      const data = await call('reserve_auth_email', {
        p_email: input.email, p_delivery_key: input.deliveryKey,
        p_max_hourly: limits.hourly, p_max_daily: limits.daily,
        p_max_per_email: limits.perEmail, p_cooldown_seconds: limits.cooldownSeconds,
      });
      if (!data || typeof data !== 'object' || !('outcome' in data)) throw new Error('Invalid admission');
      if (data.outcome === 'send' && 'attemptId' in data && typeof data.attemptId === 'string'
        && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(data.attemptId)) return {outcome: 'send', attemptId: data.attemptId};
      if (data.outcome === 'accepted' || data.outcome === 'blocked' || data.outcome === 'uncertain') return {outcome: data.outcome};
      throw new Error('Invalid admission');
    },
    async settle(input: {deliveryKey: string; attemptId: string; state: string; messageId?: string}): Promise<boolean> {
      return await call('finish_auth_email', {
        p_delivery_key: input.deliveryKey, p_attempt_id: input.attemptId,
        p_state: input.state, p_message_id: input.messageId ?? null,
      }) === true;
    },
  };
}
