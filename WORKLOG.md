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

## Deploy the website (20 Sep 2026)

- Member asked to deploy the one-page website, and chose GitHub Pages -> added `.nojekyll`, commit `a461a67`, `git push`
- Turned Pages on -> `gh api -X POST repos/gitzcdvm/lnd-ops-room-site/pages -f "source[branch]=main" -f "source[path]=/"` -> `{"html_url":"https://gitzcdvm.github.io/lnd-ops-room-site/","build_type":"legacy","public":true,"https_enforced":true,"source":{"branch":"main","path":"/"}}`
- Waited for the build -> `gh api repos/gitzcdvm/lnd-ops-room-site/pages/builds/latest --jq .status` -> `building`, then `built` (duration 22827 ms)
- Fetched the live homepage -> `HTTP 200`, `text/html`, 20727 bytes; title `LnD Ops Room — batch form, chase board and morning digest`; H1 `Every batch, every rupee, in one room.`; `LnD Ops Room` x13; booking, WhatsApp and mailto links present; `25,000` x1; slots `[YOUR RESULT], [CLIENT QUOTE], [YOUR TIMELINE]`
- Fetched live pictures -> `images/speaking.jpeg`, `images/shot-4.jpeg` `HTTP 200 image/jpeg`; `images/profile.png` `HTTP 200 image/png`; `images/logo_dark.jpeg` `HTTP 200 image/jpeg`
- Rendered the live URL in Chrome -> 11/11 images loaded, `Bricolage Grotesque` and `Inter` both reported loaded, page height 10385 (same as local), `docScrollWidth` 1440 = `clientWidth`, failed requests: none
- Checked what else the Pages URL serves -> `.env.local`, `.env.example`, `WORKLOG.md`, `supabase/setup.sql`, `app/page.tsx` all `HTTP 200`: Pages publishes the whole repo root, so the site and the app source share one URL space
- Vercel was the documented host but there is no CLI, token or login on this machine -> not used; the chase-board Next.js app is NOT deployed anywhere

## Landing page split into its own repo (21 Sep 2026)

- Member asked whether the landing page needs Supabase -> counted in `index.html`: `supabase` 0, `NEXT_PUBLIC` 0, `process.env` 0, `<script` 0, `<form` 0, `fetch(` 0; external hosts only `fonts.googleapis.com`, `fonts.gstatic.com`, `cal.com`, `wa.me`; local files only the 11 pictures -> no, it needs nothing from Supabase
- Built a folder for the page alone -> `F:\gbr\FWAI\Hackathon Session 9\fwai-starter\lnd-ops-room-landing\`, copied from `chase-board`, then `Get-FileHash` -> `index.html` SHA256 `5BCADDF1…` identical both sides; 11 images compared, 0 mismatches
- New repo -> `git init -b main`, commit `cb50b97` (14 files), `gh repo create lnd-ops-room-landing --public --source=. --remote=origin --push` -> first attempt printed `error connecting to api.github.com`; retried -> `https://github.com/gitzcdvm/lnd-ops-room-landing`, `* [new branch] HEAD -> main`
- Checked the new tree -> `.nojekyll`, `README.md`, 11 `images/…`, `index.html`; no `env`, no `app/`, no `supabase`, no `package.json`; blob `a65439f7…` matches the page already verified in Chrome
- Enabled Pages -> `{"html_url":"https://gitzcdvm.github.io/lnd-ops-room-landing/","public":true,"https_enforced":true,"source":{"branch":"main","path":"/"}}`; build `building` five polls, then `built`
- Fetched the live homepage -> `HTTP 200`, `text/html`, 20727 bytes, title and H1 correct, booking, WhatsApp and mailto links all present
- Every picture over HTTPS -> all 11 `HTTP 200` with correct content types, 0 failures
- Rendered the live URL in Chrome -> 11/11 images loaded, both fonts loaded, page height 10385, `docScrollWidth` 1440 = `clientWidth`, failed requests: none
- A first probe read 9/11 images because it sampled before two finished; waiting for every image to settle gave 11/11, so the page is complete, not short of pictures
- Kept the `lnd-ops-room-site` Pages deployment live at the member's choice, so `.env.local` stays fetchable there
- This repo carries no WORKLOG or REPORT on purpose: it is the customer-facing page, not the app

