# Shared nationality control

Inquiry forms (place guides/articles/dialog) and the trip planner now use one shared, progressively enhanced control. Feature data functions provide the same booking country values, labels, SVG stripe colors and patterns; no external flag host, new nationality list or submitted-value change. This matches the existing booking flag representations, not a newly verified geopolitical flag dataset.

A native select remains the form value/validation source. Popover-supported browsers receive keyboard arrows, Home/End, typeahead, Enter selection, Escape/focus return and top-layer placement above sticky containers. Unsupported browsers keep the native select. Inquiry draft synchronization updates the selected flag without recursive change events.

Astro check: 583 files, 0 errors/warnings/hints. Static build: 171 pages complete. Chromium at 375/1280px: English Aswan and Italian planner, SVG flag, keyboard selection/Escape, reopening typeahead, native FormData, synchronized inquiry values, no overflow or page errors passed. A separate browser case with Popover API disabled confirmed native fallback. Five results in `nationality.json`; screenshots local and ignored. No inquiries were submitted externally.
