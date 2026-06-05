import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — NephroScan" },
      { name: "description", content: "Get in touch with the NephroScan team for questions, feedback, partnerships, or research collaboration." },
      { property: "og:title", content: "Contact NephroScan" },
      { property: "og:description", content: "Questions, feedback, partnerships, and research collaboration." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    (e.target as HTMLFormElement).reset();
    toast.success("Message sent! We'll get back to you shortly.");
  };

  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-14 max-w-5xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-4">
          <MessageCircle className="w-3.5 h-3.5" /> Contact us
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Get in touch</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Questions, feedback, partnership ideas, or research collaboration — we'd love to hear from you.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          <div className="md:col-span-1 space-y-4">
            <Info icon={Mail} title="Email" body="nephroscan@example.com" />
            <Info icon={MapPin} title="Research lab" body="Department of Computer Science, NephroScan Research Group" />
            <Info icon={MessageCircle} title="Response time" body="We typically respond within 1–2 business days." />
          </div>

          <form onSubmit={onSubmit} className="md:col-span-2 rounded-2xl border bg-card p-6 md:p-8 shadow-card space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" required placeholder="Jane Doe" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="you@example.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" required placeholder="How can we help?" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" required rows={6} placeholder="Tell us a bit about your question or feedback…" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              <Send className="w-4 h-4 mr-2" /> {submitting ? "Sending…" : "Send message"}
            </Button>
            <p className="text-xs text-muted-foreground">
              For medical emergencies, please contact your healthcare provider or local emergency services — not this form.
            </p>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}

function Info({ icon: Icon, title, body }: { icon: typeof Mail; title: string; body: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{body}</div>
    </div>
  );
}
