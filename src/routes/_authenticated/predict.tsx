import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Activity, AlertTriangle, ShieldCheck, Brain, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
    <TooltipProvider>
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">New CKD prediction</h1>
          <p className="text-muted-foreground mt-1">Enter the clinical parameters below.</p>
        </header>

        <section className="rounded-xl border bg-card shadow-card p-6 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Brain className="w-5 h-5 text-primary" /> Select model</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {(Object.keys(MODELS) as ModelKey[]).map((key) => {
              const m = MODELS[key];
              const active = model === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setModel(key)}
                  className={cn(
                    "text-left rounded-lg border p-4 transition-all",
                    active
                      ? "border-primary bg-accent shadow-elegant"
                      : "hover:border-primary/50 bg-background",
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-xs text-success font-medium">{m.accuracy}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
          className="rounded-xl border bg-card shadow-card p-6 space-y-8"
        >
          <h2 className="text-lg font-semibold">Clinical parameters</h2>

          <SliderField
            label="Specific Gravity (sg)"
            tooltip="Urine concentration. Low values can indicate kidney concentration deficit. Range 1.005 - 1.025."
            value={form.specific_gravity}
            min={1.005}
            max={1.025}
            step={0.005}
            display={form.specific_gravity.toFixed(3)}
            onChange={(v) => setForm({ ...form, specific_gravity: v })}
          />

          <SliderField
            label="Hemoglobin (hemo)"
            tooltip="Hemoglobin in g/dL. Normal adult range 12-17. Low values often accompany CKD-related anemia."
            value={form.hemoglobin}
            min={3}
            max={17}
            step={0.1}
            display={`${form.hemoglobin.toFixed(1)} g/dL`}
            onChange={(v) => setForm({ ...form, hemoglobin: v })}
          />

          <SliderField
            label="Red Blood Cell Count (rc)"
            tooltip="Millions of RBCs per cubic millimeter. Normal 4.2-6.1. Low values suggest anemia / CKD."
            value={form.red_blood_cell_count}
            min={2}
            max={7}
            step={0.1}
            display={`${form.red_blood_cell_count.toFixed(1)} M/cmm`}
            onChange={(v) => setForm({ ...form, red_blood_cell_count: v })}
          />

          <div className="space-y-3">
            <FieldLabel label="Albumin (al)" tooltip="Urine albumin level. 0 = none; higher values indicate proteinuria, a hallmark of kidney damage. Scale 0-5." />
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm({ ...form, albumin: n })}
                  className={cn(
                    "flex-1 py-2 rounded-md border text-sm font-medium transition-colors",
                    form.albumin === n ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <RadioField
              label="Hypertension (htn)"
              tooltip="High blood pressure. A leading cause and complication of CKD."
              value={form.hypertension}
              options={[{ v: "yes", l: "Yes" }, { v: "no", l: "No" }]}
              onChange={(v) => setForm({ ...form, hypertension: v as "yes" | "no" })}
            />
            <RadioField
              label="Diabetes Mellitus (dm)"
              tooltip="Diabetes. The single most common cause of CKD globally."
              value={form.diabetes_mellitus}
              options={[{ v: "yes", l: "Yes" }, { v: "no", l: "No" }]}
              onChange={(v) => setForm({ ...form, diabetes_mellitus: v as "yes" | "no" })}
            />
            <RadioField
              label="Appetite (appet)"
              tooltip="Self-reported appetite. Poor appetite is associated with advanced CKD (uremic symptoms)."
              value={form.appetite}
              options={[{ v: "good", l: "Good" }, { v: "poor", l: "Poor" }]}
              onChange={(v) => setForm({ ...form, appetite: v as "good" | "poor" })}
            />
            <RadioField
              label="Pus Cell (pc)"
              tooltip="Urine microscopy. Abnormal pus cells suggest urinary tract infection or kidney involvement."
              value={form.pus_cell}
              options={[{ v: "normal", l: "Normal" }, { v: "abnormal", l: "Abnormal" }]}
              onChange={(v) => setForm({ ...form, pus_cell: v as "normal" | "abnormal" })}
            />
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent/40 rounded-md p-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-warning" />
            This tool is for screening and educational purposes only. Always consult a qualified clinician.
          </div>

          <Button type="submit" size="lg" className="w-full shadow-elegant" disabled={mutation.isPending}>
            <Activity className="w-4 h-4 mr-2" />
            {mutation.isPending ? "Analyzing…" : "Run prediction"}
          </Button>
        </form>
      </div>
    </TooltipProvider>
  );
}

function FieldLabel({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Label className="text-sm">{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
        <TooltipContent className="max-w-xs"><p className="text-xs">{tooltip}</p></TooltipContent>
      </Tooltip>
    </div>
  );
}

function SliderField({
  label, tooltip, value, min, max, step, display, onChange,
}: {
  label: string; tooltip: string; value: number; min: number; max: number; step: number;
  display: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FieldLabel label={label} tooltip={tooltip} />
        <span className="text-sm font-semibold text-primary">{display}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

function RadioField({
  label, tooltip, value, options, onChange,
}: {
  label: string; tooltip: string; value: string; options: { v: string; l: string }[]; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <FieldLabel label={label} tooltip={tooltip} />
      <RadioGroup value={value} onValueChange={onChange} className="flex gap-3">
        {options.map((o) => (
          <label key={o.v} className={cn(
            "flex-1 flex items-center gap-2 px-3 py-2.5 rounded-md border cursor-pointer transition-colors",
            value === o.v ? "border-primary bg-accent" : "hover:bg-secondary",
          )}>
            <RadioGroupItem value={o.v} />
            <span className="text-sm font-medium">{o.l}</span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
