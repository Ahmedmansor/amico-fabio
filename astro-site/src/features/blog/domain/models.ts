import type { Locale } from '../../../shared/config/languages';
import type { Destination, Interest } from './taxonomy';

/** Ordinary feature models: no provider/Astro/DOM types cross this boundary. */
export interface BlogImage {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  lang: Locale;
  title: string;
  description: string;
  /** Validated ISO date/date-time, interpreted as UTC for date-only input. */
  pubDate: string;
  updatedDate?: string;
  translationKey?: string;
  destination?: Destination;
  interests: readonly Interest[];
  hero: BlogImage;
  linkKeywords: readonly string[];
  relatedTripIds: readonly string[];
  authorId?: string;
  featured: boolean;
  draft: boolean;
  fixture: boolean;
  demo?:boolean;
  faq?:readonly {question:string;answer:string}[];
  body: string;
  sourcePath: string;
}

export interface PublicationPolicy {
  /** One captured clock per build/request; domain never reads the clock. */
  evaluatedAt: number;
  includeFixtures: boolean;
}

export interface BlogInquiry {
  name: string;
  nationality: string;
  date: string;
  adults: number;
  children: number;
  destination?: Destination;
  message: string;
}

export type BlogAlternates = Partial<Record<Locale, string>>;
