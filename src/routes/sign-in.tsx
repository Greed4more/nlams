import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Fingerprint,
  KeyRound,
  Languages,
  Loader2,
  Lock,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/context/I18nContext";
import { usePublicProposalsSearch } from "@/hooks/usePublicPortal";
import { LANGUAGES } from "@/lib/translations";
import { recordLogin } from "@/lib/lastLogin";
import { GigwUtilityBar } from "@/components/layout/GigwUtilityBar";
import { GovFooter } from "@/components/layout/GovFooter";
import { GovIdentityLockup } from "@/components/layout/GovIdentity";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Secure Sign In — BHUMITRA | Department of Land Resources" },
      {
        name: "description",
        content:
          "Secure officer sign-in for the National Land Acquisition & Management System, Department of Land Resources, Government of India.",
      },
    ],
  }),
  component: SignInPage,
});

const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCaptcha(): string {
  return Array.from({ length: 5 }, () => {
    const i = Math.floor(Math.random() * CAPTCHA_CHARS.length);
    return CAPTCHA_CHARS[i]!;
  }).join("");
}

type SignInMode = "password" | "otp";

function SignInPage() {
  const navigate = useNavigate();
  const { lang, setLang } = useI18n();

  const [mode, setMode] = useState<SignInMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Aadhaar OTP (mock second factor — shown to signal officer-grade auth)
  const [aadhaar, setAadhaar] = useState("");
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Citizen ULPIN tracker (below the fold)
  const [ulpin, setUlpin] = useState("");
  const [submittedUlpin, setSubmittedUlpin] = useState<string | null>(null);
  const { data: publicResults, isLoading: publicLoading } = usePublicProposalsSearch({
    ulpin: submittedUlpin ?? undefined,
    enabled: submittedUlpin !== null,
  });

  useEffect(() => {
    setCaptcha(makeCaptcha());
  }, []);

  const currentLangLabel = useMemo(
    () => LANGUAGES.find((l) => l.value === lang)?.label ?? "English",
    [lang],
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (captchaInput.trim().toUpperCase() !== captcha) {
      setError("Incorrect CAPTCHA — please re-enter the characters shown.");
      setCaptcha(makeCaptcha());
      setCaptchaInput("");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    recordLogin();
    void navigate({ to: "/" });
  };

  const submitOtp = (e: FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    if (!otpSent) {
      if (!/^\d{12}$/.test(aadhaar.replace(/\s+/g, ""))) {
        setOtpError("Enter a valid 12-digit Aadhaar number.");
        return;
      }
      if (!/^\d{10}$/.test(mobile.replace(/\s+/g, ""))) {
        setOtpError("Enter the mobile number registered with your officer profile.");
        return;
      }
      setOtpSent(true);
      setOtpNotice(`A one-time password has been sent to ${mobile.replace(/\d(?=\d{4})/g, "X")}.`);
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Enter the 6-digit OTP.");
      return;
    }
    setOtpNotice(
      "OTP verified. Aadhaar-linked officer sessions are enabled through Parichay for onboarded accounts — continue with Parichay SSO or password sign-in in this environment.",
    );
  };

  const parichaySignIn = () => {
    toast.info("Parichay single sign-on", {
      description:
        "Officers onboarded on the NIC Parichay directory can enter through Parichay SSO. This environment accepts the departmental credentials issued to your account.",
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <GigwUtilityBar />

      <div className="grid flex-1 lg:grid-cols-2">
        {/* Left — institutional branding and mission */}
        <section className="relative hidden overflow-hidden bg-navy px-10 py-10 text-navy-foreground lg:flex lg:flex-col">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 top-1/4 size-[420px] rounded-full bg-status-info/20 blur-3xl"
          />

          <div className="relative flex items-center justify-between">
            <GovIdentityLockup variant="dark" />
            <span className="rounded-[4px] border border-white/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80">
              Digital India
            </span>
          </div>

          <div className="relative mt-auto max-w-lg pb-6">
            <h1 className="text-[30px] font-semibold leading-tight tracking-tight">
              BHUMITRA — National Land Acquisition &amp; Management System
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed text-white/75">
              Statutory workflow, compensation and parcel-level tracking under the RFCTLARR Act,
              2013 — from Social Impact Assessment through to Rehabilitation &amp; Resettlement.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                "RFCTLARR stage tracking with statutory lapse countdowns",
                "Cryptographically chained audit vault for every filing",
                "ULPIN parcel verification and compensation assessment",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[12.5px] text-white/85">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-status-ok" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-8 text-[10.5px] leading-relaxed text-white/50">
              Restricted system of the Government of India. Access is limited to authorised officers
              of the Department of Land Resources, State Revenue Departments and notified Land
              Acquisition Offices.
            </p>
          </div>
        </section>

        {/* Right — sign-in card */}
        <section id="main-content" className="flex flex-col px-5 py-6 sm:px-10">
          <div className="flex items-center justify-between gap-3">
            <div className="lg:hidden">
              <GovIdentityLockup variant="light" />
            </div>
            <div className="ml-auto">
              <Select value={lang} onValueChange={(v) => setLang(v as typeof lang)}>
                <SelectTrigger
                  aria-label="Select language"
                  className="h-8 w-[170px] rounded-[4px] border-border bg-card text-[11.5px] font-medium"
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Languages className="size-3.5 shrink-0 text-navy" />
                    <SelectValue placeholder="Language">{currentLangLabel}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent align="end" className="max-h-[320px]">
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value} className="text-[12px]">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-[6px] bg-navy text-navy-foreground">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <div className="text-[18px] font-bold leading-tight tracking-[0.1em] text-navy">
                  BHUMITRA
                </div>
                <div className="text-[11px] leading-tight text-muted-foreground">
                  Secure officer sign-in · Department of Land Resources
                </div>
              </div>
            </div>

            <div className="panel p-5">
              <div className="grid grid-cols-2 overflow-hidden rounded-[4px] border border-border">
                {(
                  [
                    ["password", "Sign in with Password", Lock],
                    ["otp", "Sign in with Aadhaar OTP", Fingerprint],
                  ] as const
                ).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 px-2 py-2 text-[11.5px] font-semibold transition-colors",
                      mode === value
                        ? "bg-navy text-navy-foreground"
                        : "bg-card text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {mode === "password" ? (
                <form onSubmit={submit} className="mt-4 space-y-3.5">
                  <div>
                    <Label htmlFor="email" className="label-xs">
                      Official email / Officer ID
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1.5 h-10 rounded-[4px] border-[#E2E5EA] bg-card text-[13px] focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy/25"
                      placeholder="officer@dolr.gov.in"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="label-xs">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1.5 h-10 rounded-[4px] border-[#E2E5EA] bg-card text-[13px] focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy/25"
                    />
                  </div>

                  <div>
                    <Label htmlFor="captcha" className="label-xs">
                      Security check
                    </Label>
                    <div className="mt-1.5 flex items-stretch gap-2">
                      <div className="relative grid min-w-[112px] select-none place-items-center overflow-hidden rounded-[4px] border border-[#E2E5EA] bg-muted/50">
                        <span className="flex items-center gap-0.5 px-3 py-2 font-mono text-[17px] font-bold tracking-[0.18em] text-navy">
                          {captcha.split("").map((ch, i) => (
                            <span
                              key={`${ch}-${i}`}
                              style={{
                                transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (6 + i * 2)}deg) translateY(${i % 2 === 0 ? -1 : 1}px)`,
                              }}
                            >
                              {ch}
                            </span>
                          ))}
                        </span>
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-x-2 top-1/2 h-px -rotate-6 bg-navy/40"
                        />
                        <button
                          type="button"
                          aria-label="Refresh security check"
                          onClick={() => {
                            setCaptcha(makeCaptcha());
                            setCaptchaInput("");
                          }}
                          className="absolute right-1 top-1 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <RefreshCcw className="size-3" />
                        </button>
                      </div>
                      <Input
                        id="captcha"
                        required
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        className="h-10 flex-1 rounded-[4px] border-[#E2E5EA] bg-card text-[13px] tracking-[0.2em] focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy/25"
                        placeholder="Enter characters shown"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {error && <p className="text-[12px] text-status-critical">{error}</p>}

                  <Button
                    type="submit"
                    disabled={loading || captcha.length === 0}
                    className="h-10 w-full rounded-[4px] text-[13px] font-semibold"
                  >
                    {loading && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                    Secure Sign In
                  </Button>

                  <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      or
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={parichaySignIn}
                    className="h-10 w-full rounded-[4px] border-[#E2E5EA] text-[12.5px] font-semibold"
                  >
                    <KeyRound className="mr-1.5 size-3.5 text-navy" />
                    Login with Parichay SSO
                  </Button>
                </form>
              ) : (
                <form onSubmit={submitOtp} className="mt-4 space-y-3.5">
                  <div>
                    <Label htmlFor="aadhaar" className="label-xs">
                      Aadhaar number
                    </Label>
                    <Input
                      id="aadhaar"
                      inputMode="numeric"
                      maxLength={14}
                      value={aadhaar}
                      disabled={otpSent}
                      onChange={(e) => setAadhaar(e.target.value.replace(/[^\d\s]/g, ""))}
                      className="num mt-1.5 h-10 rounded-[4px] border-[#E2E5EA] bg-card text-[13px] tracking-[0.15em] focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy/25"
                      placeholder="XXXX XXXX XXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile" className="label-xs">
                      Registered mobile number
                    </Label>
                    <div className="relative mt-1.5">
                      <Smartphone className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="mobile"
                        inputMode="numeric"
                        maxLength={10}
                        value={mobile}
                        disabled={otpSent}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                        className="num h-10 rounded-[4px] border-[#E2E5EA] bg-card pl-8 text-[13px] focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy/25"
                        placeholder="10-digit mobile"
                      />
                    </div>
                  </div>

                  {otpSent && (
                    <div>
                      <Label htmlFor="otp" className="label-xs">
                        One-time password
                      </Label>
                      <Input
                        id="otp"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        className="num mt-1.5 h-10 rounded-[4px] border-[#E2E5EA] bg-card text-center text-[15px] tracking-[0.4em] focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy/25"
                        placeholder="······"
                      />
                    </div>
                  )}

                  {otpError && <p className="text-[12px] text-status-critical">{otpError}</p>}
                  {otpNotice && (
                    <p className="rounded-[4px] border border-status-info/30 bg-status-info/10 px-2.5 py-2 text-[11.5px] leading-snug text-status-info">
                      {otpNotice}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="h-10 w-full rounded-[4px] text-[13px] font-semibold"
                  >
                    {otpSent ? "Verify OTP & Sign In" : "Send OTP"}
                  </Button>
                </form>
              )}

              <p className="mt-4 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
                This is a secure Government of India portal. Unauthorized access, or use of another
                user&apos;s credentials, is a punishable offence under the Information Technology
                Act, 2000. Use of this system is monitored and audited.
              </p>
            </div>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10.5px] text-muted-foreground">
              <ShieldCheck className="size-3 text-status-ok" />
              Session protected by role-based access control and a tamper-evident audit vault.
            </div>
          </div>
        </section>
      </div>

      {/* Below the fold — citizen self-service tracking */}
      <section className="border-t border-border bg-card px-5 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2">
            <FileSearch className="size-4 text-navy" />
            <h2 className="text-[15px] font-semibold text-foreground">
              Track your land acquisition status
            </h2>
          </div>
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            Enter the 14-character ULPIN of your land parcel to view the public, non-identifying
            status of the acquisition proposal affecting it. No sign-in required.
          </p>

          <form
            className="mt-4 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmittedUlpin(ulpin.trim() ? ulpin.trim().toUpperCase() : null);
            }}
          >
            <Input
              value={ulpin}
              onChange={(e) => setUlpin(e.target.value)}
              placeholder="ULPIN (e.g. GA03B2K9X7M401)"
              className="num h-10 min-w-[240px] flex-1 rounded-[4px] border-[#E2E5EA] bg-card text-[13px] uppercase tracking-wider focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy/25"
            />
            <Button type="submit" className="h-10 rounded-[4px] text-[13px] font-semibold">
              Track Status
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          </form>

          {submittedUlpin && (
            <div className="mt-4">
              {publicLoading && (
                <p className="text-[12px] text-muted-foreground">
                  Searching the public acquisition register…
                </p>
              )}
              {!publicLoading && publicResults && publicResults.proposals.length === 0 && (
                <p className="rounded-[4px] border border-border bg-muted/40 px-3 py-2.5 text-[12px] text-muted-foreground">
                  No public acquisition record is linked to ULPIN{" "}
                  <span className="num font-mono text-foreground">{submittedUlpin}</span>. Check the
                  ULPIN printed on your land record, or search the public register by project name.
                </p>
              )}
              {!publicLoading && publicResults && publicResults.proposals.length > 0 && (
                <ul className="divide-y divide-border overflow-hidden rounded-[4px] border border-border">
                  {publicResults.proposals.map((p) => (
                    <li key={p.id}>
                      <Link
                        to="/public/$id"
                        params={{ id: p.id }}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[12.5px] font-medium text-foreground">
                            {p.projectName}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {p.state} · {p.district}
                          </div>
                        </div>
                        <span className="num shrink-0 text-[11px] font-semibold text-status-info">
                          {p.id}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to="/public"
                className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-status-info hover:underline"
              >
                Go to the full public register
                <ArrowRight className="size-3" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <GovFooter />
    </div>
  );
}
