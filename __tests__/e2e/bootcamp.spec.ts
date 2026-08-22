import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { BOOTCAMP_PRICING, formatUsd } from "../../lib/bootcamp/pricing";
import { OFFER_WINDOW_DAYS } from "../../lib/bootcamp/enrolment";
import {
  BOOTCAMP_SLUG,
  BOOTCAMP_TITLE,
  COHORT_NAME,
  GATE_TITLES,
  HOURS_COMMITTED,
  MOTIVATION,
  SESSION_TITLE,
} from "./data";
import { readState } from "./state";

// ═══════════════════════════════════════════════════════════════════════════════
// The bootcamp lifecycle, end to end, against a real signed-in session.
//
// Every loader under /bootcamp and /desk/bootcamp had been type-checked and
// route-verified but never RUN with a session attached, so the thing this file
// is actually for is proving the server components execute and produce the right
// words — not that the routes answer 200. A `force-dynamic` page that throws in
// its loader still streams a 200 with an empty shell, which is exactly the
// failure a status-code assertion cannot see. Hence: every check below is on
// rendered content.
//
// Serial by construction — one applicant is walked through one lifecycle.
// ═══════════════════════════════════════════════════════════════════════════════

const state = readState();
const { fixture } = state;

const GLOBAL_PRICE = BOOTCAMP_PRICING.global.plans.full;
const PRICE_TEXT = formatUsd(GLOBAL_PRICE); // "$799"
const TRACK_AND_COHORT = `${BOOTCAMP_TITLE} · ${COHORT_NAME}`.toLowerCase();

let studentA: BrowserContext;
let studentB: BrowserContext;
let desk: BrowserContext;
let applicationId = "";
let studentBApplicationId = "";

async function contextFor(
  browser: Browser,
  cookies: { name: string; value: string }[],
  baseURL: string,
): Promise<BrowserContext> {
  const ctx = await browser.newContext();
  await ctx.addCookies(cookies.map((c) => ({ ...c, url: baseURL })));
  return ctx;
}

/**
 * Everything the user can actually SEE on the page, whitespace-normalised and
 * lower-cased.
 *
 * The wait is load-bearing, not politeness. Every bootcamp page is
 * `force-dynamic` and sits behind the root app/loading.tsx boundary, so React
 * ships the resolved server component inside a `hidden` div and an inline script
 * swaps it into place afterwards — measured at ~90ms after the load event on
 * this machine. Two consequences:
 *
 *   • `body.innerText` read at `load` returns just the skip link, so any
 *     assertion written against it is a coin toss.
 *   • `toContainText`/`toHaveText` do NOT check visibility, so they happily
 *     match the hidden copy and would pass even if the swap never happened.
 *
 * Waiting for the page's own <h1> to be VISIBLE pins both down: it cannot be
 * satisfied by the hidden copy, and once it is satisfied the whole boundary is
 * in the document.
 *
 * Lower-cased because innerText reflects CSS `text-transform`, and half the
 * labels on these pages are uppercased by a utility class. Casing is
 * presentation; it should not decide whether a content assertion passes.
 */
async function visibleText(page: Page): Promise<string> {
  await expect(page.locator("h1").first()).toBeVisible();
  return (await page.locator("body").innerText()).replace(/\s+/g, " ").toLowerCase();
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser, baseURL }) => {
  const url = baseURL!;
  studentA = await contextFor(browser, state.cookies.studentA, url);
  studentB = await contextFor(browser, state.cookies.studentB, url);
  desk = await contextFor(browser, state.cookies.admin, url);
});

test.afterAll(async () => {
  await Promise.all([studentA?.close(), studentB?.close(), desk?.close()]);
});

// ─── 0. the rig itself ───────────────────────────────────────────────────────

test("the minted session is a session the app accepts", async () => {
  const page = await studentA.newPage();
  const res = await page.goto("/dashboard");
  // Not /login — the proxy would have bounced an invalid cookie at the edge.
  expect(new URL(page.url()).pathname).toBe("/dashboard");
  expect(res?.status()).toBe(200);
  await expect(page.locator("body")).toContainText("E2E Student A");
  await page.close();
});

// ─── 1. the public catalogue ─────────────────────────────────────────────────

