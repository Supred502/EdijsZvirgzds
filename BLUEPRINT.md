# Edijs Zvirgzds — Portfolio Blueprint

A personal site that shows all my projects in an animated way, pulls live data from GitHub, and has a private admin where I can add, edit, reorder and hide projects without touching code.

---

## 1. Stack

| Need | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router) + TypeScript** | Public pages and admin in one app; server components keep the site fast |
| Styling | **Tailwind CSS v4** | Fast to build, easy theming |
| Animation | **Motion** (`motion/react`, formerly Framer Motion) | Scroll reveals, layout animations, page transitions |
| Database + auth + images | **Supabase** (Postgres, Auth, Storage) | One free service covers all three; no own backend to run |
| GitHub data | **GitHub REST API**, cached 1 h | Stars, language, last update, topics |
| Hosting | **Vercel** (free) | Zero-config for Next.js |

No CMS, no separate API server, no state library. Supabase + server actions cover it.

---

## 2. Look

My default style: **Material 3 Expressive, pure-black OLED dark theme, one pink accent** (as in Mihon).

```css
--bg:        #000000;   /* pure black */
--surface:   #121212;   /* cards */
--surface-2: #1E1E1E;   /* raised / hover */
--text:      #F5F5F5;
--text-dim:  #A0A0A0;
--accent:    #FF4F9A;   /* the one pink */
--on-accent: #000000;
--radius:    24px;      /* M3 Expressive, big rounded corners */
```

- Fonts: a geometric sans for headings (e.g. *Space Grotesk*), *Inter* for body text.
- Pink only for: primary buttons, links, active filter chip, focus ring, small highlights. Everything else is greyscale, so the project images stand out.
- Optional: a light theme later. Not in v1.
- **Buttons: switch to Supabase-style** (wanted, not done yet): small, `rounded-md` (6px) instead of pills, raised surface with a subtle border/shadow, short ease-out transitions, press shrinks to 97%.

---

## 3. Pages

### Public
| Route | Content |
|---|---|
| `/` | **Hero** (name, one-line headline, avatar, socials, CV button) → **Featured** (2–3 big cards) → **All projects** (grid + tech filter chips) → **About** (short bio, skills) → **Contact** (email + socials) |
| `/projects/[slug]` | Cover image, title, tagline, tech chips, GitHub card (stars, language, last commit), Live / Repo buttons, write-up (Markdown), image gallery with lightbox |

### Admin (login required)
| Route | Content |
|---|---|
| `/admin/login` | Email + password (Supabase Auth) |
| `/admin` | Project list: drag to reorder, toggle published / featured, edit, delete |
| `/admin/projects/new` | Form. **"Import from GitHub"** box: paste a repo URL → fills title, description, topics, homepage |
| `/admin/projects/[id]` | Same form for editing; upload cover + gallery images (drag & drop); Markdown editor with preview |
| `/admin/profile` | Name, headline, bio, avatar, socials, CV file |

---

## 4. Animation plan

