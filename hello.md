# Five Stars Cleaning — Landing Pages (Cloudflare Pages)

## Deploy
1. Create a new GitHub repo and push this folder.
2. In Cloudflare Pages, connect to the repo. Framework preset: **None** (plain HTML).
3. Build settings: leave blank (no build), output directory: `/` (root).
4. Set your custom domain/path as needed.

## Customize
- Edit titles, descriptions, H1s, FAQs directly in each HTML file.
- Color & spacing in `/assets/brand.css`.
- Form handler in `/assets/app.js` — replace the Formspree URL with your endpoint/CF Worker/Zapier.

## SEO
- Each page has JSON-LD `Service` schema and a canonical URL.
- Consider adding `sitemap.xml` that lists these new pages.