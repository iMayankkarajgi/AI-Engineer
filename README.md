# Modern AI Engineering

The site at https://modernaiengineering.com. It teaches the **AI Engineering Bootcamp**: three tracks, 19 modules and 149 interactive lessons, from machine-learning foundations to AI system design. The site name, programme name and public address live in `src/brand.js`.

## Run locally

Requires Node.js 24 or later.

```bash
npm install --registry=https://registry.npmjs.org
npm run build
npm start
```

Open http://localhost:3001. For editing, run `npm run dev` and open http://localhost:5173.

The server creates its SQLite database under `data/`. Set `DATA_DIR` to use a different persistent location and `PORT` to change the server port. Set `NODE_ENV=production` when running behind HTTPS so session cookies use the `Secure` flag.

### Static build (no server)

```bash
npm run build:static
```

This writes `dist-static/`, which works from any static host: assets use relative paths, routing uses the URL hash, and progress is kept in the browser (accounts are hidden).

## Accounts and database (Supabase)

With Supabase configured, learners sign in with Google (or email), get a profile page at `/profile`, and their profile, lesson progress and best quiz scores are stored in Postgres. Without it the site falls back to the bundled SQLite API (or guest-only in the static build).

1. Create a project at supabase.com. In **SQL Editor**, run `supabase/schema.sql`.
2. Copy `.env.example` to `.env.local` and fill in the project URL and anon key (**Project Settings → API**).
3. In Google Cloud Console create an OAuth client (type: Web application) with the authorised redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`. Paste its client ID and secret into Supabase under **Authentication → Providers → Google**.
4. In Supabase under **Authentication → URL Configuration**, add every address the site is served from to **Redirect URLs**, for example `http://127.0.0.1:5173/**` and your production URL.

Tables: `profiles` (one row per account), `lesson_progress` (one row per learner per lesson) `code_snippets` (Python files saved from the Practice page) and `entitlements` (plans a learner has bought; learners can read their own rows but only the dashboard or a trusted server can write them). To grant a plan by hand, insert a row in `entitlements` with the learner's user id and a track of `ml`, `ai` or `complete`. Row-level security limits every learner to their own rows.

To exercise the whole flow offline, `npm run dev:mock` starts the site on http://127.0.0.1:5174 against `scripts/mock-supabase.mjs`, a small in-memory stand-in for Supabase Auth and the two tables (with a simulated Google account). `npm run build:static` leaves Supabase out unless you pass `--with-supabase`.

## Domain and search engines

- **Domain**: in Vercel, connect `modernaiengineering.com` (and `www`) to this project. In Supabase under **Authentication → URL Configuration**, set **Site URL** to `https://modernaiengineering.com` and add `https://modernaiengineering.com/**` to **Redirect URLs**, otherwise sign-in returns to the old address.
- **Per-page metadata**: `src/seo.js` gives every page its title, description, canonical URL and schema.org data (Course, FAQPage, BreadcrumbList, LearningResource). The app applies it on each navigation.
- **Prerendering**: `npm run build` ends with `scripts/prerender.mjs`, which writes `dist/<path>/index.html` for every public page with that metadata and a plain-HTML copy of the content, plus `dist/sitemap.xml`. Private and unknown URLs are served `dist/app.html`, which is marked noindex.
- **Static files**: `public/` holds `robots.txt`, the icons, the web manifest and `og.png` (the link-preview image).
- After launch, add the site in Google Search Console and Bing Webmaster Tools and submit `https://modernaiengineering.com/sitemap.xml`.

## Admin reporting

`supabase/schema.sql` also creates two views for the Supabase dashboard: `admin_learners` (one row per account: sign-in method, progress, exam score, plan) and `admin_summary` (totals: Google users, email users, users with a plan, active this week). Learners cannot read them.

## How the course works

- **Tracks and pricing** (`/pricing`): the course is offered as three tracks (ML & Deep Learning, Generative AI Engineering, Complete AI Engineer), each with its modules and labs. Track contents and prices live in `src/course/tracks.js`; the prices there are placeholders and no payment provider is connected.
- **Curriculum** (`/curriculum`): 19 modules with progress, an at-a-glance table and an animated learning path.
- **Course guide** (`/guide`): about the course, what AI engineering is, who it is for, what we learn, prerequisites, how to use it.
- **Lessons** (`/lesson/:id`): intuition, step-by-step mechanism, math with small numbers, runnable code with a line-by-line walkthrough and real output, side-by-side comparisons, animated charts and flows, interactive widgets, inline "pause and think" checks, key terms, takeaways.
- **Quiz gating**: every lesson ends with 5 multiple-choice questions. Scoring 4/5 or better marks the lesson as passed and unlocks the next one. Wrong answers show explanations; retries shuffle the options.
- **Practice** (`/practice`): a Python editor that runs code in the browser with Pyodide (output, `input()` text, Stop for runaway programs) and saves files to the learner's account, or to the browser for guests.
- **Final exam** (`/exam`): 50 mixed questions (`src/course/exam.js`), open once every lesson is passed; 45 or more earns the certificate. The result is stored as the `final-exam` row in `lesson_progress`.
- **Live news** (`/news`): current AI stories read from official lab, company and university feeds by `api/news.js` (a Vercel function, also mounted by `server.mjs`). The source list is at the top of that file; items are kept only when they link back to the source's own domain.
- **Resources** (`/resources`): papers, documentation and standards (`src/course/resources.js`). Lessons do not link to outside sites; add external references there.
- **Glossary** and **FAQ** pages.
- Guest progress and best quiz scores are stored in `localStorage`; signed-in progress is stored in SQLite.

## Content layout

| Path | What it holds |
| --- | --- |
| `src/course/curriculum.js` | Modules, lesson ids, numbers, titles, outlines ("covers") and source links |
| `src/course/lessons/<id>.js` | One lesson body per file, loaded on demand |
| `src/course/LESSON_SPEC.md` | The lesson schema and authoring rules (block types, quiz rules) |
| `src/course/vizNames.js` | The interactive widgets a lesson can embed |
| `src/course/reference.js` | Guide text, glossary and FAQs |
| `src/LessonBlocks.jsx` | Renderers for every block type (steps, code, compare, chart, flow, matrix, timeline, formula, …) |
| `src/viz/` | Widget kit (`index.jsx`) and one file per widget in `widgets/` |

Validate lesson files against the schema:

```bash
npm run validate
```

The pre-redesign content (17 tracks, 91 lessons) is kept in `_legacy/` for reference and is not used by the app.

## Licence notes

The curriculum structure, lesson outlines, module introductions and glossary definitions are adapted from the AI Engineering Course README (Apache-2.0, © 2026 Outcome School). Each lesson links to its original article.
