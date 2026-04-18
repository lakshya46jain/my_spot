import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { ADMIN_ROLE_NAMES } from "@/lib/admin";
import type {
  AdminReportEntry,
  AdminDashboardAdmin,
  AdminDashboardData,
  AdminReportedReviewRow,
  AdminReportedSpotRow,
  AdminRoleRow,
  AdminSpotRow,
  AdminUserRow,
} from "@/types/admin";
import { db } from "./db";

const chartPalette = {
  active: "var(--color-chart-1)",
  inactive: "var(--color-chart-3)",
  pending: "var(--color-chart-4)",
  admin: "var(--color-chart-1)",
  moderator: "var(--color-chart-2)",
  user: "var(--color-chart-3)",
  owner: "var(--color-chart-5)",
  default: "var(--color-chart-4)",
};

const updateUserRoleSchema = z.object({
  userId: z.number().int().positive(),
  roleId: z.number().int().positive(),
});

const bulkUpdateUserRolesSchema = z.object({
  userIds: z.array(z.number().int().positive()).min(1),
  roleId: z.number().int().positive(),
});

const updateAdminUserEmailSchema = z.object({
  userId: z.number().int().positive(),
  email: z.string().trim().email("Please enter a valid email address."),
});

const updateAdminUserPasswordSchema = z
  .object({
    userId: z.number().int().positive(),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmNewPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmNewPassword"],
        message: "New passwords do not match.",
      });
    }
  });

const deleteAdminUserAccountSchema = z.object({
  userId: z.number().int().positive(),
});

const createRoleSchema = z.object({
  roleName: z.string().trim().min(2).max(50),
});

const updateSpotStatusesSchema = z.object({
  spotIds: z.array(z.number().int().positive()).min(1),
  status: z.enum(["active", "inactive", "pending"]),
});

const moderateSpotReportsSchema = z.object({
  spotIds: z.array(z.number().int().positive()).optional(),
  reportIds: z.array(z.number().int().positive()).optional(),
  action: z.enum(["resolve", "dismiss", "deactivate"]),
  resolutionNote: z.string().trim().max(1000).optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if ((!data.spotIds || data.spotIds.length === 0) && (!data.reportIds || data.reportIds.length === 0)) {
    ctx.addIssue({
      code: "custom",
      path: ["spotIds"],
      message: "Provide at least one spot ID or report ID.",
    });
  }
});

const moderateReviewReportsSchema = z.object({
  reviewIds: z.array(z.number().int().positive()).optional(),
  reportIds: z.array(z.number().int().positive()).optional(),
  action: z.enum(["resolve", "dismiss", "remove"]),
  resolutionNote: z.string().trim().max(1000).optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if ((!data.reviewIds || data.reviewIds.length === 0) && (!data.reportIds || data.reportIds.length === 0)) {
    ctx.addIssue({
      code: "custom",
      path: ["reviewIds"],
      message: "Provide at least one review ID or report ID.",
    });
  }
});

type MetricsRow = RowDataPacket & {
  total_users: number | string;
  active_spots: number | string;
  pending_approvals: number | string;
  total_comments_reported: number | string;
  comment_reports_resolved: number | string;
  inactive_spots: number | string;
  total_spots_reported: number | string;
  spot_reports_resolved: number | string;
  active_admins: number | string;
};

type CountByMonthRow = RowDataPacket & {
  ym: string;
  count: number | string;
};

type StatusCountRow = RowDataPacket & {
  status: string;
  count: number | string;
};

type RoleCountRow = RowDataPacket & {
  role: string;
  count: number | string;
};

type ActiveAdminRow = RowDataPacket & {
  id: number;
  name: string;
  role: string;
  last_login: string | null;
  created_at: string;
  avatar_url: string | null;
};

type AdminUserDbRow = RowDataPacket & {
  user_id: number;
  display_name: string;
  email: string;
  avatar_url: string | null;
  role_id: number;
  role_name: string;
  created_at: string;
  last_login: string | null;
  is_active: number;
  deleted_at: string | null;
  spots_count: number | string;
  reviews_count: number | string;
};

type AdminRoleDbRow = RowDataPacket & {
  role_id: number;
  role_name: string;
  user_count: number | string;
};

type AdminSpotDbRow = RowDataPacket & {
  spot_id: number;
  spot_name: string;
  spot_type: string;
  primary_media_url: string | null;
  address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  short_description: string | null;
  created_at: string;
  created_by: string;
  created_by_avatar_url: string | null;
  status: "active" | "inactive" | "pending";
};

