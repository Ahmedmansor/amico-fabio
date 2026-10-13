import type {ImageMetadata} from 'astro';
const images=import.meta.glob<ImageMetadata>('/src/features/sharm-secrets/presentation/assets/**/*.webp',{eager:true,import:'default'});
export function guideImage(src:string):ImageMetadata {
  const image=images[`/src/features/sharm-secrets/presentation/assets/${src.replace(/^\/assets\/images\//,'')}`];
  if(!image)throw new Error(`[sharm-secrets] Missing source image ${src}.`);
  return image;
}
