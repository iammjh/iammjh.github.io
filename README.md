<img src="favicon_io/android-chrome-192x192.png" width="72" height="72" alt="mjh_ portfolio icon">

# Md. Jahidul Hasan — Portfolio

Personal portfolio of **Md. Jahidul Hasan (@iammjh)**, a backend developer and full-stack builder based in Dhaka, Bangladesh. Built with HTML, CSS, and vanilla JavaScript, with no framework or build step.

[Portfolio](https://iammjh.github.io/) · [GitHub](https://github.com/iammjh)

## What's inside

- **Projects:** 12 builds, a filterable archive, and dedicated case studies for [F1 Pitwall Analytics](projects/f1-analytics.html), [SDS Chemical Extractor](projects/sds-extractor.html), and [Singularity-Wars](projects/singularity-wars.html).
- **Research:** MIM-HeMIS, a first-author undergraduate thesis on brain tumor segmentation with missing MRI modalities, including three Dice scores, an expandable abstract summary and linked keywords, manuscript status, and its BRAC University repository link.
- **F1 video tour:** a 43-second feature demo in the F1 case study, linked from its homepage card. Native controls, inline mobile playback, a poster, and a text overview; the video loads only on playback.
- **Beyond the code:** an introduction, toolkit, five education records, two scholarships, community leadership, events, and sports achievements.
- **Interactions:** a system explorer, animated name entrance, an idea-to-impact signal graphic, project telemetry and scanning accents, four animated toolkit diagrams, line-by-line heading reveals, staggered cards and counters, an education timeline, a scrolling Build Notes ribbon, photo dialogs, and custom arrow pointers with a responsive hover halo on desktop.
- **Contact:** résumé download, social links, email, and a form that preserves new edits made while a previous message is sending.

The system explorer is an illustrative local simulation; it does not call a backend. Animations follow the operating system's reduced-motion preference, and the header's motion control pauses animations and remembers the choice in this browser. Decorative graphics pause offscreen and when the tab is hidden; the marquee also pauses on hover. Without JavaScript, the content, navigation, photo links, and native contact form remain available.

Selectable copy and text fields use a crisp I-beam; typing carets use orange on dark surfaces and a deeper orange on the light contact form. Warm-white arrows turn mint over links and buttons, with a subtle halo that expands on hover and contracts on press. The halo stays out of text selection and native controls and stops when motion is paused. Touch and high-contrast modes retain native mouse pointers.

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
| Homepage surfaces, spacing, portrait treatment, and coordinated motion | [design.css](design.css) |
| Explorer, scroll effects, filters, dialogs, and form handling | [script.js](script.js) |
| Project stories | [projects/](projects/) |
| Case-study layout and reading interactions | [case-study.css](case-study.css), [case-study.js](case-study.js) |
| Native arrow and I-beam artwork, cursor rules, and hover halo | [cursor.css](cursor.css), [cursor.js](cursor.js), `assets/cursor-*.svg` |
| Photographs, project images, résumé, and local fonts | [assets/](assets/) |
| Browser and mobile icons | [favicon_io/](favicon_io/) |
| Service-worker registration and cache policy | [register-sw.js](register-sw.js), [sw.js](sw.js) |

When adding or removing projects, update the visible project-count labels and the explorer’s completion announcement alongside the project cards.

The contact form uses FormSubmit. When changing its destination, update both the native form `action` in `index.html` and the AJAX endpoint in `script.js`. The direct email link and copy-email handler are separate settings.

The F1 demo lives at `assets/video/f1-pitwall-analytics-demo.mp4`, with `assets/f1-pitwall-demo-poster.webp` as its cover. The case study includes its text overview and music attribution. Editable video source and previous cuts are kept outside this repository.

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

- Page titles, descriptions, canonical URLs, Open Graph tags, and Twitter/X cards live in the `<head>` of `index.html` and each case-study HTML file. Keep the descriptions aligned with each page's visible content. The homepage includes linked `WebSite`, `ProfilePage`, `Person`, and `Thesis` structured data; the thesis is identified as an approved undergraduate thesis with a journal manuscript in preparation.
- [assets/social-card.png](assets/social-card.png) is the homepage's **1200 × 630** sharing image, with the current portrait and portfolio branding. Its editable layout is [assets/social-card.html](assets/social-card.html); changes require rendering a new PNG and updating the version query in the homepage's Open Graph and Twitter/X image URLs. Case studies use their project images for sharing.
- [robots.txt](robots.txt) allows crawling, and [sitemap.xml](sitemap.xml) lists the homepage and three case studies.
- Update a sitemap entry's `lastmod` only when that page has a meaningful content or metadata change. Use the actual change date; deploying unchanged pages does not update their dates. Keep the homepage's `ProfilePage.dateModified` aligned with its significant updates.
- After publishing, use Google Search Console's URL Inspection for the homepage and updated case studies, submit `https://iammjh.github.io/sitemap.xml`, and check PageSpeed Insights for the live URLs. The verification meta tag is already present; indexing and field performance must be checked separately from local code validation.
- Old section fragments `#projects`, `#education`, and `#activity` still work.

## Caching and publishing

The site is intended to be served from the root of **https://iammjh.github.io/**, using the root of `main` for GitHub Pages. No build output directory is needed. Root-relative icon URLs and the service-worker scope assume this hosting location.

The service worker registers on HTTPS or localhost. HTML, styles, scripts, and the web manifest use network-first requests with a cached fallback. Images, fonts, and icons use cache-first requests. After a successful worker installation, core pages and assets are precached; other assets become available offline after they have been cached. Videos bypass the service worker so the browser can stream and seek normally; they are not precached for offline playback. Contact submission, video playback, and external project links require a connection.

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
