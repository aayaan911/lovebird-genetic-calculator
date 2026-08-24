# Lovebird Genetics Calculator

A free genetics calculator and reference library for **Fischer's lovebird (*Agapornis fischeri*)**, built and maintained by KinBird Aviary.

**Live site:** https://lovebirdgenetics.com

No account, no ads, no paywall.

---

## What it does

Enter two parent birds and get the exact percentage breakdown of every possible offspring, including splits.

- **7 base colours:** Green, Blue 1, Blue 2, Parblue (B1B2), Aqua B1, Aqua B2, Aqua Homo
- **19 mutation traits**, each modelled with its real inheritance mode
- Up to 6 traits per parent
- Separate son and daughter columns for sex-linked results, because a hen cannot be split for a sex-linked gene
- Copy and share any result
- Dark and light themes
- Installable as an app (PWA), works offline-tolerant on phone, tablet and desktop

### Traits modelled

| Inheritance | Traits |
|---|---|
| Sex-linked recessive | Opaline, Cinnamon, Pale, Pallid |
| Sex-linked dominant | Greywing |
| Autosomal recessive | Ino (NSL), Yellow Face, Dilute, Pastel, Recessive Pied, Bronze Fallow, Pale Fallow, Dun Fallow, Dark Eyed Clear, Red Factor |
| Autosomal dominant | Dominant Pied, Euwing, Misty, Slaty |

Mutations that are documented in the literature but **not** modelled by the engine, such as violet, dark factor, sapphire and mottle, are declared as unmodelled on the relevant pages rather than guessed at.

---

## Scientific reference

Every result is checked against the published work of **Dirk Van den Abeele** and **Ornitho-Genetics VZW**.

- Nomenclature and gene symbols follow OGVZW exactly: `bl1`, `bl2`, `bl aq`, `bl tq`, `op`, `cin`, `ino pe` (pale), `ino pd` (pallid), `a` (NSL ino)
- Fischer's ino is modelled as **NSL ino, symbol `a`, autosomal, at the a-locus**, so hens can be split for it
- Parblue is modelled as the compound **`bl1 // bl2`** at the blue locus, not as a separate gene
- OGVZW's *Agapornis* mutation list, updated 17 August 2025, no longer records turquoise in *A. fischeri*

Sources are cited and linked. OGVZW and MutaBase content is theirs, and is never reproduced here.

- Ornitho-Genetics VZW: https://www.ogvzw.org
- MutaBase: https://mutabase.ogvzw.org

---

## Content

Alongside the calculator the site publishes **44 genetics articles and hub pages** under `/blog/`, covering individual mutations, pairing outcomes, splits, visual identification and the mutation groups as a whole.

Article pages follow a fixed structure: a short standalone answer, a fact table with gene symbol and inheritance, a Punnett grid as real HTML rather than an image, a full pairings table, visual identification against the mutations it is confused with, a calculator link with the mutation preselected, and an FAQ mirrored into `FAQPage` structured data.

---

## Repository layout

| Path | Purpose |
|---|---|
| `index.html` | The entire application: genetics engine, UI and on-page content, single file, vanilla JS |
| `blog/` | 44 article and hub pages, one `index.html` per directory |
| `about/`, `privacy.html`, `404.html` | Site pages |
| `sitemap.xml` | Sitemap |
| `sitemaps.xml` | Sitemap index pointing at `sitemap.xml` |
| `robots.txt` | Crawler rules |
| `llms.txt` | Machine-readable summary of the genetics model for language models |
| `humans.txt` | Credits |
| `manifest.json`, `sw.js`, `icon-*.png` | PWA install and service worker |
| `_redirects` | Redirect rules |
| `img/`, `avatar-*`, `og-image.*`, `favicon.*` | Images and icons |

---

## Hosting and deployment

The site is served by **Cloudflare Pages**, which builds automatically from the `main` branch of this repository. There is no build step: the repository is the deployed artefact, so a commit to `main` is a deploy.

The `netlify.toml`, `netlify/` and `SETUP_GITHUB.md` files are **legacy from an earlier Netlify setup and are no longer used**.

---

## Analytics

- Google Analytics 4, event-level: `pairing_completed`, `color_selected`, `trait_selected`, `results_copied`, `clear_all`
- Microsoft Clarity for heatmaps and session replay

---

## Credits

Built by **Ayaan Ahmed Shohan**, KinBird Aviary, Dhaka, Bangladesh. Contributions from Arifin Sumon and Adnan Younus. Scientific reference: Dirk Van den Abeele, Ornitho-Genetics VZW.

Corrections are welcome. If something in the genetics is wrong, it gets fixed.

© 2026 KinBird Aviary. Free forever.
