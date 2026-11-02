# Fabio Egypt theme

## Light/dark appearance — November 2, 2026

`features/theme/` owns the preference domain, optional local storage adapter and
small browser controls. Choices are system, light and dark. The main-site shell
applies the saved/system preference in its head before content; campaigns omit
this bootstrap. Preference changes propagate across tabs. Theme preferences
are device-local and independent of account, language and currency.

The owner requested keeping the Fabio Egypt wordmark on mobile, using smaller
header icons, a white light appearance and neutral black/gray dark surfaces.
Theme selection is in the mobile menu and a dedicated desktop header disclosure.
Light explicitly uses `color-scheme: only light` to opt out of automatic browser
dark recoloring; dark uses the dark native-control scheme. This does not claim
control over arbitrary browser extensions that replace site styles.

Use `--surface-card`, `--surface-soft`, `--surface-tinted`, `--text-heading`,
`--text-brand-muted`, `--focus-ring` and `--text-danger` for theme-aware roles.
Use `--on-accent` for text on orange actions. Brand blue, actual white, image
overlays and intentionally branded sections remain constants; do not invert
`--bg-white` or `--color-primary` globally. Theme variables preserve the original
light values. Shared-cookie consent surfaces use the same semantic roles.

Functional/visual evidence and the focused browser script live in `qa/theme/`.
No dependency, server rendering, account preference writes or remote settings
are required.

The owner supplied this site-wide palette on 2026-10-28. `theme.css` is the
single source of color values. `DocumentShell.astro` loads its variables for
main-site pages and neutral campaign shells without adding visual selectors.
`global.css` provides Tailwind v4 aliases for consumers using the shared setup.

Use CSS variables directly in scoped styles:

```css
.article-card {
  color: var(--text-main);
  background: var(--bg-white);
  border: 1px solid var(--border-color);
}
.article-action {
  color: var(--color-primary);
  background: var(--color-accent-orange);
}
```

Or use aliases such as `bg-brand-primary`, `text-content`, `bg-surface-soft`,
`border-outline`, `bg-action` and `hover:bg-action-hover` in Tailwind consumers.
Do not duplicate hex values or redefine the palette inside features. Components
may define scoped semantic variables that reference these shared tokens.

The new blog design uses this palette and ui-ux-pro-max. Other site components
can adopt these tokens as they are updated; loading variables does not migrate
existing hardcoded colors automatically. This change does not apply a global
restyle to legacy or campaign components.

Check actual foreground/background contrast for every use. Muted text, light
status colors, borders and orange accents are not automatically suitable for
small text on white. Prefer dark primary text on orange actions and a readable
foreground for status surfaces. Never convey status using color alone.