test("public /bootcamp renders the catalogue with real tracks and honest prices", async ({
  page,
}) => {
  const res = await page.goto("/bootcamp");
  expect(res?.status()).toBe(200);

  await expect(page.locator("h1")).toContainText(
    "A weekly hour with someone who has read your code.",
  );

  const text = await visibleText(page);
  // A real, seeded track — proof the catalogue query ran, not just the shell.
  expect(text).toContain("ai engineering bootcamp");
  // The fixture track, so we know the listing is live rather than cached.
  expect(text).toContain(BOOTCAMP_TITLE.toLowerCase());
  expect(text).toContain(PRICE_TEXT.toLowerCase());
  expect(text).toContain(formatUsd(BOOTCAMP_PRICING.global.list).toLowerCase());
});

test("a real track page renders its cohort facts and its gates", async ({ page }) => {
  const res = await page.goto("/bootcamp/ai-engineering");
  expect(res?.status()).toBe(200);

  await expect(page.locator("h1")).toContainText("AI Engineering Bootcamp");
  const text = await visibleText(page);
  expect(text).toContain("six months, live");
  expect(text).toContain("seats left");
  expect(text).toContain("of 50");
  // The six seeded gates for the real track (migration 024).
  expect(text).toContain("the 6 gates");
  expect(text).toContain("gate 1 · week 5");
});

test("the fixture track is joinable and links to the apply form", async ({ page }) => {
  await page.goto(`/bootcamp/${BOOTCAMP_SLUG}`);
  await expect(page.locator("h1")).toContainText(BOOTCAMP_TITLE);

  const text = await visibleText(page);
  expect(text).toContain("applications open");
  expect(text).toContain("50 of 50"); // nothing accepted yet
  expect(text).toContain(GATE_TITLES[0].toLowerCase());

  await expect(
    page.getByRole("link", { name: /Apply — 50 of 50 seats left/ }),
  ).toBeVisible();
});

// ─── 2. apply ────────────────────────────────────────────────────────────────

test("a signed-in student applies and lands on the application status page", async () => {
  const page = await studentA.newPage();
  await page.goto(`/bootcamp/${BOOTCAMP_SLUG}/apply`);

  await expect(page.locator("h1")).toContainText(BOOTCAMP_TITLE);
  // ST-01: the class hour must be shown before anything else.
  await expect(page.getByText("Step 1 — check you can actually be there")).toBeVisible();

  await page.getByRole("spinbutton").fill(String(HOURS_COMMITTED));
  await page.getByRole("textbox").fill(MOTIVATION);
  const boxes = page.locator('input[type="checkbox"]');
  await expect(boxes).toHaveCount(2); // local-time confirmation + recording consent
  await boxes.nth(0).check();
  await boxes.nth(1).check();

  await page.getByRole("button", { name: "Submit application" }).click();

  await page.waitForURL(/\/bootcamp\/application\/[0-9a-f-]{36}/, { timeout: 30_000 });
  applicationId = page.url().split("/").pop()!;

  await expect(page.locator("h1")).toContainText("Application received");
  const text = await visibleText(page);
  expect(text).toContain(TRACK_AND_COHORT);
  expect(text).toContain("take the placement assessment");
  expect(text).toContain(String(HOURS_COMMITTED));
  await page.close();
});

test("student B also applies, so the ownership check has something to defend", async () => {
  const page = await studentB.newPage();
  await page.goto(`/bootcamp/${BOOTCAMP_SLUG}/apply`);
  await page.getByRole("spinbutton").fill("10");
  const boxes = page.locator('input[type="checkbox"]');
  await boxes.nth(0).check();
  await boxes.nth(1).check();
  await page.getByRole("button", { name: "Submit application" }).click();
  await page.waitForURL(/\/bootcamp\/application\/[0-9a-f-]{36}/, { timeout: 30_000 });
  studentBApplicationId = page.url().split("/").pop()!;
  expect(studentBApplicationId).not.toBe(applicationId);
  await page.close();
});

// ─── 3. the desk decides ─────────────────────────────────────────────────────

