import {it,expect} from 'vitest';
import {channelDestination} from '../channel';
it('keeps a missing channel unavailable and accepts a real channel destination',()=>{
  expect(channelDestination('')).toBeNull();expect(channelDestination('  ')).toBeNull();
  expect(channelDestination('https://whatsapp.com/channel/ExampleChannel123')).toBe('https://whatsapp.com/channel/ExampleChannel123');
});
it('rejects ordinary chats, unsafe hosts and malformed destinations',()=>{
  for(const url of ['https://wa.me/201063239261','https://evil.test/channel/Test','javascript:alert(1)','http://whatsapp.com/channel/Test','https://whatsapp.com/channel/Test?redirect=evil','https://user@whatsapp.com/channel/Test','https://whatsapp.com/channel/'])
    expect(()=>channelDestination(url)).toThrow();
});
