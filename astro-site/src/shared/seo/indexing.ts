export function preventIndexing(value:unknown):boolean {
 if(value===undefined||value==='')return false;
 if(value==='1')return true;
 throw new Error('[SEO] PUBLIC_NOINDEX must be absent or exactly 1.');
}
export function assertIndexingHost(noindex:boolean,vercel:unknown,githubActions:unknown){
 if(vercel==='1'&&!noindex)throw new Error('[SEO] Astro Vercel test builds require PUBLIC_NOINDEX=1.');
 if(githubActions==='true'&&noindex)throw new Error('[SEO] GitHub Pages production builds must not set PUBLIC_NOINDEX.');
}
