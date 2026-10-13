import type {ImageMetadata} from 'astro';
const assets=import.meta.glob<ImageMetadata>('./assets/**/*.webp',{eager:true,import:'default'});
export function offerImage(src:string):ImageMetadata {
  const image=assets[`./assets/${src.slice('/assets/images/'.length)}`];
  if(!image)throw new Error(`[sharm-offer] Missing presentation image ${src}.`);
  return image;
}
