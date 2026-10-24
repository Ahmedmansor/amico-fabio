import { authConfig } from '../../auth/data/build-config';
import { getTrips } from '../../tours/data/trips.mjs';
import { getPackages } from '../../packages/data/packages.mjs';
import { favoriteKey } from '../domain/wishlist';
import type { Locale } from '../../../shared/config/languages';
import { readAccountSyncFlag } from './config.ts';

export const accountSyncEnabled=readAccountSyncFlag(import.meta.env.PUBLIC_WISHLIST_ACCOUNT_SYNC_ENABLED,!!authConfig);
export async function getWishlistBootstrap(locale:Locale){
  if(!accountSyncEnabled || !authConfig)return null;
  const [trips,packages]=await Promise.all([getTrips(),getPackages()]);
  return {locale,auth:authConfig,publishedIds:[...trips.map((trip:{id:string})=>favoriteKey('trip',trip.id)),...packages.map((item:{id:string})=>favoriteKey('package',item.id))]};
}
