import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      </div>
    </div>
  );
}
