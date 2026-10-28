import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { acceptedCategory } from 'vanilla-cookieconsent';
import { trackBlogInquiry } from '../../../../../shared/analytics/lead';

vi.mock('vanilla-cookieconsent', () => ({ acceptedCategory: vi.fn() }));
const gtag = vi.fn();
beforeEach(() => { gtag.mockReset(); vi.mocked(acceptedCategory).mockReset(); vi.stubGlobal('window', { gtag }); });
afterEach(() => vi.unstubAllGlobals());

describe('blog handoff analytics', () => {
  it('does nothing without analytics consent', () => {
    vi.mocked(acceptedCategory).mockReturnValue(false);
    trackBlogInquiry('demo-article', 'it');
    expect(gtag).not.toHaveBeenCalled();
  });
  it('sends only static non-personal handoff context', () => {
    vi.mocked(acceptedCategory).mockReturnValue(true);
    trackBlogInquiry('demo-article', 'it');
    expect(gtag).toHaveBeenCalledExactlyOnceWith('event', 'generate_lead', {
      event_category: 'Blog', channel: 'whatsapp', site_language: 'it', article_id: 'demo-article',
    });
  });
  it('supports a listing inquiry and unavailable gtag without manufacturing success', () => {
    vi.mocked(acceptedCategory).mockReturnValue(true);
    trackBlogInquiry(undefined, 'en');
    expect(gtag).toHaveBeenCalledWith('event', 'generate_lead', { event_category: 'Blog', channel: 'whatsapp', site_language: 'en' });
    vi.stubGlobal('window', {});
    expect(() => trackBlogInquiry(undefined, 'en')).not.toThrow();
  });
});
