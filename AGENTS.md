# model-bench

A tiny, hand-run bench for **opencode-go** models, published as a daily blog.
Cheaper models change often and prices move, so this repo keeps a fixed set of
small jobs and writes down what happened — in very simple words.

**Owner:** nd28 · **Site:** `https://nd28.github.io/model-bench/` ·
**Published from:** `main` (repo root), GitHub Pages.

There is **no build step and no pipeline.** A person (or an agent session) runs
the bench by hand, writes a post, and pushes. That is deliberate: the point is
a human-glanceable record, not automation.

---

## Layout

```
index.html              post list (newest first) — update on every new post
posts/YYYY-MM-DD.html   one post per day
assets/style.css        shared design system (edit rarely)
assets/app.js           theme + language + tooltips + share
assets/cascadia-*.woff2 vendored mono font (Inter comes from Google Fonts)
```

---

## The daily flow

1. **Run the bench** (see [Bench spec](#bench-spec)). Collect, per model:
   score per job, and wall-clock seconds per job.
2. **Write `posts/<YYYY-MM-DD>.html`** using the most recent post as the
   template. Keep its structure, copy, and classes. Do not redesign. Copy its
   `<meta>` + `og:` tags and update `og:url`, `og:title`, `og:description` and
   the page title for the new post.
3. **Update `index.html` and the old post.** Add the new card at the top of
   `.feed` (date, title, one-line summary, model tags). In the previous post's
   nav, replace the `.void next` placeholder with a link to the new post.
4. **Commit and push** to `main`.
5. **Verify** (see [Publishing](#publishing)).

If a model errors out (for example the Muse "collects data — opt in" refusal),
**do not score it**. Note it in the post as skipped and move on.

---

## Bench spec

Run each model headless:

```sh
opencode run --model <model-id> '<prompt>'
```

Models in the core run:

| label | model id |
|---|---|
| DeepSeek V4.1 Flash | `opencode-go/deepseek-v4.1-flash` |
| Muse Spark 1.3 | `opencode-go/muse-spark-1.3-contributor` |
| Muse Spark 1.2 | `opencode-go/muse-spark-1.2-contributor` |
| GLM-5.3-Flash | `opencode-go/glm-5.3-flash` |

Optional / occasional: `opencode-go/glm-5.3`, `opencode-go/longcat-2.0`.
Confirm the list first with `opencode models | grep opencode-go`.

Time each run the cheap way:

```sh
start=$(date +%s); timeout 240 opencode run --model <id> '<prompt>' 2>&1 | tail -8; end=$(date +%s); echo "SEC=$((end-start))"
```

For anything that returns code, strip colour before reading it:
`sed 's/\x1b\[[0-9;]*m//g' | sed '/^[[:space:]]*```/d'`, then keep from the
first `def ` line. Run the extracted code against the expected cases below —
**check by machine, never by eye.**

### Job 1 — quick questions (3 checks)

Prompt:

```
Answer three questions. Output exactly three lines: Q1=<answer> Q2=<answer> Q3=<answer>, no other text.
Q1: A bat and a ball cost $1.10 total. The bat costs $1.00 more than the ball. How much does the ball cost, in cents?
Q2: How many trailing zeros are in 100! (100 factorial)?
Q3: In Python, how many times does the letter a appear in "abracadabra"?
```

Expected: `Q1=5  Q2=24  Q3=5`.

### Job 2 — short code (8 checks)

Prompt: write `def longest_unique_substring(s: str) -> int` (longest substring,
no repeated characters). Output only Python.

Cases: `("abcabcbb",3) ("bbbbb",1) ("pwwkew",3) ("",0) ("dvdf",3) ("abba",2)
("tmmzuxt",5) (" ",1)`.

### Job 3 — calculator (23 checks)

Prompt: write `def evaluate(expr: str) -> int` — digits, `+ - * / ( )`, no
spaces, standard precedence, unary minus, **integer division truncated toward
zero**. Output only Python.

Cases: `("1+2*3",7) ("(1+2)*3",9) ("2*(3+4)-5",9) ("10/3",3) ("-7/2",-3)
("2*-3",-6) ("((1+2)*(3+4))",21) ("1+2+3*4-5",10) ("100",100) ("-(-5)",5)
("3*(2+1)-4/2",7) ("2*3+4*5",26) ("((((5))))",5) ("7/-2",-3) ("1-2-3",-4)
("8/2/2",2) ("12/5",2) ("-12/5",-2) ("0-0",0) ("-8/3",-2) ("5-3-2",0)
("2-(3-4)",3) ("(-2)*(-3)",6)`.

### Job 4 — pattern matcher (22 checks)

Prompt: write `def is_match(s: str, p: str) -> bool` — `.` matches any one
character, `*` repeats the preceding element, **full match** only. Output only
Python.

Cases: `("aa","a",F) ("aa","a*",T) ("ab",".*",T) ("aab","c*a*b",T)
("mississippi","mis*is*p*.",F) ("ab",".*c",F) ("","",T) ("","a*",T) ("",".*",T)
("a","",F) ("aaa","a*a",T) ("aaa","a*aa",T) ("ab",".",F) ("aaa","aaaa",F)
("aa","aa",T) ("b","a*b",T) ("aab","a*b",T) ("bbbba",".*a*",T)
("bbbba",".*a*a",T) ("a",".*..a*",F) ("ab",".*..",T) ("abc",".*..c",T)`.

### Job 5 — harder questions (5 checks)

Prompt:

```
Answer these 5 questions. Output exactly 5 lines, each "Qn=<answer>", no other text.
Q1: What is the units digit of 3^2026?
Q2: How many integers between 1 and 1000 inclusive have exactly 3 positive divisors?
Q3: How many ways can you make 25 cents using pennies (1), nickels (5), dimes (10) and quarters (25)?
Q4: How many trailing zeros does 200! have?
Q5: What is the remainder when 7^1000 is divided by 13?
```

Expected: `9  11  13  49  9`.

---

## What a post must have

Every post is the same shape as `posts/2026-09-11.html`:

- **Top bar** — brand, language button, accent dot, theme cycle, share.
- **Bench bar** — the fixed bottom slot (status + term + progress). Copy its
  `data-*` attributes from the latest post and change only the reading.
- **Hero** — date pill, one-line title, standfirst, meta row.
- **Numbered steps** in a `.flow` — typically: what we did, the models, the
  jobs, the numbers, speed, and what we'd pick.
- **A results table** in `.table-scroll` (so it never breaks a phone).
- **Comparison bars** — to compare numbers across models, use the `.compare`
  component (metric tabs + per-model bars), never a row of cards. Each `.crow`
  keeps its numbers in `data-in / data-out / data-ctx / data-max`; `app.js`
  draws the bars and marks the best value per metric.
- **Captions** under anything a reader might over-read. Say the honest caveat.
- **Post nav** (previous / next) and the footer.

Rules of voice:

- Very simple words. Short sentences. Explain, don't impress.
- Never claim a quality winner from a small test. Say the test set was small.
- Times are **one run each**. Always say so. Never turn a 2-second gap into a
  finding.
- Keep every number you collected. Drop polish, never data.

---

## Design system (do not reinvent)

OS-inspired, **liquid glass**. Theme-aware, **dark by default**; light via
`prefers-color-scheme` and an explicit `[data-theme="light"]`. Never force one
theme. `app.js` resolves the mode and always sets `data-theme` (auto → light →
dark, cycled from the top bar).

- **Accents:** one variable repaints everything — `--accent`, `--accent-2`,
  `--accent-soft`. Default is the black-and-white preset (near-white on dark,
  near-black on light); the nd28 pink (`#F06FA3`) with mint second is one of the
  choices. The accent dot in the top bar cycles presets; the choice is
  remembered.
- **Surfaces are glass:** translucent `var(--surface)` + `backdrop-filter:
  blur(var(--blur)) saturate(160%)` + `1px var(--glass-border)`. Use `.glass`.
  The `@supports not` block gives a solid fallback. Glass is an accent, never a
  full-screen surface.
- **Radius:** one `--radius` (18px) for cards and panels; pills are `999px`.
- Body font **Inter** (Google Fonts). Mono **Cascadia Code**, vendored woff2.
- Mono is for anything typed: prices, model ids, dates, counts, buttons.
- Reading flow: `.step` sections carry a number node and a connector line.
- Terms: `<button class="term" data-tip="plain-words explanation">word</button>`.
  The explanation opens in the **bench bar**, not a floating tooltip.
- Continuity: moving between the index and a post uses cross-document view
  transitions. Keep the post's `<h1>` and the index card's title sharing a
  `view-transition-name: post-<date>`.
- Add a colour or a radius → don't. Use an existing token.

## The bench bar (the signature)

A fixed, glass, bottom slot with three jobs — patterned on One UI's Now Bar:

1. **Status** — the latest reading, from `data-status-en` / `data-status-hi`,
   plus the action button (open the latest post, or share the current one).
2. **Term** — tapping a `.term` writes its explanation here. One slot, never two.
3. **Progress** — on a post (`data-prog="1"`), a hairline fills as you read.

Everything is read from `data-*` attributes on `#benchbar`; `app.js` also
switches the bar's language from there. Do not add a second floating layer.

---

## Bilingual rules (English + Hinglish)

Two languages on every page, no build step.

- Whole block differs → duplicate it and tag the copies
  `<div class="lang-en"> … </div>` / `<div class="lang-hi"> … </div>`. CSS hides
  the non-active one.
- One short string differs → put `data-en` and `data-hi` on the element; JS
  swaps its text. Used for the top bar, nav labels, footer.
- Default language comes from the browser; the toggle remembers the choice in
  `localStorage` (`mb-lang`). Theme does the same (`mb-theme`).
- Hinglish is Roman script only. Keep it the same simple register as English.

---

## Publishing

1. `git add -A && git commit -m "post: <date> — <one-line summary>"`
2. `git push` (Pages builds from `main`, ~30s).
3. Verify:
   - `curl -sI https://nd28.github.io/model-bench/ | head -1`
   - `curl -sI https://nd28.github.io/model-bench/posts/<date>.html | head -1`
   - open the post on a narrow window: no horizontal scroll, the table scrolls
     inside its own box.
4. If Pages ever stalls: `gh api repos/nd28/model-bench/pages/builds/latest`.

**Cache-busting (important).** Pages serves `assets/*` with `max-age=600`, so a
change to `style.css` / `app.js` can stay invisible for 10 minutes — the HTML is
fresh but the browser reuses the old asset. Every page therefore links the
assets with a version query: `assets/app.js?v=YYYYMMDD-N`. **When you change
either asset, bump that query in every page (index + all posts) and commit.** A
new post must copy the current query from the latest post. Adding `?v=` to the
page URL does not help — the asset URLs are what get cached.
