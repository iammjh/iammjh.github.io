<img src="favicon_io/android-chrome-192x192.png" width="72" height="72" alt="mjh_ portfolio icon">

# Md. Jahidul Hasan — Portfolio

Personal portfolio of **Md. Jahidul Hasan (@iammjh)**, a backend developer and full-stack builder based in Dhaka, Bangladesh. Built with HTML, CSS, and vanilla JavaScript, with no framework or build step.

[Portfolio](https://iammjh.github.io/) · [GitHub](https://github.com/iammjh)

## What's inside

- **Projects:** 12 builds, a filterable archive, and dedicated case studies for [F1 Analytics Hub](projects/f1-analytics.html), [SDS Chemical Extractor](projects/sds-extractor.html), and [Singularity-Wars](projects/singularity-wars.html).
- **Beyond the code:** an introduction, toolkit, five education records, two scholarships, community leadership, events, and sports achievements.
- **Interactions:** a system explorer, scroll reveals, an education timeline, animated counters, a scrolling Build Notes ribbon, photo dialogs, and a custom precision cursor with reactive tracking brackets on desktop.
- **Contact:** résumé download, social links, email, and a form that preserves new edits made while a previous message is sending.

The system explorer is an illustrative local simulation; it does not call a backend. Animations follow the operating system's reduced-motion preference, and the marquee pauses on hover. Without JavaScript, the content, navigation, photo links, and native contact form remain available.

Text fields use a matching terminal-style mouse pointer and an orange typing caret. The trailing brackets stay out of text fields; touch and high-contrast modes retain native mouse pointers.

## Run locally

From the repository root, with Python 3 installed:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open **http://127.0.0.1:8765/**. Use this HTTP server rather than opening the HTML through `file://` so paths and service-worker behavior match the deployed site.

## Editing the portfolio

| Area | Files |
| --- | --- |
| Homepage content, toolkit, education, activities, and contact | [index.html](index.html) |
| Layout, colors, typography, and responsive styles | [style.css](style.css) |
| Explorer, scroll effects, filters, dialogs, and form handling | [script.js](script.js) |
| Project stories | [projects/](projects/) |
| Case-study layout and reading interactions | [case-study.css](case-study.css), [case-study.js](case-study.js) |
| Custom mouse pointers and tracking brackets | [cursor.css](cursor.css), [cursor.js](cursor.js), `assets/cursor-*.svg` |
| Photographs, project images, résumé, and local fonts | [assets/](assets/) |
| Browser and mobile icons | [favicon_io/](favicon_io/) |
| Service-worker registration and cache policy | [register-sw.js](register-sw.js), [sw.js](sw.js) |

When adding or removing projects, update the visible project-count labels and the explorer’s completion announcement alongside the project cards.

The contact form uses FormSubmit. When changing its destination, update both the native form `action` in `index.html` and the AJAX endpoint in `script.js`. The direct email link and copy-email handler are separate settings.

## Favicon and identity

The custom **mjh_** favicon uses original SVG geometry with no font dependency: charcoal `#10110f`, warm white `#ede9df`, and orange `#ff7748`.

| Asset | Purpose |
| --- | --- |
| [favicon.svg](favicon_io/favicon.svg) | Editable browser favicon and standard icon source |
| [favicon.ico](favicon_io/favicon.ico) | 16, 32, 48, and 64px browser fallback |
| `favicon-16x16.png`, `favicon-32x32.png` | Small PNG fallbacks |
| [apple-touch-icon.svg](favicon_io/apple-touch-icon.svg) → `apple-touch-icon.png` | 180px Apple icon with a full background |
| `android-chrome-192x192.png`, `android-chrome-512x512.png` | Standard Android icons |
| [maskable-icon.svg](favicon_io/maskable-icon.svg) → `maskable-icon-512x512.png` | Android icon with space for platform cropping |
| [site.webmanifest](favicon_io/site.webmanifest) | App name, colors, start URL, and icon declarations |

The homepage and all three case studies link to the favicon set. After editing an SVG, regenerate its PNG exports and the ICO where applicable; those files do not update automatically. Export details are in [favicon_io/about.txt](favicon_io/about.txt).

## SEO and social previews

- Page titles, descriptions, canonical URLs, Open Graph tags, and Twitter/X cards live in the `<head>` of `index.html` and each case-study HTML file. The homepage also includes `Person` structured data.
- [assets/social-card.png](assets/social-card.png) is the homepage's **1200 × 630** sharing image. Its editable layout is [assets/social-card.html](assets/social-card.html); changes require rendering a new PNG. Case studies use their project images for sharing.
- [robots.txt](robots.txt) allows crawling, and [sitemap.xml](sitemap.xml) lists the homepage and three case studies.
- Old section fragments `#projects`, `#education`, and `#activity` still work.

## Caching and publishing

The site is intended to be served from the root of **https://iammjh.github.io/**, using the root of `main` for GitHub Pages. No build output directory is needed. Root-relative icon URLs and the service-worker scope assume this hosting location.

The service worker registers on HTTPS or localhost. HTML, styles, scripts, and the web manifest use network-first requests with a cached fallback. Images, fonts, and icons use cache-first requests. After a successful worker installation, core pages and assets are precached; other assets become available offline after they have been cached. Contact submission and external project links still require a connection.

When updating cached files:

1. Bump `CACHE_NAME` in `sw.js` for a new cache revision.
2. If changing an asset's version query, keep its HTML/manifest links and `CORE_ASSETS` entry in sync.
3. Check the homepage and direct case-study URLs after reloading.

Activation removes older portfolio caches and preserves unrelated caches. The worker does not intercept other project routes or external requests. A returning browser controlled by an older worker may need one refresh after the update.

## Branches and local notes

- **`main`** — current portfolio.
- **`v3`** — original portfolio, archived at commit `21c8236`.

`docs/` contains local working notes and is excluded through `.gitignore`. It is not required to run or publish the site.

The self-hosted Space Grotesk, DM Sans, and IBM Plex Mono fonts include their SIL Open Font License files in [assets/fonts/](assets/fonts/).

## Verification

Local Chrome checks covered responsive layouts from 320 to 1920px, content and asset paths, keyboard navigation, photo dialogs, the system explorer, mocked contact submissions, cache migration, and cached case-study access offline. Favicon checks covered export dimensions, ICO decoding, Android crop safety, page declarations, and precaching.

These checks used browser emulation. Real email delivery, physical devices, Safari, and Firefox were not verified.
