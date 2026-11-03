import {normalizeEmail} from '../../auth/domain/auth.ts';
import {isPreferenceRequestId} from './preferences.ts';
export interface RenderedWishlistEmail {subject:string;htmlContent:string;textContent:string}
export interface WishlistDelivery {deliveryId:string;recipient:string;content:RenderedWishlistEmail}
export type WishlistDeliveryResult=
  | {status:'accepted';messageId:string}
  | {status:'rejected';reason:'invalid-input'|'recipient-not-allowed'|'provider-rejected'|'unavailable'}
  | {status:'deferred';retryAfterSeconds:number|null}
  | {status:'unknown'};
export interface WishlistDeliveryPort {send(input:WishlistDelivery):Promise<WishlistDeliveryResult>}

export function validWishlistDelivery(input:WishlistDelivery):boolean {
  return !!input && isPreferenceRequestId(input.deliveryId) && typeof input.recipient==='string' && normalizeEmail(input.recipient)===input.recipient
    && !!input.content && typeof input.content.subject==='string' && !!input.content.subject.trim()
    && !/[\r\n]/.test(input.content.subject)
    && typeof input.content.htmlContent==='string' && !!input.content.htmlContent.trim()
    && typeof input.content.textContent==='string' && !!input.content.textContent.trim();
}
export function validatedMailAddress(input:string):string {
  const email=normalizeEmail(input);
  if(!email||email!==input)throw new Error('[wishlist-email] Invalid configured mail address.');
  return email;
}
