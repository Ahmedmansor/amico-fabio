import { z } from 'astro/zod';
import type { SchemaContext } from 'astro:content';
import { supportedLocales, type Locale } from '../../../shared/config/languages';
import { destinations, interests } from '../domain/taxonomy';
import { normalizeLinkKeyword } from '../domain/validation';

const identifier = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const date = z.union([z.date(), z.iso.date(), z.iso.datetime({ offset: true })])
  .transform(value => value instanceof Date ? value.toISOString() : value);

export function blogSchema({ image }: SchemaContext) {
  return z.object({
    id: identifier,
    title: z.string().trim().min(10).max(110),
    description: z.string().trim().min(50).max(160),
    pubDate: date,
    updatedDate: date.optional(),
    lang: z.enum(supportedLocales as [Locale, ...Locale[]]),
    translationKey: identifier.optional(),
    destination: z.enum(destinations).optional(),
    interests: z.array(z.enum(interests)).min(1).max(2).refine(values => new Set(values).size === values.length, 'Interests must be distinct.'),
    heroImage: image(),
    heroAlt: z.string().trim().min(5),
    heroCaption: z.string().trim().min(1).optional(),
    linkKeywords: z.array(z.string().transform(normalizeLinkKeyword).pipe(z.string().min(4))).default([]),
    featured: z.boolean().default(false),
    relatedTripIds: z.array(z.string().trim().min(1)).default([]),
    authorId: identifier.optional(),
    draft: z.boolean().default(false),
    fixture: z.boolean().default(false),
  }).strict().superRefine((value, context) => {
    if (!value.draft && !value.fixture && !value.authorId) {
      context.addIssue({ code: 'custom', path: ['authorId'], message: 'A real publication requires an approved authorId; no author default is configured.' });
    }
    if (value.updatedDate && Date.parse(value.updatedDate) < Date.parse(value.pubDate)) {
      context.addIssue({ code: 'custom', path: ['updatedDate'], message: 'updatedDate cannot precede pubDate.' });
    }
    if (new Set(value.relatedTripIds).size !== value.relatedTripIds.length) {
      context.addIssue({ code: 'custom', path: ['relatedTripIds'], message: 'Trip IDs must be distinct.' });
    }
  });
}