type AdminReportedSpotDbRow = RowDataPacket & {
  spot_id: number;
  report_id: number;
  spot_name: string;
  spot_type: string;
  primary_media_url: string | null;
  address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  short_description: string | null;
  submitted_by: string;
  submitted_by_avatar_url: string | null;
  report_count: number | string;
  open_report_count: number | string;
  latest_reason: string;
  latest_status: "open" | "resolved" | "dismissed";
  report_date: string;
  spot_status: "active" | "inactive" | "pending";
};

type AdminReportedReviewDbRow = RowDataPacket & {
  review_id: number;
  report_id: number;
  reviewer: string;
  reviewer_avatar_url: string | null;
  spot_id: number;
  spot_name: string;
  rating: number | string;
  review_text: string | null;
  review_date: string;
  report_count: number | string;
  open_report_count: number | string;
  report_reasons: string | null;
  latest_status: "open" | "resolved" | "dismissed";
  review_deleted: number;
};

type ReportEntryDbRow = RowDataPacket & {
  parent_id: number;
  report_id: number;
  reason: string;
  details: string | null;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
  reporter_name: string;
};

function toNumber(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

function getRecentMonths(monthCount: number) {
  const now = new Date();
  const months: Array<{ key: string; label: string; start: Date }> = [];

  for (let index = monthCount - 1; index >= 0; index -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - index, 1);
    months.push({
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      label: start.toLocaleDateString("en-US", { month: "short" }),
      start,
    });
  }

  return months;
}

function getRangeStart(months: ReturnType<typeof getRecentMonths>) {
  const first = months[0];
  return new Date(first.start.getFullYear(), first.start.getMonth(), 1);
}

function formatRelativeTime(
  value: string | Date | null,
  fallbackValue: string,
) {
  if (!value) {
    return fallbackValue;
  }

  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else {
    const match = value.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/,
    );

    date = match
      ? new Date(
          Number(match[1]),
          Number(match[2]) - 1,
          Number(match[3]),
          Number(match[4]),
          Number(match[5]),
          Number(match[6]),
        )
      : new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return fallbackValue;
  }

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);

  if (seconds > 60) {
    return "just now";
  }

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

  for (const [unit, amount] of divisions) {
    if (Math.abs(seconds) >= amount || unit === "minute") {
      return formatter.format(Math.round(seconds / amount), unit);
    }
  }

  return "just now";
}

function groupReportEntries(rows: ReportEntryDbRow[]) {
  const grouped = new Map<number, AdminReportEntry[]>();

  for (const row of rows) {
    const entries = grouped.get(row.parent_id) ?? [];
    entries.push({
      report_id: row.report_id,
      reason: row.reason,
      details: row.details,
      status: row.status,
      created_at: row.created_at,
      resolved_at: row.resolved_at,
      resolution_note: row.resolution_note,
      reporter_name: row.reporter_name,
    });
    grouped.set(row.parent_id, entries);
  }

  return grouped;
}

function mapMonthlyCounts(
  months: ReturnType<typeof getRecentMonths>,
  rows: CountByMonthRow[],
) {
  const counts = new Map(rows.map((row) => [row.ym, toNumber(row.count)]));
  return months.map((month) => ({
    month: month.label,
    count: counts.get(month.key) ?? 0,
  }));
}

