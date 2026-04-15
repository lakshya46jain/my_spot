import { createFileRoute, Link } from "@tanstack/react-router";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";
import {
  userGrowthData, spotSubmissionsData, reportVolumeData,
  spotStatusChartData, roleDistributionData,
} from "@/components/admin/sample-data";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

// TODO: fetch chart metrics from aggregated database queries

const resolvedVsCreated = [
  { month: "Oct", created: 5, resolved: 3 },
  { month: "Nov", created: 8, resolved: 6 },
  { month: "Dec", created: 12, resolved: 10 },
  { month: "Jan", created: 7, resolved: 7 },
  { month: "Feb", created: 15, resolved: 11 },
  { month: "Mar", created: 10, resolved: 9 },
];

function AnalyticsPage() {
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = user?.roleId === 1 || user?.roleId === 2;

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Growth */}
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">User Registrations Trend</h3>
              <ChartContainer config={{ users: { label: "Users", color: "var(--chart-5)" } }} className="h-[220px] w-full">
                <AreaChart data={userGrowthData}>
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

            {/* Spot Submissions */}
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">Spot Submissions Trend</h3>
              <ChartContainer config={{ submissions: { label: "Submissions", color: "var(--chart-2)" } }} className="h-[220px] w-full">
                <BarChart data={spotSubmissionsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="submissions" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Spot Status Distribution */}
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">Spot Status Distribution</h3>
              <ChartContainer config={{ Active: { color: "var(--chart-1)" }, Inactive: { color: "var(--chart-3)" }, Pending: { color: "var(--chart-4)" } }} className="h-[220px] w-full">
                <PieChart>
                  <Pie data={spotStatusChartData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} strokeWidth={2} stroke="var(--background)">
                    {spotStatusChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="flex items-center justify-center gap-4 mt-2">
                {spotStatusChartData.map((d) => (
                  <div key={d.status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.fill }} />
                    {d.status} ({d.count})
                  </div>
                ))}
              </div>
            </div>

            {/* Reports Created vs Resolved */}
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">Reports: Created vs Resolved</h3>
              <ChartContainer config={{ created: { label: "Created", color: "var(--chart-1)" }, resolved: { label: "Resolved", color: "var(--chart-2)" } }} className="h-[220px] w-full">
                <BarChart data={resolvedVsCreated}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="created" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="resolved" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Role Distribution */}
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">User Role Distribution</h3>
              <ChartContainer config={{ User: { color: "var(--chart-3)" }, Admin: { color: "var(--chart-1)" }, "Super Admin": { color: "var(--chart-5)" }, Moderator: { color: "var(--chart-2)" } }} className="h-[220px] w-full">
                <PieChart>
                  <Pie data={roleDistributionData} dataKey="count" nameKey="role" cx="50%" cy="50%" innerRadius={40} outerRadius={80} strokeWidth={2} stroke="var(--background)">
                    {roleDistributionData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
                {roleDistributionData.map((d) => (
                  <div key={d.role} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.fill }} />
                    {d.role} ({d.count})
                  </div>
                ))}
              </div>
            </div>

            {/* Report Volume Over Time */}
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">Report Volume Over Time</h3>
              <ChartContainer config={{ reports: { label: "Reports", color: "var(--chart-1)" } }} className="h-[220px] w-full">
                <LineChart data={reportVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="reports" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-chart-1)" }} />
                </LineChart>
              </ChartContainer>
            </div>
          </div>
        </AdminSectionShell>
      </div>
    </>
  );
}
