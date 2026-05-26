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
    .select("id")
    .eq("slug", slug)
    .single();

  if (site) {
    const { data: file } = await supabase
      .from("deployed_site_file")
      .select("content")
      .eq("site_id", site.id)
      .eq("path", "css/styles.css")
      .single();

    if (file) {
      console.log("=== CSS CONTENT ===");
      console.log(file.content);
    }
  }
}

check();
