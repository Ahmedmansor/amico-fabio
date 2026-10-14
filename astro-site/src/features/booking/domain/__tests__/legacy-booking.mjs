import fs from 'node:fs';import vm from 'node:vm';
export function legacyBooking(state,source,addons,copy,locale) {
 let total='€0';const context={window:{},localStorage:{getItem(){return locale;}},document:{documentElement:{lang:locale},getElementById(id){return id==='live-total-price'?{get textContent(){return total;},set textContent(value){total=value;}}:null;}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../../../../../../assets/js/modules/booking-manager.js',import.meta.url),'utf8'),context);
 const manager=context.window.BookingManager;
 manager.state={tripId:state.id,langData:{title:state.title},apiData:source,adults:state.adults,children:state.children,selectedAddons:new Set(state.selectedAddons),addons:addons.map(a=>({addon_id:a.id,price:String(a.price),label_it:a.labels.it,label_en:a.labels.en})),formData:state.formData};
 const amount=manager.calculateTotal();const message=manager._generateWhatsAppMessage(manager.state,{global:{whatsapp:copy}},state.kind==='package');return {amount,message};
}
