import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  Brain,
  Info,
  Stethoscope,
  HeartPulse,
  Droplet,
  FlaskConical,
  Apple,
  Microscope,
  Gauge,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { runPrediction } from "@/lib/predict.functions";
import { MODELS, type ModelKey } from "@/lib/ckd";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/predict")({
  head: () => ({ meta: [{ title: "New prediction — NephroScan" }] }),
  component: PredictPage,
});

interface FormState {
  specific_gravity: number;
  hypertension: "yes" | "no";
  hemoglobin: number;
  diabetes_mellitus: "yes" | "no";
  albumin: number;
  appetite: "good" | "poor";
  red_blood_cell_count: number;
  pus_cell: "normal" | "abnormal";
}

type RiskBand = "normal" | "borderline" | "risk";

function bandColor(band: RiskBand) {
  return band === "normal"
    ? "text-success"
    : band === "borderline"
      ? "text-warning"
      : "text-destructive";
}
function bandBg(band: RiskBand) {
  return band === "normal"
    ? "bg-success"
    : band === "borderline"
      ? "bg-warning"
      : "bg-destructive";
}
function bandLabel(band: RiskBand) {
  return band === "normal" ? "Normal" : band === "borderline" ? "Borderline" : "High risk";
}

function sgBand(v: number): RiskBand {
  if (v >= 1.015 && v <= 1.025) return "normal";
  if (v >= 1.010) return "borderline";
  return "risk";
}
function hemoBand(v: number): RiskBand {
  if (v >= 12) return "normal";
  if (v >= 10) return "borderline";
  return "risk";
}
function rbcBand(v: number): RiskBand {
  if (v >= 4.2) return "normal";
  if (v >= 3.5) return "borderline";
  return "risk";
}
function albuminBand(n: number): RiskBand {
  if (n === 0) return "normal";
  if (n <= 2) return "borderline";
  return "risk";
}

function PredictPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const predict = useServerFn(runPrediction);
  const [model, setModel] = useState<ModelKey>("random_forest");
  const [form, setForm] = useState<FormState>({
    specific_gravity: 1.015,
    hypertension: "no",
    hemoglobin: 13.5,
    diabetes_mellitus: "no",
    albumin: 0,
    appetite: "good",
    red_blood_cell_count: 4.8,
    pus_cell: "normal",
  });

  const mutation = useMutation({
    mutationFn: async () =>
      predict({
        data: {
          specific_gravity: form.specific_gravity,
          hypertension: form.hypertension === "yes",
          hemoglobin: form.hemoglobin,
          diabetes_mellitus: form.diabetes_mellitus === "yes",
          albumin: form.albumin,
          appetite: form.appetite,
          red_blood_cell_count: form.red_blood_cell_count,
          pus_cell: form.pus_cell,
          selected_model: model,
        },
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["history"] });
      toast.success("Prediction complete");
      navigate({ to: "/results", search: { id: data.id } });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <TooltipProvider delayDuration={150}>
      <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6">
        <header className="flex items-start gap-3">
          <div className="hidden sm:flex h-12 w-12 rounded-xl bg-primary/10 items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              New CKD prediction
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Enter the clinical parameters below to assess kidney health.
            </p>
          </div>
        </header>

        {/* Educational accordion */}
        <Accordion
          type="single"
          collapsible
          className="rounded-xl border bg-card shadow-sm px-4 md:px-6"
        >
          <AccordionItem value="about" className="border-b-0">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2 text-base font-semibold">
                <Info className="w-4 h-4 text-primary" />
                About these clinical parameters
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                These eight parameters are commonly used by nephrologists and
                primary-care physicians to assess kidney function and estimate
                the risk of Chronic Kidney Disease (CKD). They combine urine
                chemistry, blood markers, clinical history, and symptom
                indicators. Together they provide a broad view of how well the
                kidneys are filtering blood, regulating fluid, and handling
                protein. This screening tool is supportive — definitive
                diagnosis always requires a qualified clinician.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Model selection */}
        <section className="rounded-xl border bg-card shadow-sm p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Select model</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {(Object.keys(MODELS) as ModelKey[]).map((key) => {
              const m = MODELS[key];
              const active = model === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setModel(key)}
                  className={cn(
                    "text-left rounded-lg border p-4 transition-all min-h-[88px]",
                    active
                      ? "border-primary bg-accent shadow-elegant ring-1 ring-primary/30"
                      : "hover:border-primary/50 bg-background",
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-xs text-success font-medium">
                      {m.accuracy}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {m.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-5"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2 px-1">
            <HeartPulse className="w-5 h-5 text-primary" />
            Clinical parameters
          </h2>

          {/* Specific Gravity */}
          <ParameterCard
            icon={<Droplet className="w-5 h-5" />}
            title="Specific Gravity (SG)"
            shortDescription="Measures urine concentration ability of the kidneys."
            info={{
              meaning:
                "Specific gravity reflects how concentrated the urine is — i.e. how well the kidneys reabsorb water.",
              range: "Normal range: 1.005 – 1.025",
              importance:
                "A persistently low SG can indicate that damaged kidneys are losing their ability to concentrate urine.",
            }}
            valueDisplay={form.specific_gravity.toFixed(3)}
            band={sgBand(form.specific_gravity)}
          >
            <RiskSlider
              value={form.specific_gravity}
              min={1.005}
              max={1.025}
              step={0.005}
              normalLabel="Normal: 1.015 – 1.025"
              onChange={(v) => setForm({ ...form, specific_gravity: v })}
              band={sgBand(form.specific_gravity)}
            />
          </ParameterCard>

          {/* Hemoglobin */}
          <ParameterCard
            icon={<HeartPulse className="w-5 h-5" />}
            title="Hemoglobin (Hemo)"
            shortDescription="Oxygen-carrying protein in red blood cells."
            info={{
              meaning:
                "Hemoglobin is the iron-containing protein in red blood cells that carries oxygen.",
              range: "Normal adult range: 12 – 17 g/dL",
              importance:
                "Low hemoglobin (anemia) is common in CKD because diseased kidneys produce less erythropoietin.",
            }}
            valueDisplay={`${form.hemoglobin.toFixed(1)} g/dL`}
            band={hemoBand(form.hemoglobin)}
          >
            <RiskSlider
              value={form.hemoglobin}
              min={3}
              max={17}
              step={0.1}
              normalLabel="Normal: ≥ 12 g/dL"
              onChange={(v) => setForm({ ...form, hemoglobin: v })}
              band={hemoBand(form.hemoglobin)}
            />
          </ParameterCard>

          {/* RBC count */}
          <ParameterCard
            icon={<Gauge className="w-5 h-5" />}
            title="Red Blood Cell Count (RC)"
            shortDescription="Number of red blood cells per cubic millimeter."
            info={{
              meaning:
                "RBC count measures circulating red blood cells, which deliver oxygen throughout the body.",
              range: "Normal range: 4.2 – 6.1 million/cmm",
              importance:
                "Low RBC counts often accompany CKD-related anemia and worsening kidney function.",
            }}
            valueDisplay={`${form.red_blood_cell_count.toFixed(1)} M/cmm`}
            band={rbcBand(form.red_blood_cell_count)}
          >
            <RiskSlider
              value={form.red_blood_cell_count}
              min={2}
              max={7}
              step={0.1}
              normalLabel="Normal: ≥ 4.2 M/cmm"
              onChange={(v) =>
                setForm({ ...form, red_blood_cell_count: v })
              }
              band={rbcBand(form.red_blood_cell_count)}
            />
          </ParameterCard>

          {/* Albumin */}
          <ParameterCard
            icon={<FlaskConical className="w-5 h-5" />}
            title="Albumin (AL)"
            shortDescription="Protein levels detected in urine."
            info={{
              meaning:
                "Albumin in urine indicates that protein is leaking through damaged kidney filters.",
              range: "Normal: 0  •  Mildly elevated: 1 – 2  •  Elevated: 3 – 5",
              importance:
                "Persistent proteinuria is a hallmark of kidney damage and a strong predictor of CKD progression.",
            }}
            valueDisplay={`Level ${form.albumin}`}
            band={albuminBand(form.albumin)}
          >
            <div className="grid grid-cols-6 gap-2">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm({ ...form, albumin: n })}
                  className={cn(
                    "py-3 rounded-md border text-sm font-medium transition-colors min-h-[44px]",
                    form.albumin === n
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-secondary",
                  )}
                  aria-label={`Albumin level ${n}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </ParameterCard>

          {/* Hypertension — full width */}
          <ParameterCard
            icon={<HeartPulse className="w-5 h-5" />}
            title="Hypertension (HTN)"
            shortDescription="History of high blood pressure."
            info={{
              meaning:
                "Hypertension is sustained high blood pressure that strains the cardiovascular system and kidneys.",
              range: "Normal BP: < 120/80 mmHg",
              importance:
                "Hypertension is both a major cause and a complication of CKD; controlling it slows kidney decline.",
            }}
            valueDisplay={form.hypertension === "yes" ? "Yes" : "No"}
          >
            <YesNoRadio
              name="htn"
              value={form.hypertension}
              onChange={(v) =>
                setForm({ ...form, hypertension: v as "yes" | "no" })
              }
            />
          </ParameterCard>

          {/* Diabetes — full width */}
          <ParameterCard
            icon={<Droplet className="w-5 h-5" />}
            title="Diabetes Mellitus (DM)"
            shortDescription="History of diabetes."
            info={{
              meaning:
                "Diabetes mellitus is a chronic condition causing elevated blood glucose levels.",
              range: "Fasting glucose normal: 70 – 99 mg/dL",
              importance:
                "Diabetes is the single most common cause of CKD globally through diabetic nephropathy.",
            }}
            valueDisplay={form.diabetes_mellitus === "yes" ? "Yes" : "No"}
          >
            <YesNoRadio
              name="dm"
              value={form.diabetes_mellitus}
              onChange={(v) =>
                setForm({ ...form, diabetes_mellitus: v as "yes" | "no" })
              }
            />
          </ParameterCard>

          {/* Appetite — full width */}
          <ParameterCard
            icon={<Apple className="w-5 h-5" />}
            title="Appetite"
            shortDescription="Self-reported appetite level."
            info={{
              meaning: "Subjective measure of desire to eat.",
              range: "Typical: Good appetite",
              importance:
                "Poor appetite often accompanies advanced CKD due to uremic toxin build-up.",
            }}
            valueDisplay={form.appetite === "good" ? "Good" : "Poor"}
          >
            <ChoiceRadio
              name="appet"
              value={form.appetite}
              options={[
                { v: "good", l: "Good" },
                { v: "poor", l: "Poor" },
              ]}
              onChange={(v) =>
                setForm({ ...form, appetite: v as "good" | "poor" })
              }
            />
          </ParameterCard>

          {/* Pus cell — full width */}
          <ParameterCard
            icon={<Microscope className="w-5 h-5" />}
            title="Pus Cell (PC)"
            shortDescription="Pus cells found in urine microscopy."
            info={{
              meaning:
                "Pus cells (leukocytes) seen on urine microscopy suggest inflammation or infection.",
              range: "Normal: 0 – 5 per high-power field",
              importance:
                "Abnormal pus cells may indicate UTI or kidney inflammation contributing to CKD risk.",
            }}
            valueDisplay={form.pus_cell === "normal" ? "Normal" : "Abnormal"}
          >
            <ChoiceRadio
              name="pc"
              value={form.pus_cell}
              options={[
                { v: "normal", l: "Normal" },
                { v: "abnormal", l: "Abnormal" },
              ]}
              onChange={(v) =>
                setForm({ ...form, pus_cell: v as "normal" | "abnormal" })
              }
            />
          </ParameterCard>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent/40 rounded-md p-3 border">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-warning" />
            This tool is for screening and educational purposes only. Always
            consult a qualified clinician.
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full shadow-elegant min-h-[48px]"
            disabled={mutation.isPending}
          >
            <Activity className="w-4 h-4 mr-2" />
            {mutation.isPending ? "Analyzing…" : "Run prediction"}
          </Button>
        </form>
      </div>
    </TooltipProvider>
  );
}

/* ---------- shared building blocks ---------- */

interface InfoContent {
  meaning: string;
  range: string;
  importance: string;
}

function ParameterCard({
  icon,
  title,
  shortDescription,
  info,
  valueDisplay,
  band,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  shortDescription: string;
  info: InfoContent;
  valueDisplay: string;
  band?: RiskBand;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card shadow-sm p-5 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-base">{title}</h3>
              <InfoPopover title={title} info={info} />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              {shortDescription}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Current
          </div>
          <div
            className={cn(
              "text-base md:text-lg font-semibold",
              band ? bandColor(band) : "text-primary",
            )}
          >
            {valueDisplay}
          </div>
          {band && (
            <div
              className={cn(
                "inline-flex items-center gap-1 mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white",
                bandBg(band),
              )}
            >
              {bandLabel(band)}
            </div>
          )}
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

function InfoPopover({ title, info }: { title: string; info: InfoContent }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`More info about ${title}`}
          className="inline-flex items-center justify-center h-6 w-6 rounded-full text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-80 text-sm space-y-2">
        <div className="font-semibold">{title}</div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">What it means</div>
          <p className="text-sm">{info.meaning}</p>
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">Normal range</div>
          <p className="text-sm">{info.range}</p>
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">Why it matters</div>
          <p className="text-sm">{info.importance}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RiskSlider({
  value,
  min,
  max,
  step,
  normalLabel,
  band,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  normalLabel: string;
  band: RiskBand;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
        className="py-2"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Min {min}</span>
        <span>Max {max}</span>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <span className="text-xs text-muted-foreground">{normalLabel}</span>
        <div className="flex items-center gap-3 text-[11px]">
          <LegendDot className="bg-success" label="Normal" active={band === "normal"} />
          <LegendDot className="bg-warning" label="Borderline" active={band === "borderline"} />
          <LegendDot className="bg-destructive" label="High risk" active={band === "risk"} />
        </div>
      </div>
    </div>
  );
}

function LegendDot({
  className,
  label,
  active,
}: {
  className: string;
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        active ? "text-foreground font-medium" : "text-muted-foreground",
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", className)} />
      {label}
    </span>
  );
}

function YesNoRadio({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <ChoiceRadio
      name={name}
      value={value}
      options={[
        { v: "yes", l: "Yes" },
        { v: "no", l: "No" },
      ]}
      onChange={onChange}
    />
  );
}

function ChoiceRadio({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="grid grid-cols-2 gap-3"
    >
      {options.map((o) => (
        <Label
          key={o.v}
          htmlFor={`${name}-${o.v}`}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-3 rounded-md border cursor-pointer transition-colors min-h-[48px] text-sm font-medium",
            value === o.v
              ? "border-primary bg-accent text-foreground"
              : "hover:bg-secondary",
          )}
        >
          <RadioGroupItem id={`${name}-${o.v}`} value={o.v} />
          {o.l}
        </Label>
      ))}
    </RadioGroup>
  );
}
