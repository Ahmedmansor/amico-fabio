# Owner review: visible title links

The owner opened EN fixture-diving-guide and found no body links. That fixture
had no mentions of another article's title or claimed keyword. The original
implementation also used only keyword aliases, whereas the owner expected full
article titles to match automatically. Technical handoff did not imply the
owner's visual/behavioral acceptance.

Changed behavior:
- Full published same-language titles are now automatic matching phrases.
- Keywords add aliases; title/alias duplicates on one article are deduplicated.
- Ambiguous ownership across articles fails with both paths, including collisions
  between a title and another article's alias. Draft/future/self/language and
  five-link/exclusion rules are preserved.
- EN/IT diving fixtures now explicitly mention the Cairo and sea-overview titles.
- Prose links have navy semibold text and a 2px orange underline.
- Authoring/reference documentation and fixture generators reflect the behavior.

Real focused checks, astro-site/:

```
vitest run src/features/blog/domain/__tests__/internal-links.test.ts src/features/blog/data/__tests__/content.test.ts src/features/blog/presentation/markdown/__tests__/processor.test.ts
Test Files 3 passed (3); Tests 38 passed (38)
npm run check:blog
tsc --noEmit --project scripts/blog/tsconfig.json
exit 0
```

After adding the explicit title/alias collision test:

```
vitest run src/features/blog/data/__tests__/content.test.ts
Test Files 1 passed (1); Tests 20 passed (20)
```

Native processor unit output proves a title is linked even without a matching
keyword alias. The initial browser assertion exposed the still-running old
processor; after restarting dev to load the code change:

```
node scripts/blog/verify-title-links.mjs <Playwright-module> <Chrome-executable>
PASS: EN/IT diving articles show two automatically linked full titles, with visible underlines and working destination navigation.
```

TITLE_LINKS.json records rendered text/href/underline and actual clicked target.
Unobstructed paragraph screenshots are local/ignored. No broad build, Lighthouse
rerun or unrelated feature suite ran for this focused correction. Earlier build
reports remain evidence of their own revision only.

Review: http://127.0.0.1:4327/en/blog/fixture-diving-guide/ — first section under
the hero. The paragraph beginning “To try the links between test articles” has
two linked full titles. Only an eligible first mention per target is linked,
with a maximum of five automatic links in an article; headings/code/manual
links and other documented exclusions do not become nested/duplicate anchors.
