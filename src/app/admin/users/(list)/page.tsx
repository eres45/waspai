import { redirect } from "next/navigation";

// /admin/users now lives at /admin — redirect for backwards compat
export default function UsersListRedirect() {
  redirect("/admin");
}
