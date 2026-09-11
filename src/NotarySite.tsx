import { useEffect } from "react";
import SmartBooking from "./SmartBooking";
import BusinessInquiry from "./BusinessInquiry";
import { SERVICES } from "../shared/catalog.mjs";
const startBooking = (id: string) => window.dispatchEvent(new CustomEvent("smart-booking", {detail:id}));

const PRICING_IMAGES = {
  commissioner: "/istockphoto-505753884-612x612.jpg",
  notarization:
    "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80",
  mobile: "/istockphoto-1057613520-612x612.jpg",
} as const;

const LEGAL_IMAGE =
  "https://images.unsplash.com/photo-1528747008803-1f5c1c687b81?auto=format&fit=crop&w=1600&q=80";

const withBase = (path: string) => {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
};

const FALLBACK_LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="48" viewBox="0 0 440 96">
      <rect width="440" height="96" rx="12" fill="white"/>
      <rect x="12" y="12" width="72" height="72" rx="12" fill="#0f172a"/>
      <text x="48" y="60" text-anchor="middle" font-family="Inter,Arial" font-size="40" fill="white">ON</text>
      <text x="102" y="60" font-family="Inter,Arial" font-size="28" font-weight="600" fill="#0f172a">Ontario On-Call Notary</text>
    </svg>
  `);

export default function NotarySite() {
  const serviceHighlights = SERVICES;

  useEffect(() => {
    const head = document.head;
    const ensure = (selector: string, create: () => HTMLElement) => {
      const el = head.querySelector(selector) as HTMLElement | null;
      if (el) return el;
      const made = create();
      head.appendChild(made);
      return made;
    };

    ensure('link[rel="icon"][type="image/svg+xml"]', () => {
      const l = document.createElement("link");
      l.rel = "icon";
      l.type = "image/svg+xml";
      l.href = withBase("favicon.svg");
      return l;
    });

    ensure('link[rel="icon"][sizes="32x32"]', () => {
      const l = document.createElement("link");
      l.rel = "icon";
      l.sizes = "32x32";
      l.href = withBase("favicon.ico");
      return l;
    });

    ensure('link[rel="apple-touch-icon"][sizes="180x180"]', () => {
      const l = document.createElement("link");
      l.rel = "apple-touch-icon";
      l.sizes = "180x180";
      l.href = withBase("apple-touch-icon.png");
      return l;
    });

    ensure('link[rel="mask-icon"]', () => {
      const l = document.createElement("link");
      l.rel = "mask-icon";
      l.href = withBase("safari-pinned-tab.svg");
      l.setAttribute("color", "#0f172a");
      return l;
    });

    ensure('meta[name="theme-color"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("name", "theme-color");
      m.setAttribute("content", "#0f172a");
      return m;
    });

    // Social share image (Open Graph / Twitter)
    const absoluteLogoUrl = new URL(
      withBase("logo-small.png"),
      window.location.origin
    ).toString();

    ensure('meta[property="og:image"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:image");
      m.setAttribute("content", absoluteLogoUrl);
      return m;
    });
    ensure('meta[property="og:image:alt"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:image:alt");
      m.setAttribute("content", "Ontario On-Call Notary logo");
      return m;
    });
    ensure('meta[name="twitter:card"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("name", "twitter:card");
      m.setAttribute("content", "summary");
      return m;
    });
    ensure('meta[name="twitter:image"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("name", "twitter:image");
      m.setAttribute("content", absoluteLogoUrl);
      return m;
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#f6efe3] text-[#2d1b0f]">
      <header className="sticky top-0 z-40 border-b border-[#decbb2]/70 bg-[#fefbf7]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src={withBase("logo-small.png")}
              alt="Ontario On-Call Notary logo"
              className="h-16 w-auto object-contain sm:h-16"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_LOGO;
              }}
            />
            <div className="hidden sm:block">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c4634]">
                Ontario On-Call Notary & Commissioner
              </p>
              <p className="text-xs text-[#7d6650]">
                Greater Toronto Area • Six services • By appointment
              </p>
            </div>
            <div className="block sm:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c4634]">
                Ontario On-Call Notary
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#5c4634] md:flex">
            <a href="#pricing" className="transition hover:text-[#0b2b4a]">
              Pricing
            </a>
            <a href="#services" className="transition hover:text-[#0b2b4a]">
              Services
            </a>
            <a href="#book" className="transition hover:text-[#0b2b4a]">
              Book
            </a>
            <a href="#compliance" className="transition hover:text-[#0b2b4a]">
              Compliance
            </a>
            <a href="#faq" className="transition hover:text-[#0b2b4a]">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2 ml-6">
            <a
              href="tel:+16479895308"
              className="hidden items-center gap-2 rounded-full border border-[#cdbba2] px-3 py-2 text-xs font-medium text-[#5c4634] transition hover:border-[#0b2b4a] hover:text-[#0b2b4a] lg:inline-flex whitespace-nowrap"
            >
              <span className="hidden sm:inline">Call (647) 989-5308</span>
              <span className="sm:hidden">Call</span>
            </a>
            <a
              href="#book"
              className="inline-flex items-center gap-2 rounded-full bg-[#0b2b4a] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d345a] sm:px-4 sm:text-sm whitespace-nowrap"
            >
              <span className="hidden sm:inline">Book Now</span>
              <span className="sm:hidden">Book</span>
            </a>
          </div>
        </div>
      </header>

      <main className="space-y-24 pb-24">
        <section
          className="relative overflow-hidden text-[#f8e9d2]"
          style={{
            backgroundImage: "url('/hero.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#20140c]/55 via-[#20140c]/35 to-[#3f2716]/85" />
          <div className="relative mx-auto max-w-5xl px-4 py-24 text-center md:text-left">
            <div className="flex justify-center md:justify-start">
              <img
                src={withBase("logo-small.png")}
                alt="Ontario On-Call Notary logo"
                className="h-20 w-auto"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = FALLBACK_LOGO;
                }}
              />
            </div>
            <h1 className="mt-8 text-4xl font-semibold tracking-tight md:text-5xl text-[#f8e9d2]">
              <span className="block">Reliable Notary &</span>
              <span className="block">Commissioner of Oaths Services</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-[#0d345a]">
              Smart Booking • Mediation • Legal Document Drafting •
              Greater Toronto Area
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 md:justify-start">
              <a
                href="#book"
                className="rounded-full bg-[#0b2b4a] px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#0d345a] whitespace-nowrap"
              >
                Book Now
              </a>
              <a
                href="#pricing"
                className="rounded-full border border-[#0b2b4a] px-8 py-3 text-sm font-semibold text-[#0b2b4a] transition hover:bg-[#f8e9d2]/10 whitespace-nowrap"
              >
                View Pricing
              </a>
			  {/*             <a href="#book" onClick={() => startBooking("mediation")} className="rounded-full border border-[#0b2b4a] px-8 py-3 text-sm font-semibold text-[#0b2b4a]">Book Mediation</a>
			  */}
            </div>
          </div>
        </section>

        <section id="book" className="bg-[#f1e4d3] px-4 py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr,1.2fr] lg:items-start">
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9a6b2f]">An easier way to book</p>
              <h2 className="text-3xl font-semibold">Your service. Your time.</h2>
              <p className="text-[#5c4634]">Choose from six services, review your estimate, then choose an available appointment in Calendly.</p>
              <p className="text-sm text-[#5c4634]">No account needed. No payment on this website. We provide e-Transfer instructions only after your booking is confirmed.</p>

            </div>
            <SmartBooking />
          </div>
        </section>
        <section id="pricing" className="px-4">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9a6b2f]">
                  Transparent pricing
                </p>
                <h2 className="mt-1 text-3xl font-bold text-[#2d1b0f]">
                  Simple packages tailored to your documents
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-[#5c4634]">
                  Service fees are shown before 13% HST. Final scope and
                  availability are confirmed before e-Transfer instructions. In-person only
                  for our notarization service; remote commissioning available
                  for eligible documents.
                </p>
              </div>
              <a
                href="#book"
                className="inline-flex items-center justify-center rounded-full border border-[#d3bfa4] px-5 py-2 text-sm font-semibold text-[#5c4634] transition hover:border-[#0b2b4a] hover:text-[#0b2b4a] whitespace-nowrap"
              >
                Need a custom quote? Talk to us
              </a>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  name: "Commissioner of Oaths",
                  description: "Affidavits & statutory declarations",
                  price: "$29",
                  suffix: "/ first seal",
                  note: "$15 each additional; in-person commissioning adds $10 per appointment",
                  image: PRICING_IMAGES.commissioner,
                  tag: "Remote friendly",
                },
                {
                  name: "Notarization",
                  description: "Certified true copies & witnessing",
                  price: "$39",
                  suffix: "/ first seal",
                  note: "$15 each additional",
                  image: PRICING_IMAGES.notarization,
                  tag: "Most booked",
                },
                {
                  name: "Mobile Visit",
                  description: "We come to you anywhere in the GTA",
                  price: "$1.50",
                  suffix: "/ km",
                  note: "Service fee separate; billable distance confirmed by quote",
                  image: PRICING_IMAGES.mobile,
                  tag: "By appointment",
                },
              ].map((card) => (
                <article
                  key={card.name}
                  className="relative overflow-hidden rounded-3xl bg-[#fff9f2] shadow-lg ring-1 ring-[#d3bfa4]/60 transition hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div
                    className="absolute inset-0 -z-10 bg-cover bg-center"
                    style={{ backgroundImage: `url(${card.image})` }}
                  />
                  <div className="absolute inset-0 -z-10 bg-[#fff9f2]/90 backdrop-blur-sm" />
                  <div className="flex h-full flex-col gap-4 p-6 text-[#2d1b0f]">
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        card.tag === "Most booked"
                          ? "bg-[#f59e0b] text-white shadow-lg ring-2 ring-[#f59e0b]/30"
                          : "bg-[#f2d9b5] text-[#8c5a1d]"
                      }`}
                    >
                      {card.tag}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold">{card.name}</h3>
                      <p className="mt-1 text-sm text-[#5c4634]">
                        {card.description}
                      </p>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{card.price}</span>
                      <span className="text-sm font-medium text-[#7d6650]">
                        {card.suffix}
                      </span>
                    </div>
                    <p className="text-xs text-[#7d6650]">{card.note}</p>
                    <ul className="mt-4 space-y-2 text-sm text-[#5c4634]">
                      <li className="flex gap-2">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#8c7046]" />
                        Free digital copies included
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#8c7046]" />
                        Availability confirmed before payment
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#8c7046]" />
                        Ask about approved bulk page pricing
                      </li>
                    </ul>
                    <div className="mt-auto pt-4">
                      <a
                        href="#smart-booking"
                        onClick={() => startBooking(card.name === "Commissioner of Oaths" ? "affidavits" : "copies")}
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-[#d3bfa4] px-5 py-3 text-sm font-semibold text-[#5c4634] transition hover:border-[#0b2b4a] hover:text-[#0b2b4a] whitespace-nowrap"
                      >
                        Book this service
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {serviceHighlights.slice(4).map(card => <article key={card.id} className="rounded-3xl bg-[#fff9f2] p-6 shadow-sm ring-1 ring-[#d3bfa4]/60"><h3 className="text-lg font-semibold">{card.title}</h3><ul className="mt-3 space-y-2 text-sm text-[#5c4634]">{card.points.map(point=><li key={point}>{point}</li>)}</ul><p className="mt-3 text-xs text-[#7d6650]">{card.id === "drafting" ? "Commissioning and notarization charged separately. 13% HST additional." : "Planned duration is confirmed with your request. 13% HST additional."}</p><a href="#smart-booking" onClick={()=>startBooking(card.id)} className="mt-5 inline-block text-sm font-semibold">Book this service →</a></article>)}
            </div>
            <p className="mt-6 text-sm text-[#5c4634]">Urgent eligible online commissioning from 6 PM uses double the regular service price. Bulk page rates, when applicable: 1–14 pages $15/page; 15–49 $4/page; 50+ $3/page. Ask us to confirm page-based eligibility; existing seal pricing is separate.</p>
            <p className="mt-6 text-xs text-[#7d6650]">
              Price matching: if you find a lower posted price from a licensed
              GTA provider for the same service and time window, we’ll aim to
              match or beat it. HST will be added where applicable.
            </p>
          </div>
        </section>

        <section id="services" className="px-4">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9a6b2f]">
                  Services
                </p>
                <h2 className="mt-1 text-3xl font-bold text-[#2d1b0f]">
                  What we can help with
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-[#5c4634]">
                  Tailored support for individuals, families, and businesses.
                  Select a category to see how we can assist, or combine
                  services during a single appointment.
                </p>
              </div>
              <a
                href="#book"
                className="inline-flex items-center justify-center rounded-full bg-[#0b2b4a] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0d345a] whitespace-nowrap"
              >
                Ask about bundled pricing
              </a>
            </div>
            <div className="mt-10 grid gap-x-6 gap-y-8 md:grid-cols-3">
              {serviceHighlights.map((card) => (
                <article
                  key={card.title}
                  id={`service-${card.id}`}
                  className="flex h-full flex-col overflow-hidden rounded-3xl bg-[#fff9f2] shadow-sm ring-1 ring-[#d3bfa4]/70"
                >
                  <div className="relative h-36">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-[#2d1b0f]/20" />
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-6 text-[#2d1b0f]">
                    <div>
                      <h3 className="text-lg font-semibold">{card.title}</h3>
                      <p className="mt-2 text-sm text-[#5c4634]">
                        {card.blurb}
                      </p>
                    </div>
                    <ul className="space-y-2 text-sm text-[#5c4634]">
                      {card.points.map((it) => (
                        <li key={it} className="flex gap-2">
                          <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[#8c7046]" />
                          {it}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-4">
                      <a
                        href="#smart-booking"
                        onClick={() => startBooking(card.id)}
                        className="text-sm font-semibold text-[#0b2b4a] transition hover:text-[#8c7046]"
                      >
                        Book this service →
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <BusinessInquiry />

        <section id="compliance" className="px-4">
          <div className="mx-auto grid max-w-6xl gap-8 rounded-4xl bg-[#fff9f2] px-6 py-16 shadow-sm ring-1 ring-[#d3bfa4]/70 md:grid-cols-[1.2fr,0.8fr] md:items-center">
            <div className="space-y-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9a6b2f]">
                  Ontario compliance
                </p>
                <h2 className="mt-2 text-3xl font-bold text-[#2d1b0f]">
                  Ontario compliance at a glance
                </h2>
                <p className="mt-3 text-sm text-[#5c4634]">
                  We meet all provincial requirements for notarization and
                  commissioning. Review the essentials below before your
                  appointment.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-[#d3bfa4] px-5 py-6 shadow-sm bg-white/70">
                  <h3 className="text-base font-semibold text-[#2d1b0f]">
                    ID & Eligibility
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-[#5c4634]">
                    <li>
                      Bring valid, original government‑issued photo ID (e.g.,
                      driver’s licence, passport, PR card).
                    </li>
                    <li>
                      We must see you sign (or confirm your signature). No
                      third‑party signings without you present.
                    </li>
                    <li>
                      Remote meetings require clear audio‑video and secure file
                      sharing.
                    </li>
                  </ul>
                </div>
                <div className="rounded-3xl border border-[#d3bfa4] px-5 py-6 shadow-sm bg-white/70">
                  <h3 className="text-base font-semibold text-[#2d1b0f]">
                    Notary vs. Commissioner
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-[#5c4634]">
                    <li>
                      <strong>Notarization</strong> (seal/true copy/witnessing)
                      is <em>provided in person</em>.
                    </li>
                    <li>
                      <strong>Commissioning</strong> (oaths/declarations) can be
                      done <em>remotely or in person</em>.
                    </li>
                    <li>
                      Some recipients require in-person execution. Always
                      confirm acceptance before booking remote service.
                    </li>
                  </ul>
                </div>
                <div className="rounded-3xl border border-[#d3bfa4] px-5 py-6 shadow-sm bg-white/70 md:col-span-2">
                  <h3 className="text-base font-semibold text-[#2d1b0f]">
                    Important notes
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-[#5c4634]">
                    <li>
                      We do not provide legal advice. If you need legal
                      guidance, we can refer you to counsel.
                    </li>
                    <li>
                      Wills & powers of attorney often have special witnessing
                      rules—ask us if unsure.
                    </li>
                    <li>
                      We reserve the right to refuse service if identity or
                      capacity cannot be verified.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="relative hidden overflow-hidden rounded-3xl bg-[#2d1b0f]/90 shadow-lg ring-1 ring-[#2d1b0f]/50 md:block">
              <img
                src={LEGAL_IMAGE}
                alt="Ontario notary compliance"
                className="absolute inset-0 h-full w-full object-cover opacity-70"
              />
              <div className="relative flex h-full flex-col justify-end bg-gradient-to-t from-[#2d1b0f] via-[#2d1b0f]/70 to-transparent p-6">
                <p className="text-sm text-[#f8e9d2]">
                  We maintain detailed audit trails, secure document storage,
                  and encrypted communications for remote clients.
                </p>
                <p className="mt-4 text-xs uppercase tracking-wide text-[#e9c994]">
                  Fully insured • PIPEDA compliant
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="px-4">
          <div className="mx-auto max-w-6xl rounded-4xl bg-[#fff9f2] px-6 py-16 shadow-sm ring-1 ring-[#d3bfa4]/70">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9a6b2f]">
                  FAQ
                </p>
                <h2 className="mt-2 text-3xl font-bold text-[#2d1b0f]">
                  Frequently asked questions
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-[#5c4634]">
                  Have another question? Reach out and we’ll respond within
                  minutes during business hours.
                </p>
              </div>
              <a
                href="mailto:admin@on-callnotary.ca"
                className="text-sm font-semibold text-[#0b2b4a] transition hover:text-[#8c7046]"
              >
                Email admin@on-callnotary.ca →
              </a>
            </div>
            <div className="mt-8 divide-y divide-[#e8dcc8]">
              {[
                {
                  q: "Can you notarize documents online?",
                  a: "Our notarization service is provided in person. We offer remote commissioning for eligible affidavits and statutory declarations, where accepted by the recipient.",
                },
                {
                  q: "What ID do I need?",
                  a: "Bring valid, original government-issued photo ID such as a driver’s licence, passport, PR card, or Ontario Photo Card.",
                },
                {
                  q: "Do you provide witnesses?",
                  a: "Yes, with notice—fees may apply. Some documents require two witnesses; please confirm requirements before booking.",
                },
                {
                  q: "Do you travel outside the GTA?",
                  a: "Yes, by quote. Travel is $1.50 per verified billable kilometre, plus the service fee. We confirm the distance and final amount before requesting payment.",
                },
                {q: "What does Mediation cover?", a: "A neutral third party helps with landlord, civil, family and real-estate disputes. The planned rate is $100/hour plus HST. This is not legal advice or representation."},
                {q: "What can you draft?", a: "Legal Document Drafting includes an affidavit ($65) or a travel consent letter ($50), plus HST. Commissioning and notarization are separate. Other document work requires review."},
                {q: "How does Smart Booking work?", a: "Choose a service, an appointment period and an eligible format. Add your details and review the estimate. Where online scheduling is available, choose an actual time and complete the appointment in Calendly. Otherwise, review the existing calendar options. The website estimate does not create an appointment. Payment arrangements follow confirmation."},
                {q: "When do I pay?", a: "Only after your booking is confirmed. We provide Interac e-Transfer instructions for the 50% deposit. No card or Stripe payment is collected on this website."},
                {q: "Can I request an urgent appointment?", a: "From 6 PM, urgent requests are online only and need at least 30 minutes’ notice. Eligible commissioning is double the normal service price. Drafting retains regular rates. After-hours mediation requires an eligibility and pricing review."},
                {q: "Do you offer business packages?", a: "Yes. Use the Business Subscription Packages inquiry form to discuss your expected monthly notarization and commissioning needs. Packages are quoted individually."},
              ].map((item, i) => (
                <details key={item.q} className="group py-4" open={i === 0}>
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-[#2d1b0f]">
                    {item.q}
                    <span
                      className="ml-4 inline-block text-lg font-bold text-[#c3aa84] transition-transform duration-200 group-open:rotate-180"
                      aria-hidden
                    >
                      ▾
                    </span>
                  </summary>
                  <p className="mt-2 text-sm text-[#5c4634]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d3bfa4] bg-[#0b2b4a] text-[#f6efe3]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f2d9b5]">
              Ontario On-Call Notary & Commissioner
            </p>
            <p className="mt-2 max-w-lg text-sm text-[#f6efe3]/90">
              Serving the Greater Toronto Area with notarization, commissioning,
              mediation and legal document drafting. Mobile and in-office
              appointments, with eligible services available online.
            </p>
            <p className="mt-6 text-xs text-[#f6efe3]/70">
              This website provides general information only and is not legal
              advice. Services are provided by a duly appointed Notary Public
              and/or Commissioner for Taking Affidavits in Ontario. Notarization
              is performed in person. Remote commissioning is available where
              accepted by the receiving party. Mediation and document drafting
              have separate scopes and eligibility.
            </p>
          </div>
          <div className="space-y-4 text-sm text-[#f6efe3]/90">
            <div>
              <p className="font-semibold text-white">Contact</p>
              <p className="mt-1">
                Email:{" "}
                <a
                  className="text-[#f2d9b5]"
                  href="mailto:admin@on-callnotary.ca"
                >
                  admin@on-callnotary.ca
                </a>
              </p>
              <p>
                Tel:{" "}
                <a className="text-[#f2d9b5]" href="tel:+16479895308">
                  (647) 989-5308
                </a>
              </p>
            </div>
            <div>
              <p className="font-semibold text-white">Services</p>
              <ul className="mt-2 space-y-2">{serviceHighlights.map(card => <li key={card.id}><a href="#smart-booking" onClick={() => startBooking(card.id)}>{card.title}</a></li>)}</ul>
              <a href="#business-packages" className="mt-3 inline-block">Business Subscription Packages</a>
              <p className="mt-6 font-semibold text-white">Service areas</p>
              <p>Across Ontario (by appointment).</p>
            </div>
          </div>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Notary",
              name: "Ontario On-Call Notary & Commissioner",
              areaServed: "Greater Toronto Area",
              hasOfferCatalog: {"@type":"OfferCatalog", name:"Services", itemListElement: SERVICES.map(service=>({"@type":"Offer",itemOffered:{"@type":"Service",name:service.title}}))},
              telephone: "+16479895308",
              url: "https://on-callnotary.ca",
              priceRange: "$",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Toronto",
                addressRegion: "ON",
                addressCountry: "CA",
              },
            }),
          }}
        />
      </footer>
    </div>
  );
}