async function loadDashboardData(): Promise<AdminDashboardData> {
  const months = getRecentMonths(6);
  const rangeStart = getRangeStart(months);
  const adminRolePlaceholders = ADMIN_ROLE_NAMES.map(() => "?").join(", ");

  const [metricsRows] = await db.execute<MetricsRow[]>(
    `
    SELECT
      (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS total_users,
      (SELECT COUNT(*) FROM spots WHERE status = 'active') AS active_spots,
      (SELECT COUNT(*) FROM spots WHERE status = 'pending') AS pending_approvals,
      (
        SELECT COUNT(DISTINCT review_id)
        FROM content_report
        WHERE review_id IS NOT NULL
          AND status = 'open'
      ) AS total_comments_reported,
      (
        SELECT COUNT(*)
        FROM content_report
        WHERE review_id IS NOT NULL
          AND status = 'resolved'
      ) AS comment_reports_resolved,
      (SELECT COUNT(*) FROM spots WHERE status = 'inactive') AS inactive_spots,
      (
        SELECT COUNT(DISTINCT spot_id)
        FROM content_report
        WHERE spot_id IS NOT NULL
          AND status = 'open'
      ) AS total_spots_reported,
      (
        SELECT COUNT(*)
        FROM content_report
        WHERE spot_id IS NOT NULL
          AND status = 'resolved'
      ) AS spot_reports_resolved,
      (
        SELECT COUNT(*)
        FROM users u
        INNER JOIN roles r ON u.role_id = r.role_id
        WHERE u.is_active = 1
          AND u.deleted_at IS NULL
          AND LOWER(r.role_name) IN (${adminRolePlaceholders})
      ) AS active_admins
    `,
    [...ADMIN_ROLE_NAMES],
  );

  const [statusRows] = await db.execute<StatusCountRow[]>(
    `
    SELECT status, COUNT(*) AS count
    FROM spots
    GROUP BY status
    `,
  );

  const [signupRows] = await db.execute<CountByMonthRow[]>(
    `
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS count
    FROM users
    WHERE created_at >= ?
      AND deleted_at IS NULL
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    `,
    [rangeStart],
  );

  const [usersBeforeRangeRows] = await db.execute<RowDataPacket[]>(
    `
    SELECT COUNT(*) AS count
    FROM users
    WHERE created_at < ?
      AND deleted_at IS NULL
    `,
    [rangeStart],
  );

  const [submissionRows] = await db.execute<CountByMonthRow[]>(
    `
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS count
    FROM spots
    WHERE created_at >= ?
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    `,
    [rangeStart],
  );

  const [reportRows] = await db.execute<CountByMonthRow[]>(
    `
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS count
    FROM content_report
    WHERE created_at >= ?
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    `,
    [rangeStart],
  );

  const [resolvedRows] = await db.execute<CountByMonthRow[]>(
    `
    SELECT DATE_FORMAT(resolved_at, '%Y-%m') AS ym, COUNT(*) AS count
    FROM content_report
    WHERE resolved_at IS NOT NULL
      AND resolved_at >= ?
    GROUP BY DATE_FORMAT(resolved_at, '%Y-%m')
    `,
    [rangeStart],
  );

  const [roleRows] = await db.execute<RoleCountRow[]>(
    `
    SELECT r.role_name AS role, COUNT(u.user_id) AS count
    FROM roles r
    LEFT JOIN users u
      ON u.role_id = r.role_id
      AND u.deleted_at IS NULL
    GROUP BY r.role_id, r.role_name
    ORDER BY r.role_name ASC
    `,
  );

  const [attributeCountRows] = await db.execute<RowDataPacket[]>(
    `
    SELECT COUNT(*) AS count
    FROM attribute_menu
    WHERE is_active = 1
    `,
  );

  const [activeAdminRows] = await db.execute<ActiveAdminRow[]>(
    `
    SELECT
      u.user_id AS id,
      u.display_name AS name,
      r.role_name AS role,
      u.last_login,
      u.created_at,
      u.avatar_url
    FROM users u
    INNER JOIN roles r ON u.role_id = r.role_id
    WHERE u.is_active = 1
      AND u.deleted_at IS NULL
      AND LOWER(r.role_name) IN (${adminRolePlaceholders})
    ORDER BY COALESCE(u.last_login, u.created_at) DESC, u.user_id DESC
    LIMIT 6
    `,
    [...ADMIN_ROLE_NAMES],
  );

  const metricsRow = metricsRows[0];
  const signupsByMonth = mapMonthlyCounts(months, signupRows);
  let runningUsers = toNumber(usersBeforeRangeRows[0]?.count);
  const userGrowthData = signupsByMonth.map((entry) => {
    runningUsers += entry.count;
    return {
      month: entry.month,
      users: runningUsers,
    };
  });

  const spotSubmissionsData = mapMonthlyCounts(months, submissionRows).map(
    (entry) => ({
      month: entry.month,
      submissions: entry.count,
    }),
  );

  const reportVolumeData = mapMonthlyCounts(months, reportRows).map((entry) => ({
    month: entry.month,
    reports: entry.count,
  }));

  const createdMap = new Map(
    reportVolumeData.map((entry) => [entry.month, entry.reports]),
  );
  const resolvedMap = new Map(
    mapMonthlyCounts(months, resolvedRows).map((entry) => [entry.month, entry.count]),
  );

  const resolvedVsCreated = months.map((month) => ({
    month: month.label,
    created: createdMap.get(month.label) ?? 0,
    resolved: resolvedMap.get(month.label) ?? 0,
  }));

  const statusCountMap = new Map(
    statusRows.map((row) => [row.status.toLowerCase(), toNumber(row.count)]),
  );

  const spotStatusChartData = [
    {
      status: "Active",
      count: statusCountMap.get("active") ?? 0,
      fill: chartPalette.active,
    },
    {
      status: "Inactive",
      count: statusCountMap.get("inactive") ?? 0,
      fill: chartPalette.inactive,
    },
    {
      status: "Pending",
      count: statusCountMap.get("pending") ?? 0,
      fill: chartPalette.pending,
    },
  ];

  const roleDistributionData = roleRows
    .map((row) => {
      const normalizedRole = row.role.trim().toLowerCase();
      return {
        role: row.role,
        count: toNumber(row.count),
        fill:
          chartPalette[normalizedRole as keyof typeof chartPalette] ??
          chartPalette.default,
      };
    })
    .filter((row) => row.count > 0);

  const activeAdmins: AdminDashboardAdmin[] = activeAdminRows.map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    avatar_url: row.avatar_url,
    lastActive: formatRelativeTime(
      row.last_login,
      `Joined ${new Date(row.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`,
    ),
  }));

  return {
    metrics: {
      totalUsers: toNumber(metricsRow.total_users),
      totalActiveSpots: toNumber(metricsRow.active_spots),
      pendingApprovals: toNumber(metricsRow.pending_approvals),
      totalCommentsReported: toNumber(metricsRow.total_comments_reported),
      commentReportsResolved: toNumber(metricsRow.comment_reports_resolved),
      inactiveSpots: toNumber(metricsRow.inactive_spots),
      totalSpotsReported: toNumber(metricsRow.total_spots_reported),
      spotReportsResolved: toNumber(metricsRow.spot_reports_resolved),
      activeAdmins: toNumber(metricsRow.active_admins),
    },
    activeAdmins,
    spotStatusChartData,
    userGrowthData,
    spotSubmissionsData,
    reportVolumeData,
    resolvedVsCreated,
    roleDistributionData,
    roleCount: roleRows.length,
    attributeCount: toNumber(attributeCountRows[0]?.count),
  };
}

