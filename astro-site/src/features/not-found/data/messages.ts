import {getSharedMessages} from '../../../shared/i18n/shared';
import {supportedLocales} from '../../../shared/config/languages';
import {validateNotFound} from '../domain/not-found';
export function getNotFoundMessages(){return supportedLocales.map(locale=>({locale,text:validateNotFound(getSharedMessages(locale).notFound,locale)}));}
