import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Languages,
  Loader2,
  Lock,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth, ROLE_LABEL, type Role } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { LANGUAGES } from "@/lib/translations";
import { recordLogin } from "@/lib/lastLogin";
import { VectorMapBackdrop } from "@/components/map/VectorMapBackdrop";
import { GigwUtilityBar } from "@/components/layout/GigwUtilityBar";
import { GovFooter } from "@/components/layout/GovFooter";
import { AshokaChakra, OfficialSeal } from "@/components/layout/GovIdentity";
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

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Secure Officer Sign In — BHUMITRA | Department of Land Resources" },
      {
        name: "description",
        content:
          "Secure officer sign-in for the National Land Acquisition & Management System, Department of Land Resources, Government of India.",
      },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { lang, setLang } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentLangLabel = useMemo(
    () => LANGUAGES.find((l) => l.value === lang)?.label ?? "English",
    [lang],
  );

  useEffect(() => {
    if (!authLoading && session) {
      void navigate({ to: "/dashboard" });
    }
  }, [authLoading, session, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    recordLogin();
    // Role-based redirection: credentials carry app_metadata.role, and the
    // workspace at /dashboard renders the corresponding role-scoped view.
    const assignedRole = data.user?.app_metadata["role"] as Role | undefined;
    toast.success("Signed in", {
      description: assignedRole
        ? `Routing to the ${ROLE_LABEL[assignedRole]} workspace.`
        : "No workspace role assigned to this account yet.",
    });
    void navigate({ to: "/dashboard" });
  };

  const parichaySignIn = () => {
    toast.info("Government SSO", {
      description:
        "Parichay / MeriPehchan users can enter through single sign-on. This environment accepts the departmental credentials issued to your account.",
    });
  };

  const forgotPassword = () => {
    toast.info("Password assistance", {
      description:
        "Contact your departmental nodal officer to reset credentials for this environment.",
    });
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <VectorMapBackdrop />

      <div className="relative flex flex-1 flex-col">
        <GigwUtilityBar />

        {/* Institutional header */}
        <header className="border-b border-border/70 bg-card/85 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-3 px-5 py-3">
            <Link to="/" className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-ink-foreground">
                <AshokaChakra className="size-8" />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="flex items-baseline gap-2">
                  <span className="font-serif text-[19px] font-bold tracking-[0.12em] text-ink">
                    BHUMITRA
                  </span>
                  <span className="text-[12px] font-semibold text-muted-foreground">भूमित्र</span>
                </span>
                <span className="block truncate text-[10.5px] text-muted-foreground">
                  National Land Acquisition &amp; Management System · भारत सरकार
                </span>
              </span>
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              <Select value={lang} onValueChange={(v) => setLang(v as typeof lang)}>
                <SelectTrigger
                  aria-label="Select language"
                  className="h-8 w-9 justify-center gap-0 rounded-[4px] border-border bg-card/90 px-0 text-[11.5px] font-medium sm:w-[160px] sm:justify-start sm:gap-1.5 sm:px-3"
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Languages className="size-3.5 shrink-0 text-ink" />
                    <SelectValue placeholder="Language">
                      <span className="hidden sm:inline">{currentLangLabel}</span>
                    </SelectValue>
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

              <Link
                to="/"
                className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-border bg-card/90 px-3 text-[11.5px] font-semibold text-ink transition-colors hover:bg-muted"
              >
                <ArrowLeft className="size-3.5" />
                Back
              </Link>
            </div>
          </div>
        </header>

        <div className="grid flex-1 lg:grid-cols-[1.05fr_minmax(0,560px)]">
          {/* Left overlay banner over the map canvas */}
          <section className="relative hidden flex-col justify-center overflow-hidden px-10 py-14 lg:flex xl:px-16">
            <OfficialSeal className="pointer-events-none absolute -bottom-16 -left-10 size-[300px] -rotate-[6deg] text-ink opacity-[0.07]" />
            <div className="relative max-w-xl">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-ink">
                  Authorized Access
                </span>
                <span aria-hidden className="tricolour-rule h-[3px] w-16" />
              </div>

              <h1 className="mt-5 font-serif text-[40px] font-semibold leading-[1.1] tracking-tight text-ink xl:text-[46px]">
                Secure access to BHUMITRA
              </h1>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Sign in to manage land acquisition projects, workflows, parcel information and
                records.
              </p>

              <div className="mt-9 h-px max-w-md bg-border" />

              <div className="mt-9 inline-flex items-center gap-2.5 rounded-[6px] border border-forest/25 bg-card/85 px-4 py-3 shadow-[0_1px_2px_rgba(42,33,24,0.06)] backdrop-blur-sm">
                <ShieldCheck className="size-4 shrink-0 text-forest" strokeWidth={2} />
                <span className="text-[12.5px] font-medium text-ink">
                  Government service access for authorized users
                </span>
              </div>

              <p className="mt-8 max-w-md text-[10.5px] leading-relaxed text-muted-foreground">
                Restricted system of the Government of India. Access is limited to authorised
                officers of the Department of Land Resources, State Revenue Departments and notified
                Land Acquisition Offices.
              </p>
            </div>
          </section>

          {/* Authentication card */}
          <section
            id="main-content"
            className="flex items-center justify-center px-5 py-10 lg:px-10 lg:pr-14"
          >
            <div className="w-full max-w-[440px]">
              <div className="rounded-[10px] border border-border bg-card p-7 shadow-[0_28px_70px_-38px_rgba(42,33,24,0.65)]">
                <div className="flex flex-col items-center text-center">
                  <span className="grid size-14 place-items-center rounded-full bg-ink/5 ring-1 ring-ink/10">
                    <AshokaChakra className="size-9 text-ink" />
                  </span>
                  <h2 className="mt-4 text-[24px] font-semibold tracking-tight text-ink">
                    Welcome Back
                  </h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Sign in to your BHUMITRA account
                  </p>
                </div>

                <form onSubmit={submit} className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-[12px] font-semibold text-foreground">
                      Email or Username
                    </Label>
                    <div className="relative mt-1.5">
                      <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        required
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-[6px] border-border bg-muted/50 pl-10 text-[13.5px] focus-visible:border-forest focus-visible:ring-2 focus-visible:ring-forest/25"
                        placeholder="officer@dolr.gov.in"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Label
                        htmlFor="password"
                        className="text-[12px] font-semibold text-foreground"
                      >
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={forgotPassword}
                        className="text-[11.5px] font-medium text-status-info underline-offset-2 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative mt-1.5">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 rounded-[6px] border-border bg-muted/50 pl-10 pr-11 text-[13.5px] focus-visible:border-forest focus-visible:ring-2 focus-visible:ring-forest/25"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-[4px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p role="alert" className="text-[12px] text-status-critical">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full rounded-[6px] bg-forest text-[14px] font-semibold text-forest-foreground hover:bg-forest-hover"
                  >
                    {loading ? (
                      <Loader2 className="mr-1.5 size-4 animate-spin" />
                    ) : (
                      <Lock className="mr-1.5 size-4" />
                    )}
                    Sign In
                  </Button>

                  <div className="flex items-center gap-3 pt-1">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      or continue with
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={parichaySignIn}
                    className="h-11 w-full rounded-[6px] border-border text-[13px] font-semibold"
                  >
                    <ShieldCheck className="mr-1.5 size-4 text-forest" />
                    Login with Government SSO
                  </Button>
                </form>

                <p className="mt-5 border-t border-border pt-3.5 text-[10px] leading-relaxed text-muted-foreground">
                  This is a secure Government of India portal. Unauthorized access, or use of
                  another user&apos;s credentials, is a punishable offence under the Information
                  Technology Act, 2000. Use of this system is monitored and audited.
                </p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10.5px] text-muted-foreground">
                <ShieldCheck className="size-3 shrink-0 text-forest" />
                Session protected by role-based access control and a tamper-evident audit vault.
              </div>
            </div>
          </section>
        </div>

        <GovFooter />
      </div>
    </div>
  );
}
