import type { PublicationPolicy } from '../domain/models';

/** Captured once per module context; no environment/clock access in domain. */
export function createPublicationPolicy(settings: { dev: boolean; includeFixtures?: string; noindex?: string; githubActions?: string }, evaluatedAt = Date.now()): PublicationPolicy {
  const requested = settings.includeFixtures === '1';
  const preview = settings.noindex === '1' && settings.githubActions !== 'true';
  if (requested && !settings.dev && !preview) {
    throw new Error('[blog] Fixture opt-in requires local dev or an approved noindex preview; production refuses it.');
  }
  return { evaluatedAt, includeFixtures: settings.dev || (requested && preview) };
}
