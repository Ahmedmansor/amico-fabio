const contact=document.getElementById('whatsapp-wrapper');
if(contact){
 const synchronize=()=>{contact.dataset.contactMotion=String(!document.hidden);};
 document.addEventListener('visibilitychange',synchronize);
 synchronize();
}
