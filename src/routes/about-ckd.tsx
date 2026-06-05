import { createFileRoute } from "@tanstack/react-router";
import { HeartPulse, AlertTriangle, ShieldCheck, Activity, Droplets } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";

export const Route = createFileRoute("/about-ckd")({
  head: () => ({
    meta: [
      { title: "About CKD — NephroScan" },
      { name: "description", content: "Learn what Chronic Kidney Disease is, its causes, stages, symptoms, and prevention strategies." },
      { property: "og:title", content: "About Chronic Kidney Disease" },
      { property: "og:description", content: "Causes, stages, symptoms, and prevention of Chronic Kidney Disease." },
    ],
  }),
  component: AboutCkd,
});

function AboutCkd() {
  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-14 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-4">
          <HeartPulse className="w-3.5 h-3.5" /> Patient education
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">About Chronic Kidney Disease</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Chronic Kidney Disease (CKD) is the gradual loss of kidney function over months or years. It affects more than 850 million people worldwide — and most don't know they have it until it's advanced.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-10">
          <Card icon={AlertTriangle} title="Common causes">
            <ul className="list-disc list-inside space-y-1">
              <li>Diabetes mellitus (Type 1 and 2)</li>
              <li>High blood pressure (hypertension)</li>
              <li>Glomerulonephritis</li>
              <li>Polycystic kidney disease</li>
              <li>Recurrent urinary tract infections</li>
              <li>Long-term use of NSAIDs</li>
            </ul>
          </Card>
          <Card icon={Activity} title="Early warning signs">
            <ul className="list-disc list-inside space-y-1">
              <li>Fatigue and weakness</li>
              <li>Swelling in feet and ankles</li>
              <li>Frequent urination, especially at night</li>
              <li>Poor appetite, nausea</li>
              <li>Difficulty concentrating</li>
              <li>Persistent itching</li>
            </ul>
          </Card>
        </div>

        <h2 className="text-2xl font-bold mt-12">The 5 stages of CKD</h2>
        <p className="text-muted-foreground mt-2">Staging is based on eGFR (estimated Glomerular Filtration Rate, mL/min/1.73 m²).</p>
        <div className="mt-6 rounded-xl border bg-card divide-y shadow-card">
          {[
            { s: "Stage 1", g: "≥ 90", d: "Normal kidney function but signs of damage (e.g., protein in urine)." },
            { s: "Stage 2", g: "60–89", d: "Mild loss of kidney function with damage." },
            { s: "Stage 3a", g: "45–59", d: "Mild to moderate loss of function." },
            { s: "Stage 3b", g: "30–44", d: "Moderate to severe loss of function." },
            { s: "Stage 4", g: "15–29", d: "Severe loss — preparing for dialysis or transplant." },
            { s: "Stage 5", g: "< 15", d: "Kidney failure — dialysis or transplant required." },
          ].map((r) => (
            <div key={r.s} className="grid grid-cols-12 gap-3 p-4 text-sm">
              <div className="col-span-3 font-semibold">{r.s}</div>
              <div className="col-span-3 text-muted-foreground">eGFR {r.g}</div>
              <div className="col-span-6">{r.d}</div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold mt-12">Prevention &amp; lifestyle</h2>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <Mini icon={Droplets} title="Hydrate" body="Drink 1.5–2L of water daily (unless restricted by a doctor)." />
          <Mini icon={Activity} title="Stay active" body="150 minutes of moderate exercise per week protects kidneys." />
          <Mini icon={ShieldCheck} title="Monitor BP & sugar" body="Tight control of blood pressure and HbA1c slows progression." />
        </div>
      </section>
    </PublicLayout>
  );
}

function Card({ icon: Icon, title, children }: { icon: typeof HeartPulse; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}
function Mini({ icon: Icon, title, body }: { icon: typeof HeartPulse; title: string; body: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <Icon className="w-5 h-5 text-primary mb-2" />
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{body}</div>
    </div>
  );
}
