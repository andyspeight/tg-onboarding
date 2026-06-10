import { runAutomation } from "@/lib/onboarding/airtable";

// Always run fresh; never cached.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily anti-wilting run: task reminders, milestone emails and staff
 * wilting alerts. Secured with CRON_SECRET per Vercel's convention —
 * Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`. Fails closed
 * when the secret is unset or wrong.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await runAutomation();
    if (!result) {
      return Response.json({ ok: false, reason: "not-configured" });
    }
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("[api/cron/automation] failed:", error);
    return new Response("Automation run failed", { status: 500 });
  }
}
