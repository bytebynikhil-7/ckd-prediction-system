import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppNav, MobileBar } from "@/components/AppNav";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="min-h-screen flex bg-gradient-subtle">
      <AppNav />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <Outlet />
      </main>
      <MobileBar />
    </div>
  );
}
