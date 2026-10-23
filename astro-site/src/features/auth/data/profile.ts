import type { User } from '@supabase/supabase-js';
import type { AccountSession } from '../domain/auth.ts';

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
function googleAvatar(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port
      || !url.hostname.endsWith('.googleusercontent.com')) return null;
    return url.href;
  } catch { return null; }
}

/** Provider metadata is presentation only, never an authorization/ownership source. */
export function accountSession(user: Pick<User, 'id' | 'email' | 'user_metadata'>): AccountSession {
  const metadata = user.user_metadata ?? {};
  return { userId: user.id, profile: {
    displayName: text(metadata.full_name) ?? text(metadata.name),
    email: text(user.email),
    avatarUrl: googleAvatar(metadata.avatar_url) ?? googleAvatar(metadata.picture),
  } };
}
