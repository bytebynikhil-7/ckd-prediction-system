import { Link } from "@tanstack/react-router";
import { Stethoscope, Mail, Github, HeartPulse } from "lucide-react";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-card mt-10">
      <div className="container mx-auto px-4 py-12 grid gap-10 md:grid-cols-4">
        <div className="space-y-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-elegant">
              <Stethoscope className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">NephroScan</span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ML-powered Chronic Kidney Disease screening for early detection and clinical awareness.
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">Learn</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about-ckd" className="hover:text-foreground">About CKD</Link></li>
            <li><Link to="/about-project" className="hover:text-foreground">About the Project</Link></li>
            <li><Link to="/models" className="hover:text-foreground">Model Information</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">Get Started</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Create account</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">Connect</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /><a href="mailto:nikhilmudhiraj.ch@gmail.com" className="hover:text-foreground">nikhilmudhiraj.ch@gmail.com</a></li>
            <li className="flex items-center gap-2"><Github className="w-4 h-4" /><a href="https://github.com/bytebynikhil-7" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">github.com/bytebynikhil-7</a></li>
            <li className="flex items-center gap-2"><HeartPulse className="w-4 h-4" /> Built for healthcare research</li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container mx-auto px-4 py-4 text-xs text-muted-foreground flex flex-col md:flex-row justify-between gap-2">
          <div>© {year} NephroScan. For educational and screening purposes only.</div>
          <div>Not a substitute for professional medical advice, diagnosis, or treatment.</div>
        </div>
      </div>
    </footer>
  );
}
