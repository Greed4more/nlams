import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardList,
  FileSearch,
  Fingerprint,
  Gavel,
  IndianRupee,
  LineChart,
  Mail,
  Map as MapIcon,
  ShieldCheck,
} from "lucide-react";
import { GigwUtilityBar } from "@/components/layout/GigwUtilityBar";
import { GovFooter } from "@/components/layout/GovFooter";
import { AshokaChakra, GovIdentityLockup, OfficialSeal } from "@/components/layout/GovIdentity";
import { PortalEntryCard } from "@/components/landing/PortalEntryCard";
import { useAuth, ROLE_LABEL } from "@/context/AuthContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BHUMITRA — Land Intelligence for Transparent Infrastructure" },
      {
        name: "description",
        content:
          "An intelligent platform for transparent, data-driven land acquisition and infrastructure project monitoring under the RFCTLARR Act, 2013.",
      },
      {
        property: "og:title",
        content: "BHUMITRA — Land Intelligence for Transparent Infrastructure",
      },
      {
        property: "og:description",
        content:
          "Dual portal for land intelligence: a restricted officer workspace and an open citizen land information portal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { session, role, displayName, loading } = useAuth();
  const signedIn = !loading && session !== null;
  const officerTo = signedIn ? ("/dashboard" as const) : ("/sign-in" as const);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <GigwUtilityBar />

      {/* Masthead */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-ink/20 bg-ink text-ink-foreground">
              <AshokaChakra className="size-8" />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-[20px] font-bold tracking-[0.12em] text-ink">
                  BHUMITRA
                </span>
                <span className="text-[12.5px] font-semibold text-muted-foreground">भूमित्र</span>
              </div>
              <div className="truncate text-[10.5px] text-muted-foreground">
                Land Acquisition Management System &middot; भारत सरकार
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden rounded-[3px] border border-ink/20 bg-ink/5 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink lg:inline-flex">
              Smart India Hackathon 2026 &middot; Ministry Decision Support
            </span>
            {signedIn ? (
              <Link
                to="/dashboard"
                className="inline-flex h-9 items-center gap-1.5 rounded-[4px] bg-ink px-3.5 text-[12px] font-semibold text-ink-foreground transition-colors hover:bg-ink-hover"
              >
                <ShieldCheck className="size-3.5" />
                Open Dashboard
              </Link>
            ) : (
              <Link
                to="/sign-in"
                className="inline-flex h-9 items-center gap-1.5 rounded-[4px] border border-ink/25 px-3.5 text-[12px] font-semibold text-ink transition-colors hover:bg-ink/5"
              >
                <ShieldCheck className="size-3.5" />
                Officer Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 80% 70% at 30% 0%, black 20%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 30% 0%, black 20%, transparent 75%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full bg-forest/10 blur-3xl"
        />
        <OfficialSeal className="pointer-events-none absolute -right-4 top-6 hidden size-[300px] -rotate-[8deg] text-ink opacity-[0.06] lg:block" />

        <div className="relative mx-auto w-full max-w-[1240px] px-5 py-14 lg:py-16">
          <div className="flex items-center gap-2">
            <GovIdentityLockup variant="light" />
          </div>

          <h1 className="mt-8 max-w-3xl font-serif text-[34px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[42px]">
            Land Intelligence for Transparent Infrastructure
          </h1>
          <p className="mt-1.5 max-w-2xl font-serif text-[16px] text-ink/70">
            राष्ट्रीय भू-अधिग्रहण एवं प्रबंधन प्रणाली — पारदर्शी अधिग्रहण, समयबद्ध मुआवज़ा
          </p>
          <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            An intelligent platform for transparent, data-driven land acquisition and infrastructure
            project monitoring — from Social Impact Assessment through to compensation,
            rehabilitation and resettlement.
          </p>

          <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {[
              { icon: Gavel, label: "RFCTLARR Act, 2013 statutory workflow" },
              { icon: Fingerprint, label: "ULPIN-linked parcel records" },
              { icon: ShieldCheck, label: "Tamper-evident audit vault" },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-[12px] font-medium text-foreground"
              >
                <Icon className="size-4 shrink-0 text-forest" strokeWidth={1.9} />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Split entry gateways */}
      <main id="main-content" className="mx-auto w-full max-w-[1240px] flex-1 px-5 py-12">
        <div className="mb-7">
          <div className="label-xs">Portal access</div>
          <h2 className="mt-1.5 text-[22px] font-semibold tracking-tight text-ink">
            Choose your entry point
          </h2>
          <p className="mt-1.5 max-w-2xl text-[12.5px] text-muted-foreground">
            Administrative workflows and public disclosures are kept strictly separate. Officer
            actions are role-scoped and audited; citizen views are read-only and free of personal
            data.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <PortalEntryCard
            tone="restricted"
            badge="Restricted · Authorized Personnel Only"
            eyebrow="Officer Workspace"
            title="Officer Portal"
            description="Role-based workspace for district, state and national officers handling statutory acquisition workflows."
            ctaTo={officerTo}
            ctaLabel={
              signedIn ? `Continue as ${role ? ROLE_LABEL[role] : displayName}` : "Officer Login"
            }
            capabilities={[
              {
                icon: LineChart,
                label: "Project Monitoring & Risk Analysis",
                detail: "Stage-wise portfolios, statutory lapse countdowns and delay-risk scoring.",
              },
              {
                icon: MapIcon,
                label: "GIS Land Intelligence & Parcel Inspection",
                detail: "Cadastral maps, ULPIN verification and notified-alignment overlays.",
              },
              {
                icon: IndianRupee,
                label: "Compensation Tracking & AI Decision Support",
                detail: "Sec. 26 award assessment, disbursal status and litigation risk flags.",
              },
            ]}
            footerNote="Government service access for authorized users. Every action is logged to the audit vault."
          />

          <PortalEntryCard
            tone="open"
            badge="Open Access · Citizen Services"
            eyebrow="Public Information"
            title="Public Land Information Portal"
            description="Open, non-identifying register of acquisition proceedings — no sign-in and no personal data."
            ctaTo="/public"
            ctaLabel="Enter Public Portal"
            capabilities={[
              {
                icon: FileSearch,
                label: "Search Land Parcels & Survey Numbers",
                detail: "Look up proposals by ULPIN, project name, district or state.",
              },
              {
                icon: ClipboardList,
                label: "Track Acquisition Status & Notices",
                detail: "Follow every statutory stage from SIA through Section 19 to award.",
              },
              {
                icon: IndianRupee,
                label: "View Compensation Status & Submit Grievances",
                detail: "Public compensation aggregates and title-correction grievance filing.",
              },
            ]}
            footerNote="Personal data excluded from public disclosure under the Digital Personal Data Protection Act, 2023."
          />
        </div>
      </main>

      {/* Citizen help strip — plain-language entry points for land owners */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto grid w-full max-w-[1240px] gap-4 px-5 py-7 sm:grid-cols-3">
          {[
            {
              icon: FileSearch,
              hi: "अपनी ज़मीन खोजें",
              en: "Search your parcel by ULPIN, survey number or project name.",
              to: "/public" as const,
            },
            {
              icon: ClipboardList,
              hi: "स्थिति देखें",
              en: "Track acquisition stages, notices and compensation status.",
              to: "/public" as const,
            },
            {
              icon: Mail,
              hi: "सहायता लें",
              en: "help-dolr@gov.in · District Land Acquisition Office, Mon–Fri.",
              to: null,
            },
          ].map(({ icon: Icon, hi, en, to }) => {
            const body = (
              <>
                <span className="grid size-9 shrink-0 place-items-center rounded-[3px] border border-border bg-card text-ink">
                  <Icon className="size-4" strokeWidth={1.9} />
                </span>
                <span className="min-w-0">
                  <span className="block font-serif text-[14.5px] font-semibold text-ink">
                    {hi}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">
                    {en}
                  </span>
                </span>
              </>
            );
            return to ? (
              <Link
                key={hi}
                to={to}
                className="flex items-start gap-3 rounded-[3px] border border-transparent p-2.5 transition-colors hover:border-border hover:bg-card"
              >
                {body}
              </Link>
            ) : (
              <div key={hi} className="flex items-start gap-3 p-2.5">
                {body}
              </div>
            );
          })}
        </div>
      </section>

      <GovFooter />
    </div>
  );
}
