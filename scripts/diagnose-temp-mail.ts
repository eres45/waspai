import { TempMailService } from "../src/lib/ai/tools/web/temp-mail-service";

async function diagnoseMailTm() {
  console.log("--- Diagnosing Mail.tm ---");
  try {
    const account = await TempMailService.createMailTmAccount();
    console.log("✅ Success:", account.email);
  } catch (e: any) {
    console.log("❌ Failed:", e.message);
    if (e.stack) console.log(e.stack);
  }
}

diagnoseMailTm();
