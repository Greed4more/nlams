import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { recordLogin } from "@/lib/lastLogin";
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

/**
 * Unlinked fast-access screen for demo operators only. Deliberately not part
 * of the officer or citizen chrome and never linked from the sign-in page —
 * navigate here manually (/judge-access) when a walkthrough shouldn't pause
 * for credentials. No credential text is rendered.
 */
export const Route = createFileRoute("/judge-access")({
  head: () => ({
    meta: [{ title: "Demo Access — BHUMITRA" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: JudgeAccessPage,
});

const BYPASS_ROLES = [
  { value: "DOLR_SECRETARY", label: "DoLR Secretary (national)" },
  { value: "DISTRICT_COLLECTOR", label: "District Collector — South Goa" },
  { value: "LAO", label: "Land Acquisition Officer — South Goa" },
  { value: "STATE_REVENUE", label: "State Revenue Dept — Maharashtra" },
  { value: "FINANCE_OFFICER", label: "Finance Officer — Compensation & Disbursement" },
] as const;

interface BypassLoginResponse {
  token: string;
  role: string;
  name: string;
  email: string;
  states: string[];
}

function JudgeAccessPage() {
  const navigate = useNavigate();
  const { signInWithBypass } = useAuth();
  const [role, setRole] = useState<(typeof BYPASS_ROLES)[number]["value"]>("DOLR_SECRETARY");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<BypassLoginResponse>("/api/public/auth/bypass", {
        password,
        role,
      });
      signInWithBypass(res);
      recordLogin();
      void navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Demo sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="main-content" className="grid min-h-screen place-items-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-[6px] bg-ink text-ink-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <div className="text-[15px] font-semibold text-foreground">Demo access</div>
            <div className="text-[11px] text-muted-foreground">
              Operator-only screen · not part of the officer or citizen interface
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="panel space-y-3.5 p-5">
          <div>
            <Label htmlFor="demo-role" className="label-xs">
              Persona
            </Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger id="demo-role" className="mt-1.5 h-9 rounded-[4px] text-[13px]">
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
            <Label htmlFor="demo-password" className="label-xs">
              Demo access key
            </Label>
            <div className="relative mt-1.5">
              <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="demo-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 rounded-[4px] pl-8 text-[13px]"
                placeholder="Enter key"
                autoComplete="off"
              />
            </div>
          </div>

          {error && <p className="text-[12px] text-status-critical">{error}</p>}

          <Button type="submit" variant="outline" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            Enter demo session
          </Button>

          <p className="border-t border-border pt-3 text-[10.5px] leading-snug text-muted-foreground">
            Demo sessions are scoped to the selected persona and expire when the browser session
            ends. Do not share this URL.
          </p>
        </form>
      </div>
    </div>
  );
}
