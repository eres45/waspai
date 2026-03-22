import { TempMailService } from "../src/lib/ai/tools/web/temp-mail-service";

async function testProviders() {
  console.log("--- Testing New Temp Mail Providers ---");

  // 1. Test 1SecMail (Usually fastest and simplest)
  try {
    console.log("\n[1SecMail] Creating account...");
    const account1 = await TempMailService.create1SecMailAccount();
    console.log(`[1SecMail] Created: ${account1.email}`);

    console.log("[1SecMail] Checking messages...");
    const msgs1 = await TempMailService.get1SecMailMessages(account1.email);
    console.log(`[1SecMail] Messages found: ${msgs1.length}`);
  } catch (err: any) {
    console.error(`[1SecMail] FAILED: ${err.message}`);
  }

  // 2. Test Mail.tm (Default)
  try {
    console.log("\n[Mail.tm] Creating account...");
    const accountTm = await TempMailService.createMailTmAccount();
    console.log(`[Mail.tm] Created: ${accountTm.email}`);

    console.log("[Mail.tm] Checking messages...");
    const msgsTm = await TempMailService.getMailTmMessages(accountTm);
    console.log(`[Mail.tm] Messages found: ${msgsTm.length}`);
  } catch (err: any) {
    console.error(`[Mail.tm] FAILED: ${err.message}`);
  }

  // 3. Test Guerrilla Mail
  try {
    console.log("\n[Guerrilla Mail] Creating account...");
    const accountGm = await TempMailService.createGuerrillaMailAccount();
    console.log(`[Guerrilla Mail] Created: ${accountGm.email}`);

    console.log("[Guerrilla Mail] Checking messages...");
    const msgsGm = await TempMailService.getGuerrillaMailMessages(
      accountGm.token!,
    );
    console.log(`[Guerrilla Mail] Messages found: ${msgsGm.length}`);
  } catch (err: any) {
    console.error(`[Guerrilla Mail] FAILED: ${err.message}`);
  }

  // 4. Test Maildrop.cc
  try {
    console.log("\n[Maildrop.cc] Checking messages for random name...");
    const msgsMd = await TempMailService.getMaildropMessages(
      "testuser123@maildrop.cc",
    );
    console.log(`[Maildrop.cc] Messages found: ${msgsMd.length}`);
  } catch (err: any) {
    console.error(`[Maildrop.cc] FAILED: ${err.message}`);
  }
}

testProviders();
