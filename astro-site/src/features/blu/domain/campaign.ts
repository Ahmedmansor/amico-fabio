import type {Locale} from '../../../shared/config/languages';
import {campaignLanguagePaths} from '../../../shared/config/campaigns';

export const bluLocales = ['it', 'en'] as const satisfies readonly Locale[];
export type BluLocale = typeof bluLocales[number];
export const bluId = 'red-sea-cartoon';
export const bluPaths = campaignLanguagePaths.blu;
export const passphrase = 'SEGRETO-BIKINI';
export const experienceIds = ['sponge','squid','patrick','treasure','puff'] as const;
export type ExperienceId = typeof experienceIds[number];

export function isBluLocale(value: unknown): value is BluLocale {
  return bluLocales.some(locale => locale === value);
}

export function validateCampaign(content: Record<string, unknown>, locale: string): void {
  if (!isBluLocale(locale)) throw new Error(`[blu:${locale}] Unsupported campaign locale.`);
  for (const [field,value] of Object.entries(content)) {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`[blu:${locale}] Invalid required field ${field}.`);
  }
  if (!String(content.waDefaultMsg).includes(passphrase)) throw new Error(`[blu:${locale}] waDefaultMsg is missing the passphrase.`);
  if (!String(content.selectionStatus).includes('{experience}')) throw new Error(`[blu:${locale}] selectionStatus is missing {experience}.`);
}

export function buildBluMessage(message: string, selectedLabel: string, experience?: string): string {
  return experience ? `${message}\n${selectedLabel}: ${experience}` : message;
}

export function buildBluWhatsApp(number: string, message: string): string {
  if (!/^\d{8,15}$/.test(number)) throw new Error('[blu] Invalid WhatsApp contact number.');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export type MotionPreference = 'auto' | 'lite' | 'full';
export interface MotionSignals { reducedMotion: boolean; saveData: boolean; cores?: number; memory?: number }
/** Missing browser hints are neutral. No user-agent/device-size classification. */
export function canEnhanceMotion(preference: MotionPreference, signals: MotionSignals): boolean {
  if (preference === 'lite' || signals.reducedMotion || signals.saveData) return false;
  if (preference === 'full') return true;
  return !(signals.cores !== undefined && signals.cores < 4) && !(signals.memory !== undefined && signals.memory < 4);
}

/** A short visible-tab sample must have enough frames; tolerate occasional dropped frames. */
export function smoothFrameSample(intervals: readonly number[]): boolean {
  if (intervals.length < 20) return false;
  const slow = intervals.filter(ms => ms > 34).length;
  return slow / intervals.length < 0.15 && intervals.reduce((sum,ms) => sum+ms,0)/intervals.length < 26;
}
