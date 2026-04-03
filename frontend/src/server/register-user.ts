import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { db } from "./db";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters."),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
    agreedToTerms: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }

    if (!data.agreedToTerms) {
      ctx.addIssue({
        code: "custom",
        path: ["agreedToTerms"],
        message: "You must agree to the Terms of Service and Privacy Policy.",
      });
    }
  });

type RegisterInput = z.infer<typeof registerSchema>;

type ExistingUserRow = RowDataPacket & {
  user_id: number;
};

type RoleRow = RowDataPacket & {
  role_id: number;
};

export const registerUser = createServerFn({ method: "POST" })
  .inputValidator((input: RegisterInput) => registerSchema.parse(input))
  .handler(async ({ data }) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    const fullName = data.fullName.trim();

    await db.execute<ResultSetHeader>(
      `
      UPDATE users
      SET email = CONCAT('archived+', user_id, '@deleted.myspot')
      WHERE email = ?
        AND is_active = 0
      `,
      [normalizedEmail],
    );

    const [existingUsers] = await db.execute<ExistingUserRow[]>(
      `
      SELECT user_id
      FROM users
      WHERE email = ?
        AND is_active = 1
      LIMIT 1
      `,
      [normalizedEmail],
    );

    if (existingUsers.length > 0) {
      throw new Error("An account with this email already exists.");
    }

    const [roleRows] = await db.execute<RoleRow[]>(
      `
      SELECT role_id
      FROM roles
      WHERE role_name = 'user'
      LIMIT 1
      `,
    );

    if (roleRows.length === 0) {
      throw new Error("Default 'user' role was not found in the roles table.");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const [result] = await db.execute<ResultSetHeader>(
      `
      INSERT INTO users (display_name, email, password_hash, role_id)
      VALUES (?, ?, ?, ?)
      `,
      [fullName, normalizedEmail, passwordHash, roleRows[0].role_id],
    );

    return {
      success: true,
      userId: result.insertId,
      message: "Account created successfully.",
    };
  });
