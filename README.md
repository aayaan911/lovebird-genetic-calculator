# Lovebird Genetics Calculator — KinBird Aviary

Free lovebird genetics calculator built for the global lovebird breeding community.

**Live site:** https://lovebirdgenetics.com

## What it does
- Predicts offspring mutations for any lovebird pairing with exact percentages
- Supports all major mutations: Opaline, Pallid, Cinnamon, Ino, Pale Fallow, Dun Fallow, Bronze Fallow, Dilute, Yellow Face
- Handles all base colors: Green, Blue 1, Blue 2, Parblue (B1B2), Aqua B1, Aqua B2, Aqua Homo — with optional Yellow Face
- Correctly models sex-linked (SL), autosomal recessive (AR), and dominant inheritance
- Up to 6 mutation traits per parent
- Separate male/female offspring columns for sex-linked mutations
- Copy and share results
- Dark/light mode
- Works on all devices — mobile, tablet, desktop

## Analytics & Tracking
- Google Analytics 4 (G-08CWVZ2806) — tracks pairing_completed, color_selected, trait_selected, results_copied, clear_all
- Microsoft Clarity — heatmaps and session recordings

## SEO
- FAQPage + SoftwareApplication schema in `<head>`
- Static SEO content section (mutation tags, how-to steps, FAQs) for crawler indexing
- sitemap.xml and robots.txt included

## Files
- `index.html` — Entire app: genetics engine, UI, and SEO content (single file, vanilla JS)
- `privacy.html` — Privacy policy page
- `manifest.json` — PWA manifest for install + Play Store
- `sw.js` — Service worker (network-only, no caching)
- `netlify.toml` — Netlify headers, redirects, and deploy config
- `sitemap.xml` — Sitemap for Google Search Console
- `robots.txt` — Crawler rules
- `.well-known/assetlinks.json` — Android TWA fingerprint for Play Store
- `avatar-ayaan.png` — Ayaan Shohan profile photo (Creator)
- `avatar-arifin.jpg` — Arifin Sumon profile photo (Contributor)
- `avatar-adnan.jpg` — Adnan Younus profile photo (Contributor)
- `Dirk_Van_den_Abeele.jpg` — Dirk Van den Abeele profile photo (Scientific Reference)

## Deploying
All code lives in `index.html`. When Claude makes changes, upload the changed files to GitHub and Netlify auto-deploys.

© 2026 KinBird Aviary — Free forever.