export const getAdminDashboardData = createServerFn({ method: "GET" }).handler(
  async () => loadDashboardData(),
);

export const getAdminUsers = createServerFn({ method: "GET" }).handler(
  async () => {
    const [rows] = await db.execute<AdminUserDbRow[]>(
      `
      SELECT
        u.user_id,
        u.display_name,
        u.email,
        u.avatar_url,
        u.role_id,
        r.role_name,
        u.created_at,
        u.last_login,
        u.is_active,
        u.deleted_at,
        COUNT(DISTINCT s.spot_id) AS spots_count,
        COUNT(DISTINCT rv.review_id) AS reviews_count
      FROM users u
      INNER JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN spots s ON s.user_id = u.user_id
      LEFT JOIN reviews rv
        ON rv.user_id = u.user_id
        AND rv.deleted_at IS NULL
      GROUP BY
        u.user_id,
        u.display_name,
        u.email,
        u.avatar_url,
        u.role_id,
        r.role_name,
        u.created_at,
        u.last_login,
        u.is_active,
        u.deleted_at
      ORDER BY u.created_at DESC, u.user_id DESC
      `,
    );

    return rows.map<AdminUserRow>((row) => ({
      user_id: row.user_id,
      display_name: row.display_name,
      email: row.email,
      avatar_url: row.avatar_url,
      role_id: row.role_id,
      role_name: row.role_name,
      created_at: row.created_at,
      last_login: row.last_login,
      spots_count: toNumber(row.spots_count),
      reviews_count: toNumber(row.reviews_count),
      status:
        row.deleted_at !== null
          ? "deleted"
          : row.is_active === 1
            ? "active"
            : "inactive",
    }));
  },
);

export const updateAdminUserRole = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof updateUserRoleSchema>) =>
    updateUserRoleSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const [targetRows] = await db.execute<RowDataPacket[]>(
      `
      SELECT user_id, deleted_at
      FROM users
      WHERE user_id = ?
      LIMIT 1
      `,
      [data.userId],
    );

    if (targetRows.length === 0) {
      throw new Error("User not found.");
    }

    if (targetRows[0].deleted_at !== null) {
      throw new Error("Deleted accounts cannot be assigned a new role.");
    }

    await db.execute<ResultSetHeader>(
      `
      UPDATE users
      SET role_id = ?
      WHERE user_id = ?
      `,
      [data.roleId, data.userId],
    );

    return {
      success: true,
      message: "User role updated successfully.",
    };
  });

