import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ModelKey } from "./ckd";

const InputSchema = z.object({
  specific_gravity: z.number().min(1.005).max(1.025),
  hypertension: z.boolean(),
  hemoglobin: z.number().min(3).max(17),
  diabetes_mellitus: z.boolean(),
  albumin: z.number().int().min(0).max(5),
  appetite: z.enum(["good", "poor"]),
  red_blood_cell_count: z.number().min(2).max(7),
  pus_cell: z.enum(["normal", "abnormal"]),
  selected_model: z.enum(["random_forest", "adaboost", "gradient_boosting"]),
});

type PredictionInput = z.infer<typeof InputSchema>;

interface ApiResponse {
  prediction?: string | number;
  prediction_result?: string;
  confidence?: number;
  confidence_score?: number;
  probability?: number;
  risk_level?: string;
}

function buildApiPayload(data: PredictionInput) {
  // Matches the trained model feature names: sg, htn, hemo, dm, al, appet, rc, pc
  return {
    sg: data.specific_gravity,
    htn: data.hypertension ? 1 : 0,
    hemo: data.hemoglobin,
    dm: data.diabetes_mellitus ? 1 : 0,
    al: data.albumin,
    appet: data.appetite === "good" ? 1 : 0,
    rc: data.red_blood_cell_count,
    pc: data.pus_cell === "normal" ? 1 : 0,
    model: data.selected_model,
  };
}

function normalizeResponse(raw: ApiResponse): {
  prediction_result: "ckd" | "not_ckd";
  confidence_score: number;
  risk_level: "low" | "moderate" | "high";
} {
  const predRaw = raw.prediction ?? raw.prediction_result;
  let isCKD = false;
  if (typeof predRaw === "number") {
    isCKD = predRaw === 1;
  } else if (typeof predRaw === "string") {
    const v = predRaw.toLowerCase().trim();
    isCKD = v === "ckd" || v === "1" || v === "true" || v === "positive" || v === "yes";
  }

  let confRaw = raw.confidence_score ?? raw.confidence ?? raw.probability ?? 0;
  if (confRaw <= 1) confRaw = confRaw * 100;
  const confidence = Math.round(Math.max(0, Math.min(100, confRaw)) * 10) / 10;

  let risk: "low" | "moderate" | "high";
  if (raw.risk_level && ["low", "moderate", "high"].includes(raw.risk_level.toLowerCase())) {
    risk = raw.risk_level.toLowerCase() as "low" | "moderate" | "high";
  } else if (!isCKD) {
    risk = confidence > 75 ? "low" : "moderate";
  } else {
    risk = confidence >= 75 ? "high" : "moderate";
  }

  return {
    prediction_result: isCKD ? "ckd" : "not_ckd",
    confidence_score: confidence,
    risk_level: risk,
  };
}

async function callPredictionApi(data: PredictionInput) {
  const baseUrl = (process.env.CKD_API_URL || "").replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("CKD_API_URL is not configured on the server.");
  }
  const apiKey = process.env.CKD_API_KEY;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(`${baseUrl}/predict`, {
      method: "POST",
      headers,
      body: JSON.stringify(buildApiPayload(data)),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Prediction API error (${res.status}): ${body || res.statusText}`);
    }
    const json = (await res.json()) as ApiResponse;
    return normalizeResponse(json);
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("Prediction API timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export const runPrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const result = await callPredictionApi({
      ...data,
      selected_model: data.selected_model as ModelKey,
    });

    const { data: row, error } = await supabase
      .from("prediction_history")
      .insert({
        user_id: userId,
        specific_gravity: data.specific_gravity,
        hypertension: data.hypertension,
        hemoglobin: data.hemoglobin,
        diabetes_mellitus: data.diabetes_mellitus,
        albumin: data.albumin,
        appetite: data.appetite,
        red_blood_cell_count: data.red_blood_cell_count,
        pus_cell: data.pus_cell,
        selected_model: data.selected_model,
        prediction_result: result.prediction_result,
        confidence_score: result.confidence_score,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { ...result, id: row.id, prediction_timestamp: row.prediction_timestamp };
  });
