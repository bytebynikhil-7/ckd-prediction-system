import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, Database, Shield, Brain, Workflow, Eye, Sparkles, Clock, Heart, FileText, Stethoscope } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about-project")({
  head: () => ({
    meta: [
      { title: "About the Project — NephroScan" },
      { name: "description", content: "How NephroScan was built — objectives, dataset, machine learning approach, architecture, and ethical considerations." },
      { property: "og:title", content: "About the NephroScan Project" },
      { property: "og:description", content: "Objectives, dataset, ML approach, and architecture behind NephroScan." },
    ],
  }),
  component: AboutProject,
});

function AboutProject() {
  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-14 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-4">
          <Workflow className="w-3.5 h-3.5" /> Project overview
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">About the Project</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          NephroScan is an end-to-end machine-learning pipeline that screens for Chronic Kidney Disease using 8 routine clinical parameters. It pairs three ensemble models with a secure, user-friendly web application to support early detection.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-10">
          <Box icon={Target} title="Objective">
            Build a reliable, accessible CKD screening pipeline that healthcare providers and patients can use as a first-line tool before specialist referral.
          </Box>
          <Box icon={Database} title="Dataset">
            UCI Chronic Kidney Disease dataset — 400 anonymised patient records with 24 clinical attributes, distilled to 8 high-signal features for input efficiency.
          </Box>
          <Box icon={Brain} title="ML approach">
            Three trained ensemble classifiers — Random Forest, AdaBoost, and Gradient Boosting — chosen for their robustness on tabular medical data.
          </Box>
          <Box icon={Shield} title="Security & privacy">
            Row-level security on all patient data, encrypted authentication, and zero data sharing — every user can only access their own prediction history.
          </Box>
        </div>

        <h2 className="text-2xl font-bold mt-12">Architecture</h2>
        <div className="mt-4 rounded-xl border bg-card p-6 shadow-card text-sm">
          <Layers className="w-5 h-5 text-primary mb-2" />
          <ul className="space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">Frontend:</strong> React 19 + TanStack Start with TypeScript and Tailwind CSS.</li>
            <li><strong className="text-foreground">Backend:</strong> Server functions secured with authenticated middleware.</li>
            <li><strong className="text-foreground">Database:</strong> PostgreSQL with row-level security for per-user isolation.</li>
            <li><strong className="text-foreground">ML layer:</strong> Clinical scoring engine ready to be swapped with a FastAPI service hosting the trained models.</li>
            <li><strong className="text-foreground">Auth:</strong> Email/password authentication with role-based admin access.</li>
          </ul>
        </div>

        <h2 className="text-2xl font-bold mt-12">Ethical considerations</h2>
        <p className="text-muted-foreground mt-2">
          NephroScan is a <strong className="text-foreground">screening tool</strong>, not a diagnostic device. Predictions must always be interpreted by a qualified clinician. The system intentionally surfaces confidence levels and risk bands to support — not replace — medical judgement.
        </p>

        <div className="mt-10 flex gap-3">
          <Link to="/models"><Button>Explore the models</Button></Link>
          <Link to="/auth"><Button variant="outline">Try a prediction</Button></Link>
        </div>
      </section>
    </PublicLayout>
  );
}

function Box({ icon: Icon, title, children }: { icon: typeof Target; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-card">
      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-3"><Icon className="w-5 h-5 text-primary" /></div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}
