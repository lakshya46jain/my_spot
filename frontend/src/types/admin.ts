import type { AttributeType } from "@/lib/attributes";

export interface AdminMetricSummary {
  totalUsers: number;
  totalActiveSpots: number;
  pendingApprovals: number;
  totalCommentsReported: number;
  commentReportsResolved: number;
  inactiveSpots: number;
  totalSpotsReported: number;
  spotReportsResolved: number;
  activeAdmins: number;
}

export interface AdminChartDatum {
  month?: string;
  count?: number;
  submissions?: number;
  users?: number;
  reports?: number;
  created?: number;
  resolved?: number;
  status?: string;
  role?: string;
  fill?: string;
}

export interface AdminDashboardAdmin {
  id: number;
  name: string;
  role: string;
  lastActive: string;
  avatar_url?: string | null;
}

export interface AdminDashboardData {
  metrics: AdminMetricSummary;
  activeAdmins: AdminDashboardAdmin[];
  spotStatusChartData: Array<{
    status: string;
    count: number;
    fill: string;
  }>;
  userGrowthData: Array<{
    month: string;
    users: number;
  }>;
  spotSubmissionsData: Array<{
    month: string;
    submissions: number;
  }>;
  reportVolumeData: Array<{
    month: string;
    reports: number;
  }>;
  resolvedVsCreated: Array<{
    month: string;
    created: number;
    resolved: number;
  }>;
  roleDistributionData: Array<{
    role: string;
    count: number;
    fill: string;
  }>;
  roleCount: number;
  attributeCount: number;
}

export interface AdminUserRow {
  user_id: number;
  display_name: string;
  email: string;
  avatar_url?: string | null;
  role_id: number;
  role_name: string;
  created_at: string;
  last_login: string | null;
  spots_count: number;
  reviews_count: number;
  status: "active" | "inactive" | "deleted";
}

export interface AdminRoleRow {
  role_id: number;
  role_name: string;
  user_count: number;
}

export interface AdminAttributeRow {
  attribute_id: number;
  name: string;
  attribute_type: AttributeType;
  allowed_values: string[];
  number_unit: string | null;
  min_value: number | null;
  max_value: number | null;
  help_text: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminSpotRow {
  spot_id: number;
  spot_name: string;
  spot_type: string;
  primary_media_url?: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  short_description: string | null;
  created_at: string;
  created_by: string;
  created_by_avatar_url?: string | null;
  status: "active" | "inactive" | "pending";
}

export interface AdminReportEntry {
  report_id: number;
  reason: string;
  details: string | null;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
  reporter_name: string;
}

export interface AdminReportedSpotRow {
  spot_id: number;
  report_id: number;
  spot_name: string;
  spot_type: string;
  primary_media_url?: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  short_description: string | null;
  submitted_by: string;
  submitted_by_avatar_url?: string | null;
  report_count: number;
  open_report_count: number;
  latest_reason: string;
  report_status: "open" | "resolved" | "dismissed";
  report_date: string;
  spot_status: "active" | "inactive" | "pending";
  reports: AdminReportEntry[];
}

export interface AdminReportedReviewRow {
  review_id: number;
  report_id: number;
  reviewer: string;
  reviewer_avatar_url?: string | null;
  spot_id: number;
  spot_name: string;
  rating: number;
  review_text: string | null;
  review_date: string;
  report_count: number;
  open_report_count: number;
  report_reasons: string[];
  report_status: "open" | "resolved" | "dismissed";
  review_deleted: boolean;
  reports: AdminReportEntry[];
}
