import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, ChevronUp, ChevronDown, Search, SearchX } from "lucide-react";
import {
  STAGE_ORDER,
  STATES,
  REQUIRING_BODY_LIST,
  type Proposal,
} from "@/data/mockData";
import { getSlaStatus, type SlaStatus } from "@/lib/slaRules";
import { Route } from "@/routes/proposals.index";
import { useRole } from "@/context/RoleContext";
import { useSpotlight } from "@/context/DemoContext";
import { SlaBadge, StageMiniBar, StagePill, SHORT_STAGE } from "./bits";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SortKey = "id" | "projectName" | "state" | "stage" | "area" | "families" | "sla";

const ALL = "__all__";

const CHIPS = [
  { key: "all", label: "All" },
  { key: "breached", label: "Breached" },
  { key: "at-risk", label: "At Risk" },
  { key: "awaiting-award", label: "Awaiting Award" },
] as const;

type ChipKey = (typeof CHIPS)[number]["key"];

export function ProposalPipeline() {
  const { scopedProposals } = useRole();
  const spotlight = useSpotlight("pipeline-chips");
  const rows = useMemo(
    () => scopedProposals.map((p) => ({ p, sla: getSlaStatus(p) })),
    [scopedProposals],
  );
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [state, setState] = useState(ALL);
  const [body, setBody] = useState(ALL);
  const [stage, setStage] = useState(ALL);
  const [slaFilter, setSlaFilter] = useState(ALL);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "sla", dir: 1 });

  const chip: ChipKey =
    search.filter === "breached"
      ? "breached"
      : search.filter === "at-risk"
        ? "at-risk"
        : search.filter === "awaiting-award"
          ? "awaiting-award"
          : "all";

  const setChip = (key: ChipKey) =>
    navigate({
      to: "/proposals",
      search: key === "all" ? {} : { filter: key },
    });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(({ p, sla }) => {
      if (needle) {
        const hit =
          p.id.toLowerCase().includes(needle) ||
          p.projectName.toLowerCase().includes(needle) ||
          p.parcels.some((x) => x.ulpin.toLowerCase().includes(needle));
        if (!hit) return false;
      }
      if (state !== ALL && p.state !== state) return false;
      if (body !== ALL && p.requiringBody !== body) return false;
      if (stage !== ALL && p.currentStage !== stage) return false;
      if (slaFilter !== ALL && sla.status !== (slaFilter as SlaStatus)) return false;
      if (chip === "breached" && sla.status !== "BREACHED") return false;
      if (chip === "at-risk" && sla.status !== "AT_RISK") return false;
      if (
        chip === "awaiting-award" &&
        !(["SEC_11", "SEC_19"] as string[]).includes(p.currentStage)
      )
        return false;
      return true;
    });
  }, [rows, q, state, body, stage, slaFilter, chip]);

  const sorted = useMemo(() => {
    const val = (r: { p: Proposal; sla: ReturnType<typeof getSlaStatus> }) => {
      switch (sort.key) {
        case "id":
          return r.p.id;
        case "projectName":
          return r.p.projectName;
        case "state":
          return `${r.p.state} ${r.p.district}`;
        case "stage":
          return STAGE_ORDER.indexOf(r.p.currentStage);
        case "area":
          return r.p.totalAreaHa;
        case "families":
          return r.p.affectedFamilies;
        case "sla":
          return r.sla.daysRemaining === Infinity ? 99999 : r.sla.daysRemaining;
      }
    };
    return [...filtered].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * sort.dir;
      return String(av).localeCompare(String(bv)) * sort.dir;
    });
  }, [filtered, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  const hasFilters = q.trim() !== "" || state !== ALL || body !== ALL || stage !== ALL || slaFilter !== ALL || chip !== "all";

  const clearFilters = () => {
    setQ("");
    setState(ALL);
    setBody(ALL);
    setStage(ALL);
    setSlaFilter(ALL);
    navigate({ to: "/proposals", search: {} });
  };

  const Th = ({
    label,
    sortKey,
    className,
  }: {
    label: string;
    sortKey?: SortKey;
    className?: string;
  }) => (
    <th
      className={cn(
        "label-xs whitespace-nowrap border-b border-border px-3 py-2 text-left font-semibold",
        sortKey && "cursor-pointer select-none hover:text-foreground",
        className,
      )}
      onClick={sortKey ? () => toggleSort(sortKey) : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey && sort.key === sortKey ? (
          sort.dir === 1 ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )
        ) : null}
      </span>
    </th>
  );

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="panel p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search proposal ID, project name or ULPIN…"
              className="h-8 rounded-[4px] pl-8 text-[13px]"
            />
          </div>

          <FilterSelect value={state} onChange={setState} placeholder="State" options={STATES} />
          <FilterSelect
            value={body}
            onChange={setBody}
            placeholder="Requiring Body"
            options={REQUIRING_BODY_LIST}
          />
          <FilterSelect
            value={stage}
            onChange={setStage}
            placeholder="Stage"
            options={STAGE_ORDER.map((s) => ({ value: s, label: SHORT_STAGE[s] }))}
          />
          <FilterSelect
            value={slaFilter}
            onChange={setSlaFilter}
            placeholder="SLA Status"
            options={[
              { value: "OK", label: "On track" },
              { value: "AT_RISK", label: "At risk" },
              { value: "BREACHED", label: "Breached" },
            ]}
          />
        </div>

        <div className={cn("mt-2.5 flex items-center gap-1.5 border-t border-border pt-2.5", spotlight)}>
          {CHIPS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setChip(c.key)}
              className={cn(
                "rounded-[4px] border px-2.5 py-1 text-[12px] font-medium transition-colors",
                chip === c.key
                  ? "border-navy bg-navy text-navy-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
          <span className="num ml-auto text-[12px] text-muted-foreground">
            {sorted.length} of {rows.length} proposals
          </span>
        </div>
      </div>

      {/* Mobile stacked cards */}
      <div className="space-y-2 md:hidden">
        {sorted.map(({ p, sla }) => (
          <Link
            key={p.id}
            to="/proposals/$id"
            params={{ id: p.id }}
            className={cn(
              "panel block p-3",
              sla.status === "BREACHED" && "bg-status-critical/[0.045]",
              search.focus === p.id && "ring-1 ring-inset ring-status-info/40",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="num text-[11px] font-semibold text-status-info">{p.id}</span>
              <SlaBadge sla={sla} />
            </div>
            <div className="mt-1 truncate text-[13px] font-medium text-foreground">
              {p.projectName}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">{p.requiringBody}</div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="min-w-0 text-[11px] text-muted-foreground">
                {p.state} · {p.district}
              </div>
              <StagePill stage={p.currentStage} />
            </div>
            <div className="num mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{p.totalAreaHa.toFixed(2)} Ha</span>
              <span>{p.affectedFamilies} families</span>
            </div>
          </Link>
        ))}
        {sorted.length === 0 && (
          <div className="panel px-4 py-10 text-center">
            <SearchX className="mx-auto size-5 text-muted-foreground/50" />
            <p className="mt-2 text-[13px] text-muted-foreground">
              No proposals match the current filters.
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="panel hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-[13px]">
          <thead className="bg-muted/50">
            <tr>
              <Th label="Proposal ID" sortKey="id" />
              <Th label="Project / Requiring Body" sortKey="projectName" />
              <Th label="State / District" sortKey="state" />
              <Th label="Stage" sortKey="stage" />
              <Th label="Progress" />
              <Th label="Area (Ha)" sortKey="area" className="text-right" />
              <Th label="Families" sortKey="families" className="text-right" />
              <Th label="SLA" sortKey="sla" />
              <th className="w-8 border-b border-border" />
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ p, sla }) => (
              <tr
                key={p.id}
                className={cn(
                  "group border-b border-border last:border-0 hover:bg-muted/60",
                  sla.status === "BREACHED" && "bg-status-critical/[0.045]",
                  search.focus === p.id && "ring-1 ring-inset ring-status-info/40",
                )}
              >
                <td className="px-3 py-2 align-middle">
                  <Link
                    to="/proposals/$id"
                    params={{ id: p.id }}
                    className="num font-mono text-[12px] font-medium text-foreground hover:underline"
                  >
                    {p.id}
                  </Link>
                </td>
                <td className="max-w-[320px] px-3 py-2">
                  <Link
                    to="/proposals/$id"
                    params={{ id: p.id }}
                    className="block truncate font-medium text-foreground hover:underline"
                    title={p.projectName}
                  >
                    {p.projectName}
                  </Link>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {p.requiringBody}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {p.state}
                  <div className="text-[11px] text-muted-foreground">{p.district}</div>
                </td>
                <td className="px-3 py-2">
                  <StagePill stage={p.currentStage} />
                </td>
                <td className="px-3 py-2">
                  <StageMiniBar stage={p.currentStage} />
                </td>
                <td className="num whitespace-nowrap px-3 py-2 text-right">
                  {p.totalAreaHa.toFixed(2)}
                </td>
                <td className="num px-3 py-2 text-right">{p.affectedFamilies}</td>
                <td className="px-3 py-2">
                  <SlaBadge sla={sla} />
                </td>
                <td className="px-2 py-2 text-right">
                  <Link to="/proposals/$id" params={{ id: p.id }} aria-label={`Open ${p.id}`}>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground" />
                  </Link>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center">
                  <SearchX className="mx-auto size-5 text-muted-foreground/50" />
                  <p className="mt-2 text-[13px] text-muted-foreground">
                    No proposals match the current filters.
                  </p>
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-3 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      Clear filters
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: readonly (string | { value: string; label: string })[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-[168px] rounded-[4px] text-[12px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL} className="text-[12px]">
          All {placeholder}
        </SelectItem>
        {options.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          const l = typeof o === "string" ? o : o.label;
          return (
            <SelectItem key={v} value={v} className="text-[12px]">
              {l}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