test("the desk sees the application and accepts it", async () => {
  const page = await desk.newPage();
  const res = await page.goto("/desk/bootcamp");
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText("Bootcamp admissions");

  const section = page
    .locator("section")
    .filter({ hasText: `${BOOTCAMP_TITLE} · ${COHORT_NAME}` });
  await expect(section).toBeVisible();
  await expect(section).toContainText("E2E Student A");
  await expect(section).toContainText("e2e-student-a@e2e.square1ai.test");
  await expect(section).toContainText(MOTIVATION);
  await expect(section).toContainText("2 awaiting a decision");

  const card = page.locator("article").filter({ hasText: "e2e-student-a@e2e.square1ai.test" });
  await card.getByPlaceholder(/Reason/).fill("E2E automated acceptance");
  await card.getByRole("button", { name: "Accept" }).click();

  await expect(card).toContainText("Unpaid · offer expires in", { timeout: 30_000 });
  await expect(card).toContainText(`${OFFER_WINDOW_DAYS} day(s)`);
  await expect(page.locator("body")).toContainText("49 of 50 seats left");
  await page.close();
});

// ─── 4. pay state ────────────────────────────────────────────────────────────

test("the status page shows the pay state with the right amount and days left", async () => {
  const page = await studentA.newPage();
  await page.goto(`/bootcamp/application/${applicationId}`);

  await expect(page.locator("h1")).toContainText("You're in");
  const text = await visibleText(page);
  expect(text).toContain("next step — secure your seat");
  expect(text).toContain("tuition in full");
  expect(text).toContain(PRICE_TEXT.toLowerCase());
  expect(text).toContain(`${OFFER_WINDOW_DAYS} days left`);
  await expect(
    page.getByRole("button", { name: `Pay ${PRICE_TEXT} and confirm my seat` }),
  ).toBeVisible();
  await page.close();
});

// ─── 5. manual payment → enrolment ───────────────────────────────────────────

test("the desk records a manual payment and the student becomes enrolled", async () => {
  const page = await desk.newPage();
  await page.goto("/desk/bootcamp");

  const card = page.locator("article").filter({ hasText: "e2e-student-a@e2e.square1ai.test" });
  await card.getByRole("button", { name: "Record a payment" }).click();
  await card.getByPlaceholder(/Bank reference/).fill("E2E-REF-001");
  await card.getByRole("button", { name: "Record and enrol" }).click();

  await expect(card).toContainText("Enrolled · paid in full", { timeout: 30_000 });
  await expect(card).toContainText(`${PRICE_TEXT} received`);
  await page.close();

  // …and the student's own view agrees.
  const studentPage = await studentA.newPage();
  await studentPage.goto(`/bootcamp/application/${applicationId}`);
  const text = await visibleText(studentPage);
  expect(text).toContain("your seat is paid for and confirmed");
  expect(text).toContain("nothing further is owed");
  await studentPage.close();
});

// ─── 6. the cockpit ──────────────────────────────────────────────────────────

test("/bootcamp/home renders the live bar, week rail, gate rail and standing chip", async () => {
  const page = await studentA.newPage();
  const res = await page.goto("/bootcamp/home");
  expect(res?.status()).toBe(200);

  await expect(page.locator("h1")).toContainText(BOOTCAMP_TITLE);

  // Live bar — a real session row, with the honest "no link yet" copy because
  // no Zoom registrant exists.
  await expect(page.getByText(`Next: Live class — ${SESSION_TITLE}`)).toBeVisible();
  await expect(page.getByText("Your link will appear before the session")).toBeVisible();

  const text = await visibleText(page);
  expect(text).toContain(COHORT_NAME.toLowerCase());
  expect(text).toMatch(/starts .* — in \d+ days/);

  // Week rail: one <li> per programme week.
  const rail = page.locator(`ol[aria-label="Week 1 to ${fixture.weeks}"] li`);
  await expect(rail).toHaveCount(fixture.weeks);
  await expect(rail.first()).toHaveText("1");
  await expect(rail.last()).toHaveText(String(fixture.weeks));
  expect(text).toContain("tinted weeks are gate weeks");

  // Gate rail: one card per seeded gate, first one open, rest locked.
  for (const title of GATE_TITLES) expect(text).toContain(title.toLowerCase());
  await expect(page.getByText("Open now")).toHaveCount(1);
  await expect(page.getByText("Locked")).toHaveCount(GATE_TITLES.length - 1);

  // Standing chip — plain language, never a score.
  await expect(page.getByRole("link", { name: "On track" })).toBeVisible();
  expect(text).not.toMatch(/risk score/);

  // Squad + attendance panels, in their honest empty states.
  expect(text).toContain("you are not in a squad yet");
  expect(text).toContain("nothing recorded yet");
  await page.close();
});

