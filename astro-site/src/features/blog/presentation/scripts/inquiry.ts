import { validateInquiry, inquiryMessage, whatsappInquiryUrl, type InquirySource } from '../../domain/inquiry';
import type { BlogInquiry } from '../../domain/models';
import type { Destination } from '../../domain/taxonomy';
import type { Locale } from '../../../../shared/config/languages';
import type { getSharedMessages } from '../../../../shared/i18n/shared';
import { siteConfig } from '../../../../shared/config/site';
import { trackBlogInquiry } from '../../../../shared/analytics/lead';
import './dialog';

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
const configElement = document.getElementById('blog-inquiry-config');
if (configElement) {
  const { m, source, locale, nationalities } = JSON.parse(configElement.textContent!) as {
    m: ReturnType<typeof getSharedMessages>['blog']; source: InquirySource; locale: Locale; nationalities: string[];
  };
  const forms = [...document.querySelectorAll<HTMLFormElement>('[data-blog-inquiry]')];
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let draft: BlogInquiry = { name: '', nationality: '', date: '', adults: 1, children: 0, message: '', destination: source.destination };
  const read = (form: HTMLFormElement): BlogInquiry => {
    const data = new FormData(form);
    return { name: String(data.get('name') ?? ''), nationality: String(data.get('nationality') ?? ''), date: String(data.get('date') ?? ''),
      adults: Number(data.get('adults')), children: Number(data.get('children')), message: String(data.get('message') ?? ''),
      destination: String(data.get('destination') ?? '') as Destination || undefined };
  };
  const sync = (active?: HTMLFormElement) => {
    for (const form of forms) if (form !== active) for (const [key, value] of Object.entries(draft)) {
      const field = form.elements.namedItem(key) as Field | null;
      if (field) field.value = value === undefined ? '' : String(value);
    }
  };
  const invalidateOtherReviews = (active: HTMLFormElement) => {
    for (const other of forms) if (other !== active) {
      other.hidden = false;
      const review = other.closest('.blog-inquiry-instance')?.querySelector<HTMLElement>('[data-inquiry-review]');
      if (review) review.hidden = true;
    }
  };
  sync();
  for (const form of forms) {
    (form.elements.namedItem('date') as HTMLInputElement).min = today;
    const instance = form.closest<HTMLElement>('.blog-inquiry-instance')!;
    const review = instance.querySelector<HTMLElement>('[data-inquiry-review]')!;
    const handoff = review.querySelector<HTMLButtonElement>('[data-whatsapp-handoff]')!;
    const fallback = review.querySelector<HTMLAnchorElement>('[data-whatsapp-fallback]')!;
    let handoffUrl = '';
    form.addEventListener('input', () => { draft = read(form); invalidateOtherReviews(form); sync(form); });
    form.addEventListener('change', () => { draft = read(form); invalidateOtherReviews(form); sync(form); });
    form.querySelectorAll<HTMLButtonElement>('[data-step]').forEach(button => button.addEventListener('click', () => {
      const field = form.elements.namedItem(button.dataset.step!) as HTMLInputElement;
      const min = button.dataset.step === 'adults' ? 1 : 0;
      field.value = String(Math.max(min, (Number(field.value) || min) + Number(button.dataset.change)));
      draft = read(form); invalidateOtherReviews(form); sync(form);
    }));
    form.addEventListener('submit', event => {
      event.preventDefault();
      draft = read(form); invalidateOtherReviews(form); sync(form);
      const errors = validateInquiry(draft, today, new Set(nationalities));
      form.querySelectorAll<HTMLElement>('[data-error]').forEach(error => {
        const key = error.dataset.error as keyof BlogInquiry;
        error.hidden = !errors[key]; error.textContent = errors[key] ? m[errors[key]!] : '';
        const field = form.elements.namedItem(key) as Field;
        if (errors[key]) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid');
      });
      const first = Object.keys(errors)[0];
      if (first) { (form.elements.namedItem(first) as Field).focus(); return; }
      const summary = review.querySelector('[data-inquiry-summary]')!;
      summary.replaceChildren();
      for (const [label, value] of [[m.name,draft.name.trim()],[m.nationality,draft.nationality],[m.date,draft.date],
        [m.adults,String(draft.adults)],[m.children,String(draft.children)],
        [m.destination,draft.destination?m.destinationLabels[draft.destination]:m.undecided],
        ...(draft.message.trim()?[[m.message,draft.message.trim()]]:[])]) {
        const row = document.createElement('div'), term = document.createElement('dt'), detail = document.createElement('dd');
        term.textContent = label; detail.textContent = value; row.append(term, detail); summary.append(row);
      }
      handoffUrl = whatsappInquiryUrl(siteConfig.whatsapp.number, inquiryMessage(draft, source, {
        ...m, greeting: m.whatsappGreeting,
      }));
      form.hidden = true; review.hidden = false; review.focus();
    });
    review.querySelector('[data-inquiry-edit]')?.addEventListener('click', () => {
      review.hidden = true; form.hidden = false; (form.elements.namedItem('name') as Field).focus();
    });
    // Keep personal message text out of DOM hrefs: automatic outbound-click
    // analytics can collect link_url independently of our sanitized GA4 event.
    handoff.addEventListener('click', () => {
      if (!handoffUrl) return;
      trackBlogInquiry(source.articleId, locale);
      window.open(handoffUrl, '_blank', 'noopener,noreferrer');
    });
    fallback.addEventListener('click', event => {
      if (!handoffUrl) return;
      event.preventDefault();
      trackBlogInquiry(source.articleId, locale);
      window.location.assign(handoffUrl);
    });
    // Unlock only after enhancement is wired. Native method=dialog also avoids
    // an accidental GET submission of personal fields if JavaScript is absent.
    form.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled = false;
  }
}