Keep it smooth, not noisy. Everything respects `prefers-reduced-motion` (Motion's `useReducedMotion` → no movement, fades only).

| Where | Effect |
|---|---|
| Hero | Name letters stagger in; avatar scales in; subtle pink glow follows the cursor |
| Sections | Fade + slide up on scroll (`whileInView`, once) |
| Project grid | Cards stagger in; filtering uses `layout` + `AnimatePresence` so cards glide into new spots |
| Card hover | Lift + image zoom + pink border fade |
| Card → detail | Shared element: the cover image morphs into the detail page header (`layoutId`) |
| Page change | Short fade/slide between routes |
| Gallery | Lightbox opens from the clicked thumbnail |
| Admin | Minimal: toasts on save, reorder animates. Admin should feel fast, not fancy |

---

## 5. Data model (Supabase)

```sql
-- Projects shown on the site
create table projects (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  tagline      text,                          -- one line on the card
  body         text,                          -- Markdown write-up
  cover_url    text,
  gallery      text[] default '{}',           -- image URLs from Storage
  tech         text[] default '{}',           -- used for filter chips
  repo_url     text,                          -- github.com/owner/repo
  live_url     text,
  featured     boolean default false,
  published    boolean default false,         -- drafts stay hidden
  sort_order   int default 0,
  started_on   date,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- One row: info about me
create table profile (
  id         int primary key default 1 check (id = 1),
  name       text,
  headline   text,
  bio        text,
  avatar_url text,
  cv_url     text,
  socials    jsonb default '{}'                -- {"github": "...", "linkedin": "...", "email": "..."}
);

-- Security: anyone reads published things, only I write
alter table projects enable row level security;
alter table profile  enable row level security;

create policy "public read published" on projects for select using (published or auth.uid() is not null);
create policy "owner writes"          on projects for all    using (auth.uid() = '<MY_USER_ID>') with check (auth.uid() = '<MY_USER_ID>');
create policy "public read profile"   on profile  for select using (true);
create policy "owner writes profile"  on profile  for all    using (auth.uid() = '<MY_USER_ID>') with check (auth.uid() = '<MY_USER_ID>');
```

**Storage:** one public bucket `media` (`projects/<id>/…`, `profile/…`). Upload/delete allowed only for my user ID.

**Sign-ups:** turn off in Supabase Auth settings. Only my account exists.

---

## 6. GitHub integration

- `lib/github.ts` → `getRepo(url)` calls `https://api.github.com/repos/{owner}/{repo}`, returns `stars, forks, language, topics, pushed_at, description, homepage`.
- Cached with `fetch(..., { next: { revalidate: 3600 } })` — at most one call per repo per hour.
- Optional `GITHUB_TOKEN` env var (read-only, no scopes) raises the limit from 60 to 5000 calls/hour.
- If GitHub fails, the card just hides. The page never breaks.
- Admin "Import from GitHub" reuses the same function.

---

## 7. Folder structure

```
app/
  (site)/
    layout.tsx              nav, footer, page transition
    page.tsx                home
    projects/[slug]/page.tsx
  admin/
    layout.tsx              checks login, redirects to /admin/login
    login/page.tsx
    page.tsx                project list
    projects/new/page.tsx
    projects/[id]/page.tsx
    profile/page.tsx
    actions.ts              server actions: save, delete, reorder, upload
components/
  ProjectCard.tsx  ProjectGrid.tsx  FilterChips.tsx
  Hero.tsx  GitHubCard.tsx  Gallery.tsx  Reveal.tsx
  admin/ProjectForm.tsx  admin/ImageUpload.tsx  admin/SortableList.tsx
lib/
  supabase/server.ts  supabase/client.ts
  github.ts
  types.ts
supabase/
  schema.sql                the SQL above
middleware.ts               refreshes the Supabase session on /admin
```

Extra packages beyond the stack: `@supabase/ssr`, `react-markdown`, `@dnd-kit/sortable` (drag to reorder), `zod` (form validation in server actions).

---

## 8. Security checklist

- [ ] RLS on every table; writes checked against my user ID (not just "logged in").
- [ ] Every server action re-checks the session and validates input with `zod`.
- [ ] Sign-ups disabled in Supabase.
- [ ] Only the **publishable** key in the browser. The secret (service-role) key is never used in this app.
- [ ] `.env.local` in `.gitignore` before the first commit.
- [ ] Image uploads: allow only `image/*`, max ~5 MB.
- [ ] Markdown rendered without raw HTML (react-markdown default).

---

## 9. Build order

Status (2026-11-04): steps 1–6 done, plus 2FA (Google Authenticator, enforced in the DB via `aal2`). Redesigned as a KDE Dolphin-style file manager: Documents is the root; nested `folders` (colour + lucide emblem, can be locked), Markdown `notes` (e.g. About_me/Aboutme.md), projects live in folders and can be locked (visitors only get the `locked_projects` view). Single click selects → info panel; double click opens; hovering a folder shows a "shulker box" peek of its contents. DB change: `supabase/002_folders.sql` (run). Step 7 mostly done: title template + Open Graph (site image `app/opengraph-image.tsx`, project cover per project), `sitemap.ts`, `robots.ts` (hides /admin), `not-found.tsx`, security headers in `next.config.ts`, owner-only Admin button in the path bar. Left: Lighthouse/mobile check on the deployed site. Then 8.

1. ✅ **Setup** — `create-next-app`, Tailwind, theme tokens, fonts, Supabase project, run `schema.sql`, create my user, disable sign-ups.
2. ✅ **Read-only site** — home + project page from the DB, with a couple of rows entered by hand in Supabase.
3. ✅ **GitHub card** — `lib/github.ts` + card on project page and small stars badge on cards.
4. ✅ **Admin** — login, project list, create/edit form, image upload, publish toggle.
5. ✅ **Admin extras** — drag reorder, GitHub import, profile page.
6. ✅ **Animations** — reveals, grid filter, shared-element card → detail, page transitions, reduced-motion check.
7. 🟡 **Polish** — SEO (metadata, Open Graph image per project, `sitemap.ts`), 404 page, Lighthouse pass, mobile check.
8. **Ship** — push to GitHub, connect Vercel, add env vars, custom domain.

---

## 10. Env vars

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
GITHUB_TOKEN=            # optional
NEXT_PUBLIC_SITE_URL=    # your domain, for sitemap + link previews
```

## 11. Later (not in v1)

Light theme · blog · view counter · contact form · multiple languages (LV/EN) · auto-sync all my public repos as drafts.
