import type {ImageMetadata} from 'astro';
export const imageAssets=import.meta.glob<ImageMetadata>('/src/shared/assets/catalog/trips/**/*.webp',{eager:true,import:'default'});