test("/bootcamp/standing explains the three levels for this student", async () => {
  const page = await studentA.newPage();
  const res = await page.goto("/bootcamp/standing");
  expect(res?.status()).toBe(200);

  await expect(page.locator("h1")).toContainText("Where you stand");
  const text = await visibleText(page);
  expect(text).toContain(TRACK_AND_COHORT);
  expect(text).toContain("on track");
  expect(text).toContain("slipping");
  expect(text).toContain("needs attention");
  await page.close();
});

test("/bootcamp/contract restates what the student agreed to", async () => {
  const page = await studentA.newPage();
  const res = await page.goto("/bootcamp/contract");
  expect(res?.status()).toBe(200);

  await expect(page.locator("h1")).toContainText("Your learning contract");
  const text = await visibleText(page);
  expect(text).toContain("what you committed to");
  // The hours the applicant actually typed, not the bootcamp default.
  expect(text).toContain(String(HOURS_COMMITTED));
  expect(text).toContain(TRACK_AND_COHORT);
  await page.close();
});

test("a gate detail page renders for the student's own gate", async () => {
  const page = await studentA.newPage();
  const res = await page.goto(`/bootcamp/gates/${fixture.gateIds[0]}`);
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText(GATE_TITLES[0]);
  const text = await visibleText(page);
  // The thresholds are a withheld answer key and must never reach the page.
  expect(text).not.toContain("min_score");
  expect(text).not.toContain("75%");
  await page.close();
});

// ─── 7. the desk's other surfaces ────────────────────────────────────────────

test("the desk roster shows the newly enrolled student", async () => {
  const page = await desk.newPage();
  const res = await page.goto("/desk/bootcamp/roster");
  expect(res?.status()).toBe(200);

  await expect(page.locator("h1")).toContainText("Roster");
  const text = await visibleText(page);
  expect(text).toContain(TRACK_AND_COHORT);
  expect(text).toContain("e2e student a");
  expect(text).toContain("e2e-student-a@e2e.square1ai.test");
  // The honesty rule: no sessions have happened, so attendance is absent, not 0%.
  expect(text).toContain("no sessions yet");
  await page.close();
});

test("the reviewer queue renders", async () => {
  // Nothing has been submitted, so the queue is empty — but it must render its
  // empty state rather than blow up. This page joins bootcamp_enrollments to
  // bootcamp_cohorts, the join that PGRST201 silently emptied everywhere else.
  const page = await desk.newPage();
  const res = await page.goto("/desk/bootcamp/gates");
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toBeVisible();
  const text = await visibleText(page);
  expect(text).not.toContain("application error");
  await page.close();
});

test("cohort health renders every tile with no-data rather than zeroes", async () => {
  const page = await desk.newPage();
  const res = await page.goto("/desk/bootcamp/health");
  expect(res?.status()).toBe(200);

  await expect(page.locator("h1")).toContainText(/health/i);
  const text = await visibleText(page);
  expect(text).toContain(TRACK_AND_COHORT);
  expect(text).toContain("gate 1 first-attempt pass rate");
  expect(text).toContain("no gate 1 has been decided yet");
  await page.close();
});

// ─── 8. the negatives ────────────────────────────────────────────────────────

test("student A cannot open student B's application", async () => {
  const page = await studentA.newPage();
  await page.goto(`/bootcamp/application/${studentBApplicationId}`);

  // The not-found page, not the application.
  await expect(page.getByText("404 · Not found")).toBeVisible();

  // The RAW document, not the visible text: a leak inside the streamed RSC
  // payload is still a leak even if nothing paints it.
  const html = await page.content();
  expect(html).not.toContain("E2E Student B");
  expect(html).not.toContain("e2e-student-b@e2e.square1ai.test");
  // Nothing from the application status page may render at all.
  expect(html).not.toContain("Cohort starts");
  expect(html).not.toContain("Next step — secure your seat");
  await page.close();
});

