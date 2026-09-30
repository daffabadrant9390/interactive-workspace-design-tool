import type { Metadata } from "next";
import Link from "next/link";
import { HeroScene } from "@/components/marketing/HeroScene";

export const metadata: Metadata = {
  title: "monis.rent | Rent a workspace, not just furniture",
  description:
    "Design your home office in 3D before you rent a single thing. Pick a desk, chair, monitors and more, see the price update live, then get it delivered.",
};

const steps = [
  {
    title: "Preview it",
    body: "Open any desk, chair, monitor or accessory to see a real 3D thumbnail, its footprint in tiles, its weekly price and, for most items, a color to try.",
  },
  {
    title: "Place it",
    body: "Click a tile to drop it into your room. A ghost preview shows exactly where it will land before you commit, and you can rotate or move anything afterward.",
  },
  {
    title: "Rent it",
    body: "Save your room for a shareable link, or send it straight to our team as a rental request. No account needed to try it out.",
  },
];

const highlights = [
  {
    title: "Built on real inventory rules",
    body: "Desk widths, monitor sizes and slot counts all come from our actual catalog, so a setup that fits on screen fits in your room too.",
  },
  {
    title: "An AI advisor that knows the catalog",
    body: "Describe how you work and get a suggested setup pulled only from items we actually stock, never a made up product.",
  },
  {
    title: "3D that runs on anything",
    body: "The whole room renders in a handful of draw calls, so it stays smooth on an older laptop or a phone, not just the newest hardware.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">
            monis<span className="text-accent">.</span>rent
          </span>
          <Link
            href="/design"
            className="text-sm font-medium text-muted transition hover:text-foreground"
          >
            Launch the designer
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">
              Workspace equipment, rented
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Design your workspace before a single desk shows up
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted">
              Pick a desk, a chair, monitors and accessories, arrange them in a real 3D room, and
              watch the price update as you go. What you see is what gets delivered.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/design"
                className="rounded-full bg-accent px-7 py-3 text-base font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition hover:brightness-110"
              >
                Get started
              </Link>
              <span className="text-sm text-muted">No signup needed to try it out</span>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6 text-sm">
              <div>
                <dt className="text-muted">Setup time</dt>
                <dd className="mt-1 font-semibold">Minutes, not weeks</dd>
              </div>
              <div>
                <dt className="text-muted">Billing</dt>
                <dd className="mt-1 font-semibold">Weekly or monthly</dd>
              </div>
              <div>
                <dt className="text-muted">Delivery</dt>
                <dd className="mt-1 font-semibold">Straight to your door</dd>
              </div>
            </dl>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
            <div className="aspect-[4/3] w-full">
              <HeroScene />
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">How it works</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {steps.map((step, i) => (
                <div key={step.title} className="rounded-xl border border-border bg-surface p-6">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Why it feels like more than a catalog page
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-xl border border-border p-6">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-16 text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Ready to see your setup in 3D?
            </h2>
            <p className="max-w-md text-muted">
              Build a room, save a shareable link, and send it to our team when you are ready to
              rent it for real.
            </p>
            <Link
              href="/design"
              className="mt-2 rounded-full bg-accent px-7 py-3 text-base font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition hover:brightness-110"
            >
              Get started
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted">
        monis.rent is a rental equipment brand. Prices shown in the designer are illustrative
        placeholders for this demo.
      </footer>
    </div>
  );
}
