# Fabio Tours Project Rules (Isolated Architecture)

## 1. File Isolation (STRICT)
- **CSS Modules**: 
  1. `catalog.css` (for index.html & trips).
  2. `sharm-secrets.css` (for survival manual/10 commandments).
  3. `welcome.css` (for welcome.html - Lead Generation).
- **NEVER** delete or "cleanup" any CSS file you are not explicitly working on.
- **NEVER** assume code is dead. If it exists in the original main.css, it MUST be moved, not deleted.

## 2. Project Scope
- This project contains THREE main modules: Trip Catalog, Sharm Secrets, and Welcome/Lead Page.
- All assets and JS core files are shared.

## 3. UI & Performance Standards
- **Skeleton UI**: Must show instantly.
- **No Data Loss**: During migration, the total line count of the new files must match the original main.css.