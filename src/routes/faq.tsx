import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — NephroScan" },
      { name: "description", content: "Frequently asked questions about NephroScan, CKD screening, model accuracy, privacy, and data handling." },
      { property: "og:title", content: "FAQ — NephroScan" },
      { property: "og:description", content: "Answers to common questions about NephroScan and CKD screening." },
    ],
  }),
  component: Faq,
});

const QA = [
  {
    q: "Is NephroScan a medical diagnosis?",
    a: "No. NephroScan is a screening and educational tool. It indicates risk based on clinical inputs and ML models, but only a qualified healthcare professional can diagnose Chronic Kidney Disease.",
  },
  {
    q: "How accurate are the predictions?",
    a: "On the UCI CKD benchmark, Random Forest reaches ~98.5% accuracy, Gradient Boosting ~98.0%, and AdaBoost ~97.2%. Real-world performance depends on input quality and population characteristics.",
  },
  {
    q: "What clinical parameters does it use?",
    a: "Eight inputs: specific gravity, hemoglobin, red blood cell count, albumin, hypertension, diabetes mellitus, appetite, and pus cell appearance. These are common, routinely available lab values.",
  },
  {
    q: "Is my data private?",
    a: "Yes. All prediction history is stored with row-level security — only the account that created a record can read it. We never sell or share patient data.",
  },
  {
    q: "Can I download my prediction report?",
    a: "Yes. After running a prediction, open the result and click 'Download report' to save a PDF you can share with your doctor.",
  },
  {
    q: "Which model should I trust most?",
    a: "Compare confidence across the three models. Strong agreement increases trust. If models disagree, treat the prediction as inconclusive and seek a clinical evaluation.",
  },
  {
    q: "Do I need lab tests to use NephroScan?",
    a: "Yes — you will need recent results for hemoglobin, specific gravity, RBC count, and albumin. Hypertension, diabetes, appetite, and pus cell can be self-reported with clinical guidance.",
  },
  {
    q: "Does NephroScan replace doctor visits?",
    a: "Absolutely not. NephroScan is a first-line awareness tool. Any concerning result should prompt a visit to a nephrologist for confirmatory testing.",
  },
];

function Faq() {
  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-14 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-4">
          <HelpCircle className="w-3.5 h-3.5" /> FAQ
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Frequently Asked Questions</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Answers to the most common questions about NephroScan, the models, and what predictions mean.
        </p>

        <Accordion type="single" collapsible className="mt-8 rounded-xl border bg-card shadow-card divide-y">
          {QA.map((item, i) => (
            <AccordionItem key={i} value={`q-${i}`} className="px-5">
              <AccordionTrigger className="text-left font-medium">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </PublicLayout>
  );
}
