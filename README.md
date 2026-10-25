# RarePrint Studio

An AI-powered online design studio for print shops. Customers pick a product, see a blank canvas at the exact print size, design it (with AI, from templates, or by uploading their own artwork), preview it in real life, and send a print-ready order straight to the printer.

It's set up for **[go cre8](https://www.gocre8.co.uk)** in Liverpool, and everything brand-specific can be changed with environment variables, so you can offer it to other print shops.

## What customers get

- **16 products in 4 groups.** Signage: shop fascia signs, hanging signs, A-boards, window graphics and van magnets. Print: business cards, flyers, posters, menus and stickers. Display: roller banners, PVC banners and wall graphics. Promo: mugs, tote bags and coasters.
- **True-to-size canvas.** Every product opens at its real size, with bleed, a trim line and a "keep text inside" safe area. Signs and banners also take custom sizes in mm. Double-sided products have Front/Back tabs.
- **AI Magic Designer.** The customer describes their business and the AI returns 3 complete, *editable* layouts: fonts, colours, shapes and text, plus optional AI artwork. On an empty canvas the first design is applied straight away.
- **AI Artwork.** Generates photos, illustrations, patterns, backgrounds or cut-out icons with transparent backgrounds, matched to the product's shape. The prompt never asks for text, so the images contain no garbled lettering.
- **AI Copywriter.** Writes slogans, headlines, offers and body copy, or rewrites the text the customer selected.
- **AI Design Review.** A vision model scores the design for print readiness and gives friendly tips.
- **Templates.** Starter layouts that fill in automatically from the customer's details (name, phone, website…), saved on their device.
- **Full editor.** Text (22 Google Fonts, outline, shadow, spacing), shapes, icons, image upload (PNG/JPG/WEBP/SVG), "remove white background", layers, snapping, undo/redo and keyboard shortcuts. It works on phones too.
- **Print check before ordering.** Flags low-resolution images, text outside the safe area, text too small to read, and pending AI artwork.
- **Real-life previews.** The design is shown on a shop front, a mug, a roller banner stand, a van, a window, a tote bag and more.
- **Order flow.** Material, quantity, collect/deliver/fitting, an estimated price, contact details, extra attachments and "send me a proof first".
- **Downloads.** A PNG image, or a print-ready PDF at full size with bleed.

## What the printer gets

- **Print files with every order:** a PNG at the product's print resolution (300dpi for cards, about 100dpi for large-format work), an SVG, the editable design as JSON, and a preview image.
- **Orders dashboard** at `/admin` (password protected), with statuses New → Proof sent → Approved → Printing → Ready → Completed.
- **Email notifications** through Resend (one to the printer, a confirmation to the customer), and/or a **webhook** for Zapier, Make or your own system.
- **Embed script** so the studio can go on the printer's existing website.

## Quick start (local)

```bash
npm install
cp .env.example .env.local    # add your OPENAI_API_KEY and an ADMIN_PASSWORD
npm run dev                   # http://localhost:3000
```

Without an OpenAI key everything still works except the AI tools; the studio tells customers that AI isn't switched on yet.

## Deploy to Vercel (recommended)

1. On vercel.com, choose **Add New → Project**, import the `rare-print` GitHub repo and keep the defaults (Next.js).
2. Under **Settings → Environment Variables**, add at least:
   - `OPENAI_API_KEY`
   - `ADMIN_PASSWORD`
   - `APP_SECRET`: any long random string
   - `ORDER_PREFIX`: for example `GC`
3. Under **Storage → Create → Blob**, create a store and connect it to the project. This sets `BLOB_READ_WRITE_TOKEN` for you, and it's where orders and artwork are kept. If you create a *private* store, also set `BLOB_ACCESS=private`.
4. Optional: add `RESEND_API_KEY` and `EMAIL_FROM` for emails, and `PUBLIC_BASE_URL` once you add a custom domain (for example `design.gocre8.co.uk`).
5. Redeploy. The AI image route can take up to about 60 seconds, so a plan that allows longer function durations is recommended.

## Self-host on a VPS

With Docker:

```bash
docker build -t rare-print .
docker run -d -p 3000:3000 --env-file .env -v $(pwd)/data:/app/data --name rare-print rare-print
```

Or with Node 20+:

```bash
npm ci && npm run build
ADMIN_PASSWORD=... OPENAI_API_KEY=... npm start   # put nginx/Caddy in front for HTTPS
```

Without a Blob token, orders and artwork are saved to `DATA_DIR` (default `./data`), so back that folder up.

## White-label for another print shop

All branding is set with `NEXT_PUBLIC_BRAND_*` variables: name, tagline, logo URL, website, phone, email, address, city, colours, currency and whether to show prices. See `.env.example`. These values are built into the site, so redeploy after changing them. One deployment per print shop keeps orders, keys and branding separate.

Products, sizes, materials and price estimates are in `src/lib/products.ts`. **The prices there are placeholders**, so set your own. Customers always see them as estimates that are confirmed with the proof.

## Put it on the printer's website

```html
<!-- Floating "Design it online" button that opens the studio full screen -->
<script src="https://design.gocre8.co.uk/embed.js" data-label="Design your sign online" async></script>

<!-- Or open a specific product from your own buttons/links -->
<a href="#" class="rp-studio-open" data-path="/design/shop-sign">Design a shop sign</a>
<script src="https://design.gocre8.co.uk/embed.js" data-button="false" async></script>
```

You can also link straight to a product (`/design/business-cards`), or pass a brief that the AI starts from: `/design/shop-sign?brief=Barber%20shop%20called%20Fade%20Kings`.

## How it's built

- **Next.js 16** (App Router) with React 19, Tailwind CSS 4 and TypeScript.
- **Canvas editor:** fabric.js 6, in `src/components/editor/`.
  - `engine.ts` holds the canvas maths, layouts, exports and print check. The design space is always 1000 units on its long side, so a business card and a 6m sign behave the same way.
  - `Studio.tsx` is the editor shell: sides, history, autosave to `localStorage`, zoom and the mobile layout.
- **AI:** OpenAI, in `src/app/api/ai/*`.
  - Layouts are generated as strict JSON (structured outputs), described in `src/lib/layout.ts`. The same format powers the templates in `src/lib/templates.ts`.
  - Images are generated with GPT Image, sized to the product's aspect ratio.
  - There's a simple per-visitor rate limit (`AI_REQUESTS_PER_HOUR`).
- **Orders:** `src/app/api/orders`, with storage in `src/lib/server/storage.ts` (Vercel Blob or local disk). Download links are signed with HMAC, so they can be emailed safely.
