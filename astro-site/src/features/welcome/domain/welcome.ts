export interface WelcomeCampaign {id:string;locale:string;path:string;title:string;description:string;pending:string;error:string;message:string;scriptUrl:string}
export function validateWelcome(campaign:WelcomeCampaign,locales:readonly string[],assetsPresent:boolean){
 for(const [key,value]of Object.entries(campaign))if(typeof value!=='string'||!value.trim())throw new Error(`[campaign:welcome] Missing ${key}.`);
 if(!locales.includes(campaign.locale)||!campaign.path.startsWith('/'))throw new Error('[campaign:welcome] Invalid language/path.');
 if(!assetsPresent)throw new Error('[campaign:welcome] Missing linked source image.');
 if(!campaign.message.includes('{name}'))throw new Error('[campaign:welcome] Missing message name field.');
 if(!campaign.scriptUrl.startsWith('https://script.google.com/macros/s/'))throw new Error('[campaign:welcome] Invalid Google Apps Script endpoint.');
 return campaign;
}
export const catalogMessage=(name:string,template:string)=>template.replace('{name}',name);
export function successfulSubmission(ok:boolean,result:unknown){
 if(!ok||!result||typeof result!=='object')return false;
 const data=result as Record<string,unknown>;
 return data.result==='success'||data.status==='success'||data.success===true;
}
