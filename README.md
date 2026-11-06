# החשבון שלנו – Italy Trip

Mobile-first Hebrew expense splitter for רובי, גרציאני, ג׳ורדן, בן.

## Features
- Add expenses in EUR / ILS / USD, choose payer and any set of participants, optional description.
- Equal splits with deterministic cent rounding.
- Per-currency debt netting and payer breakdown.
- Everyone can view and delete entries.
- Entry password: `bbttrrjj` (client-side only; **not security**).

## Local preview
Open `index.html` in a browser. By default it stores data in that browser's `localStorage`, **not shared**.

## Shared mode (Supabase)
1. Create a free Supabase project.
2. Open SQL Editor and run `setup.sql`.
3. In Project Settings / API, copy **Project URL** and **anon/publishable key**. Never use the service_role/secret key in the browser.
4. Edit the two constants near the beginning of the `<script>` in `index.html`:
   ```js
   const SUPABASE_URL='https://YOUR_PROJECT.supabase.co';
   const SUPABASE_ANON_KEY='YOUR_PUBLISHABLE_OR_ANON_KEY';
   ```
5. Deploy `index.html` to GitHub Pages (Repository Settings → Pages → Deploy from a branch → main → /root).
6. Share the Pages URL and the entry password with friends. Refresh the page to see others' changes.

**Security:** This is a deliberately public demo database with no real authentication. Anyone with access to the API URL/key (both visible in page source) can read, add, and delete expenses. The entry password only hides the UI and is not a security control. Do not store private data.

## Limitations
- Equal split only; no custom per-person amounts.
- No payment-settlement recording yet.
- Refresh required to see changes from other devices (no realtime subscription).
