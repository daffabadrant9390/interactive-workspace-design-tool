# Design Your Workspace: Desent Solutions Developer Challenge

An interactive, Sims style workspace designer for **monis.rent**. Instead of a
flat product catalog, the customer builds their setup in a small 3D room:
placing a desk, a chair, monitors, and accessories, watching a live price as
they go, and getting a shareable link that they (or our sales team) can act
on.

Built solo within the roughly four to eight hour budget. See
[What I'd do next](#what-id-do-next) for everything deliberately left out of
scope.

## Live demo

- App: [interactive-workspace-design-tool.vercel.app](https://interactive-workspace-design-tool.vercel.app)
- Repo: [github.com/daffabadrant9390/interactive-workspace-design-tool](https://github.com/daffabadrant9390/interactive-workspace-design-tool)

## The core idea

The brief's sketch mixes an IKEA Kreativ style "design your space" feeling
with The Sims' build mode. I leaned into the Sims comparison because it maps
cleanly onto a rental catalog.

- **Click an item, then click a tile to place it.** No drag and drop
  plumbing needed, and it works the same with a mouse or a finger on
  mobile.
- **A ghost preview follows your cursor**, tinted green or red depending on
  whether the spot is valid. It uses the exact same validation function as
  the real placement (see `src/lib/rules.ts`), so the preview never
  promises something the click won't deliver.
- **Desks have slots.** Monitors and accessories don't sit on the floor;
  they attach to a specific desk, and the desk's real width (from
  monis.rent's actual size options: 110, 120, 140, and 160cm) decides what
  fits. Try dragging a 34 inch curved monitor onto the compact desk and it
  gets refused with a plain English reason.
- **One click persona quick starts** (Freelance Developer, Day Trader,
  Content Creator) exist so a judge sees something interesting in the
  first five seconds instead of an empty room.

## How to use it

Everything lives on one screen. Roughly the order a first time visitor
would try things:

1. **Pick a category** on the left (Desks, Chairs, Monitors, Accessories,
   or Break Corner) and browse the items inside it.
2. **Preview an item** before committing to it. Clicking "Preview" opens a
   modal with a real 3D thumbnail, its footprint in tiles, its weekly
   price, and, for items that support it, a row of color swatches to try.
3. **Place it.** Confirming from the preview drops a ghost version onto
   the floor that follows your cursor, tinted green where it can legally
   go and red where it can't. Click a valid tile to commit.
4. **Adjust it afterward.** Hover any placed item and a small floating
   toolbar appears above it with rotate, move, and remove controls, so
   nothing has to be perfect on the first try.
5. **Fill a desk.** Monitors and accessories only attach once a desk
   exists in the room. Pick a desk slot item, then click the desk you
   want it on. The desk's real width decides how many monitors and
   accessories it can hold.
6. **Try a persona quick start** (Freelance Developer, Day Trader, Content
   Creator) if you'd rather start from a finished room than build one
   from scratch, then keep editing from there.
7. **Ask the AI advisor.** The "Ask AI" button opens a popup where you
   describe how you work in plain language. It suggests real catalog
   items and explains why, and you choose whether to apply the suggestion
   to the room or close the popup without changing anything.
8. **Switch billing** between weekly and monthly in the summary panel.
   Monthly applies a standing discount to every line.
9. **Save and get a shareable link.** Once the room has something in it,
   "Save & Get Shareable Link" persists the design and returns a
   `/d/[id]` URL that reloads the same room for anyone who opens it, no
   login required.
10. **Request the setup.** From a saved design, "Request This Setup" opens
    a small contact form (name, email, optional note) that stores a lead
    against that design, standing in for a real checkout flow.

## What's implemented (the MVP)

Mapped against the brief's must haves:

- [x] Desk: 3 options (Compact 110cm / Standard 140cm / Wide 160cm)
- [x] Chair: 2 options (Ergonomic Mesh / Executive Recline)
- [x] Accessories: monitors (3), lamp, laptop stand, keyboard, webcam, plus a
      small "break corner" (bean bag, espresso machine, plant, whiteboard)
      pulled from the brief's own sketch
- [x] Live updating 3D preview as items are added, removed, and rotated
- [x] A summary/checkout view (the right hand panel) with a running total
- [x] Deployed and reachable via a public URL
- [x] Code on GitHub with `desent-bot` added as a read collaborator
- [x] 150 unit tests, 100% statement/line/function coverage, 95.94% branch coverage

Plus the "extraordinary" asks from the brief:

- **A real database** (Postgres via free tier Neon, plus Drizzle ORM)
  instead of localStorage. "Save & Get Shareable Link" persists a design
  server side, and `/d/[id]` reloads it for anyone with the link.
- **AI recommendations.** A small "Not sure where to start?" box takes a
  plain English description of how someone works and suggests real
  catalog items via Gemini (`gemini-2.5-flash-lite`, free tier),
  constrained to only ever return real catalog IDs. If there's no API
  key, the quota is exhausted, or the call errors, it falls back to a
  deterministic keyword based advisor (`src/lib/advisor-fallback.ts`) so
  the feature never just breaks in a demo.
- **Bundle detection**, mirroring monis.rent's real "The Essentials" and
  "The Trading Setup" bundles. Build a desk, chair, and curved monitor
  together and the summary panel automatically applies a 20% bundle
  discount.
- **A "Request This Setup" flow.** After saving, a tiny contact form
  stores a lead (name, email, note) against the design ID, the closest
  thing to a real conversion event without building a payment flow.

## Why Three.js doesn't get laggy here

3D is normally the riskiest choice for a timeboxed challenge, given asset
pipelines, GPU cost, and the chance of jank on a judge's older laptop.
Here is what keeps it cheap, all inside `src/components/scene/`.

1. **`frameloop="demand"` (`Scene.tsx`).** The single biggest win. Nothing
   redraws on a timer; the canvas only re-renders when you interact with
   it (`OrbitControls` invalidates itself) or when the store changes
   (`InvalidateOnChange.tsx` explicitly calls `invalidate()`). An idle tab
   uses roughly 0% GPU instead of 60fps of nothing happening.
2. **Shared geometry and materials (`geometry.ts`).** Every mesh in the
   scene references one of a handful of module scoped
   `THREE.BoxGeometry`, `CylinderGeometry`, and similar instances. A desk
   leg and a lamp pole are the same GPU buffer, just scaled differently.
   Materials are cached by color in a `Map`, so adding the 50th furniture
   piece costs zero new GPU uploads, just one more draw call.
3. **Low poly primitives, no imported models.** Furniture is built from
   about three to six boxes and cylinders per item
   (`furniture-recipes.ts`), with cylinders capped at 10 radial segments.
   This sidesteps the biggest risk of doing 3D in a few hours entirely: no
   GLB downloads, no Draco or meshopt pipeline, no loading spinners, and
   no license question about where the models came from.
4. **One instanced draw call for the floor.** All 48 grid tiles render
   through `@react-three/drei`'s `<Instances>`, meaning a single
   `InstancedMesh` instead of 48 separate mesh objects.
5. **No real time shadow maps.** A single baked looking `<ContactShadows>`
   pass gives the grounded look. It re-bakes once, not every frame, and
   only when the floor layout actually changes.
6. **Capped device pixel ratio** (`dpr={[1, 1.5]}`). Skips full native
   resolution on Retina and 4K screens, which is often a bigger cost than
   the scene's actual complexity.
7. **Bounded camera.** `OrbitControls` has `minDistance` and `maxDistance`
   plus a clamped polar angle, so there's no degenerate "fly into the
   floor" or "zoom out to a speck" state to accidentally tank the frame
   rate.

Net effect: even with every catalog item placed at once, this comes out to
a couple dozen draw calls with no textures and no shadow maps. It should
run smoothly on essentially any laptop or phone from the last several
years.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | One deployable, API routes co-located with the UI |
| 3D | React Three Fiber + drei (Three.js) | See performance section above |
| State | Zustand | Small, no boilerplate, easy undo/redo via snapshots |
| Validation | Zod | Both for the placement rules' inputs and API payloads |
| Database | Postgres via **Neon** (free tier) + Drizzle ORM | Free, doesn't sleep after inactivity (unlike Supabase's free tier), has a first-class Vercel integration |
| AI | Vercel AI SDK + `@ai-sdk/google` (Gemini) | Free tier available; `generateObject` gives a typed, schema-constrained response so the model can't suggest items that don't exist |
| Hosting | Vercel (Hobby) | Free, zero-config for Next.js |

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL (and optionally the Gemini key)
npm run dev
```

The app works with **no environment variables at all**: the 3D designer,
pricing, and bundle logic all run without a database. Only "Save & Get
Link", the shared `/d/[id]` view, and "Request This Setup" need
`DATABASE_URL`. The AI advisor needs `GOOGLE_GENERATIVE_AI_API_KEY`, or it
quietly falls back to the rule based advisor.

### Setting up the free database (2 minutes)

1. Create a free project at [neon.tech](https://neon.tech) (or, on Vercel,
   add the **Neon** integration from the Marketplace, which injects
   `DATABASE_URL` automatically).
2. Copy the pooled connection string into `.env.local` / your Vercel
   project's environment variables.
3. Push the schema: `npm run db:push`.

### Setting up the free AI advisor (optional, 1 minute)

1. Grab a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Set `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local` / Vercel.

Note: Gemini's free tier has a small daily request cap, which is why there
is a per-IP rate limit in `src/app/api/advisor/route.ts`. It exists so one
visitor mashing the button doesn't burn the whole day's quota for everyone
else looking at the demo.

## Testing

150 unit tests cover every business logic module, the whole Zustand store,
the grid/rotation math, and all four API routes (database and AI SDK
mocked), written with Vitest and React Testing Library:

```bash
npm test              # run once
npm run test:watch    # watch mode, reruns on save
npm run test:coverage # run once + print the coverage table below
```

| | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| **All files** | 100% | 95.94% | 100% | 100% |

- `src/lib/rules.test.ts`: placement and desk slot validation rules
- `src/lib/pricing.test.ts`: weekly/monthly rates, bundle detection, price breakdown
- `src/lib/catalog.test.ts`, `personas.test.ts`, `advisor-fallback.test.ts`: catalog data integrity, persona layouts, keyword based AI fallback
- `src/components/scene/layout.test.ts`: grid to world space conversion, rotated footprints
- `src/store/design-store.test.ts`: the entire Zustand store, placement, move/rotate, undo/redo, personas, desk slots
- `src/app/api/**/route.test.ts`: every API route, with `@/lib/db` and the AI SDK mocked so the suite never touches the real database or spends AI quota

Roughly 4% of the uncovered branches are defensive fallbacks for states the
UI can't actually produce, such as a stale catalog id that no longer
resolves. They're kept for robustness even though normal use never
exercises them. Config lives in `vitest.config.ts`, with coverage
thresholds (90% lines/statements/functions, 85% branches) enforced so a
regression fails the run.

## Adding `desent-bot` as a GitHub collaborator

```
Repo → Settings → Collaborators → Add people → search "desent-bot" → Read access
```

## Project structure

```
src/
  app/
    page.tsx                  the main designer (composes WorkspaceApp)
    d/[id]/page.tsx            loads a saved design server-side, renders it
    api/designs/route.ts       POST: save a design, returns a shareable id
    api/designs/[id]/route.ts  GET: used by the /d/[id] page
    api/requests/route.ts      POST: "Request This Setup" lead capture
    api/advisor/route.ts       POST: AI (or fallback) item suggestions
  components/
    scene/                     everything Three.js related, see performance section above
    ui/                        catalog, toolbar, summary/checkout, advisor
  lib/
    catalog.ts                 the seed product catalog (desks/chairs/etc.)
    rules.ts                   the single source of truth for "can this go here?"
    pricing.ts                 weekly/monthly rates + bundle detection
    personas.ts                one-click quick-start layouts
    advisor-fallback.ts        keyword-based suggestions when AI is unavailable
    db/                        Drizzle schema + client
  store/
    design-store.ts            Zustand store: placement, undo/redo, personas
```

## What I'd do next

Given more than a weekend:

- **Photo based room import**, IKEA Kreativ style: scan the customer's
  actual room and place furniture into it instead of an abstract grid.
- **Real 3D models** for furniture (with Draco/meshopt compression),
  replacing the procedural low poly primitives once there's budget for an
  asset pipeline and licensing.
- **Live monis.rent catalog and availability**, pulled by delivery date,
  instead of a small hardcoded seed catalog with placeholder prices.
- **Full lifestyle zones from the brief's sketch**: outdoor gear, garage
  space, a proper multi zone layout instead of one shared room.
- **Multi room and floor plan support**, with walls and doors.
- **Accounts and authentication**, so a saved design belongs to a customer
  instead of just an anonymous link.
- **Free, non grid locked rotation and finer placement**, the way The
  Sims lets you hold Alt to place off grid.
- **An admin view** of submitted "Request This Setup" leads.
- **Playwright end to end tests** for the placement rules and checkout
  flow.
- **Keyboard accessible placement** (arrow keys plus Enter to place) as an
  alternative to click only interaction, for accessibility.
- **Currency and locale support** to match monis.rent's actual USD pricing
  model once real prices are available (see note below).

## Honest caveats

- **Prices are illustrative placeholders.** monis.rent doesn't expose
  numeric pricing publicly (their product pages only show "From $/week"),
  so I invented reasonable looking weekly rates to make the checkout flow
  demonstrable. This is called out in the UI itself, not just here.
- **The catalog is a small seed set** (16 items), not the real monis.rent
  inventory. It's enough to cover "at least two desks and chairs"
  comfortably and to show the compatibility rules doing real work (a 34
  inch curved monitor genuinely won't fit the compact desk), without
  spending the whole time budget on data entry.
- **No payment integration.** "Request This Setup" captures a lead
  instead of charging a card, since monis.rent's own checkout, deposit,
  and logistics rules are more involved than a four to eight hour scope
  should try to replicate.
