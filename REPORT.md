# REPORT — LnD Ops Room one page site

Deliverable: `F:\gbr\FWAI\Hackathon Session 9\fwai-starter\chase-board\index.html`
Style: `<style>` in the head, no build step. The only JavaScript is `onerror=` on the pictures, so a
missing picture closes up its own space. No `<script>` tag, no backend, no form.

## Status per part

Hero — one headline, one line under it, the booking button, speaking photo behind, full width: DONE
  evidence: CDP probe at 1440 -> `hero@81h828`, viewport 900 px tall, so the photo covers 92% of the
  first screen; screenshot `desktop-part-1-top.png` shows Balaram visible on the right with the board
  on his laptop.

Problem in the client's own words — DONE
  evidence: four lines, straight from the brief (status late, feedback, monthly report, unpaid invoices).

Three services, one line each, one icon each, title loudest, price once: DONE
  evidence: `grep '25,000'` -> exactly 1 match, `One price: Rs 25,000 a month, and it covers the whole offer.`
  (services section). The three card titles are 1.5rem against 1.19rem body, so the title is the loudest
  thing in the card.

Three steps: DONE
  evidence: `I set it up for you` / `Fixed scope, live in a week` / `I keep it running`.

Who I am, own voice, profile picture small and round, working photo beside at about a third: DONE
  evidence: `.about` grid is `minmax(0,1fr) minmax(0,340px)` = 30% of 1120 px; `.avatar` is 64 px and
  50% radius.

Contact last, links only: DONE
  evidence: section order at 1440 is `… band@8615 | section contact@9473 | site-foot@10212` — contact is
  the last section before the footer. Booking first, then WhatsApp, then email.

Pictures: DONE
  evidence: all 11 files used, in order `speaking` (hero), `shot-6, shot-2, shot-4, shot-1, shot-3,
  shot-5` (one band per gap), `profile` + `working` (who I am), `logo` (header), `logo_dark` (footer).
  Every `<img>` has width, height and alt text.

Phone first: DONE
  evidence: at 390 and 768 px `docScrollWidth` equals `clientWidth` and `offenders: []`; smallest tap
  target 48 px (`a` heights 48 / 54 / 58); `minFontPx: 18` (nothing under 18 px anywhere).

Still reads with no pictures: DONE
  evidence: a copy of the page with no `images/` folder -> `bandsStillTakingSpace: 0`, page height
  10385 -> 5222, and the H1, three card titles, three step titles, three slots and all contact links
  still present.

## What broke and how I fixed it

1. Footer wordmark was ink `#111418` on the navy `#0B1F3A` band (`.wordmark` sets its own colour).
   Fixed with `.site-foot .wordmark{color:#FFF6E9}` and re-rendered.
2. In the first hero render the speaking photo's subject sat behind the text panel, so the only person
   visible was someone's back. Narrowed the panel to 560 px and set the photo to
   `transform:scale(1.22); transform-origin:0% 42%`, then re-rendered and looked at it: Balaram is now
   visible on the right. Reset to `transform:none` under 1080 px, where the hero stacks.
3. Two picture bands landed back to back between "who I am" and contact. Moved `shot-6` into the
   hero-to-problem gap, so every band now sits between two sections of words.
4. Three text styles came out under 18 px (`.label`, `.kicker`, `.btn` — `0.95rem`/`1.0625rem` against a
   16 px root). Raised all three to `1.125rem`; the probe now reports `minFontPx: 18` and `small: []`.
5. The button hover introduced a sixth hex (`#d95c12`). Replaced with `filter:brightness(0.94)` so the
   file contains only the five named colours.

## Claims ledger

| Claim | Command that proves it | Result |
|---|---|---|
| Contact details are the member's, exactly as given | `Select-String href=` on the file | `https://cal.com/gitz-cdvm-3oicgb/20-minute-intro-call`, `https://wa.me/919553893919?text=…`, `mailto:gitz.cdm@gmail.com?subject=…` |
| Name on the page is exactly `Balaram Gorle` | rendered `.about h2` text | `Balaram Gorle` |
| Business name written exactly `LnD Ops Room` | `Select-String 'LnD Ops Room'` | 13 occurrences, all as `LnD Ops Room` |
| Price appears once | `grep '25,000'` | 1 match |
| No backend, no script, no form | `grep '<script'` and `href=` audit | 0 matches; only `<a href>` links |
| No horizontal scroll at 390 / 768 / 1440 | CDP probe | `docScrollWidth` = `clientWidth` at all three; `offenders: []` at 390 and 768; the single 1440 offender is the zoomed hero `IMG`, clipped by `.hero{overflow:hidden}` |
| Nothing under 18 px | CDP probe of every leaf text node | `minFontPx: 18`, `small: []` |
| Every picture loads | CDP probe of `document.images` | 11 images, `natural` widths 1024/2048/298, none broken |
| Page still reads with no pictures | CDP on a copy with no `images/` folder | 6 bands hidden, height 10385 -> 5222, all words and links present |
| Colours are only the five named | hex scan of the file | `#0B1F3A, #0E7C86, #111418, #F26B1D, #FFF6E9` |
| Two Google Fonts, named with the link tag | `<link>` in head | `Bricolage Grotesque` + `Inter` |
| Proof is not invented | file contents | the three slots are literal `[YOUR RESULT]`, `[CLIENT QUOTE]`, `[YOUR TIMELINE]` |

UNVERIFIED: how the page looks in a browser other than Chrome — only Chrome 1440 / 768 / 390 were run.
UNVERIFIED: the page is not deployed, so no live URL exists.

## One judgement call, recorded

Requirement 5 says "write the price once, exactly as Rs 25,000 a month", and requirement 6 gives step
three as "I keep it running for Rs 25,000 a month". Written literally, that is the price twice. I kept
requirement 5's instruction: the figure appears once, in the offer line with "it covers the whole
offer", and step three reads "Setup, the running of it and the morning digest all stay inside that one
monthly price." If the member wants the figure inside step three instead, it moves in one edit and the
offer line drops to "One price, and it covers the whole offer."

## What I would tell the next person

- Put the three slots in before publishing: `[YOUR RESULT]`, `[CLIENT QUOTE]`, `[YOUR TIMELINE]`. They
  sit each in their own introducing sentence, so filling the bracket is enough — no other edit needed.
- Open the file straight from the folder: `chase-board\index.html`, pictures resolve to `images\`.
- If a picture is ever renamed, nothing breaks: the section keeps its words and closes the gap.
- The hero's person only clears the text panel because of `transform:scale(1.22)` on the hero photo. If
  that picture is swapped for one with the subject elsewhere, expect to re-tune that one line.
