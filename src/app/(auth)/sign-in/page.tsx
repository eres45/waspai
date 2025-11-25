import SignIn from "@/components/auth/sign-in";
import { getAuthConfig } from "lib/auth/config";
import { AuthCallbackHandler } from "@/app/auth/callback-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SignInPage() {
  const {
    emailAndPasswordEnabled,
    signUpEnabled,
    socialAuthenticationProviders,
  } = getAuthConfig();
  const enabledProviders = (
    Object.keys(
      socialAuthenticationProviders,
    ) as (keyof typeof socialAuthenticationProviders)[]
  ).filter((key) => socialAuthenticationProviders[key]);
  return (
    <>
      <AuthCallbackHandler />
      <SignIn
        emailAndPasswordEnabled={emailAndPasswordEnabled}
        signUpEnabled={signUpEnabled}
        socialAuthenticationProviders={enabledProviders}
        isFirstUser={false}
      />
    </>
  );
}
