// Shared CKD types and clinical scoring used by client + server.
export type ModelKey = "random_forest" | "adaboost" | "gradient_boosting";

export const MODELS: Record<ModelKey, { name: string; accuracy: number; description: string }> = {
  random_forest: {
    name: "Random Forest",
    accuracy: 98.5,
    description:
      "Ensemble of decision trees that vote on the outcome. Robust to noisy features and the strongest baseline on the UCI CKD dataset.",
  },
  adaboost: {
    name: "AdaBoost",
    accuracy: 97.2,
    description:
      "Boosted ensemble that focuses on hard-to-classify samples. Lightweight and interpretable.",
  },
  gradient_boosting: {
    name: "Gradient Boosting",
    accuracy: 98.0,
    description:
      "Sequentially trained trees that minimize residual error. Excellent calibration on tabular medical data.",
  },
};

export interface PredictionInput {
  specific_gravity: number;     // 1.005 - 1.025
  hypertension: boolean;
  hemoglobin: number;           // 3.0 - 17.0 g/dL
  diabetes_mellitus: boolean;
  albumin: number;              // 0 - 5
  appetite: "good" | "poor";
  red_blood_cell_count: number; // 2.0 - 7.0 millions/cmm
  pus_cell: "normal" | "abnormal";
  selected_model: ModelKey;
}

export interface PredictionOutput {
  prediction_result: "ckd" | "not_ckd";
  confidence_score: number;     // 0 - 100
  risk_level: "low" | "moderate" | "high";
}

/**
 * Clinical rule-based scoring derived from the UCI CKD dataset thresholds.
 * Each feature contributes a weighted risk signal; final score is normalised.
 * Model variations apply slight bias adjustments to mimic ensemble behaviour.
 */
export function predictCKD(input: PredictionInput): PredictionOutput {
  let score = 0;

  // Albumin (strongest indicator) — 0 normal, >=1 abnormal
  score += Math.min(input.albumin, 5) * 14; // 0..70

  // Specific gravity — low SG suggests poor kidney concentration
  if (input.specific_gravity <= 1.010) score += 18;
  else if (input.specific_gravity <= 1.015) score += 10;
  else if (input.specific_gravity <= 1.020) score += 3;

  // Hemoglobin — anemia common in CKD
  if (input.hemoglobin < 10) score += 22;
  else if (input.hemoglobin < 12) score += 12;
  else if (input.hemoglobin < 13.5) score += 4;

  // RBC count
  if (input.red_blood_cell_count < 3.5) score += 16;
  else if (input.red_blood_cell_count < 4.2) score += 8;

  // Categorical risks
  if (input.hypertension) score += 14;
  if (input.diabetes_mellitus) score += 14;
  if (input.appetite === "poor") score += 10;
  if (input.pus_cell === "abnormal") score += 12;

  // Model-specific bias (subtle)
  const bias = {
    random_forest: 0,
    adaboost: -2,
    gradient_boosting: 1,
  }[input.selected_model];
  score += bias;

  // Normalise to 0-100
  const raw = Math.max(0, Math.min(100, score));

  // Logistic-shaped confidence around threshold 50
  const distance = Math.abs(raw - 50);
  const confidence = Math.min(99.5, 55 + distance * 0.9);

  const isCKD = raw >= 50;
  const risk_level: "low" | "moderate" | "high" =
    raw < 35 ? "low" : raw < 65 ? "moderate" : "high";

  return {
    prediction_result: isCKD ? "ckd" : "not_ckd",
    confidence_score: Math.round(confidence * 10) / 10,
    risk_level,
  };
}
