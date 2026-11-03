import { defaultLocale, supportedLocales, type Locale } from '../config/languages.ts';
import { validateTranslations } from './validate.ts';

type SetupMessages = {
  title: string;
  status: string;
};

export const setupMessages = {
  it: {
    title: 'Fabio Egypt — Astro',
    status: 'Ambiente Astro pronto per la migrazione.',
  },
  en: {
    title: 'Fabio Egypt — Astro',
    status: 'Astro environment ready for migration.',
  },
  es: { title: 'Fabio Egypt — Astro', status: 'Entorno Astro listo para la migración.' },
  pt: { title: 'Fabio Egypt — Astro', status: 'Ambiente Astro pronto para a migração.' },
  de: { title: 'Fabio Egypt — Astro', status: 'Astro-Umgebung bereit für die Migration.' },
} as const satisfies Record<Locale, SetupMessages>;

// Runs during static page generation. A mismatch stops the build, not rendering.
validateTranslations(setupMessages, supportedLocales, defaultLocale);

export function getSetupMessages(locale: Locale): SetupMessages {
  return setupMessages[locale];
}
