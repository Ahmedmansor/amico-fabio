import { readAuthConfig } from './config';
import { readLocaleBrowserConfig } from './locale-browser-config';
// Explicit browser Auth settings only. No catalog env loading or key reuse.
export const authConfig = readAuthConfig(import.meta.env);
export const localeBrowserConfig = readLocaleBrowserConfig(import.meta.env, authConfig);
