import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Brain, History, TrendingUp, Stethoscope, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — NephroScan" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("prediction_history")
        .select("*")
        .order("prediction_timestamp", { ascending: false });
      if (error) throw error;
      const ckd = rows.filter((r) => r.prediction_result === "ckd").length;
      return { total: rows.length, ckd, notCkd: rows.length - ckd, recent: rows.slice(0, 5) };
    },
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-1">{user?.email}</p>
        </div>
        <Link to="/predict">
          <Button size="lg" className="shadow-elegant">
            <Activity className="w-4 h-4 mr-2" /> New prediction
          </Button>
        </Link>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={History} label="Total predictions" value={stats?.total ?? 0} />
        <StatCard icon={TrendingUp} label="CKD detected" value={stats?.ckd ?? 0} tone="danger" />
        <StatCard icon={Stethoscope} label="Not detected" value={stats?.notCkd ?? 0} tone="success" />
        <StatCard
          icon={Brain}
          label="Detection rate"
          value={stats && stats.total ? `${Math.round((stats.ckd / stats.total) * 100)}%` : "—"}
        />
      </div>

      <section className="rounded-xl border bg-card shadow-card">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold">Recent predictions</h2>
          <Link to="/history" className="text-sm text-primary inline-flex items-center gap-1 hover:underline">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y">
          {!stats?.recent?.length && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No predictions yet. <Link to="/predict" className="text-primary underline">Run your first prediction</Link>.
            </div>
          )}
          {stats?.recent?.map((r) => (
            <div key={r.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    r.prediction_result === "ckd"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-success/10 text-success"
                  }`}
                >
                  {r.prediction_result === "ckd" ? "CKD" : "Normal"}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {r.selected_model.replace(/_/g, " ")} · {r.confidence_score}% confidence
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.prediction_timestamp), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  tone?: "danger" | "success";
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            tone === "danger" ? "bg-destructive/10 text-destructive" :
            tone === "success" ? "bg-success/10 text-success" :
            "bg-accent text-primary"
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
