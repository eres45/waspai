import ResetPassword from "@/components/auth/reset-password";
import { getAuthConfig } from "lib/auth/config";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ResetPasswordPage() {
  const { emailAndPasswordEnabled } = getAuthConfig();
  if (!emailAndPasswordEnabled) {
    redirect("/sign-in");
  }
  return <ResetPassword />;
}
