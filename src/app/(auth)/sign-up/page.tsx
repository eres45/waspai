import SignUpPage from "@/components/auth/sign-up";
import { getAuthConfig } from "auth/config";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SignUp({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const {
    emailAndPasswordEnabled,
    socialAuthenticationProviders,
    signUpEnabled,
  } = getAuthConfig();

  const { ref } = await searchParams;

  if (!signUpEnabled) {
    redirect("/sign-in");
  }
  const enabledProviders = (
    Object.keys(
      socialAuthenticationProviders,
    ) as (keyof typeof socialAuthenticationProviders)[]
  ).filter((key) => socialAuthenticationProviders[key]);
  return (
    <SignUpPage
      isFirstUser={false}
      emailAndPasswordEnabled={emailAndPasswordEnabled}
      socialAuthenticationProviders={enabledProviders}
      refCode={ref}
    />
  );
}
