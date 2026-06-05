import { createFileRoute } from "@tanstack/react-router";
import { Brain, TreePine, TrendingUp, Layers } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { MODELS } from "@/lib/ckd";

export const Route = createFileRoute("/models")({
  head: () => ({
    meta: [
      { title: "Model Information — NephroScan" },
      { name: "description", content: "How Random Forest, AdaBoost, and Gradient Boosting are used to predict Chronic Kidney Disease in NephroScan." },
      { property: "og:title", content: "ML Model Information — NephroScan" },
      { property: "og:description", content: "Random Forest, AdaBoost, and Gradient Boosting for CKD prediction." },
    ],
  }),
  component: Models,
});

const DETAILS = [
  {
    key: "random_forest",
    icon: TreePine,
    how: "Builds many independent decision trees on bootstrapped samples and averages their votes. Each tree only considers a random subset of features at each split, which reduces overfitting and increases generalization on noisy clinical data.",
    strengths: ["Highly robust to outliers and missing values", "Provides natural feature importance ranking", "Strongest baseline on the UCI CKD dataset"],
    weaknesses: ["Larger memory footprint", "Less interpretable than a single tree"],
  },
  {
    key: "adaboost",
    icon: Layers,
    how: "Trains a sequence of weak learners (typically shallow trees) where each new learner focuses on the samples the previous ones misclassified. Final predictions are a weighted vote of all learners.",
    strengths: ["Lightweight and fast to train", "Adapts to difficult-to-classify samples", "Good interpretability with stump learners"],
    weaknesses: ["Sensitive to noisy labels", "Can overemphasize outliers"],
  },
  {
    key: "gradient_boosting",
    icon: TrendingUp,
    how: "Trains trees sequentially where each new tree fits the residual errors of the ensemble so far, using gradient descent in function space. Excels at producing well-calibrated probabilities.",
    strengths: ["Excellent calibration on tabular data", "Captures complex non-linear interactions", "Very competitive accuracy"],
    weaknesses: ["Slower to train than Random Forest", "Requires careful tuning to avoid overfitting"],
  },
] as const;

function Models() {
  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-14 max-w-5xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-4">
          <Brain className="w-3.5 h-3.5" /> Model information
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">The Machine Learning Models</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          NephroScan uses three ensemble learning algorithms. Each takes the same 8 clinical inputs and outputs a CKD probability and confidence score.
        </p>

        <div className="space-y-6 mt-10">
          {DETAILS.map((d) => {
            const meta = MODELS[d.key];
            return (
              <article key={d.key} className="rounded-2xl border bg-card p-6 md:p-8 shadow-card">
                <header className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-elegant">
                      <d.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{meta.name}</h2>
                      <p className="text-xs text-muted-foreground">Ensemble classifier</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-semibold">
                    Accuracy: {meta.accuracy}%
                  </div>
                </header>

                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{d.how}</p>

                <div className="grid md:grid-cols-2 gap-4 mt-5">
                  <div className="rounded-lg border bg-background p-4">
                    <div className="text-xs font-semibold text-success uppercase tracking-wider mb-2">Strengths</div>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      {d.strengths.map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-lg border bg-background p-4">
                    <div className="text-xs font-semibold text-warning uppercase tracking-wider mb-2">Trade-offs</div>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      {d.weaknesses.map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 rounded-xl border bg-accent/30 p-6 text-sm">
          <strong>Why three models?</strong> Ensemble diversity reduces single-model bias. Clinicians can compare confidence across algorithms — strong agreement increases trust in the prediction.
        </div>
      </section>
    </PublicLayout>
  );
}
