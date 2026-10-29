import {describe, expect, it} from 'vitest';
import {validateTestimonials} from '../testimonials';

describe('shared campaign testimonial publication', () => {
  const video = {videoId:'1214756632',title:'Ras Mohamed',image:'/assets/images/review.webp'};
  it('keeps the original record and rejects broken video associations', () => {
    expect(validateTestimonials([video])).toEqual([video]);
    expect(() => validateTestimonials([{...video,image:''}])).toThrow(/title\/image/);
    expect(() => validateTestimonials([{...video,videoId:'javascript:alert(1)'}])).toThrow(/invalid Vimeo ID/);
    expect(() => validateTestimonials([video,video])).toThrow(/Duplicate/);
  });
});
