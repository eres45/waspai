"use server";

import {
  validatedActionWithAdminPermission,
  validatedActionWithUserManagePermission,
} from "lib/action-utils";
import { headers } from "next/headers";
import { auth } from "auth/server";
import {
  UpdateUserDetailsSchema,
  UpdateUserPreferencesSchema,
  DeleteUserSchema,
  UpdateUserPasswordSchema,
  UpdateUserActionState,
  DeleteUserActionState,
  UpdateUserPasswordActionState,
} from "./validations";
import { getUser, getUserAccounts, updateUserDetails } from "lib/user/server";
import { getTranslations } from "next-intl/server";
import { logger } from "better-auth";
import {
  generateImageWithOpenAI,
  generateImageWithXAI,
  GeneratedImageResult,
  generateImageWithNanoBanana,
} from "lib/ai/image/generate-image";

export const updateUserImageAction = validatedActionWithUserManagePermission(
  UpdateUserDetailsSchema.pick({ userId: true, image: true }),
  async (
    data,
    userId,
    _userSession,
    isOwnResource,
  ): Promise<UpdateUserActionState> => {
    const t = await getTranslations("User.Profile.common");

    try {
      const { image } = data;

      // Update user image in database
      // Works for both Better Auth and Supabase Auth users
      await updateUserDetails(userId, undefined, undefined, image);

      const user = await getUser(userId);
      if (!user) {
        return {
          success: false,
          message: t("userNotFound"),
        };
      }

      return {
        success: true,
        message: "Profile photo updated successfully",
        user,
        currentUserUpdated: isOwnResource,
      };
    } catch (error) {
      logger.error("Failed to update user image:", error);
      return {
        success: false,
        message: "Failed to update profile photo",
      };
    }
  },
);

