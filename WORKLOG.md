# WORKLOG — LnD Ops Room one page site (chase-board)

One line per slice: what I did -> the command I ran -> what it actually printed.

- Read the brief, then listed the picture folder myself -> `Get-ChildItem -LiteralPath "...\chase-board\images"` -> 11 files: `logo.jpeg, logo_dark.jpeg, profile.png, working.jpeg, speaking.jpeg, shot-1.jpeg … shot-6.jpeg` (the dark logo's real filename is `logo_dark.jpeg`, underscore)
- Measured the pictures so every `<img>` carries real width/height -> `System.Drawing.Image` loop -> `speaking.jpeg = 1024 x 1024`, `profile.png = 298 x 281`, `logo.jpeg = 2048 x 2048`, all shots `1024 x 1024`
- Asked for the four missing details and waited -> answer -> name `Balaram Gorle`, WhatsApp `919553893919`, email `gitz.cdm@gmail.com`, why-started line, all six shots to be used
- Kept claims to what was given -> `PRD.md`, `TECH-STACK.md` exist and PRD is an unresolved draft, so no PRD assumption was put on the page
- Wrote the page -> `index.html` (one file, inline CSS, no build step, no `<script>`)
- Made the price appear once -> `grep '25,000'` -> 1 match, in the offer line; step 3 therefore says "that one monthly price" without repeating the figure
- Rendered in real Chrome and probed the layout (CDP `Emulation.setDeviceMetricsOverride` + `Runtime.evaluate`) -> at 390 / 768 / 1440: `docScrollWidth` 390 / 768 / 1440 equals `clientWidth`, `offenders: []` at 390 and 768, one offender at 1440 (`IMG.` — the hero photo, zoomed for the person to clear the text panel, clipped by `.hero{overflow:hidden}`), `minFontPx: 18`, smallest tap target 48 px, all 11 images `natural` width loaded
- First render showed the footer wordmark as dark ink on the navy band -> fixed with `.site-foot .wordmark{color:#FFF6E9}`
- First hero render hid the person behind the text panel -> changed the crop (`transform:scale(1.22); transform-origin:0% 42%`) and narrowed the panel to 560 px -> re-rendered -> Balaram is visible on the right, mid-conversation, laptop board in frame
- Two picture bands ended up back to back between the "who I am" section and contact -> moved `shot-6` to the hero-to-problem gap -> re-rendered -> one band per gap: hero, band, problem, band, services, dark band, how, band, proof, band, about, band, contact, footer
- Proved the page still reads with no pictures -> loaded a copy of `index.html` with no `images/` folder -> all 6 bands `display:none`, page height 10385 -> 5222, headings, card titles, step titles, the three slots and all contact links still present, `docScrollWidth` 1440 = `clientWidth`
- Checked every link on the finished page -> `Select-String href=` -> booking `https://cal.com/gitz-cdvm-3oicgb/20-minute-intro-call`, `https://wa.me/919553893919?text=…`, `mailto:gitz.cdm@gmail.com?subject=…`, and nothing else
- Colour audit -> hex values in the file: `#0B1F3A, #0E7C86, #111418, #F26B1D, #FFF6E9` only (the button hover shade was replaced with `filter:brightness(0.94)` to stay inside the palette)

## New repository and environment file (19 Sep 2026)

- Asked to reuse `.env.local` "from old remote" -> `git log --all --diff-filter=A -- '.env*'` -> nothing, and `git ls-tree -r origin/main` has no env file, so the old remote never had it; only the local, ignored `chase-board\.env.local` exists
- Checked what the local file holds, names only -> `NEXT_PUBLIC_SUPABASE_URL` (40 chars), `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (46 chars); no service-role key
- Checked whether publishing it would matter -> `supabase/setup.sql:51-70` -> four policies `using (true)` / `with check (true)` and `grant select, insert, update, delete ... to anon, authenticated`, so the publishable key is full read/write on `chase_items` -> held and did not publish it, then reversed at the member's explicit instruction (see below)
- Confirmed the repo was not already carrying the values -> `git grep -E 'sb_publishable_|supabase\.co'` -> only `app/page.tsx:319`, which is the placeholder `https://your-project.supabase.co`
- Published the names with no values instead -> `.env.example` plus `!.env.example` in `.gitignore` -> `git ls-tree -r lnd-ops-room-site/main --name-only` -> `.env.example` present, `.env.local` absent
- Tried to set the two variables in Vercel -> `Get-Command vercel` -> not installed; `VERCEL_TOKEN` not set; no `.vercel` folder anywhere -> BLOCKED, needs the member
- Member instructed the values to be published anyway -> `git add .env.local .env.example .gitignore`, commit `ffa1d99`, `git push` -> `26d2a8e..ffa1d99  main -> main`; `git ls-tree -r lnd-ops-room-site/main --name-only` -> `.env.example` and `.env.local` both present; raw fetch of each -> `HTTP 200` with both values populated; `.gitignore` now allow-lists `.env.local`
- Not done, and not mine to decide: `supabase/setup.sql:51-70` still lets the `anon` role select, insert, update and delete every row in `chase_items`, so the now-public publishable key opens that table to anyone who copies it

