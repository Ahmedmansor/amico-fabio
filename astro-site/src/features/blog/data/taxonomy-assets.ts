import history from './assets/interests/history.webp';
import diving from './assets/interests/diving.webp';
import desert from './assets/interests/desert.webp';
import food from './assets/interests/food.webp';
import tips from './assets/interests/tips.webp';
import stories from './assets/interests/stories.webp';
import type { Interest } from '../domain/taxonomy';
import type { ImageMetadata } from 'astro';

/** Temporary illustrative assets; exact replacement paths are in ASSETS.md. */
export const interestImages = { history, diving, desert, food, tips, stories } satisfies Record<Interest, ImageMetadata>;
