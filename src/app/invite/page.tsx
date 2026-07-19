import type { Metadata } from "next";
import InviteClient from "./invite-client";

export const metadata: Metadata = {
  title: "Invite to Earn – WaspAI",
  description:
    "Invite friends to WaspAI and earn up to 1-year K3 Credits for both of you.",
};

export default function InvitePage() {
  return <InviteClient />;
}