// KNOWN DEFECT, deliberately recorded rather than hidden.
//
// notFound() on a `force-dynamic` page cannot set a status: the root
// app/loading.tsx boundary has already flushed the shell with a 200 by the time
// the component throws, so the body is the 404 page under an HTTP 200. It is not
// specific to this route or to the bootcamp — /courses/{unknown} and
// /newsroom/{unknown} behave identically — and it is the same mechanism the
// comment at the top of proxy.ts describes for the disabled-flag case, which is
// why THAT one is handled at the edge instead of in the page.
//
// Marked test.fail() so the suite stays honest in both directions: it does not
// go red for a defect nobody has fixed yet, and it goes red the moment somebody
// does, as the prompt to delete this block.
test("SOFT 404: an application belonging to someone else answers 200, not 404", async () => {
  test.fail();
  const page = await studentA.newPage();
  const res = await page.goto(`/bootcamp/application/${studentBApplicationId}`);
  expect(res?.status()).toBe(404);
  await page.close();
});

const DESK_PATHS = [
  "/desk/bootcamp",
  "/desk/bootcamp/roster",
  "/desk/bootcamp/health",
  "/desk/bootcamp/gates",
];

/** Strings that only ever appear once a desk page has actually rendered. */
const DESK_ONLY = [
  "Bootcamp admissions",
  "Cohort health",
  "Gate review queue",
  "awaiting a decision",
  "e2e-student-a@e2e.square1ai.test",
];

test("a non-admin session is turned away from every desk page, with nothing leaked", async () => {
  // The body first, straight off the wire: whatever the status code, a student
  // must never receive desk content. This is the assertion that matters.
  for (const path of DESK_PATHS) {
    const res = await studentA.request.get(path);
    const body = await res.text();
    for (const needle of DESK_ONLY) {
      expect(body, `${path} leaked "${needle}" to a non-admin`).not.toContain(needle);
    }
  }

  // …and then the browser outcome: the student ends up on /dashboard.
  const page = await studentA.newPage();
  for (const path of DESK_PATHS) {
    await page.goto(path);
    // redirect() from a force-dynamic page is delivered as a client-side hop
    // inside a 200, not a 307 — see the SOFT 404 note above — so the URL is not
    // final at `load` and has to be waited for.
    await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });
  }
  await page.close();
});

// KNOWN DEFECT, same mechanism as the soft 404 and equally pre-existing:
// /desk/newsroom behaves identically, so this is the app's redirect strategy
// rather than anything the bootcamp desk does. Recorded, not hidden.
test("SOFT REDIRECT: the desk answers 200 to a non-admin instead of 307", async () => {
  test.fail();
  const res = await studentA.request.get("/desk/bootcamp", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
});

test("the desk's write routes refuse a non-admin session", async () => {
  const api = studentA.request;
  const decide = await api.post("/api/bootcamp/decide", {
    data: { applicationId, decision: "accepted" },
  });
  expect(decide.status()).toBe(403);

  const enrol = await api.post("/api/bootcamp/enrol", {
    data: { applicationId: studentBApplicationId, provider: "manual" },
  });
  expect(enrol.status()).toBe(403);
});

test("signed-out hits on the signed-in bootcamp surfaces redirect to /login", async ({
  browser,
}) => {
  const anon = await browser.newContext();
  const page = await anon.newPage();
  for (const path of [
    "/bootcamp/home",
    "/bootcamp/standing",
    "/bootcamp/contract",
    `/bootcamp/gates/${fixture.gateIds[0]}`,
  ]) {
    const res = await page.goto(path);
    expect(new URL(page.url()).pathname, `${path} must bounce a signed-out visitor`).toBe(
      "/login",
    );
    expect(res?.status()).toBe(200); // the /login page itself
  }
  await anon.close();
});

test("a signed-out visitor cannot read an application", async ({ browser }) => {
  const anon = await browser.newContext();
  const page = await anon.newPage();
  await page.goto(`/bootcamp/application/${applicationId}`);
  expect(new URL(page.url()).pathname).toBe("/login");
  await anon.close();
});