export const updateUserDetailsAction = validatedActionWithUserManagePermission(
  UpdateUserDetailsSchema,
  async (
    data,
    userId,
    userSession,
    isOwnResource,
    _formData,
  ): Promise<UpdateUserActionState> => {
    const t = await getTranslations("User.Profile.common");

    try {
      const { name, email, image } = data;

      // Check if at least one field is provided
      if (!name && !email && !image) {
        return {
          success: false,
          message: "Please provide at least one field to update",
        };
      }

      const user = await getUser(userId);
      if (!user) {
        logger.warn(`User not found for update: ${userId}`);
        return {
          success: false,
          message: t("userNotFound"),
        };
      }

      const isDifferentEmail = email && email !== userSession.user.email;
      const isDifferentName = name && name !== userSession.user.name;
      const isDifferentImage = image && image !== userSession.user.image;

      logger.info(
        `Updating user ${userId}: name=${name}, email=${email}, image=${image ? "yes" : "no"}`,
      );

      // Update user details in database
      // Works for both Better Auth and Supabase Auth users
      await updateUserDetails(userId, name, email, image);

      if (isDifferentEmail) user.email = email;
      if (isDifferentName) user.name = name;
      if (isDifferentImage) user.image = image;

      logger.info(`User ${userId} updated successfully`);

      return {
        success: true,
        message: t("userDetailsUpdatedSuccessfully"),
        user,
        currentUserUpdated: isOwnResource,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Failed to update user details for ${userId}: ${errorMessage}`,
        error,
      );
      return {
        success: false,
        message: t("failedToUpdateUserDetails"),
      };
    }
  },
);

export const deleteUserAction = validatedActionWithAdminPermission(
  DeleteUserSchema,
  async (data, _formData, _userSession): Promise<DeleteUserActionState> => {
    const t = await getTranslations("Admin.UserDelete");
    const { userId } = data;
    try {
      await auth.api.removeUser({
        body: { userId },
        headers: await headers(),
      });
    } catch (error) {
      console.error("Failed to delete user:", error);
      return {
        success: false,
        message: t("failedToDeleteUser"),
      };
    }

    return {
      success: true,
      message: t("userDeletedSuccessfully"),
      redirect: "/admin",
    };
  },
);

export const updateUserPasswordAction = validatedActionWithUserManagePermission(
  UpdateUserPasswordSchema,
  async (
    data,
    userId,
    _userSession,
    isOwnResource,
    _formData,
  ): Promise<UpdateUserPasswordActionState> => {
    const t = await getTranslations("User.Profile.common");
    const {
      newPassword,
      isCurrentUser: isCurrentUserParam,
      currentPassword,
    } = data;
    const { hasPassword } = await getUserAccounts(userId);

    const isCurrentUser = isCurrentUserParam ? isOwnResource : false;

    if (!hasPassword) {
      return {
        success: false,
        message: t("userHasNoPasswordAccount"),
      };
    }

    try {
      if (isCurrentUser) {
        if (!currentPassword) {
          return {
            success: false,
            message: t("failedToUpdatePassword"),
          };
        }
        await auth.api.changePassword({
          body: { currentPassword, newPassword, revokeOtherSessions: true },
          headers: await headers(),
        });
      } else {
        await auth.api.setUserPassword({
          body: { userId, newPassword },
          headers: await headers(),
        });
        await auth.api.revokeUserSessions({
          body: { userId },
          headers: await headers(),
        });
      }
      return {
        success: true,
        message: t("passwordUpdatedSuccessfully"),
      };
    } catch (_error) {
      console.error("Failed to update user password:", _error);
      return {
        success: false,
        message: t("failedToUpdatePassword"),
      };
    }
  },
);

type ImageProvider = "openai" | "xai" | "google";

interface GenerateAvatarResult {
  success: boolean;
  base64?: string;
  mimeType?: string;
  error?: string;
}

/**
 * Server Action to generate avatar image using AI
 */
export async function generateAvatarImageAction(
  provider: ImageProvider,
  prompt: string,
): Promise<GenerateAvatarResult> {
  try {
    if (!prompt.trim()) {
      return {
        success: false,
        error: "Prompt is required",
      };
    }

    // Wrap user prompt with avatar-specific instructions
    const enhancedPrompt = `You are tasked with creating a professional profile picture for a user.

Requirements:
- Portrait style with centered face
- Clear, high-quality image suitable for profile/avatar use
- Friendly and approachable expression
- Professional yet personable appearance
- Clean background that doesn't distract from the subject
- Well-lit with good contrast

User's request:
"${prompt}"

Generate a profile picture that fulfills the user's request while maintaining the professional portrait quality requirements above.`;

    let response: GeneratedImageResult;

    switch (provider) {
      case "openai":
        response = await generateImageWithOpenAI({
          prompt: enhancedPrompt,
        });
        break;
      case "xai":
        response = await generateImageWithXAI({
          prompt: enhancedPrompt,
        });
        break;
      case "google":
        response = await generateImageWithNanoBanana({
          prompt: enhancedPrompt,
        });
        break;
      default:
        return {
          success: false,
          error: "Invalid provider",
        };
    }

    if (!response || response.images.length === 0) {
      return {
        success: false,
        error: "No image generated",
      };
    }

    const image = response.images[0];

    if (!image.base64) {
      return {
        success: false,
        error: "No image data received",
      };
    }

    return {
      success: true,
      base64: image.base64,
      mimeType: image.mimeType || "image/png",
    };
  } catch (error) {
    logger.error("Failed to generate avatar image:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate image",
    };
  }
}

export const updateUserPreferencesAction =
  validatedActionWithUserManagePermission(
    UpdateUserPreferencesSchema,
    async (
      data,
      userId,
      _userSession,
      _isOwnResource,
      _formData,
    ): Promise<UpdateUserActionState> => {
      const t = await getTranslations("User.Profile.common");

      try {
        const { displayName, profession, responseStyleExample, botName } = data;

        // Check if at least one field is provided
        if (!displayName && !profession && !responseStyleExample && !botName) {
          return {
            success: false,
            message: "Please provide at least one field to update",
          };
        }

        const user = await getUser(userId);
        if (!user) {
          logger.warn(`User not found for preferences update: ${userId}`);
          return {
            success: false,
            message: t("userNotFound"),
          };
        }

        logger.info(
          `Updating user preferences ${userId}: displayName=${displayName}, profession=${profession}`,
        );

        // Update user preferences in database
        const { userRepository } = await import("lib/db/repository");
        const currentPreferences = await userRepository.getPreferences(userId);

        await userRepository.updatePreferences(userId, {
          displayName: displayName || currentPreferences?.displayName,
          profession: profession || currentPreferences?.profession,
          responseStyleExample:
            responseStyleExample || currentPreferences?.responseStyleExample,
          botName: botName || currentPreferences?.botName,
        });

        logger.info(`User preferences ${userId} updated successfully`);

        return {
          success: true,
          message: "Preferences updated successfully",
          user,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(
          `Failed to update user preferences for ${userId}: ${errorMessage}`,
          error,
        );
        return {
          success: false,
          message: "Failed to update preferences",
        };
      }
    },
  );
