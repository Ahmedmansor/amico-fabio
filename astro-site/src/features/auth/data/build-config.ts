import { readAuthConfig } from './config';
// Explicit browser Auth settings only. No catalog env loading or key reuse.
export const authConfig = readAuthConfig(import.meta.env);
