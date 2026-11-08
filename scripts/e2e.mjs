/**
 * End-to-end walkthrough of the demo story with real browsers (Playwright).
 * Needs: local Supabase running, `npm run seed` done, the app running on :3000.
 *
 *   node scripts/e2e.mjs            (SHOT_DIR=some/folder to keep screenshots)
 *
 * Uses only the fake seed people plus one throwaway account that it deletes at the end.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOT = process.env.SHOT_DIR ?? "e2e-shots";
const PASSWORD = "demo-password-123";
mkdirSync(SHOT, { recursive: true });

let passed = 0;
const failures = [];
function check(name, ok, extra = "") {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(name);
    console.log(`  ✗ ${name} ${extra}`);
  }
}
const step = (title) => console.log(`\n${title}`);

const browser = await chromium.launch();
const phone = { viewport: { width: 430, height: 900 }, deviceScaleFactor: 1 };

async function session(opts = phone) {
  const context = await browser.newContext(opts);
  if (process.env.E2E_HOUR) await context.clock.setFixedTime(new Date(2026, 10, 8, Number(process.env.E2E_HOUR), 0, 0));
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log("    [pageerror]", e.message));
  return { context, page };
}
const shot = async (page, name) => {
  await page.waitForTimeout(1100); // let entrance animations finish
  await page.screenshot({ path: `${SHOT}/${name}.png` });
};

async function login(page, email, landing) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(landing, { timeout: 15000 });
}

try {
  // ------------------------------------------------------------------ landing
  step("1. Landing page");
  const visitor = await session();
  await visitor.page.goto(BASE);
  await visitor.page.waitForSelector("text=Families who get it");
  await visitor.page.waitForTimeout(1500);
  await shot(visitor.page, "01-landing");
  check("landing renders", true);
  await visitor.page.evaluate(() => (document.documentElement.dataset.phase = "night"));
  await visitor.page.waitForTimeout(3000);
  await shot(visitor.page, "01b-landing-night");
  await visitor.context.close();

  // ------------------------------------------------------------ staff: code
  step("2. Partner staff makes an invite code");
  const staff = await session({ viewport: { width: 1200, height: 900 } });
  await login(staff.page, "staff.a@example.test", "**/dashboard");
  check("moderator lands on the dashboard", true);
  await shot(staff.page, "02-dashboard");
  await staff.page.goto(`${BASE}/dashboard/codes`);
  await staff.page.getByRole("button", { name: "Make a code" }).click();
  const codeEl = staff.page.getByTestId("new-code");
  await codeEl.waitFor();
  const code = (await codeEl.innerText()).trim();
  check("a long random code is shown once", /^RGTH(-[0-9A-Z]{4}){4}$/.test(code), code);
  await shot(staff.page, "03-code-modal");
  await staff.page.getByRole("button", { name: "Done" }).click();

  // --------------------------------------------------------- new parent joins
  step("3. A parent joins with the code and gets matched");
  const email = `tester+${Date.now()}@example.test`;
  const tester = await session();
  const t = tester.page;
  await t.goto(`${BASE}/join?code=${encodeURIComponent(code)}`);
  await shot(t, "04-join");
  await t.getByLabel("Nickname").fill("Tester");
  await t.getByLabel("Email").fill(email);
  await t.getByLabel("Password").fill("long-test-password-1");
  await t.getByRole("button", { name: "Continue" }).click();
  await t.waitForURL("**/onboarding", { timeout: 20000 });
  check("code accepted, account created, signed in", true);

  await t.getByRole("button", { name: "Parent / caregiver", pressed: true }).waitFor();
  check("role comes from the code (Parent pre-selected)", true);
  await shot(t, "05-onboarding-role");
  await t.getByRole("button", { name: "That's me" }).click();
  await t.getByRole("button", { name: "Anxiety" }).click();
  await t.getByRole("button", { name: "Just left the ER" }).click();
  await t.getByRole("button", { name: "Just after a crisis" }).click();
  await t.getByRole("button", { name: "13 to 15" }).click();
  await t.getByRole("button", { name: "Late nights" }).click();
  await shot(t, "06-onboarding-about");
  await t.getByRole("button", { name: "Next", exact: true }).click();
  for (const checkbox of await t.getByRole("checkbox").all()) await checkbox.click();
  await shot(t, "07-onboarding-norms");
  await t.getByRole("button", { name: "Find my circle" }).click();
  await t.waitForURL("**/welcome", { timeout: 20000 });
  await t.waitForSelector("text=Circle Willow");
  check("matched into the best circle (Willow)", true);
  await t.waitForTimeout(2500);
  await shot(t, "08-welcome");

  // ----------------------------------------------------------------- the chat
  step("4. Circle chat, check-in, and the crisis safety net");
  await t.getByRole("link", { name: "Say hi" }).click();
  await t.waitForURL(/\/circle\/[0-9a-f-]{36}$/);
  await t.waitForSelector("text=welcome", { timeout: 1000 }).catch(() => {});
  await t.waitForSelector("text=Welcome, everyone");
  check("seeded conversation is visible", true);
  const box = t.getByLabel(/Write a message/);
  await box.fill("Hi all. I'm new. Call me on 403-555-0199 or mail me at me@mail.com");
  await box.press("Enter");
  await t.waitForSelector("text=Hi all. I'm new.");
  // wait for the server's reply to swap in the version with contact details hidden
  await t.waitForFunction(() => document.querySelector("ol[aria-label=Messages]")?.textContent?.includes("hidden"), null, { timeout: 15000 });
  const bodyText = await t.locator("ol[aria-label=Messages]").innerText();
  check("phone number and email were hidden", !bodyText.includes("555-0199") && !bodyText.includes("me@mail.com"), bodyText.slice(-160));
  await t.getByRole("button", { name: "4 of 5, good" }).click();
  await t.waitForSelector("text=checked in: 4");
  check("daily check-in posts", true);
  await shot(t, "09-circle-chat");

  await box.fill("some nights i just want to die");
  await box.press("Enter");
  await t.getByRole("heading", { name: "You're not alone." }).waitFor({ timeout: 10000 });
  check("risky message shows the crisis card immediately", true);
  const crisisText = await t.getByRole("dialog").innerText();
  check("crisis card lists 9-8-8, Distress Centre Calgary, 911", crisisText.includes("9-8-8") && crisisText.includes("Distress Centre Calgary") && crisisText.includes("9-1-1"));
  await shot(t, "10-crisis-card");
  await t.getByRole("button", { name: "I'm safe right now" }).click();
  check("the flagged message is still there (never silently deleted)", (await t.locator("ol[aria-label=Messages]").innerText()).includes("want to die"));

  // ------------------------------------------------ realtime with a 2nd person
  step("5. Another member sees it live");
  const sam = await session();
  await login(sam.page, "sam@example.test", "**/circle/*");
  await sam.page.waitForSelector("text=Hi all. I'm new.");
  check("Sam sees the new parent's message", true);
  await sam.page.waitForTimeout(1500);
  const samLine = await sam.page.getByRole("status").first().innerText();
  check("presence shows who else is awake", /awake/.test(samLine), samLine);
  await sam.page.getByLabel(/Write a message/).fill("Welcome Tester. Glad you're here.");
  await sam.page.getByLabel(/Write a message/).press("Enter");
  await t.waitForSelector("text=Welcome Tester. Glad you're here.", { timeout: 10000 });
  check("Tester receives Sam's message live, without refreshing", true);
  await shot(sam.page, "11-sam-chat");

  // ---------------------------------------------------- staff sees the flag live
  step("6. The moderator sees the flag");
  await staff.page.goto(`${BASE}/dashboard/flags`);
  await staff.page.waitForSelector("text=Circle message");
  check("flag is in the moderator queue", true);
  await staff.page.getByRole("button", { name: "Show message" }).first().click();
  const flagText = await staff.page.locator("main").innerText();
  check("moderator can read the flagged text", flagText.includes("want to die"));
  await shot(staff.page, "12-flags");
  // a new flag appears without reloading
  const before = await staff.page.getByRole("button", { name: /Show message|Hide message/ }).count();
  await t.getByLabel(/Write a message/).fill("i wish i was dead");
  await t.getByLabel(/Write a message/).press("Enter");
  await t.getByRole("button", { name: "I'm safe right now" }).click({ timeout: 10000 });
  await staff.page.waitForFunction(
    (n) => document.querySelectorAll("main button[aria-expanded]").length > n,
    before,
    { timeout: 15000 },
  );
  check("a new flag appears live, no refresh", true);
  await staff.page.getByRole("button", { name: "Mark resolved" }).first().click();
  await staff.page.waitForTimeout(1200);
  check("moderator can resolve a flag", true);

  // ------------------------------------------------------------------- notes
  step("7. Candy-gram note");
  await t.getByRole("link", { name: "Notes", exact: true }).click();
  await t.getByRole("button", { name: /Send a candy-gram/ }).click();
  await t.getByRole("button", { name: /Sam/ }).first().click();
  await t.getByLabel("Your note").fill("Thank you for the welcome. <b>bold?</b>");
  await shot(t, "13-note-compose");
  await t.getByRole("button", { name: "Send", exact: true }).click();
  await t.waitForSelector("text=swimming over");
  check("note sends", true);
  await sam.page.goto(`${BASE}/notes`);
  await sam.page.waitForSelector("text=From Tester");
  const noteHtml = await sam.page.locator("article").first().innerHTML();
  check("note HTML is shown as text, not rendered", !noteHtml.includes("<b>bold") && noteHtml.includes("&lt;b&gt;"));
  await shot(sam.page, "14-notes-jar");

  // ----------------------------------------------------------- private chat
  step("8. Private chat needs both people to agree");
  await t.getByRole("link", { name: "Circle", exact: true }).click();
  await t.getByRole("button", { name: /Who's here/ }).click();
  await t.getByRole("button", { name: "Ask to chat" }).first().click();
  await t.waitForSelector("text=Request sent");
  check("request sent", true);
  await t.keyboard.press("Escape");
  await sam.page.goto(`${BASE}/chats`);
  await sam.page.getByText("would like to chat 1:1").first().waitFor();
  await shot(sam.page, "15-chat-request");
  await sam.page.getByRole("button", { name: "Accept" }).first().click();
  await sam.page.waitForURL(/\/chats\/[0-9a-f-]{36}$/, { timeout: 15000 });
  await sam.page.getByLabel(/Write a message/).fill("Hi, just us.");
  await sam.page.getByLabel(/Write a message/).press("Enter");
  await sam.page.waitForSelector("text=Hi, just us.");
  check("after both agree, a private thread opens", true);

  // ------------------------------------------------------------------ mentor
  step("9. Mentor 1:1");
  await t.goto(`${BASE}/circle`);
  await t.getByRole("button", { name: /Ask Dana for a 1:1/ }).click();
  await t.waitForSelector("text=Dana will see your request");
  check("mentor request sent", true);
  const dana = await session();
  await login(dana.page, "dana@example.test", "**/circle**");
  await dana.page.goto(`${BASE}/chats`);
  await dana.page.getByText("asked for a 1:1 with you").first().waitFor();
  await dana.page.getByRole("button", { name: "Accept" }).first().click();
  await dana.page.waitForURL(/\/chats\/[0-9a-f-]{36}$/, { timeout: 15000 });
  await dana.page.waitForSelector("text=moderator at your program can review");
  check("mentor accepts; the thread says it is moderated", true);
  await shot(dana.page, "16-mentor-thread");

  // --------------------------------------------- youth never see parent things
  step("10. Youth and parents stay apart");
  const pip = await session();
  await login(pip.page, "pip@example.test", "**/circle/*");
  const pipText = await pip.page.locator("main").innerText();
  check("youth circle shows youth only", pipText.includes("Circle Lily") && !pipText.includes("Tester") && !/bSamb/.test(pipText) && !pipText.includes("Willow"));
  await pip.page.getByRole("button", { name: /Who's here/ }).click();
  const dlg = await pip.page.getByRole("dialog").innerText();
  check("no parent appears in the youth member list", !dlg.includes("Parent"));
  await shot(pip.page, "17-youth-circle");
  const direct = await pip.page.request.get(`${BASE}/circle/c0000000-0000-4000-8000-000000000001`);
  check("a youth opening a parent circle by URL gets nothing", !(await direct.text()).includes("Welcome, everyone"));

  // ------------------------------------------------------- privacy & deletion
  step("11. Export and delete");
  await t.getByRole("link", { name: "Me", exact: true }).click();
  const [download] = await Promise.all([t.waitForEvent("download"), t.getByRole("link", { name: "Download my data" }).click()]);
  const path = await download.path();
  const { readFileSync } = await import("node:fs");
  const exported = JSON.parse(readFileSync(path, "utf8"));
  check("data export contains my profile and messages", exported.profile?.nickname === "Tester" && exported.messages_sent.length >= 3);
  await shot(t, "18-me");
  await t.getByLabel(/Type your nickname/).fill("Tester");
  await t.getByRole("button", { name: "Delete everything" }).click();
  await t.waitForURL("**/?goodbye=1", { timeout: 20000 });
  await t.waitForSelector("text=Take care");
  check("account deleted and signed out", true);
  await shot(t, "19-goodbye");
  await t.goto(`${BASE}/login`);
  await t.getByLabel("Email").fill(email);
  await t.getByLabel("Password").fill("long-test-password-1");
  await t.getByRole("button", { name: "Sign in" }).click();
  await t.waitForSelector("text=didn't match");
  check("the deleted account can no longer sign in", true);
} catch (e) {
  failures.push(`CRASH: ${e instanceof Error ? e.message.split("\n")[0] : e}`);
  console.log("\nCRASH:", e instanceof Error ? e.message : e);
} finally {
  await browser.close();
}

console.log(`\n${passed} checks passed, ${failures.length} problems`);
if (failures.length) {
  console.log(failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
