import fs from 'node:fs';
import {resolve} from 'node:path';
import copy from './content/it.json' with {type:'json'};
import {validateWelcome} from '../domain/welcome.ts';
import {supportedLocales} from '../../../shared/config/languages.ts';
export function getWelcome(){return validateWelcome(copy,supportedLocales,['bg.jpeg','bg-mobile.jpg','portrait.webp','placeholder.webp'].every(name=>fs.existsSync(resolve('src/features/welcome/presentation/assets',name))));}
