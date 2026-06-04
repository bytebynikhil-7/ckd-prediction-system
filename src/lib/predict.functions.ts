import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { predictCKD, type ModelKey } from "./ckd";

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

export const runPrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const result = predictCKD({
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
