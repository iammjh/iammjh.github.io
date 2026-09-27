# Md. Jahidul Hasan — Portfolio

A static personal portfolio with selected projects, case studies, education, scholarships, community work, and life activities. Built with HTML, CSS, and vanilla JavaScript; no build step is required.

## Branches

- `main`: the redesigned portfolio, promoted from the design preview.
- `v3`: the original portfolio, preserved at commit `21c8236` before promotion.

The branch transition is local until the branches are pushed. GitHub Pages can continue serving the root of `main`.

## Run locally

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open [the portfolio](http://127.0.0.1:8765/). Case studies live under `/projects/`.

## Files

- `index.html`, `style.css`, `script.js`: homepage, layout, and interactions.
- `projects/`, `case-study.css`, `case-study.js`: three project stories.
- `assets/`: photographs, project images, résumé, local fonts, and social sharing card.
- `register-sw.js`, `sw.js`: shared registration and offline caching.
- `robots.txt`, `sitemap.xml`: indexing and the four public page URLs.

## Behavior

The system explorer is a local animation, not a live backend. Portfolio content and navigation remain readable without JavaScript. Motion follows the operating system’s reduced-motion preference; there is no manual pause button. The marquee pauses on hover. Contact submissions use the original FormSubmit destination, with draft-preserving error handling and a native HTML fallback.

The service worker uses network-first requests for HTML, styles, and scripts, with matching cached responses available offline. Local assets use cache-first requests. Activation removes older portfolio caches without deleting unrelated application caches. Other sites hosted under this origin and external requests are not intercepted. Returning visitors whose old worker is still active may need one refresh after it updates.

Old homepage fragments `#projects`, `#education`, and `#activity` remain valid. Public pages use production canonical/share URLs and allow indexing. The editable sharing-card source at `assets/social-card.html` remains non-indexable.

The fonts include their SIL Open Font License files under `assets/fonts/`. No real contact messages are sent during verification.

## Verification

The promotion passed 42 local browser checks, plus file/link and whitespace checks. Testing used Chrome emulation and mocked contact submissions; actual email delivery and physical-device testing were not exercised.
