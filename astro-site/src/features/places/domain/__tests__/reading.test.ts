import {expect,it} from 'vitest';
import {readingOutline} from '../../../../shared/data/reading-outline';
import {createSatteriMarkdownProcessor} from '@astrojs/markdown-satteri';
import {blogMarkdownPlugins} from '../../../blog/presentation/markdown/processor';
import type {MarkdownContext} from '../../../blog/data/markdown-context';
const context:MarkdownContext={current:{id:'sample',title:'Sample article',lang:'en',slug:'sample',sourcePath:'en/sample/index.md',pubDate:'2026-01-01',linkKeywords:[],relatedTripIds:[],fixture:true,draft:false},records:[],policy:{includeFixtures:true,evaluatedAt:Date.parse('2026-10-28')},targets:[
  {kind:'place',id:'giza',lang:'en',title:'Pyramids',url:'/en/egypt/giza/',aliases:['Pyramids'],source:'place:giza'},
  {kind:'package',id:'package-id',lang:'en',title:'Existing package',url:'/en/packages/existing/',aliases:[],source:'catalog package-id'},
]};
it('native output resolves stable links, suppresses manual targets and supplies only authored reading headings',async()=>{
  const processor=await createSatteriMarkdownProcessor({syntaxHighlight:false,hastPlugins:blogMarkdownPlugins(()=>context)});
  const result=await processor.render('## First section\n\nPyramids. [The pyramids](place:giza).\n\n![Illustration](./image.webp)\n\n### A closer look\n\n[Existing package](package:package-id).\n\n## First section');
  expect(result.code).not.toContain('href="place:');expect(result.code).toContain('href="/en/packages/existing/"');
  expect(result.code.match(/href="\/en\/egypt\/giza\/"/g)).toHaveLength(1);
  const outline=readingOutline(result.code);expect(outline.map(item=>item.text)).toEqual(['First section','A closer look','First section']);
  expect(new Set(outline.map(item=>item.slug)).size).toBe(3);expect(outline[1].depth).toBe(3);
});
it('native output rejects nonexistent references before publishing pseudo URLs',async()=>{
  const processor=await createSatteriMarkdownProcessor({syntaxHighlight:false,hastPlugins:blogMarkdownPlugins(()=>context)});
  await expect(processor.render('[Unknown](tour:missing)')).rejects.toThrow('Unknown, unpublished or untranslated');
});
it('outline rejects ambiguous authored anchors',()=>expect(()=>readingOutline('<h2 id="same">A</h2><h3 id="same">B</h3>')).toThrow('duplicate reading anchor'));
