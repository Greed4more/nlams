import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
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
  head: () => ({ meta: [{ title: "Sign in — NLAMS" }] }),
  component: SignInPage,
});

const DEMO_ACCOUNTS = [
  { label: "DoLR Secretary (national)", email: "dolr.secretary@nlams.demo" },
  { label: "District Collector — South Goa", email: "district.collector@nlams.demo" },
  { label: "Land Acquisition Officer — South Goa", email: "lao@nlams.demo" },
  { label: "State Revenue Dept — Maharashtra", email: "state.revenue@nlams.demo" },
];

const BYPASS_ROLES = [
  { value: "DOLR_SECRETARY", label: "DoLR Secretary (national)" },
  { value: "DISTRICT_COLLECTOR", label: "District Collector — South Goa" },
  { value: "LAO", label: "Land Acquisition Officer — South Goa" },
  { value: "STATE_REVENUE", label: "State Revenue Dept — Maharashtra" },
] as const;

interface BypassLoginResponse {
  token: string;
  role: string;
  name: string;
  email: string;
  states: string[];
}

function SignInPage() {
  const navigate = useNavigate();
  const { signInWithBypass } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [bypassRole, setBypassRole] =
    useState<(typeof BYPASS_ROLES)[number]["value"]>("DOLR_SECRETARY");
  const [bypassPassword, setBypassPassword] = useState("");
  const [bypassError, setBypassError] = useState<string | null>(null);
  const [bypassLoading, setBypassLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    void navigate({ to: "/" });
  };

  const submitBypass = async (e: FormEvent) => {
    e.preventDefault();
    setBypassLoading(true);
    setBypassError(null);
    try {
      const res = await api.post<BypassLoginResponse>("/api/public/auth/bypass", {
        password: bypassPassword,
        role: bypassRole,
      });
      signInWithBypass(res);
      void navigate({ to: "/" });
    } catch (err) {
      setBypassError(err instanceof ApiError ? err.message : "Bypass sign-in failed");
    } finally {
      setBypassLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-[6px] bg-navy text-navy-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-foreground">NLAMS</div>
            <div className="text-[11px] text-muted-foreground">
              National Land Acquisition &amp; Management System
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="panel space-y-4 p-5">
          <div>
            <Label htmlFor="email" className="label-xs">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-9 rounded-[4px] text-[13px]"
              placeholder="you@nlams.demo"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-9 rounded-[4px] text-[13px]"
            />
          </div>

          {error && <p className="text-[12px] text-status-critical">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            Sign in
          </Button>
        </form>

        <div className="panel mt-3 p-4 text-[11.5px] text-muted-foreground">
          <div className="label-xs mb-2">Demo accounts</div>
          <ul className="space-y-1">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email} className="flex items-center justify-between gap-2">
                <span>{a.label}</span>
                <button
                  type="button"
                  onClick={() => setEmail(a.email)}
                  className="num shrink-0 font-mono text-status-info hover:underline"
                >
                  {a.email}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2">
            Created by <code className="num">server/scripts/seed-supabase-users.ts</code> — shared
            demo password set there.
          </p>
        </div>

        <form onSubmit={submitBypass} className="panel mt-3 space-y-3 p-4">
          <div className="flex items-center gap-1.5">
            <KeyRound className="size-3.5 text-muted-foreground" />
            <div className="label-xs">Quick Demo Access — no Supabase account needed</div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Only needs the app's own local Postgres. Password defaults to{" "}
            <code className="num">nlams-demo-2026</code> — see{" "}
            <code className="num">server/.env.example</code>'s{" "}
            <code className="num">BYPASS_PASSWORD</code>.
          </p>

          <div>
            <Label htmlFor="bypass-role" className="label-xs">
              Role
            </Label>
            <Select value={bypassRole} onValueChange={(v) => setBypassRole(v as typeof bypassRole)}>
              <SelectTrigger id="bypass-role" className="mt-1.5 h-9 rounded-[4px] text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BYPASS_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="bypass-password" className="label-xs">
              Bypass password
            </Label>
            <Input
              id="bypass-password"
              type="password"
              required
              value={bypassPassword}
              onChange={(e) => setBypassPassword(e.target.value)}
              className="mt-1.5 h-9 rounded-[4px] text-[13px]"
            />
          </div>

          {bypassError && <p className="text-[12px] text-status-critical">{bypassError}</p>}

          <Button type="submit" variant="outline" disabled={bypassLoading} className="w-full">
            {bypassLoading && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            Bypass Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
