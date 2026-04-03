import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { db } from "./db";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type UserRow = RowDataPacket & {
  user_id: number;
  display_name: string;
  email: string;
  password_hash: string;
  role_id: number;
  role_name: string;
};

export const loginUser = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const parsed = loginSchema.parse(data);
    const normalizedEmail = parsed.email.trim().toLowerCase();

    const [rows] = await db.execute<UserRow[]>(
      `
      SELECT
        u.user_id,
        u.display_name,
        u.email,
        u.password_hash,
        u.role_id,
        r.role_name
      FROM users u
      INNER JOIN roles r ON u.role_id = r.role_id
      WHERE u.email = ?
        AND u.is_active = 1
      LIMIT 1
      `,
      [normalizedEmail],
    );

    if (rows.length === 0) {
      throw new Error("Invalid email or password.");
    }

    const user = rows[0];

    const passwordMatches = await bcrypt.compare(
      parsed.password,
      user.password_hash,
    );

    if (!passwordMatches) {
      throw new Error("Invalid email or password.");
    }

    return {
      success: true,
      user: {
        userId: user.user_id,
        displayName: user.display_name,
        email: user.email,
        roleId: user.role_id,
        roleName: user.role_name,
      },
    };
  },
);
