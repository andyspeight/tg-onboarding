import {
  airtableConfig,
  createClientWithJourney,
  type NewClientInput,
} from "@/lib/onboarding/airtable";
import { adminSessionFromRequest } from "@/lib/api/admin-auth";
import { guardPost, jsonError } from "@/lib/api/guard";
import { isContractType } from "@/lib/onboarding/contract-type";

const PLANS = ["Spark", "Boost", "Ignite"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= max ? trimmed : null;
}

/** Staff-only: create a client and stamp out their journey. */
export async function POST(request: Request) {
  const guard = await guardPost(request, "admin-clients", 10);
  if (!guard.ok) return guard.response;

  if (!adminSessionFromRequest(request)) {
    return jsonError(401, "Sign in first");
  }

  const body = guard.body as Record<string, unknown>;
  const company = cleanText(body.company, 100);
  const contactName = cleanText(body.contactName, 100);
  const contactEmail = cleanText(body.contactEmail, 150);
  const accountManager = cleanText(body.accountManager, 100) ?? "Andy Speight";
  const plan = body.plan;
  const startDate = body.startDate;
  // Legacy callers that predate contract type default to a full website.
  const contractType = body.contractType ?? "full";

  if (
    !company ||
    !contactName ||
    !contactEmail ||
    !EMAIL_PATTERN.test(contactEmail) ||
    typeof plan !== "string" ||
    !PLANS.includes(plan) ||
    typeof contractType !== "string" ||
    !isContractType(contractType) ||
    typeof startDate !== "string" ||
    !DATE_PATTERN.test(startDate) ||
    Number.isNaN(Date.parse(startDate))
  ) {
    return jsonError(400, "Invalid request");
  }

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const input: NewClientInput = {
      company,
      contactName,
      contactEmail,
      plan,
      contractType,
      accountManager,
      startDate,
    };
    const clientId = await createClientWithJourney(config, input);
    return Response.json({ ok: true, clientId });
  } catch (error) {
    console.error("[api/admin-clients] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
