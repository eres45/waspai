import EmailSignUp from "@/components/auth/email-sign-up";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EmailSignUpPage() {
  return <EmailSignUp isFirstUser={false} />;
}
