import {it,expect} from 'vitest';
import {catalogMessage,successfulSubmission,validateWelcome} from '../welcome';
import copy from '../../data/content/it.json';
it('retains the original Italian WhatsApp template',()=>{expect(catalogMessage('Mario',copy.message)).toBe('Ciao Fabio! Sono Mario. Ho visto il tuo sito e voglio il catalogo VIP.');});
it('only acknowledged successful HTTP submissions continue to WhatsApp',()=>{expect(successfulSubmission(true,{result:'success'})).toBe(true);for(const [ok,result]of [[false,{result:'success'}],[true,{result:'error'}],[true,{}],[true,null],[true,{success:false}]] as const)expect(successfulSubmission(ok,result)).toBe(false);});
it('validates campaign language, source images and public endpoint',()=>{expect(validateWelcome(copy,['it','en'],true)).toEqual(copy);expect(()=>validateWelcome(copy,['en'],true)).toThrow(/language/);expect(()=>validateWelcome(copy,['it'],false)).toThrow(/image/);expect(()=>validateWelcome({...copy,scriptUrl:''},['it'],true)).toThrow(/scriptUrl/);});
