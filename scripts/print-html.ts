import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function check() {
  const slug = "novaplay-cloud-gaming";
  const { data: site } = await supabase
    .from("deployed_site")
    .select("html_content")
    .eq("slug", slug)
    .single();

  if (site) {
    console.log("=== HTML CONTENT ===");
    console.log(site.html_content);
  }
}

check();
