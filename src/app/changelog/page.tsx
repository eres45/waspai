import { Metadata } from "next";
import ChangelogClientPage from "./changelog-client";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Follow the latest features, improvements, and bug fixes shipped by the Wasp AI team.",
};

export default function Page() {
  return <ChangelogClientPage />;
}
