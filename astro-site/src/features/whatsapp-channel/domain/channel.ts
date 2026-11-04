/** A missing channel is an intentional coming-soon state, never a fake link. */
export function channelDestination(value: string): string | null {
  if(!value.trim())return null;
  const url=new URL(value);
  if(url.protocol!=='https:'||!['whatsapp.com','www.whatsapp.com'].includes(url.hostname)
    ||url.username||url.password||url.port||url.search||url.hash
    ||!/^\/channel\/[a-zA-Z0-9]+\/?$/.test(url.pathname))
    throw new Error('[whatsapp-channel] Expected an HTTPS WhatsApp channel URL.');
  return url.href;
}
