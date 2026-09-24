import type { Metadata } from "next";
import InviteHistoryClient from "./invite-history-client";

export const metadata: Metadata = {
  title: "My Invites & Referral History – WaspAI",
  description:
    "Track friends who joined via your referral link and view your rewards.",
};

export default function InviteHistoryPage() {
  return <InviteHistoryClient />;
}
