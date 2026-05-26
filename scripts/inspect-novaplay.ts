import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function check() {
  const slug = "novaplay-cloud-gaming";
  console.log(`Checking site for slug: ${slug}...`);

  const { data: site, error } = await supabase
    .from("deployed_site")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Error fetching site:", error);
    return;
  }

  if (!site) {
    console.log(`Site not found for slug ${slug}`);
    return;
  }

  console.log("\nSite Details:");
  console.log("ID:", site.id);
  console.log("Slug:", site.slug);
  console.log("Title:", site.title);
  console.log("HTML Content length:", site.html_content?.length || 0);
  console.log("HTML Content Preview:", site.html_content?.substring(0, 500));

  const { data: files, error: filesErr } = await supabase
    .from("deployed_site_file")
    .select("*")
    .eq("site_id", site.id);

  if (filesErr) {
    console.error("Error fetching files:", filesErr);
    return;
  }

  console.log(`\nFiles Count: ${files?.length || 0}`);
  for (const f of files || []) {
    console.log(`- Path: ${f.path}`);
    console.log(`  MimeType: ${f.mime_type}`);
    console.log(`  Content length: ${f.content?.length || 0}`);
    console.log(`  Content Preview:`, f.content?.substring(0, 200));
  }
}

check();
