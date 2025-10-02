import React from "react";
import Link from "next/link";
import FAQ from "@/components/Faq";
import {
  ArrowRightIcon,
  PlayIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  MagnifyingGlassCircleIcon,
  CpuChipIcon,
  CameraIcon,
  GlobeAltIcon,
  BoltIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

export default function LandingPage() {
  const features = [
    {
      icon: <CameraIcon className="w-7 h-7" />,
      title: "Snap & Identify",
      description:
        "Upload or take a photo. Our vision model pinpoints the exact part with OEM numbers and cross‑refs.",
      pill: "Vision AI",
    },
    {
      icon: <WrenchScrewdriverIcon className="w-7 h-7" />,
      title: "Guaranteed Fitment",
      description:
        "VIN/vehicle selector + fitment graph ensures the part matches your make, model, year, and trim.",
      pill: "Fitment",
    },
    {
      icon: <ShieldCheckIcon className="w-7 h-7" />,
      title: "Counterfeit Shield",
      description:
        "Risk scoring, package anomalies, and seller reputation signals to avoid fake parts.",
      pill: "Trust",
    },
    {
      icon: <TruckIcon className="w-7 h-7" />,
      title: "Real‑time Stock & Delivery",
      description:
        "See nearby vendors, pickup windows, and delivery ETAs with dynamic pricing.",
      pill: "Logistics",
    },
    {
      icon: <CpuChipIcon className="w-7 h-7" />,
      title: "OEM vs Aftermarket",
      description:
        "Compare OEM, OES, and quality aftermarket alternatives with ratings and warranty.",
      pill: "Compare",
    },
    {
      icon: <GlobeAltIcon className="w-7 h-7" />,
      title: "Sri Lanka Ready",
      description:
        "LKR pricing, local vendors, trilingual UI, and support for re‑conditioned imports.",
      pill: "Local",
    },
  ];

  const steps = [
    {
      n: 1,
      title: "Choose your vehicle",
      text: "Set VIN or pick Make → Model → Year. We pre‑filter everything to your fitment.",
    },
    {
      n: 2,
      title: "Snap or search",
      text: "Upload a photo or type the part name/number. AI suggests exact matches.",
    },
    { n: 3, title: "Compare & verify", text: "See OEM vs aftermarket, pricing, stock, and risk score." },
    { n: 4, title: "Checkout or pickup", text: "Order with delivery windows or reserve for in‑store pickup." },
  ];

  const testimonials = [
    {
      name: "Ruwan Perera",
      role: "Workshop Owner – Galle",
      quote:
        "PartPal cut our sourcing time from hours to minutes. Fitment confidence is a game‑changer.",
    },
    {
      name: "Shalini Fernando",
      role: "Parts Buyer – Colombo",
      quote:
        "Counterfeit Shield saved us from a costly mistake. Love the local vendor integrations!",
    },
    {
      name: "Akila Jayasuriya",
      role: "Fleet Manager – Logistics",
      quote: "Bulk requests + delivery ETA tracking works brilliantly for our vans.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ===== HERO ===== */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-gray-950 via-indigo-900 to-gray-900">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-purple-500/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] translate-x-1/3 translate-y-1/3 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/50 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/50 rounded-full blur-xl animate-pulse delay-1000" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:flex lg:items-center lg:gap-12 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-blue-100">
              <BoltIcon className="h-4 w-4" />
              <span>AI‑Powered Spare‑Part Identifier & Marketplace</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find the <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">right part</span> in seconds -
              with fitment certainty.
            </h1>
            <p className="mt-5 text-lg leading-7 text-blue-100/90">
              Snap a photo or search by name/number. PartPal identifies the component, verifies authenticity, and connects you to nearby vendors with stock.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/identify"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-gray-900 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Try Image Identify
                <CameraIcon className="h-5 w-5" />
              </Link>
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Browse Catalog
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <button className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 font-semibold text-white/90 backdrop-blur hover:bg-white/10">
                <PlayIcon className="h-5 w-5" /> Watch 60s demo
              </button>
            </div>

            {/* Quick vehicle selector pills */}
            <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-blue-100/80">
              {[
                "Toyota Premio 2008",
                "Nissan Leaf ZE1",
                "Suzuki Alto 800",
                "Honda Vezel RU3",
                "Mazda Axela BK",
              ].map((t) => (
                <span key={t} className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                  {t}
                </span>
              ))}
            </div>

            {/* Search bar mock */}
            <div className="mt-6 max-w-xl rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur">
              <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
                <MagnifyingGlassCircleIcon className="h-6 w-6 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search: Alternator Toyota 1NZ-FE or paste part #"
                  className="h-10 w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
                <button className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white">Search</button>
              </div>
            </div>
          </div>
          {/* Mock phone card — Dark Glass UI (with part thumbnail) */}
          <div className="mt-16 w-full max-w-2xl lg:mt-0 lg:flex-1">
            <div className="relative rounded-[2rem] border border-white/10 bg-gradient-to-br from-gray-900 via-gray-900 to-black p-5 shadow-2xl">
              {/* subtle grid */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

              <div className="relative rounded-[1.25rem] bg-white/5 p-4 shadow-inner ring-1 ring-white/10 backdrop-blur">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse delay-1000" />
                    <span>Live match</span>
                    <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">98%</span>
                  </div>
                  {/* tiny part image */}
                  <img
                    src="/images/parts/brake-pad.jpg"
                    alt="Brake pad"
                    className="h-10 w-10 rounded-lg bg-black/30 object-contain ring-1 ring-white/10"
                  />
                </div>

                {/* Part summary */}
                <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <div className="truncate pr-3">
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">Part</p>
                      <p className="text-sm font-semibold text-white">Brake Pad Set (Front)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">OEM #</p>
                      <p className="font-mono text-sm text-gray-100">04465-0D240</p>
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[98%] bg-gradient-to-r from-emerald-400 to-green-500" />
                  </div>
                  <p className="mt-2 text-xs text-gray-400">Fits Toyota 1NZ‑FE · Premio/Allion (2007–2011)</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-300">
                    {["OEM", "Aftermarket A+", "Ceramic", "Warranty 6m"].map((t) => (
                      <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 ring-1 ring-white/10">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick picks */}
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {["Brake Pad", "Alternator", "Tie Rod", "Oil Filter", "Radiator", "Shock Absorber"].map((k) => (
                    <div
                      key={k}
                      className="rounded-xl border border-white/10 bg-white/5 p-3 text-center text-xs font-medium text-gray-100 hover:border-white/20"
                    >
                      {k}
                    </div>
                  ))}
                </div>

                {/* Vendor & delivery */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] text-gray-400">Nearby vendor</p>
                    <p className="text-sm font-semibold text-gray-100">AutoZone Bambalapitiya</p>
                    <p className="text-xs text-emerald-400">In stock · Pickup 2h</p>
                    <p className="mt-1 text-xs text-gray-300">LKR 8,250</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] text-gray-400">Delivery ETA</p>
                    <p className="text-sm font-semibold text-gray-100">Tomorrow 10:00–12:00</p>
                    <p className="text-xs text-blue-300">Fee LKR 950</p>
                    <p className="mt-1 text-[11px] text-gray-400">Cash on delivery available</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button className="inline-flex flex-1 items-center justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow hover:-translate-y-0.5 hover:shadow-md">
                    Add to cart
                  </button>
                  <button className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">
                    Compare
                  </button>
                  <button className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">
                    3D View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for the automotive ecosystem</h2>
            <p className="mt-3 text-lg text-gray-600">
              From workshops and fleets to DIY enthusiasts — PartPal streamlines sourcing, verification, and checkout.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600/10 to-blue-600/10 text-purple-700">
                    {f.icon}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                    {f.pill}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">From photo to checkout in four steps</h2>
          </div>
          <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n} className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <div className="absolute -top-3 left-6 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                  {s.n}
                </div>
                <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-3 text-lg text-gray-600">Start free. Upgrade as you scale.</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                name: "Starter",
                price: "Rs 0",
                note: "No credit card",
                perks: ["100 identifications / month", "1 vehicle profile", "Community support"],
              },
              {
                name: "Pro",
                price: "Rs 3,900",
                note: "/month",
                highlight: true,
                perks: [
                  "Unlimited identifications",
                  "Fitment graph + Counterfeit Shield",
                  "Vendor quotes & delivery windows",
                ],
              },
              {
                name: "Business",
                price: "Custom",
                note: "Contact sales",
                perks: ["Multi‑branch vendors", "API access", "SLA & priority support"],
              },
            ].map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl border p-6 ${
                  p.highlight
                    ? "border-transparent bg-gradient-to-b from-purple-600 to-blue-600 p-[1px]"
                    : "border-gray-200"
                }`}
              >
                <div className={`rounded-2xl ${p.highlight ? "bg-white p-6" : "p-0"}`}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                    {p.highlight && (
                      <span className="rounded-full bg-purple-600/10 px-2 py-1 text-xs font-medium text-purple-700">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-3xl font-bold">{p.price}</span>
                    <span className="text-sm text-gray-500">{p.note}</span>
                  </div>
                  <ul className="mt-5 space-y-2 text-sm">
                    {p.perks.map((k) => (
                      <li key={k} className="flex items-start gap-2">
                        <CheckCircleIcon className="mt-0.5 h-5 w-5 text-emerald-600" />
                        <span>{k}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      p.highlight
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    Get started
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Trusted by garages & fleets</h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <blockquote className="text-sm text-gray-700">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{t.name}</span> — {t.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />
    </div>
  );
}