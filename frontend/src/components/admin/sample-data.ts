// Sample data for admin dashboard GUI. All placeholder — TODO: replace with real DB queries.

export const sampleMetrics = {
  totalUsers: 1247,
  totalActiveSpots: 312,
  pendingApprovals: 18,
  totalCommentsReported: 34,
  commentReportsResolved: 28,
  inactiveSpots: 45,
  totalSpotsReported: 12,
  spotReportsResolved: 9,
  activeAdmins: 3,
};

export const sampleAdmins = [
  { id: 1, name: "Sarah Chen", role: "Super Admin", avatar: null, lastActive: "2 min ago" },
  { id: 2, name: "Marcus Rivera", role: "Admin", avatar: null, lastActive: "15 min ago" },
  { id: 3, name: "Priya Patel", role: "Moderator", avatar: null, lastActive: "1 hr ago" },
];

export const sampleSpots = [
  { spot_id: 1, spot_name: "Brewed Awakening", spot_type: "Coffee Shop", address: "123 Main St, Austin, TX", created_by: "Alice M.", created_at: "2025-03-10", status: "active" as const, short_description: "Cozy café with fast WiFi and great lattes." },
  { spot_id: 2, spot_name: "The Study Nook", spot_type: "Library", address: "456 Oak Ave, Portland, OR", created_by: "Bob K.", created_at: "2025-03-12", status: "pending" as const, short_description: "Quiet library corner with power outlets everywhere." },
  { spot_id: 3, spot_name: "Campus Commons", spot_type: "University Space", address: "789 College Rd, Boston, MA", created_by: "Clara J.", created_at: "2025-03-08", status: "active" as const, short_description: "Open study area with natural light." },
  { spot_id: 4, spot_name: "Bean Scene", spot_type: "Coffee Shop", address: "321 Elm St, Denver, CO", created_by: "Dan W.", created_at: "2025-03-15", status: "pending" as const, short_description: "Trendy café with group-friendly tables." },
  { spot_id: 5, spot_name: "Quiet Corner Library", spot_type: "Library", address: "654 Pine Blvd, Seattle, WA", created_by: "Eva L.", created_at: "2025-02-28", status: "inactive" as const, short_description: "Recently renovated with modern furnishings." },
  { spot_id: 6, spot_name: "Sunrise Co-Work", spot_type: "Co-working Space", address: "987 Sunset Dr, LA, CA", created_by: "Frank R.", created_at: "2025-03-18", status: "pending" as const, short_description: "Affordable day passes available." },
];

export const sampleReportedSpots = [
  { report_id: 1, spot_name: "Bean Scene", spot_type: "Coffee Shop", address: "321 Elm St, Denver, CO", submitted_by: "Dan W.", report_count: 3, latest_reason: "Incorrect address", report_status: "open" as const, report_date: "2025-03-20", spot_status: "active" as const },
  { report_id: 2, spot_name: "Campus Commons", spot_type: "University Space", address: "789 College Rd, Boston, MA", submitted_by: "Clara J.", report_count: 1, latest_reason: "Permanently closed", report_status: "open" as const, report_date: "2025-03-19", spot_status: "active" as const },
  { report_id: 3, spot_name: "Old Library Annex", spot_type: "Library", address: "100 First Ave, Chicago, IL", submitted_by: "Grace T.", report_count: 5, latest_reason: "Spam / fake listing", report_status: "resolved" as const, report_date: "2025-03-14", spot_status: "inactive" as const },
];

