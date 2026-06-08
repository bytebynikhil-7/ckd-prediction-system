import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ShieldCheck, AlertTriangle, ArrowLeft, Brain, Clock, Activity, FileText, HeartPulse } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MODELS, type ModelKey } from "@/lib/ckd";
import { cn } from "@/lib/utils";
import { deriveRisk, getRecommendations, RISK_STYLES, getRiskExplanation, type RiskLevel } from "@/lib/recommendations";

export const Route = createFileRoute("/_authenticated/results")({
  head: () => ({ meta: [{ title: "Prediction result — NephroScan" }] }),
  validateSearch: z.object({ id: z.string() }),
  component: ResultsPage,
});

function ResultsPage() {
  const { id } = Route.useSearch();
  const { data, isLoading } = useQuery({
    queryKey: ["prediction", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prediction_history")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!data) return <div className="p-10 text-center">Prediction not found.</div>;

  const isCKD = data.prediction_result === "ckd";
  const result = (isCKD ? "ckd" : "not_ckd") as "ckd" | "not_ckd";
  const conf = Number(data.confidence_score);
  const risk = deriveRisk(result, conf);
  const riskStyle = RISK_STYLES[risk];
  const recommendations = getRecommendations(result, risk, {
    hypertension: data.hypertension,
    diabetes_mellitus: data.diabetes_mellitus,
    hemoglobin: Number(data.hemoglobin),
  });

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      <Link to="/predict" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> New prediction
      </Link>

      <div className={cn(
        "rounded-2xl border-2 p-8 shadow-elegant",
        isCKD ? "border-destructive bg-destructive/5" : "border-success bg-success/5",
      )}>
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shrink-0",
            isCKD ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground",
          )}>
            {isCKD ? <AlertTriangle className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider">
              Prediction status
            </div>
            <h1 className={cn(
              "text-3xl md:text-4xl font-bold tracking-tight mt-1",
              isCKD ? "text-destructive" : "text-success",
            )}>
              {isCKD ? "CKD Detected" : "CKD Not Detected"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {getRiskExplanation(result, risk)}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <Metric label="Confidence" value={`${conf}%`} />
          <RiskMetric risk={risk} />
          <Metric label="Model" value={MODELS[data.selected_model as ModelKey].name} />
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Risk indicator</span>
            <span className={riskStyle.color + " font-semibold"}>{riskStyle.label}</span>
          </div>
          <div className="h-3 rounded-full bg-secondary overflow-hidden relative">
            <div className="absolute inset-0 flex">
              <div className="flex-1 bg-success/30" />
              <div className="flex-1 bg-warning/30" />
              <div className="flex-1 bg-destructive/30" />
            </div>
            <div
              className="relative h-full bg-foreground/80 w-1"
              style={{
                marginLeft: `${risk === "low" ? 15 : risk === "borderline" ? 35 : risk === "moderate" ? 65 : risk === "high" ? 85 : 50}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Low</span><span>Moderate</span><span>High</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-card p-6 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Input summary</h2>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Row k="Specific gravity" v={Number(data.specific_gravity).toFixed(3)} />
          <Row k="Hemoglobin" v={`${data.hemoglobin} g/dL`} />
          <Row k="RBC count" v={`${data.red_blood_cell_count} M/cmm`} />
          <Row k="Albumin" v={String(data.albumin)} />
          <Row k="Hypertension" v={data.hypertension ? "Yes" : "No"} />
          <Row k="Diabetes" v={data.diabetes_mellitus ? "Yes" : "No"} />
          <Row k="Appetite" v={data.appetite} />
          <Row k="Pus cell" v={data.pus_cell} />
        </dl>
        <div className="pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {format(new Date(data.prediction_timestamp), "PPpp")}
          <span className="mx-1">·</span>
          <Brain className="w-3.5 h-3.5" />
          {MODELS[data.selected_model as ModelKey].name}
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-card p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <HeartPulse className="w-4 h-4 text-primary" /> Health recommendations
        </h2>
        <ul className="space-y-3">
          {recommendations.map((r, i) => (
            <li key={r.title} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-accent text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <div className="font-medium text-sm">{r.title}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{r.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-md bg-warning/10 border border-warning/30 p-4 text-sm text-foreground">
        <strong className="text-warning-foreground/90">Disclaimer:</strong>{" "}
        This is a screening tool, not a medical diagnosis. Always consult a qualified healthcare professional before making any clinical decisions.
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/report" search={{ id }} className="flex-1">
          <Button className="w-full shadow-elegant"><FileText className="w-4 h-4 mr-2" /> Download report</Button>
        </Link>
        <Link to="/predict" className="flex-1"><Button className="w-full" variant="outline">Run another</Button></Link>
        <Link to="/history" className="flex-1"><Button className="w-full" variant="outline">View history</Button></Link>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}
function RiskMetric({ risk }: { risk: "low" | "moderate" | "high" }) {
  const s = RISK_STYLES[risk];
  return (
    <div className={cn("rounded-lg border p-4 ring-1", s.bg, s.ring)}>
      <div className="text-xs text-muted-foreground">Risk level</div>
      <div className={cn("text-xl font-bold mt-1", s.color)}>{s.label}</div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (<><dt className="text-muted-foreground capitalize">{k}</dt><dd className="font-medium">{v}</dd></>);
}