export const bulkUpdateAdminUserRoles = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof bulkUpdateUserRolesSchema>) =>
    bulkUpdateUserRolesSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const placeholders = data.userIds.map(() => "?").join(", ");

    await db.execute<ResultSetHeader>(
      `
      UPDATE users
      SET role_id = ?
      WHERE deleted_at IS NULL
        AND user_id IN (${placeholders})
      `,
      [data.roleId, ...data.userIds],
    );

    return {
      success: true,
      message: "Selected users were updated successfully.",
    };
  });

export const updateAdminUserEmail = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof updateAdminUserEmailSchema>) =>
    updateAdminUserEmailSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const normalizedEmail = data.email.trim().toLowerCase();

    const [targetRows] = await db.execute<RowDataPacket[]>(
      `
      SELECT user_id, deleted_at
      FROM users
      WHERE user_id = ?
      LIMIT 1
      `,
      [data.userId],
    );

    if (targetRows.length === 0) {
      throw new Error("User not found.");
    }

    if (targetRows[0].deleted_at !== null) {
      throw new Error("Deleted accounts cannot be edited.");
    }

    const [existingUsers] = await db.execute<RowDataPacket[]>(
      `
      SELECT user_id
      FROM users
      WHERE email = ?
        AND user_id <> ?
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [normalizedEmail, data.userId],
    );

    if (existingUsers.length > 0) {
      throw new Error("Another account is already using this email.");
    }

    await db.execute<ResultSetHeader>(
      `
      UPDATE users
      SET email = ?
      WHERE user_id = ?
      `,
      [normalizedEmail, data.userId],
    );

    return {
      success: true,
      message: "Email updated successfully.",
    };
  });

export const updateAdminUserPassword = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof updateAdminUserPasswordSchema>) =>
    updateAdminUserPasswordSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const [targetRows] = await db.execute<RowDataPacket[]>(
      `
      SELECT user_id, deleted_at
      FROM users
      WHERE user_id = ?
      LIMIT 1
      `,
      [data.userId],
    );

    if (targetRows.length === 0) {
      throw new Error("User not found.");
    }

    if (targetRows[0].deleted_at !== null) {
      throw new Error("Deleted accounts cannot be edited.");
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 10);

    await db.execute<ResultSetHeader>(
      `
      UPDATE users
      SET password_hash = ?
      WHERE user_id = ?
      `,
      [passwordHash, data.userId],
    );

    return {
      success: true,
      message: "Password updated successfully.",
    };
  });

export const deleteAdminUserAccount = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof deleteAdminUserAccountSchema>) =>
    deleteAdminUserAccountSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const [targetRows] = await db.execute<RowDataPacket[]>(
      `
      SELECT user_id, deleted_at
      FROM users
      WHERE user_id = ?
      LIMIT 1
      `,
      [data.userId],
    );

    if (targetRows.length === 0) {
      throw new Error("User not found.");
    }

    if (targetRows[0].deleted_at !== null) {
      throw new Error("This account has already been deleted.");
    }

    await db.execute<ResultSetHeader>(
      `
      UPDATE users
      SET
        email = CONCAT('archived+', user_id, '@deleted.myspot'),
        is_active = 0,
        deleted_at = NOW()
      WHERE user_id = ?
      `,
      [data.userId],
    );

    return {
      success: true,
      message: "Account deleted successfully.",
    };
  });

export const getAdminRoles = createServerFn({ method: "GET" }).handler(
  async () => {
    const [rows] = await db.execute<AdminRoleDbRow[]>(
      `
      SELECT
        r.role_id,
        r.role_name,
        COUNT(u.user_id) AS user_count
      FROM roles r
      LEFT JOIN users u
        ON u.role_id = r.role_id
        AND u.deleted_at IS NULL
      GROUP BY r.role_id, r.role_name
      ORDER BY r.role_name ASC
      `,
    );

    return rows.map<AdminRoleRow>((row) => ({
      role_id: row.role_id,
      role_name: row.role_name,
      user_count: toNumber(row.user_count),
    }));
  },
);

export const createAdminRole = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof createRoleSchema>) =>
    createRoleSchema.parse(input),
  )
  .handler(async ({ data }) => {
    await db.execute<ResultSetHeader>(
      `
      INSERT INTO roles (role_name)
      VALUES (?)
      `,
      [data.roleName.trim().toLowerCase()],
    );

    return {
      success: true,
      message: "Role created successfully.",
    };
  });

export const getAdminSpots = createServerFn({ method: "GET" }).handler(
  async () => {
    const [rows] = await db.execute<AdminSpotDbRow[]>(
      `
      SELECT
        s.spot_id,
        s.spot_name,
        s.spot_type,
        (
          SELECT sm.media_url
          FROM spot_media sm
          WHERE sm.spot_id = s.spot_id
            AND sm.deleted_at IS NULL
          ORDER BY sm.is_primary DESC, sm.sort_order ASC, sm.media_id ASC
          LIMIT 1
        ) AS primary_media_url,
        s.address,
        s.latitude,
        s.longitude,
        s.short_description,
        s.created_at,
        u.display_name AS created_by,
        u.avatar_url AS created_by_avatar_url,
        s.status
      FROM spots s
      INNER JOIN users u ON s.user_id = u.user_id
      ORDER BY s.created_at DESC, s.spot_id DESC
      `,
    );

    return rows.map<AdminSpotRow>((row) => ({
      spot_id: row.spot_id,
      spot_name: row.spot_name,
      spot_type: row.spot_type,
      primary_media_url: row.primary_media_url,
      address: row.address,
      latitude: row.latitude === null ? null : Number(row.latitude),
      longitude: row.longitude === null ? null : Number(row.longitude),
      short_description: row.short_description,
      created_at: row.created_at,
      created_by: row.created_by,
      created_by_avatar_url: row.created_by_avatar_url,
      status: row.status,
    }));
  },
);

export const updateAdminSpotStatuses = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof updateSpotStatusesSchema>) =>
    updateSpotStatusesSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const placeholders = data.spotIds.map(() => "?").join(", ");

    await db.execute<ResultSetHeader>(
      `
      UPDATE spots
      SET
        status = ?,
        last_modified = CURRENT_TIMESTAMP
      WHERE spot_id IN (${placeholders})
      `,
      [data.status, ...data.spotIds],
    );

    return {
      success: true,
      message: "Spot statuses updated successfully.",
    };
  });

export const getAdminReportedSpots = createServerFn({ method: "GET" }).handler(
  async () => {
    const [rows] = await db.execute<AdminReportedSpotDbRow[]>(
      `
      SELECT
        s.spot_id,
        (
          SELECT cr2.report_id
          FROM content_report cr2
          WHERE cr2.spot_id = s.spot_id
          ORDER BY cr2.created_at DESC, cr2.report_id DESC
          LIMIT 1
        ) AS report_id,
        s.spot_name,
        s.spot_type,
        (
          SELECT sm.media_url
          FROM spot_media sm
          WHERE sm.spot_id = s.spot_id
            AND sm.deleted_at IS NULL
          ORDER BY sm.is_primary DESC, sm.sort_order ASC, sm.media_id ASC
          LIMIT 1
        ) AS primary_media_url,
        s.address,
        s.latitude,
        s.longitude,
        s.short_description,
        u.display_name AS submitted_by,
        u.avatar_url AS submitted_by_avatar_url,
        COUNT(cr.report_id) AS report_count,
        SUM(CASE WHEN cr.status = 'open' THEN 1 ELSE 0 END) AS open_report_count,
        (
          SELECT cr2.reason
          FROM content_report cr2
          WHERE cr2.spot_id = s.spot_id
          ORDER BY cr2.created_at DESC, cr2.report_id DESC
          LIMIT 1
        ) AS latest_reason,
        (
          SELECT cr2.status
          FROM content_report cr2
          WHERE cr2.spot_id = s.spot_id
          ORDER BY cr2.created_at DESC, cr2.report_id DESC
          LIMIT 1
        ) AS latest_status,
        (
          SELECT cr2.created_at
          FROM content_report cr2
          WHERE cr2.spot_id = s.spot_id
          ORDER BY cr2.created_at DESC, cr2.report_id DESC
          LIMIT 1
        ) AS report_date,
        s.status AS spot_status
      FROM spots s
      INNER JOIN users u ON s.user_id = u.user_id
      INNER JOIN content_report cr ON cr.spot_id = s.spot_id
      GROUP BY
        s.spot_id,
        s.spot_name,
        s.spot_type,
        s.address,
        s.latitude,
        s.longitude,
        s.short_description,
        u.display_name,
        u.avatar_url,
        s.status
      ORDER BY report_date DESC, s.spot_id DESC
      `,
    );

    const [reportRows] = await db.execute<ReportEntryDbRow[]>(
      `
      SELECT
        cr.spot_id AS parent_id,
        cr.report_id,
        cr.reason,
        cr.details,
        cr.status,
        cr.created_at,
        cr.resolved_at,
        cr.resolution_note,
        u.display_name AS reporter_name
      FROM content_report cr
      INNER JOIN users u ON cr.user_id = u.user_id
      WHERE cr.spot_id IS NOT NULL
      ORDER BY cr.created_at DESC, cr.report_id DESC
      `,
    );

    const groupedReports = groupReportEntries(reportRows);

    return rows.map<AdminReportedSpotRow>((row) => ({
      spot_id: row.spot_id,
      report_id: row.report_id,
      spot_name: row.spot_name,
      spot_type: row.spot_type,
      primary_media_url: row.primary_media_url,
      address: row.address,
      latitude: row.latitude === null ? null : Number(row.latitude),
      longitude: row.longitude === null ? null : Number(row.longitude),
      short_description: row.short_description,
      submitted_by: row.submitted_by,
      submitted_by_avatar_url: row.submitted_by_avatar_url,
      report_count: toNumber(row.report_count),
      open_report_count: toNumber(row.open_report_count),
      latest_reason: row.latest_reason,
      report_status:
        toNumber(row.open_report_count) > 0 ? "open" : row.latest_status,
      report_date: row.report_date,
      spot_status: row.spot_status,
      reports: groupedReports.get(row.spot_id) ?? [],
    }));
  },
);

export const moderateAdminSpotReports = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof moderateSpotReportsSchema>) =>
    moderateSpotReportsSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const connection = await db.getConnection();
    const trimmedResolutionNote = data.resolutionNote?.trim() || null;
    const spotIds = data.spotIds ?? [];
    const reportIds = data.reportIds ?? [];

    try {
      await connection.beginTransaction();

      if (data.action === "deactivate" && spotIds.length > 0) {
        const spotPlaceholders = spotIds.map(() => "?").join(", ");
        await connection.execute<ResultSetHeader>(
          `
          UPDATE spots
          SET
            status = 'inactive',
            last_modified = CURRENT_TIMESTAMP
          WHERE spot_id IN (${spotPlaceholders})
          `,
          [...spotIds],
        );
      }

      const nextStatus = data.action === "dismiss" ? "dismissed" : "resolved";
      const defaultNote =
        data.action === "deactivate"
          ? "Spot marked inactive by admin."
          : data.action === "dismiss"
            ? "Report dismissed by admin."
            : "Report resolved by admin.";
      const resolutionNote = trimmedResolutionNote || defaultNote;

      if (reportIds.length > 0) {
        const reportPlaceholders = reportIds.map(() => "?").join(", ");
        await connection.execute<ResultSetHeader>(
          `
          UPDATE content_report
          SET
            status = ?,
            resolved_at = CURRENT_TIMESTAMP,
            resolution_note = ?
          WHERE report_id IN (${reportPlaceholders})
            AND status = 'open'
          `,
          [nextStatus, resolutionNote, ...reportIds],
        );
      } else if (spotIds.length > 0) {
        const spotPlaceholders = spotIds.map(() => "?").join(", ");
        await connection.execute<ResultSetHeader>(
          `
          UPDATE content_report
          SET
            status = ?,
            resolved_at = CURRENT_TIMESTAMP,
            resolution_note = COALESCE(resolution_note, ?)
          WHERE spot_id IN (${spotPlaceholders})
            AND status = 'open'
          `,
          [nextStatus, resolutionNote, ...spotIds],
        );
      }

      await connection.commit();

      return {
        success: true,
        message: "Spot reports updated successfully.",
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

export const getAdminReportedReviews = createServerFn({ method: "GET" }).handler(
  async () => {
    const [rows] = await db.execute<AdminReportedReviewDbRow[]>(
      `
      SELECT
        r.review_id,
        (
          SELECT cr2.report_id
          FROM content_report cr2
          WHERE cr2.review_id = r.review_id
          ORDER BY cr2.created_at DESC, cr2.report_id DESC
          LIMIT 1
        ) AS report_id,
        u.display_name AS reviewer,
        u.avatar_url AS reviewer_avatar_url,
        s.spot_id,
        s.spot_name,
        r.rating,
        r.review AS review_text,
        r.created_at AS review_date,
        COUNT(cr.report_id) AS report_count,
        SUM(CASE WHEN cr.status = 'open' THEN 1 ELSE 0 END) AS open_report_count,
        GROUP_CONCAT(DISTINCT cr.reason ORDER BY cr.reason SEPARATOR '||') AS report_reasons,
        (
          SELECT cr2.status
          FROM content_report cr2
          WHERE cr2.review_id = r.review_id
          ORDER BY cr2.created_at DESC, cr2.report_id DESC
          LIMIT 1
        ) AS latest_status,
        CASE WHEN r.deleted_at IS NULL THEN 0 ELSE 1 END AS review_deleted
      FROM reviews r
      INNER JOIN users u ON r.user_id = u.user_id
      INNER JOIN spots s ON r.spot_id = s.spot_id
      INNER JOIN content_report cr ON cr.review_id = r.review_id
      GROUP BY
        r.review_id,
        u.display_name,
        u.avatar_url,
        s.spot_id,
        s.spot_name,
        r.rating,
        r.review,
        r.created_at,
        r.deleted_at
      ORDER BY review_date DESC, r.review_id DESC
      `,
    );

    const [reportRows] = await db.execute<ReportEntryDbRow[]>(
      `
      SELECT
        cr.review_id AS parent_id,
        cr.report_id,
        cr.reason,
        cr.details,
        cr.status,
        cr.created_at,
        cr.resolved_at,
        cr.resolution_note,
        u.display_name AS reporter_name
      FROM content_report cr
      INNER JOIN users u ON cr.user_id = u.user_id
      WHERE cr.review_id IS NOT NULL
      ORDER BY cr.created_at DESC, cr.report_id DESC
      `,
    );

    const groupedReports = groupReportEntries(reportRows);

    return rows.map<AdminReportedReviewRow>((row) => ({
      review_id: row.review_id,
      report_id: row.report_id,
      reviewer: row.reviewer,
      reviewer_avatar_url: row.reviewer_avatar_url,
      spot_id: row.spot_id,
      spot_name: row.spot_name,
      rating: Number(row.rating),
      review_text: row.review_text,
      review_date: row.review_date,
      report_count: toNumber(row.report_count),
      open_report_count: toNumber(row.open_report_count),
      report_reasons: row.report_reasons
        ? row.report_reasons.split("||").filter(Boolean)
        : [],
      report_status:
        toNumber(row.open_report_count) > 0 ? "open" : row.latest_status,
      review_deleted: row.review_deleted === 1,
      reports: groupedReports.get(row.review_id) ?? [],
    }));
  },
);

export const moderateAdminReviewReports = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof moderateReviewReportsSchema>) =>
    moderateReviewReportsSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const connection = await db.getConnection();
    const trimmedResolutionNote = data.resolutionNote?.trim() || null;
    const reviewIds = data.reviewIds ?? [];
    const reportIds = data.reportIds ?? [];

    try {
      await connection.beginTransaction();

      if (data.action === "remove" && reviewIds.length > 0) {
        const reviewPlaceholders = reviewIds.map(() => "?").join(", ");
        await connection.execute<ResultSetHeader>(
          `
          UPDATE reviews
          SET
            deleted_at = COALESCE(deleted_at, CURRENT_TIMESTAMP),
            deletion_note = COALESCE(
              deletion_note,
              'Removed by admin moderation'
            )
          WHERE review_id IN (${reviewPlaceholders})
          `,
          [...reviewIds],
        );
      }

      const nextStatus = data.action === "dismiss" ? "dismissed" : "resolved";
      const defaultNote =
        data.action === "remove"
          ? "Review removed by admin moderation."
          : data.action === "dismiss"
            ? "Report dismissed by admin."
            : "Report resolved by admin.";
      const resolutionNote = trimmedResolutionNote || defaultNote;

      if (reportIds.length > 0) {
        const reportPlaceholders = reportIds.map(() => "?").join(", ");
        await connection.execute<ResultSetHeader>(
          `
          UPDATE content_report
          SET
            status = ?,
            resolved_at = CURRENT_TIMESTAMP,
            resolution_note = ?
          WHERE report_id IN (${reportPlaceholders})
            AND status = 'open'
          `,
          [nextStatus, resolutionNote, ...reportIds],
        );
      } else if (reviewIds.length > 0) {
        const reviewPlaceholders = reviewIds.map(() => "?").join(", ");
        await connection.execute<ResultSetHeader>(
          `
          UPDATE content_report
          SET
            status = ?,
            resolved_at = CURRENT_TIMESTAMP,
            resolution_note = COALESCE(resolution_note, ?)
          WHERE review_id IN (${reviewPlaceholders})
            AND status = 'open'
          `,
          [nextStatus, resolutionNote, ...reviewIds],
        );
      }

      await connection.commit();

      return {
        success: true,
        message: "Review moderation completed successfully.",
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });
