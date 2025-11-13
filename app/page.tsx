export const dynamic = 'force-dynamic';

import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth'

export default async function Home() {
  const token = (await cookies()).get('auth-token')?.value
  const user = token ? verifyJWT(token) : null
  const primaryCtaHref = user ? '/admin' : '/login'
  const primaryCtaLabel = user ? 'Go to Dashboard' : 'Login'

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-indigo-100" />

      <header className="border-b border-blue-100/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-indigo-600">Doezy</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold uppercase text-indigo-600">
              MedOnsite
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-indigo-600">
              Features
            </a>
            <a href="#benefits" className="transition hover:text-indigo-600">
              Benefits
            </a>
            <a href="#contact" className="transition hover:text-indigo-600">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-3">
            {!user && (
              <Link
                href="/login"
                className="hidden text-sm font-semibold text-slate-600 transition hover:text-indigo-600 md:inline-flex"
              >
                Demo Login
              </Link>
            )}
            <Link
              href={primaryCtaHref}
              className="inline-flex items-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700"
            >
              {primaryCtaLabel}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-24 md:pb-32 md:pt-32">
        <section className="grid items-center gap-16 md:grid-cols-2">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Onsite conference management
            </span>
            <h1 className="text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
              Seamless attendee journeys from registration to check-in.
            </h1>
            <p className="text-lg leading-relaxed text-slate-600">
              Doezy’s MedOnsite platform digitises hospital-supplied attendee rosters, powers on-spot registrations, and
              keeps queues moving with secure QR passes, meal tracking, badge printing and audit trails.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={primaryCtaHref}
                className="inline-flex items-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-700"
              >
                {primaryCtaLabel}
              </Link>
              <a
                href="#features"
                className="inline-flex items-center rounded-full border border-indigo-200 px-6 py-3 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700"
              >
                Explore Features
              </a>
            </div>
            <dl className="grid gap-6 sm:grid-cols-3">
              {[
                { value: '100k+', label: 'Attendees processed' },
                { value: '99.9%', label: 'QR scan uptime' },
                { value: '7 min', label: 'Average setup time' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-indigo-100 bg-white/50 p-4 text-center shadow-sm">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</dt>
                  <dd className="mt-1 text-xl font-bold text-slate-900">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rotate-3 rounded-3xl bg-indigo-100 opacity-70 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-xl">
              <div className="border-b border-slate-200 bg-slate-900 px-6 py-3 text-sm font-semibold text-white">
                Real-time Event Oversight
              </div>
              <div className="space-y-6 px-6 py-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-100 bg-indigo-50/60 p-4">
                    <p className="text-sm font-semibold text-indigo-700">Secure QR Passes</p>
                    <p className="mt-2 text-xs text-indigo-600">
                      HMAC-signed, revokable, and trackable for every attendee.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-emerald-50/60 p-4">
                    <p className="text-sm font-semibold text-emerald-700">Meal Controls</p>
                    <p className="mt-2 text-xs text-emerald-600">
                      Enforce allowances automatically at cafeteria and gate scans.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-amber-50/60 p-4">
                    <p className="text-sm font-semibold text-amber-700">On-Spot Kiosks</p>
                    <p className="mt-2 text-xs text-amber-600">
                      Fast track walk-ins with automated badge IDs and printing.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-sky-50/60 p-4">
                    <p className="text-sm font-semibold text-sky-700">Audit Ready</p>
                    <p className="mt-2 text-xs text-sky-600">
                      Every scan, token change, and meal usage stored for compliance.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-sm font-semibold text-slate-700">Trusted by medical conference teams</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Designed with clinicians, hospital administrators, and onsite operators to deliver dependable
                    attendee journeys from pre-registration through certification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-24 space-y-10">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-900">Everything you need for day-of coordination.</h2>
            <p className="mt-3 text-lg text-slate-600">
              Doezy consolidates event intake, live scanning, badge production, and compliance into a single beautifully
              simple workspace.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Role-based dashboards',
                description:
                  'Purpose-built views for super admins, gate staff, hospitality teams, and hospital partners—all with audit trails.',
              },
              {
                title: 'Smart attendee roster',
                description:
                  'Search, filter, and enrich attendee profiles. View QR states, regenerate passes, and print badges in one click.',
              },
              {
                title: 'Instant imports',
                description:
                  'Connect Google Sheets or upload CSVs to keep onsite rosters aligned with hospital records in minutes.',
              },
              {
                title: 'Live scan monitor',
                description:
                  'Track gate activity in real time, flag failed scans, and investigate issues without leaving the dashboard.',
              },
              {
                title: 'Certificate automation',
                description:
                  'Generate CME certificates using branded templates the moment sessions conclude and attendance is verified.',
              },
              {
                title: 'Enterprise-grade security',
                description:
                  'Hardened token signing, role-based access controls, and detailed logs keep sensitive medical data protected.',
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-slate-100 bg-white/60 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="benefits" className="mt-24 grid gap-12 md:grid-cols-2">
          <div className="rounded-3xl border border-indigo-100 bg-indigo-600/90 p-8 text-white shadow-xl">
            <h2 className="text-3xl font-bold">Less chaos, more confidence.</h2>
            <p className="mt-4 text-base text-indigo-100">
              With Doezy, conference teams orchestrate thousands of specialised attendees without the manual headaches.
              Keep lines moving, maintain compliance, and give your staff the tools to delight every participant.
            </p>
            <ul className="mt-6 space-y-3 text-sm font-medium">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                  1
                </span>
                Centralise intake across hospital feeds and walk-ins.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                  2
                </span>
                Validate and revoke QR badges instantly from any device.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                  3
                </span>
                Capture every scan in tamper-proof logs for post-event audits.
              </li>
            </ul>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Plug into your existing tools</h3>
              <p className="mt-2 text-sm text-slate-600">
                Integrate hospital rosters, email senders, SMS gateways, and cloud storage. Doezy adapts to your stack, so
                teams go live faster.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Onsite & remote friendly</h3>
              <p className="mt-2 text-sm text-slate-600">
                Whether staff are stationed at registration desks or monitoring remotely, roles and permissions keep
                responsibilities clear.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Designed with clinicians</h3>
              <p className="mt-2 text-sm text-slate-600">
                We co-created MedOnsite with medical conference organisers to ensure every workflow respects clinical
                priorities and privacy.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="text-base font-semibold text-slate-900">Ready for your next conference?</span>
            <p className="mt-1 text-sm text-slate-500">
              Reach our team at{' '}
              <a href="mailto:hello@doezy.com" className="font-medium text-indigo-600 hover:text-indigo-700">
                hello@doezy.com
              </a>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={primaryCtaHref}
              className="inline-flex items-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
            >
              {primaryCtaLabel}
            </Link>
            <a
              href="tel:+12065551234"
              className="inline-flex items-center rounded-full border border-indigo-200 px-5 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              Talk to Sales
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

