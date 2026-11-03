// Test oracle executes the real legacy form handler without DOM or external requests.
import fs from 'node:fs';
import vm from 'node:vm';
export function legacyForm(input) {
 const fields={name:input.name,date:input.date,people:input.people};const errors=new Set(),events=[];let url;
 const context={encodeURIComponent,document:{getElementById:id=>id.endsWith('-error')?{classList:{add(){errors.add(id);},remove(){errors.delete(id);}}}:{value:fields[id.replace('lsh-','')]}},window:{open(value){url=value;},gtag(...args){events.push(args);}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../../../../../../src/landing-sharm/components/BookingFormWidget.js',import.meta.url),'utf8').replace(/export default [^;]+;/,''),context);
 vm.runInContext('BookingFormWidget._handleSubmit();',context);
 return {url,errors:[...errors],events};
}
