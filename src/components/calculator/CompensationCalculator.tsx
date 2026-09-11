import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { ChevronDown, ChevronRight, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { computeCompensation } from "@/lib/compensation";
import { computePayloadSha256 } from "@/lib/clientCrypto";
import { formatINRFull, formatCrore } from "@/data/mockData";
import { useProposalsQuery } from "@/hooks/useProposals";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRole, NO_CREDENTIALS_HINT } from "@/context/RoleContext";
import { useSpotlight } from "@/context/DemoContext";
import { cn } from "@/lib/utils";
import { Route as CalculatorRoute } from "@/routes/calculator";

function useCountUp(value: number) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 550);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(from + (value - from) * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return display;
}

export function CompensationCalculator() {
  const { canAct, person, role } = useRole();
  const spotlight = useSpotlight("calculator-breakdown");
  const search = CalculatorRoute.useSearch();
  const { data: proposals } = useProposalsQuery();

  const [areaHa, setAreaHa] = useState(4.5);
  const [marketValuePerHa, setMarketValuePerHa] = useState(28_00_000);
  const [classification, setClassification] = useState<"RURAL" | "URBAN">("RURAL");
  const [distance, setDistance] = useState(22);
  const [trees, setTrees] = useState(3_20_000);
  const [structures, setStructures] = useState(11_50_000);
  const [wells, setWells] = useState(2_40_000);
  const [siaDate, setSiaDate] = useState("2024-03-18");
  const [awardDate, setAwardDate] = useState("2026-02-11");

  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideAmount, setOverrideAmount] = useState("");
  const [justification, setJustification] = useState("");
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  const [prefillUlpin, setPrefillUlpin] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (!search.ulpin || !proposals) return;
    const match = proposals.flatMap((p) => p.parcels).find((p) => p.ulpin === search.ulpin);
    if (!match) return;
    setAreaHa(match.areaHa);
    setClassification(match.classification);
    setMarketValuePerHa(
      Math.round(match.compensationAssessed / Math.max(match.areaHa, 0.01) / 10_000) * 10_000,
    );
    setPrefillUlpin(match.ulpin);
    setBannerDismissed(false);
  }, [search.ulpin, proposals]);

  const result = useMemo(
    () =>
      computeCompensation({
        areaHa,
        marketValuePerHa,
        classification,
        distanceFromUrbanKm: distance,
        trees,
        structures,
        wells,
        siaNotificationDate: siaDate,
        awardDate,
      }),
    [
      areaHa,
      marketValuePerHa,
      classification,
      distance,
      trees,
      structures,
      wells,
      siaDate,
      awardDate,
    ],
  );

  const animated = useCountUp(result.finalAward);

  const chartData = [
    {
      name: "Award",
      land: result.multipliedLandValue,
      assets: result.assetValue,
      solatium: result.solatium,
      interest: result.interest,
    },
  ];

  return (
    <div>
      {prefillUlpin && !bannerDismissed && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-[4px] border border-status-info/30 bg-status-info/10 px-3 py-2 text-[12px] text-status-info">
          <span>
            Prefilled from parcel{" "}
            <span className="num font-mono font-semibold">{prefillUlpin}</span> — adjust before
            submitting.
          </span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setBannerDismissed(true)}
            className="shrink-0 text-status-info/70 transition-colors hover:text-status-info"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_440px]">
        {/* LEFT — inputs */}
        <section className="panel p-4">
          <div className="label-xs">Award Parameters</div>

          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Land Area (hectares)">
              <NumInput value={areaHa} onChange={setAreaHa} step={0.1} />
            </Field>
            <Field
              label="Base Market Value per Hectare (₹)"
              helper="Higher of circle rate or avg. of top 50% of recent sale deeds — Sec. 26(1)"
            >
              <NumInput value={marketValuePerHa} onChange={setMarketValuePerHa} step={10000} />
            </Field>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Land Classification">
              <div className="inline-flex w-full overflow-hidden rounded-[4px] border border-border">
                {(["RURAL", "URBAN"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setClassification(c)}
                    className={cn(
                      "flex-1 px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                      classification === c
                        ? "bg-navy text-navy-foreground"
                        : "bg-card text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {c === "RURAL" ? "Rural" : "Urban"}
                  </button>
                ))}
              </div>
            </Field>

            <Field
              label={`Distance from Urban Centre — ${distance} km`}
              helper={
                classification === "URBAN"
                  ? "Not applicable for urban land; factor fixed at 1.00"
                  : `Derived factor ${result.factor.toFixed(2)}× (First Schedule)`
              }
            >
              <div
                className={cn(
                  "pt-2",
                  classification === "URBAN" && "pointer-events-none opacity-45",
                )}
              >
                <Slider
                  value={[distance]}
                  min={0}
                  max={50}
                  step={1}
                  disabled={classification === "URBAN"}
                  onValueChange={(v) => setDistance(v[0] ?? 0)}
                />
              </div>
            </Field>
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <div className="label-xs">Attached Assets — Sec. 29</div>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Trees & Standing Crops (₹)">
                <NumInput value={trees} onChange={setTrees} step={10000} />
              </Field>
              <Field label="Structures & Buildings (₹)">
                <NumInput value={structures} onChange={setStructures} step={10000} />
              </Field>
              <Field label="Wells & Irrigation Works (₹)">
                <NumInput value={wells} onChange={setWells} step={10000} />
              </Field>
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <div className="label-xs">Interest Computation Window — Sec. 30(3)</div>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="SIA Notification Date">
                <Input
                  type="date"
                  value={siaDate}
                  onChange={(e) => setSiaDate(e.target.value)}
                  className="num h-8 rounded-[4px] text-[13px]"
                />
              </Field>
              <Field label="Award Date">
                <Input
                  type="date"
                  value={awardDate}
                  onChange={(e) => setAwardDate(e.target.value)}
                  className="num h-8 rounded-[4px] text-[13px]"
                />
              </Field>
            </div>
            <p className="num mt-2 text-[11px] text-muted-foreground">
              {result.interestDays} days elapsed between notification and award.
            </p>
          </div>

          {/* Officer override — gated behind LAO credentials */}
          <div className="mt-5 border-t border-border pt-3">
            {(() => {
              const toggle = (
                <button
                  type="button"
                  disabled={!canAct}
                  onClick={() => canAct && setOverrideOpen((o) => !o)}
                  className={cn(
                    "flex w-full items-center gap-1.5 text-left text-[12.5px] font-semibold text-foreground",
                    !canAct && "cursor-not-allowed opacity-45",
                  )}
                >
                  {overrideOpen ? (
                    <ChevronDown className="size-3.5" />
                  ) : (
                    <ChevronRight className="size-3.5" />
                  )}
                  Officer Override
                </button>
              );
              if (canAct) return toggle;
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="block">{toggle}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top">{NO_CREDENTIALS_HINT}</TooltipContent>
                </Tooltip>
              );
            })()}
            {overrideOpen && canAct && (
              <div className="mt-3 space-y-3">
                <Field label="Override Award Amount (₹)">
                  <Input
                    value={overrideAmount}
                    onChange={(e) => setOverrideAmount(e.target.value)}
                    inputMode="numeric"
                    className="num h-8 rounded-[4px] text-[13px]"
                  />
                </Field>
                <Field label="Justification (mandatory)">
                  <Textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    rows={3}
                    placeholder="Record the statutory basis and evidence relied upon for the override…"
                    className="rounded-[4px] text-[13px]"
                  />
                </Field>
                <button
                  type="button"
                  disabled={
                    !overrideAmount.trim() || justification.trim().length < 10 || overrideSubmitting
                  }
                  onClick={async () => {
                    const revisedAward = Number(overrideAmount) || 0;
                    const record = {
                      type: "COMPENSATION_OVERRIDE",
                      proposalUlpin: search.ulpin ?? null,
                      originalAward: result.finalAward,
                      revisedAward,
                      justification,
                      officer: person,
                      role,
                      computedAt: new Date().toISOString(),
                    };
                    setOverrideSubmitting(true);
                    try {
                      const hash = await computePayloadSha256(record);
                      toast.success("Override recorded and anchored to audit trail", {
                        description: `Revised award ${formatINRFull(revisedAward)} logged against the officer's credential. Integrity hash ${hash.slice(0, 16)}…`,
                      });
                    } finally {
                      setOverrideSubmitting(false);
                    }
                  }}
                  className="rounded-[4px] bg-navy px-3 py-1.5 text-[12.5px] font-semibold text-navy-foreground disabled:opacity-45"
                >
                  Save Override
                </button>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT — breakdown */}
        <section className={cn("panel sticky top-[72px] overflow-hidden", spotlight)}>
          <div className="border-b border-border px-4 py-2.5">
            <div className="label-xs">Statutory Breakdown</div>
          </div>

          <div className="divide-y divide-border">
            {result.rows.map((row) => {
              const isSolatium = row.key === "solatium";
              const isFactor = row.key === "factor";
              return (
                <div
                  key={row.key}
                  className={cn(
                    "flex items-baseline justify-between gap-3 px-4 py-2",
                    isSolatium && "bg-status-ok/[0.07]",
                    row.key === "subtotal" && "bg-muted/50",
                  )}
                >
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "text-[12.5px] leading-tight",
                        isSolatium ? "font-bold text-status-ok" : "text-foreground",
                      )}
                    >
                      {row.label}
                    </div>
                    <div className="text-[10.5px] text-muted-foreground">{row.statute}</div>
                  </div>
                  <div
                    className={cn(
                      "num whitespace-nowrap text-[13.5px] font-semibold",
                      isSolatium && "text-status-ok",
                    )}
                  >
                    {isFactor ? `${row.value.toFixed(2)}×` : formatINRFull(row.value)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-navy px-4 py-4 text-navy-foreground">
            <div className="label-xs text-navy-muted">Final Award Compensation</div>
            <div className="num mt-1 text-[30px] font-bold leading-none tracking-tight">
              {formatINRFull(animated)}
            </div>
            <div className="num mt-1.5 text-[11.5px] text-navy-muted">
              {formatCrore(result.finalAward, 2)} · Sec. 27 read with Sec. 30
            </div>
            <span className="num mt-3 inline-block rounded-[4px] bg-white/10 px-2 py-1 text-[11.5px] font-semibold">
              {result.effectiveMultiple.toFixed(2)}× base market value
            </span>
          </div>

          <div className="px-4 py-3">
            <div className="label-xs mb-2">Award Decomposition</div>
            <ResponsiveContainer width="100%" height={92}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" hide />
                <RechartsTooltip
                  cursor={{ fill: "transparent" }}
                  formatter={(v: number, n: string) => [formatINRFull(v), n]}
                  contentStyle={{ fontSize: 11, borderRadius: 6 }}
                />
                <Legend wrapperStyle={{ fontSize: 10.5 }} iconSize={8} />
                <Bar dataKey="land" stackId="a" name="Land" fill="var(--navy)" />
                <Bar dataKey="assets" stackId="a" name="Assets" fill="var(--status-info)" />
                <Bar dataKey="solatium" stackId="a" name="Solatium" fill="var(--status-ok)" />
                <Bar dataKey="interest" stackId="a" name="Interest" fill="var(--status-warn)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-1.5 border-t border-border bg-muted/40 px-4 py-2 text-[10.5px] text-muted-foreground">
            <ShieldCheck className="size-3" />
            Computation logged against the officer credential for audit.
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="label-xs">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {helper && <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground">{helper}</p>}
    </div>
  );
}

function NumInput({
  value,
  onChange,
  step,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
}) {
  return (
    <Input
      type="number"
      value={value}
      step={step}
      min={0}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="num h-8 rounded-[4px] text-[13px]"
    />
  );
}
