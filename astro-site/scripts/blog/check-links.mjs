import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { htmlToHast } from 'satteri';

function elements(node, result = []) {
  if (node.type === 'element') result.push(node);
  for (const child of node.children ?? []) elements(child, result);
  return result;
}
const relHas = (node, rel) => (Array.isArray(node.properties.rel) ? node.properties.rel : String(node.properties.rel ?? '').split(/\s+/)).includes(rel);

/** Blog-only assertions; other pages are parsed as destinations, not re-audited. */
export async function checkBlogLinks(directory, { origin = 'https://fabioegypt.com' } = {}) {
  const root = resolve(directory instanceof URL ? fileURLToPath(directory) : directory);
  const pages = new Map(), files = new Set(), errors = [];
  async function visit(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const absolute = resolve(folder, entry.name);
      if (entry.isDirectory()) { await visit(absolute); continue; }
      const path = '/' + relative(root, absolute).split(sep).join('/');
      files.add(path);
      if (!path.endsWith('.html')) continue;
      const nodes = elements(htmlToHast(await readFile(absolute, 'utf8')));
      const route = path.endsWith('/index.html') ? path.slice(0, -10) : path;
      pages.set(route, { nodes, ids: new Set(nodes.map(node => node.properties.id).filter(Boolean)) });
    }
  }
  await visit(root);
  const resolveLink = (href, route) => {
    let url;
    try { url = new URL(href, new URL(route, origin)); } catch { return { error: `invalid URL ${href}` }; }
    if (url.origin !== new URL(origin).origin) return {};
    let path, hash;
    try { path = decodeURIComponent(url.pathname); hash = decodeURIComponent(url.hash.slice(1)); }
    catch { return { error: `invalid URL encoding ${href}` }; }
    const page = pages.get(path) ?? pages.get(path.replace(/\/?$/, '/'));
    if (!page && !files.has(path)) return { error: `missing target ${href}` };
    if (hash && (!page || !page.ids.has(hash))) return { error: `missing fragment ${href}` };
    return { url, page };
  };
  let checked = 0;
  for (const [route, page] of pages) {
    const lang = route.match(/^\/(it|en)\/(?:blog|egypt)\//)?.[1];
    if (!lang) continue;
    checked++;
    const fail = message => errors.push(`${route}: ${message}`);
    if (page.nodes.filter(node => node.tagName === 'h1').length !== 1) fail('expected exactly one H1');
    if (page.nodes.find(node => node.tagName === 'html')?.properties.lang !== lang) fail(`expected html lang=${lang}`);
    const canonicals = page.nodes.filter(node => node.tagName === 'link' && relHas(node, 'canonical'));
    if (canonicals.length !== 1 || new URL(canonicals[0].properties.href, origin).pathname !== route) fail('expected one self canonical');
    for (const node of page.nodes) {
      const p = node.properties;
      if (node.tagName === 'img' && !Object.hasOwn(p, 'alt')) fail(`missing image alt: ${p.src}`);
      if (node.tagName === 'article') for (const image of elements(node).filter(n => n.tagName === 'img')) {
        if (!String(image.properties.alt ?? '').trim()) fail(`empty article image alt: ${image.properties.src}`);
      }
      const alternate = node.tagName === 'link' && relHas(node, 'alternate') && p.hrefLang;
      if (node.tagName !== 'a' && !alternate) continue;
      if (typeof p.href !== 'string') continue;
      if(/^(post|place|tour|package):/.test(p.href)){fail(`unresolved editorial reference ${p.href}`);continue;}
      const target = resolveLink(p.href, route);
      if (target.error) { fail(target.error); continue; }
      if (!target.url) continue;
      const targetLang = target.url.pathname.match(/^\/(it|en)\//)?.[1];
      const switcher = Object.hasOwn(p, 'dataLangSwitch');
      if (targetLang && targetLang !== lang && !switcher && !alternate) fail(`language leak ${p.href}`);
      if (alternate && target.page && p.hrefLang !== 'x-default') {
        if (targetLang !== p.hrefLang) fail(`alternate language mismatch ${p.href}`);
        const reciprocal = target.page.nodes.some(n => n.tagName === 'link' && relHas(n, 'alternate') && n.properties.hrefLang === lang && new URL(n.properties.href, origin).pathname === route);
        if (!reciprocal) fail(`nonreciprocal alternate ${p.href}`);
      }
    }
  }
  if (errors.length) throw new Error(`[blog:links]\n${errors.join('\n')}`);
  return checked;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const count = await checkBlogLinks(new URL('../../dist/', import.meta.url));
  console.log(`PASS: ${count} editorial pages checked for paths, fragments, languages, headings, alt and reciprocal alternates.`);
}
