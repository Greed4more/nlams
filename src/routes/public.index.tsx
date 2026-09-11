import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { usePublicProposalsSearch } from "@/hooks/usePublicPortal";
import { STAGE_LABELS, STATES } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/public/")({
  head: () => ({
    meta: [
      { title: "Public Case Search — BHUMITRA" },
      {
        name: "description",
        content:
          "Search public land acquisition proposals under the RFCTLARR Act, 2013. No PII, no sign-in required.",
      },
    ],
  }),
  component: PublicSearchPage,
});

const ALL_STATES = "__all__";

function PublicSearchPage() {
  const [name, setName] = useState("");
  const [state, setState] = useState(ALL_STATES);
  const { data, isLoading, isError } = usePublicProposalsSearch({
    name: name.trim() || undefined,
    state: state === ALL_STATES ? undefined : state,
  });

  return (
    <PublicShell>
      <h1 className="text-[20px] font-semibold leading-tight tracking-tight text-foreground">
        Land Acquisition Case Search
      </h1>
      <p className="mt-1 text-[12px] text-muted-foreground">
        Public, non-identifying register of acquisition proceedings under the RFCTLARR Act, 2013.
        Search by project name or state — no personal or beneficiary data is disclosed here.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by project name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={state} onValueChange={setState}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All states" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATES}>All states</SelectItem>
            {STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <section className="panel mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead className="bg-muted/50">
              <tr>
                {["Project", "State", "District", "Current Stage"].map((h) => (
                  <th
                    key={h}
                    className="label-xs whitespace-nowrap border-b border-border px-3 py-2 text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-3 py-2">
                      <div className="shimmer h-5 w-full" />
                    </td>
                  </tr>
                ))}
              {isError && !isLoading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-[12px] text-muted-foreground"
                  >
                    Could not reach the public register. Try again shortly.
                  </td>
                </tr>
              )}
              {!isLoading && data?.proposals.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-[12px] text-muted-foreground"
                  >
                    No matching proposals found.
                  </td>
                </tr>
              )}
              {data?.proposals.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-3 py-2">
                    <Link
                      to="/public/$id"
                      params={{ id: p.id }}
                      className="font-medium text-status-info hover:underline"
                    >
                      {p.projectName}
                    </Link>
                    <div className="num text-[10.5px] text-muted-foreground">{p.id}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{p.state}</td>
                  <td className="whitespace-nowrap px-3 py-2">{p.district}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {STAGE_LABELS[p.currentStage] ?? p.currentStage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PublicShell>
  );
}
