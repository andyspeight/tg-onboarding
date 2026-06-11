import { revalidatePath } from "next/cache";
import {
  airtableConfig,
  countTeamUnread,
  fetchActiveKnowledge,
  getRecord,
  recordSignalAndTouch,
  sendMessage,
} from "@/lib/onboarding/airtable";
import { guardPost, jsonError } from "@/lib/api/guard";
import { resolveRouteClientId } from "@/lib/api/client-auth";
import { parseMessageFile } from "@/lib/api/message-file";
import { lunaAnswer } from "@/lib/luna";
import { send } from "@/lib/email";
import { newMessageEmail } from "@/lib/email/templates";

const MAX_BODY_CHARS = 2000;
// Base64 of a 3MB attachment is ~4.1MB; stays inside Vercel's body limit.
const MAX_REQUEST_BYTES = 4_400_000;
const CLIENTS_TABLE = "tblJshqEDEbezPemO";
const CLIENT_COMPANY_FIELD = "fldV3aAKMwGbKweMJ";
const CLIENT_CONTACT_FIELD = "fldPZiMqRPXgjI2Pi";

/**
 * The client sends a message. Luna answers instantly when the knowledge
 * base covers it; either way the team gets the thread, and the first
 * unanswered message triggers a staff email so nothing sits unseen.
 */
export async function POST(request: Request) {
  const guard = await guardPost(request, "messages", 20, MAX_REQUEST_BYTES);
  if (!guard.ok) return guard.response;

  const { body, attachment } = guard.body as {
    body?: unknown;
    attachment?: unknown;
  };
  const text = typeof body === "string" ? body.trim() : "";
  const file = parseMessageFile(attachment);
  if (file === null) return jsonError(400, "Invalid request");
  if (typeof body !== "string" || body.length > MAX_BODY_CHARS) {
    return jsonError(400, "Invalid request");
  }
  // A message needs words or a file.
  if (text.length === 0 && !file) return jsonError(400, "Invalid request");

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const clientId = await resolveRouteClientId(request, config);
    if (!clientId) return jsonError(401, "Sign in first");

    // Was the inbox clear before this message? Decides the staff email.
    const unreadBefore = await countTeamUnread(config, clientId);

    await sendMessage(config, clientId, "client", text, file);
    // A message IS engagement — it feeds Last Active and the wilting rules.
    await recordSignalAndTouch(config, clientId, "message-sent", "");

    // Luna takes first crack when there's an actual question to answer.
    let luna: string | null = null;
    if (text.length > 0) {
      try {
        const articles = await fetchActiveKnowledge(config);
        const reply = await lunaAnswer(text, articles);
        if (reply) {
          await sendMessage(config, clientId, "luna", reply.body);
          luna = reply.body;
          console.log(`[api/messages] luna answered via ${reply.via}`);
        }
      } catch (error) {
        // Luna failing must never block the client's message.
        console.error("[api/messages] luna step failed:", error);
      }
    }

    // First new message since staff last looked → one email, not a flood.
    const staffEmail = process.env.STAFF_ALERT_EMAIL;
    if (staffEmail && unreadBefore === 0) {
      try {
        const clientRecord = await getRecord(config, CLIENTS_TABLE, clientId);
        const company =
          (clientRecord?.fields[CLIENT_COMPANY_FIELD] as string) ?? "A client";
        const contact =
          (clientRecord?.fields[CLIENT_CONTACT_FIELD] as string) ?? "Your client";
        const appBase =
          process.env.APP_BASE_URL || "https://tg-onboarding-gamma.vercel.app";
        const preview =
          text.slice(0, 200) || `Sent a file: ${file?.name ?? "attachment"}`;
        const tpl = newMessageEmail(
          company,
          contact,
          preview,
          luna !== null,
          `${appBase}/admin/clients/${clientId}`,
        );
        await send({
          to: staffEmail,
          subject: tpl.subject,
          text: tpl.text,
          html: tpl.html,
        });
      } catch (error) {
        console.error("[api/messages] staff alert failed:", error);
      }
    }

    revalidatePath("/messages");
    return Response.json({ ok: true, luna });
  } catch (error) {
    console.error("[api/messages] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
