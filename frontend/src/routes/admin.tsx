import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { MetricCard } from "@/components/admin/MetricCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Shield, Users, Flag, MapPin, BarChart3, Clock,
  AlertTriangle, CheckCircle2, MessageSquareWarning,
  UserCog, ChevronRight, ArrowRight,
} from "lucide-react";
import {
  sampleMetrics, sampleAdmins, spotStatusChartData,
  userGrowthData, spotSubmissionsData, reportVolumeData,
} from "@/components/admin/sample-data";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from "recharts";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

// TODO: fetch dashboard metrics from database
// TODO: fetch active admins from users + roles tables

const quickLinks = [
  { to: "/admin/pending-spots", label: "Pending Spots", icon: Clock, count: sampleMetrics.pendingApprovals, color: "bg-amber-100 text-amber-700" },
  { to: "/admin/spots", label: "All Spots", icon: MapPin, count: sampleMetrics.totalActiveSpots, color: "bg-emerald-100 text-emerald-700" },
  { to: "/admin/reported-spots", label: "Reported Spots", icon: Flag, count: sampleMetrics.totalSpotsReported, color: "bg-rose-100 text-rose-700" },
  { to: "/admin/reported-reviews", label: "Reported Reviews", icon: MessageSquareWarning, count: sampleMetrics.totalCommentsReported, color: "bg-orange-100 text-orange-700" },
  { to: "/admin/users", label: "Users", icon: Users, count: sampleMetrics.totalUsers, color: "bg-sky-100 text-sky-700" },
  { to: "/admin/roles", label: "Roles", icon: UserCog, count: 4, color: "bg-violet-100 text-violet-700" },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, count: null, color: "bg-warm-200 text-warm-700" },
];

function AdminPage() {
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = user?.roleId === 1 || user?.roleId === 2;

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mb-6">You need to be signed in to access the admin dashboard.</p>
          <Button asChild><Link to="/signin">Sign In</Link></Button>
        </div>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mb-6">Your account does not have permission to access the admin dashboard.</p>
          <Button asChild><Link to="/explore">Back to Explore</Link></Button>
        </div>
      </div>
    );
  }

  if (location.pathname !== "/admin") {
    return <Outlet />;
  }

  return (
    <>
      <FloatingRightNav />
      <div className="min-h-screen bg-background pr-20">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-display text-foreground">Admin Dashboard</h1>
                <StatusBadge status="active" className="text-xs" />
              </div>
              <p className="mt-1.5 text-muted-foreground">Manage spots, users, reports, and platform health.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" asChild className="rounded-xl">
                <Link to="/admin/pending-spots"><Clock className="h-3.5 w-3.5 mr-1.5" />Review Pending</Link>
              </Button>
              <Button size="sm" variant="outline" asChild className="rounded-xl">
                <Link to="/admin/reported-spots"><Flag className="h-3.5 w-3.5 mr-1.5" />Report Queue</Link>
              </Button>
              <Button size="sm" asChild className="rounded-xl">
                <Link to="/admin/users"><Users className="h-3.5 w-3.5 mr-1.5" />Manage Users</Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <MetricCard label="Total Users" value={sampleMetrics.totalUsers.toLocaleString()} icon={<Users className="h-5 w-5 text-primary" />} trend={{ value: "+12% this month", direction: "up" }} />
            <MetricCard label="Active Spots" value={sampleMetrics.totalActiveSpots} icon={<MapPin className="h-5 w-5 text-primary" />} trend={{ value: "+8 this week", direction: "up" }} />
            <MetricCard label="Pending Approvals" value={sampleMetrics.pendingApprovals} icon={<Clock className="h-5 w-5 text-amber-600" />} trend={{ value: "3 new today", direction: "up" }} />
            <MetricCard label="Spots Reported" value={sampleMetrics.totalSpotsReported} icon={<Flag className="h-5 w-5 text-rose-600" />} trend={{ value: `${sampleMetrics.spotReportsResolved} resolved`, direction: "flat" }} />
            <MetricCard label="Reviews Reported" value={sampleMetrics.totalCommentsReported} icon={<MessageSquareWarning className="h-5 w-5 text-orange-600" />} trend={{ value: `${sampleMetrics.commentReportsResolved} resolved`, direction: "flat" }} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <MetricCard label="Inactive Spots" value={sampleMetrics.inactiveSpots} icon={<AlertTriangle className="h-5 w-5 text-warm-500" />} />
            <MetricCard label="Spot Reports Resolved" value={sampleMetrics.spotReportsResolved} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} />
            <MetricCard label="Review Reports Resolved" value={sampleMetrics.commentReportsResolved} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} />
            <MetricCard label="Active Admins" value={sampleMetrics.activeAdmins} icon={<Shield className="h-5 w-5 text-primary" />} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {/* Spot Status Breakdown */}
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">Spot Status Breakdown</h3>
              <ChartContainer config={{ Active: { color: "var(--chart-1)" }, Inactive: { color: "var(--chart-3)" }, Pending: { color: "var(--chart-4)" } }} className="h-[200px] w-full">
                <PieChart>
                  <Pie data={spotStatusChartData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={75} strokeWidth={2} stroke="var(--background)">
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

            {/* User Growth */}
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">User Growth</h3>
              <ChartContainer config={{ users: { label: "Users", color: "var(--chart-5)" } }} className="h-[200px] w-full">
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-5)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-chart-5)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="users" stroke="var(--color-chart-5)" fill="url(#userGrad)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </div>

            {/* Spot Submissions */}
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">Spot Submissions</h3>
              <ChartContainer config={{ submissions: { label: "Submissions", color: "var(--chart-2)" } }} className="h-[200px] w-full">
                <BarChart data={spotSubmissionsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="submissions" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          {/* Report Volume Chart */}
          <div className="rounded-2xl bg-card border border-border p-5 shadow-sm mb-10">
            <h3 className="text-sm font-semibold text-foreground mb-4">Report Volume Over Time</h3>
            <ChartContainer config={{ reports: { label: "Reports", color: "var(--chart-1)" } }} className="h-[180px] w-full">
              <LineChart data={reportVolumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="reports" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-chart-1)" }} />
              </LineChart>
            </ChartContainer>
          </div>

          {/* Active Admins */}
          <div className="mb-10">
            <h3 className="text-lg font-display text-foreground mb-4">Active Admins</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {sampleAdmins.map((admin) => (
                <div key={admin.id} className="rounded-2xl bg-card border border-border p-5 shadow-sm flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-warm-200 flex items-center justify-center text-lg font-semibold text-warm-700">
                    {admin.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{admin.name}</p>
                    <p className="text-xs text-muted-foreground">{admin.role}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Active {admin.lastActive}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="mb-10">
            <h3 className="text-lg font-display text-foreground mb-4">Quick Navigation</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="group rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${link.color}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="font-medium text-foreground text-sm">{link.label}</p>
                    {link.count !== null && (
                      <p className="text-xs text-muted-foreground mt-0.5">{link.count.toLocaleString()} total</p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
