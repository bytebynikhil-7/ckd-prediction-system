import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageCircle, Copy, Check } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — NephroScan" },
      { name: "description", content: "Get in touch with the NephroScan team for questions, feedback, or research collaboration." },
      { property: "og:title", content: "Contact NephroScan" },
      { property: "og:description", content: "Questions, feedback, and research collaboration." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [copied, setCopied] = useState(false);
  const email = "nikhilmudhiraj.ch@gmail.com";

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      toast.success("Email copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy email");
    }
  };

  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-14 max-w-3xl flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-4">
          <MessageCircle className="w-3.5 h-3.5" /> Contact us
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Contact</h1>

        <div className="w-full mt-10 rounded-2xl border bg-card p-6 md:p-10 shadow-card space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Email</div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <a
                  href={`mailto:${email}`}
                  className="text-lg md:text-xl font-semibold text-primary hover:underline"
                >
                  {email}
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleCopyEmail}
                  aria-label="Copy email to clipboard"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
            For project-related questions, feedback, feature suggestions, bug reports, or collaboration inquiries, feel free to reach out via email.
          </div>

          <div className="border-t pt-6">
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
              <span className="font-medium text-foreground">Note:</span> NephroScan is an educational and screening tool designed to support chronic kidney disease awareness and early risk assessment. It is not intended to replace professional medical advice, diagnosis, or treatment.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
