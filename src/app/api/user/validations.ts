import { z } from "zod";
import { USER_ROLES, UserRoleNames } from "app-types/roles";

import { ActionState } from "lib/action-utils";
import { BasicUserWithLastLogin } from "app-types/user";
import { passwordSchema } from "lib/validations/password";

export const UpdateUserRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z
    .enum(Object.values(USER_ROLES) as [UserRoleNames, ...UserRoleNames[]])
    .optional(),
});

export const UpdateUserPasswordError = {
  PASSWORD_MISMATCH: "Passwords do not match",
  CURRENT_PASSWORD_REQUIRED: "Current password is required",
} as const;

export type UpdateUserPasswordError =
  (typeof UpdateUserPasswordError)[keyof typeof UpdateUserPasswordError];

export const UpdateUserDetailsSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .optional(),
  email: z.string().email("Invalid email address").optional(),
  image: z
    .string()
    .max(10 * 1024 * 1024, "Image is too large (max 10MB)")
    .optional(),
});

export const UpdateUserPreferencesSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  displayName: z.string().max(100, "Display name is too long").optional(),
  profession: z.string().max(200, "Profession is too long").optional(),
  responseStyleExample: z
    .string()
    .max(1000, "Response style example is too long")
    .optional(),
  botName: z.string().max(100, "Bot name is too long").optional(),
});

export const DeleteUserSchema = z.object({
  userId: z.uuid("Invalid user ID"),
});

export const UpdateUserPasswordSchema = z
  .object({
    userId: z.string().uuid("Invalid user ID"),
    isCurrentUser: z.boolean(),
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
    currentPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: UpdateUserPasswordError.PASSWORD_MISMATCH,
      });
    }
    if (data.isCurrentUser && !data.currentPassword) {
      ctx.addIssue({
        code: "custom",
        message: UpdateUserPasswordError.CURRENT_PASSWORD_REQUIRED,
      });
    }
  });

export type UpdateUserRoleActionState = ActionState & {
  user?: BasicUserWithLastLogin | null;
};

export type DeleteUserActionState = ActionState & {
  redirect?: string;
};

export type UpdateUserActionState = ActionState & {
  user?: BasicUserWithLastLogin | null;
  currentUserUpdated?: boolean;
};

export type UpdateUserPasswordActionState = ActionState & {
  error?: UpdateUserPasswordError;
};
