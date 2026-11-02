import type {Locale} from '../../../shared/config/languages.ts';

interface AuthEmailCopy {
  signupSubject:string; signInSubject:string; signupTitle:string; signInTitle:string;
  greeting:string; signupIntro:string; signInIntro:string; signupButton:string; signInButton:string;
  validityNotice:string; codeLabel:string; codeHelp:string; alternative:string; ignoreNotice:string; fallbackText:string;
}
const messages={
  it:{
    signupSubject:'Conferma il tuo account - Fabio Egypt',signInSubject:'Il tuo codice di accesso - Fabio Egypt',signupTitle:'Conferma il tuo indirizzo email',signInTitle:'Accedi a Fabio Egypt',greeting:'Ciao,',
    signupIntro:'Hai richiesto un account Fabio Egypt. Conferma il tuo indirizzo email per accedere e gestire i tuoi preferiti.',signInIntro:'Abbiamo ricevuto una richiesta di accesso al tuo account Fabio Egypt per salvare e gestire i tuoi preferiti.',signupButton:'Conferma email',signInButton:'Accedi ora',
    validityNotice:'Il codice e il link alternativo sono validi una sola volta e scadono a breve. Usando uno, l’altro non sarà più valido.',codeLabel:'Il tuo codice monouso',codeHelp:'Inserisci questo codice nella pagina in cui hai richiesto l’email. Puoi leggere il messaggio da un altro dispositivo. Non condividere il codice.',alternative:'In alternativa, questo link effettua l’accesso nel browser in cui lo apri:',ignoreNotice:'Se non hai richiesto questo link, puoi ignorare questa email in tutta sicurezza.',fallbackText:'Se il pulsante non funziona, copia e incolla questo indirizzo nel tuo browser:'
  },
  en:{
    signupSubject:'Confirm your account - Fabio Egypt',signInSubject:'Your sign-in code - Fabio Egypt',signupTitle:'Confirm your email address',signInTitle:'Sign in to Fabio Egypt',greeting:'Hello,',
    signupIntro:'You requested a Fabio Egypt account. Confirm your email address to sign in and manage your favorites.',signInIntro:'We received a request to sign in to your Fabio Egypt account to save and manage your favorites.',signupButton:'Confirm email',signInButton:'Sign in now',
    validityNotice:'The code and alternative link are single-use and expire shortly. Using either consumes this confirmation.',codeLabel:'Your one-time code',codeHelp:'Enter this code on the page where you requested the email. You can read this message on another device. Do not share the code.',alternative:'Alternatively, this link signs in the browser where you open it:',ignoreNotice:'If you did not request this link, you can safely ignore this email.',fallbackText:'If the button does not work, copy and paste this link into your browser:'
  },
  es:{
    signupSubject:'Confirma tu cuenta - Fabio Egypt',signInSubject:'Tu código de acceso - Fabio Egypt',signupTitle:'Confirma tu dirección de correo electrónico',signInTitle:'Inicia sesión en Fabio Egypt',greeting:'Hola,',
    signupIntro:'Has solicitado una cuenta de Fabio Egypt. Confirma tu correo electrónico para iniciar sesión y gestionar tus favoritos.',signInIntro:'Hemos recibido una solicitud de acceso a tu cuenta de Fabio Egypt para guardar y gestionar tus favoritos.',signupButton:'Confirmar correo',signInButton:'Iniciar sesión',
    validityNotice:'El código y el enlace alternativo son de un solo uso y caducan pronto. Al utilizar uno, el otro deja de ser válido.',codeLabel:'Tu código de un solo uso',codeHelp:'Introduce este código en la página donde solicitaste el correo. Puedes leer este mensaje en otro dispositivo. No compartas el código.',alternative:'Como alternativa, este enlace inicia sesión en el navegador donde lo abras:',ignoreNotice:'Si no has solicitado este enlace, puedes ignorar este correo con tranquilidad.',fallbackText:'Si el botón no funciona, copia y pega este enlace en tu navegador:'
  },
  pt:{
    signupSubject:'Confirme a sua conta - Fabio Egypt',signInSubject:'O seu código de acesso - Fabio Egypt',signupTitle:'Confirme o seu endereço de e-mail',signInTitle:'Iniciar sessão na Fabio Egypt',greeting:'Olá,',
    signupIntro:'Pediu uma conta Fabio Egypt. Confirme o seu endereço de e-mail para iniciar sessão e gerir os seus favoritos.',signInIntro:'Recebemos um pedido para iniciar sessão na sua conta Fabio Egypt e guardar e gerir os seus favoritos.',signupButton:'Confirmar e-mail',signInButton:'Iniciar sessão',
    validityNotice:'O código e a ligação alternativa são de utilização única e expiram em breve. Ao utilizar um, o outro deixa de ser válido.',codeLabel:'O seu código de utilização única',codeHelp:'Introduza este código na página onde pediu o e-mail. Pode ler esta mensagem noutro dispositivo. Não partilhe o código.',alternative:'Em alternativa, esta ligação inicia sessão no navegador onde a abrir:',ignoreNotice:'Se não pediu esta ligação, pode ignorar este e-mail em segurança.',fallbackText:'Se o botão não funcionar, copie e cole esta ligação no seu navegador:'
  },
} satisfies Record<Locale,AuthEmailCopy>;
export function getAuthEmailCopy(locale:Locale,signup:boolean){
  const m=messages[locale];
  return {...m,subject:signup?m.signupSubject:m.signInSubject,title:signup?m.signupTitle:m.signInTitle,intro:signup?m.signupIntro:m.signInIntro,buttonText:signup?m.signupButton:m.signInButton};
}
