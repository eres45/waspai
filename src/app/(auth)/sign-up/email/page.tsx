import EmailSignUp from "@/components/auth/email-sign-up";
import { getAuthConfig } from "lib/auth/config";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EmailSignUpPage() {
  const { emailAndPasswordEnabled } = getAuthConfig();
  if (!emailAndPasswordEnabled) {
    redirect("/sign-in");
  }
  return <EmailSignUp isFirstUser={false} />;
}
