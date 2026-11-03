import {siteConfig} from '../../../shared/config/site';
import {getSharedMessages} from '../../../shared/i18n/shared';
import type {Locale} from '../../../shared/config/languages';
import {channelDestination} from '../domain/channel';
export function getWhatsAppChannel(locale:Locale){
  const messages=getSharedMessages(locale);
  return {name:'Fabio Egypt',url:channelDestination(siteConfig.whatsapp.channelUrl),copy:messages.whatsappChannel,subtitle:messages.global.brand_subtitle};
}
