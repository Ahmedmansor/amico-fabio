# Fabio Egypt theme

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