export const sampleReportedReviews = [
  { report_id: 1, reviewer: "Jake M.", reviewer_avatar: null, spot_name: "Brewed Awakening", rating: 1, review_text: "This place is terrible. The staff were rude and the coffee tasted like dirt. Worst experience ever.", review_date: "2025-03-18", report_count: 2, report_reasons: ["Inappropriate language", "Harassment"], report_status: "open" as const },
  { report_id: 2, reviewer: "Nina K.", reviewer_avatar: null, spot_name: "The Study Nook", rating: 5, review_text: "Buy my product at spamlink.com! Best deals ever!!!", review_date: "2025-03-17", report_count: 4, report_reasons: ["Spam", "Advertising"], report_status: "open" as const },
  { report_id: 3, reviewer: "Sam T.", reviewer_avatar: null, spot_name: "Campus Commons", rating: 2, review_text: "Average place but the review was flagged for containing personal info about another user.", review_date: "2025-03-12", report_count: 1, report_reasons: ["Contains personal information"], report_status: "resolved" as const },
];

export const sampleUsers = [
  { user_id: 1, name: "Sarah Chen", email: "sarah@example.com", role: "Super Admin", role_id: 1, joined: "2024-06-01", spots_count: 5, reviews_count: 12, status: "active" as const },
  { user_id: 2, name: "Marcus Rivera", email: "marcus@example.com", role: "Admin", role_id: 2, joined: "2024-08-15", spots_count: 8, reviews_count: 20, status: "active" as const },
  { user_id: 3, name: "Alice M.", email: "alice@example.com", role: "User", role_id: 3, joined: "2025-01-10", spots_count: 3, reviews_count: 7, status: "active" as const },
  { user_id: 4, name: "Bob K.", email: "bob@example.com", role: "User", role_id: 3, joined: "2025-01-22", spots_count: 1, reviews_count: 2, status: "active" as const },
  { user_id: 5, name: "Priya Patel", email: "priya@example.com", role: "Moderator", role_id: 2, joined: "2024-11-03", spots_count: 0, reviews_count: 0, status: "active" as const },
  { user_id: 6, name: "Tom H.", email: "tom@example.com", role: "User", role_id: 3, joined: "2024-09-20", spots_count: 2, reviews_count: 5, status: "deleted" as const },
  { user_id: 7, name: "Grace T.", email: "grace@example.com", role: "User", role_id: 3, joined: "2025-02-14", spots_count: 4, reviews_count: 9, status: "active" as const },
];

export const sampleRoles = [
  { role_id: 1, role_name: "Super Admin", user_count: 1 },
  { role_id: 2, role_name: "Admin", user_count: 2 },
  { role_id: 3, role_name: "User", user_count: 1240 },
  { role_id: 4, role_name: "Moderator", user_count: 4 },
];

// Chart data — TODO: replace with aggregated DB queries
export const spotStatusChartData = [
  { status: "Active", count: 312, fill: "var(--color-chart-1)" },
  { status: "Inactive", count: 45, fill: "var(--color-chart-3)" },
  { status: "Pending", count: 18, fill: "var(--color-chart-4)" },
];

export const userGrowthData = [
  { month: "Oct", users: 420 },
  { month: "Nov", users: 580 },
  { month: "Dec", users: 710 },
  { month: "Jan", users: 890 },
  { month: "Feb", users: 1050 },
  { month: "Mar", users: 1247 },
];

export const spotSubmissionsData = [
  { month: "Oct", submissions: 32 },
  { month: "Nov", submissions: 45 },
  { month: "Dec", submissions: 28 },
  { month: "Jan", submissions: 56 },
  { month: "Feb", submissions: 61 },
  { month: "Mar", submissions: 48 },
];

export const reportVolumeData = [
  { month: "Oct", reports: 5 },
  { month: "Nov", reports: 8 },
  { month: "Dec", reports: 12 },
  { month: "Jan", reports: 7 },
  { month: "Feb", reports: 15 },
  { month: "Mar", reports: 10 },
];

export const roleDistributionData = [
  { role: "User", count: 1240, fill: "var(--color-chart-3)" },
  { role: "Admin", count: 2, fill: "var(--color-chart-1)" },
  { role: "Super Admin", count: 1, fill: "var(--color-chart-5)" },
  { role: "Moderator", count: 4, fill: "var(--color-chart-2)" },
];
