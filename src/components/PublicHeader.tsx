import { Link } from "@tanstack/react-router";
import { Stethoscope, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { to: "/about-ckd", label: "About CKD" },
  { to: "/about-project", label: "Project" },
  { to: "/models", label: "Models" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
] as const;

export function PublicHeader() {
  return (
    <header className="border-b bg-card/70 backdrop-blur sticky top-0 z-30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-elegant">
            <Stethoscope className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">NephroScan</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
              activeProps={{ className: "text-foreground bg-accent" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/auth"><Button>Get started</Button></Link>
        </div>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="mt-8 flex flex-col gap-1">
              {links.map((l) => (
                <Link key={l.to} to={l.to} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent">
                  {l.label}
                </Link>
              ))}
              <div className="h-px bg-border my-3" />
              <Link to="/auth" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent">Sign in</Link>
              <Link to="/auth" className="px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90">Get started</Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
