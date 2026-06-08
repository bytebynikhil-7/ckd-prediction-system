import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Brain, History, TrendingUp, Stethoscope, ArrowRight } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { MODELS, type ModelKey } from "@/lib/ckd";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — NephroScan" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const displayName =
    profile?.full_name?.trim() ||
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "there";

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

      const modelCounts = (Object.keys(MODELS) as ModelKey[]).map((m) => ({
        model: MODELS[m].name,
        ckd: rows.filter((r) => r.selected_model === m && r.prediction_result === "ckd").length,
        normal: rows.filter((r) => r.selected_model === m && r.prediction_result !== "ckd").length,
      }));

      const today = startOfDay(new Date());
      const trend = Array.from({ length: 14 }, (_, i) => {
        const day = startOfDay(subDays(today, 13 - i));
        const next = startOfDay(subDays(today, 12 - i));
        const dayRows = rows.filter((r) => {
          const t = new Date(r.prediction_timestamp).getTime();
          return t >= day.getTime() && t < next.getTime();
        });
        return {
          date: format(day, "MMM d"),
          predictions: dayRows.length,
          ckd: dayRows.filter((r) => r.prediction_result === "ckd").length,
        };
      });

      const avgConf = rows.length
        ? Math.round(rows.reduce((s, r) => s + Number(r.confidence_score), 0) / rows.length)
        : 0;

      return {
        total: rows.length,
        ckd,
        notCkd: rows.length - ckd,
        avgConf,
        recent: rows.slice(0, 5),
        modelCounts,
        trend,
      };
    },
  });

  const pieData = stats
    ? [
        { name: "CKD detected", value: stats.ckd, color: "var(--destructive)" },
        { name: "Normal", value: stats.notCkd, color: "var(--success)" },
      ]
    : [];

  const hasData = (stats?.total ?? 0) > 0;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {displayName} 👋</h1>
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
        <StatCard icon={Brain} label="Avg confidence" value={stats ? `${stats.avgConf}%` : "—"} />
      </div>

      {hasData && (
        <div className="grid lg:grid-cols-2 gap-4">
          <ChartCard title="Outcome distribution" subtitle="CKD vs Normal across all predictions">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="By model" subtitle="Predictions per ML model">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats!.modelCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="model" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="ckd" name="CKD" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="normal" name="Normal" fill="var(--success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Activity (last 14 days)" subtitle="Daily predictions trend" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stats!.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="predictions" name="Total" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="ckd" name="CKD" stroke="var(--destructive)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

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
            <Link
              key={r.id}
              to="/results"
              search={{ id: r.id }}
              className="p-4 flex items-center justify-between gap-4 hover:bg-accent/30 transition-colors"
            >
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
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function ChartCard({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-card shadow-card p-5 ${className ?? ""}`}>
      <div className="mb-3">
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
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
