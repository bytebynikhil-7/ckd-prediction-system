import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ShieldCheck, HeartPulse, LineChart, Brain, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NephroScan — Chronic Kidney Disease Prediction" },
      { name: "description", content: "Screen for Chronic Kidney Disease in seconds with ML-powered risk analysis. Built for early detection and clinical awareness." },
      { property: "og:title", content: "NephroScan — Chronic Kidney Disease Prediction" },
      { property: "og:description", content: "ML-powered CKD screening with Random Forest, AdaBoost, and Gradient Boosting." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <PublicHeader />

      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
            <HeartPulse className="w-3.5 h-3.5" />
            ML-powered clinical screening tool
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            Detect <span className="bg-gradient-primary bg-clip-text text-transparent">Chronic Kidney Disease</span> early.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            NephroScan analyses 8 clinical parameters with three machine-learning models to predict CKD risk in seconds — helping patients and clinicians act before symptoms progress.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="shadow-elegant">
                Start Prediction <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/about-project"><Button size="lg" variant="outline">Learn more</Button></Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">For screening and educational purposes only — not a medical diagnosis.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: HeartPulse, title: "What is CKD?", body: "Chronic Kidney Disease is the gradual loss of kidney function. Over 850 million people are affected worldwide, often without knowing.", to: "/about-ckd" },
            { icon: ShieldCheck, title: "Why early detection?", body: "Early-stage CKD has no symptoms but can be slowed dramatically with intervention. Screening saves lives and treatment cost.", to: "/about-ckd" },
            { icon: Brain, title: "How NephroScan helps", body: "Three trained ML models score risk from routine lab values — a fast first-line screening before specialist referral.", to: "/models" },
          ].map((c) => (
            <Link key={c.title} to={c.to} className="rounded-xl border bg-card p-6 shadow-card hover:shadow-elegant transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-4">
                <c.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
              <div className="text-sm text-primary mt-3 inline-flex items-center gap-1">Learn more <ArrowRight className="w-3.5 h-3.5" /></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="rounded-2xl bg-gradient-primary p-8 md:p-12 text-primary-foreground shadow-elegant">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Project objectives</h2>
          <ul className="grid md:grid-cols-2 gap-4 text-sm md:text-base opacity-95">
            {[
              { icon: Activity, t: "Build a reliable CKD screening pipeline from common lab parameters." },
              { icon: Brain, t: "Compare Random Forest, AdaBoost, and Gradient Boosting predictions." },
              { icon: LineChart, t: "Track prediction history with searchable analytics for each user." },
              { icon: ShieldCheck, t: "Secure patient data with row-level access and authentication." },
            ].map((o) => (
              <li key={o.t} className="flex items-start gap-3">
                <o.icon className="w-5 h-5 mt-0.5 shrink-0" />
                <span>{o.t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Link to="/about-project"><Button variant="secondary" size="lg">Read project details</Button></Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
