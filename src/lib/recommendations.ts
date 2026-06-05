import type { PredictionInput } from "./ckd";

export type RiskLevel = "low" | "moderate" | "high";

export function deriveRisk(result: "ckd" | "not_ckd", confidence: number): RiskLevel {
  if (result === "ckd") return confidence > 80 ? "high" : "moderate";
  return confidence > 80 ? "low" : "moderate";
}

export interface Recommendation {
  title: string;
  detail: string;
}

export function getRecommendations(
  result: "ckd" | "not_ckd",
  risk: RiskLevel,
  input?: Partial<PredictionInput>,
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (result === "ckd" || risk !== "low") {
    recs.push({
      title: "Consult a nephrologist",
      detail:
        "Book an appointment with a kidney specialist for confirmatory testing (eGFR, creatinine, ACR). Bring this report and any recent lab results.",
    });
  } else {
    recs.push({
      title: "Maintain annual kidney check-ups",
      detail:
        "Continue with yearly screening — especially if you have diabetes, hypertension, or a family history of kidney disease.",
    });
  }

  recs.push({
    title: "Hydrate consistently",
    detail:
      "Aim for 1.5–2 L of water per day unless your physician has restricted your fluid intake. Avoid sugary drinks and excessive caffeine.",
  });

  recs.push({
    title: "Reduce sodium and processed foods",
    detail:
      "Keep sodium intake under 2,300 mg/day. Replace processed foods with whole grains, fresh vegetables, and lean protein.",
  });

  if (input?.hypertension) {
    recs.push({
      title: "Control blood pressure",
      detail:
        "Keep BP under 130/80 mmHg. Take prescribed medication consistently, monitor daily, and reduce stress through regular exercise.",
    });
  }

  if (input?.diabetes_mellitus) {
    recs.push({
      title: "Manage blood sugar tightly",
      detail:
        "Maintain HbA1c below 7%. Diabetes is the leading cause of CKD — strict glycemic control slows progression.",
    });
  }

  if ((input?.hemoglobin ?? 14) < 12) {
    recs.push({
      title: "Address anemia",
      detail:
        "Low hemoglobin is common in CKD. Discuss iron studies, B12/folate testing, and possible supplementation with your doctor.",
    });
  }

  recs.push({
    title: "Avoid nephrotoxic medications",
    detail:
      "Limit NSAIDs (ibuprofen, naproxen) and always check with your pharmacist before starting any new medication or supplement.",
  });

  recs.push({
    title: "Stay physically active",
    detail:
      "Aim for 150 minutes of moderate exercise per week. Activity supports cardiovascular and kidney health.",
  });

  if (risk === "high") {
    recs.push({
      title: "Seek prompt medical attention",
      detail:
        "Do not delay — high-risk indicators warrant urgent clinical evaluation. Save your prediction report and share it with your care team.",
    });
  }

  return recs;
}

export const RISK_STYLES: Record<RiskLevel, { label: string; color: string; bg: string; ring: string }> = {
  low: { label: "Low Risk", color: "text-success", bg: "bg-success/10", ring: "ring-success/30" },
  moderate: { label: "Moderate Risk", color: "text-warning", bg: "bg-warning/10", ring: "ring-warning/30" },
  high: { label: "High Risk", color: "text-destructive", bg: "bg-destructive/10", ring: "ring-destructive/30" },
};
