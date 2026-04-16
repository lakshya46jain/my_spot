import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";
import { hasAdminAccess } from "@/lib/admin";
import { getAdminDashboardData } from "@/server/admin";
import type { AdminDashboardData } from "@/types/admin";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = hasAdminAccess(user);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");
        setDashboardData(await getAdminDashboardData());
      } catch (loadError) {
        setError(
          getUserFriendlyErrorMessage(
            loadError,
            "Could not load analytics.",
          ),
        );
      } finally {
        setLoading(false);
      }
    }

    if (canAccessAdmin) {
      loadAnalytics();
    }
  }, [canAccessAdmin]);

  if (!isLoggedIn || !canAccessAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">Access Restricted</h2>
          <Button asChild><Link to="/admin">Back to Admin</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <FloatingRightNav />
      <div className="pr-20">
        <AdminSectionShell title="Analytics & Insights" subtitle="Platform trends, growth metrics, and moderation analytics.">
          {loading ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
              Loading analytics...
            </div>
          ) : error || !dashboardData ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error || "Analytics could not be loaded."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-4">User Registrations Trend</h3>
                <ChartContainer config={{ users: { label: "Users", color: "var(--chart-5)" } }} className="h-[220px] w-full">
                  <AreaChart data={dashboardData.userGrowthData}>
                    <defs>
                      <linearGradient id="aUserGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-chart-5)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-chart-5)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={40} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="users" stroke="var(--color-chart-5)" fill="url(#aUserGrad)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </div>

              <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-4">Spot Submissions Trend</h3>
                <ChartContainer config={{ submissions: { label: "Submissions", color: "var(--chart-2)" } }} className="h-[220px] w-full">
                  <BarChart data={dashboardData.spotSubmissionsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={30} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="submissions" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>

              <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-4">Spot Status Distribution</h3>
                <ChartContainer config={{ Active: { color: "var(--chart-1)" }, Inactive: { color: "var(--chart-3)" }, Pending: { color: "var(--chart-4)" } }} className="h-[220px] w-full">
                  <PieChart>
                    <Pie data={dashboardData.spotStatusChartData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} strokeWidth={2} stroke="var(--background)">
                      {dashboardData.spotStatusChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex items-center justify-center gap-4 mt-2">
                  {dashboardData.spotStatusChartData.map((datum) => (
                    <div key={datum.status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: datum.fill }} />
                      {datum.status} ({datum.count})
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-4">Reports: Created vs Resolved</h3>
                <ChartContainer config={{ created: { label: "Created", color: "var(--chart-1)" }, resolved: { label: "Resolved", color: "var(--chart-2)" } }} className="h-[220px] w-full">
                  <BarChart data={dashboardData.resolvedVsCreated}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={30} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="created" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="resolved" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>

              <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-4">User Role Distribution</h3>
                <ChartContainer config={{ User: { color: "var(--chart-3)" }, Admin: { color: "var(--chart-1)" }, Moderator: { color: "var(--chart-2)" }, Owner: { color: "var(--chart-5)" } }} className="h-[220px] w-full">
                  <PieChart>
                    <Pie data={dashboardData.roleDistributionData} dataKey="count" nameKey="role" cx="50%" cy="50%" innerRadius={40} outerRadius={80} strokeWidth={2} stroke="var(--background)">
                      {dashboardData.roleDistributionData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
                  {dashboardData.roleDistributionData.map((datum) => (
                    <div key={datum.role} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: datum.fill }} />
                      {datum.role} ({datum.count})
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-4">Report Volume Over Time</h3>
                <ChartContainer config={{ reports: { label: "Reports", color: "var(--chart-1)" } }} className="h-[220px] w-full">
                  <LineChart data={dashboardData.reportVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={30} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="reports" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-chart-1)" }} />
                  </LineChart>
                </ChartContainer>
              </div>
            </div>
          )}
        </AdminSectionShell>
      </div>
    </>
  );
}
