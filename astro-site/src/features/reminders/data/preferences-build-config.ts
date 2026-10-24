import {authConfig} from '../../auth/data/build-config';
import {readPreferenceBrowserConfig} from './preferences-browser-config';
export const preferenceBrowserConfig = readPreferenceBrowserConfig(import.meta.env, authConfig);
