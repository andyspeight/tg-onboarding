import type {
  ClientDocument,
  ClientProfile,
  IntakeSection,
  JourneyPhase,
  NotificationKind,
  OnboardingJourney,
  OnboardingTask,
  PortalMessage,
  PortalNotification,
  TaskAudience,
  TaskOwner,
  TaskStatus,
  TrainingResource,
} from "./types";
import { INTAKE_SECTIONS } from "./mock-data";
import { daysUntil, shiftDays, ukToday } from "./dates";
import {
  deriveHealth,
  type AdminClientDetail,
  type AdminClientSummary,
  type AdminSnapshot,
  type AdminSupplier,
  type AdminTeamTask,
  type SupplierCategory,
  type TeamTaskUrgency,
} from "./health";
import { revalidateTag } from "next/cache";
import { TASK_TEMPLATE } from "./task-template";
import { send } from "../email";
import {
  milestoneEmail,
  reminderEmail,
  welcomeEmail,
  wiltingAlertEmail,
} from "../email/templates";

/**
 * Airtable layer for the TG Onboarding base (appOSIsT3wpkTmit9).
 *
 * SERVER-SIDE ONLY. This module is reached exclusively through `data.ts` and
 * the API routes — the PAT must never appear in any client bundle.
 * Credentials come from env (AIRTABLE_PAT, AIRTABLE_BASE_ID); when they're
 * absent or Airtable errors, read callers fall back to mock data so the
 * portal always renders, and write callers respond 503.
 *
 * Table and field IDs mirror `.claude/skills/airtable-operations/SKILL.md`
 * section 9. IDs, not names, so renames in Airtable can't break the portal.
 */

const API_URL = "https://api.airtable.com/v0";

const TABLES = {
  clients: "tblJshqEDEbezPemO",
  phases: "tbl3KczJTtCcBMiMY",
  suppliers: "tblzkvTGKU8dHbwz2",
  tasks: "tblrqtEreCM7lF03k",
  training: "tbleBDB9oqkGpxt1t",
  trainingCompletions: "tblPuZGHHSs9Au7JL",
  documents: "tblmnJ1x0av9sQw0N",
  notifications: "tblx5z4eV3YGWaEBq",
  intakeResponses: "tblUN366QbH6fugHP",
  confidenceRatings: "tbl1mfOO84zYhnpYR",
  engagementSignals: "tblUJTgxwcjzGvaRd",
  automationLog: "tbl6JmGMnuRvHbYuc",
  messages: "tblClvD9i8QPZJwVS",
  knowledgeBase: "tbl02IR9iQtRxAV28",
};

const MSG_F = {
  preview: "fldrHdHQd9ojanUBZ",
  client: "fldRxcp88EqjMHLD8",
  sender: "fld2XdCzogwngsNad",
  body: "fldmRrouQj3T5wu0o",
  sentAt: "fldQ7V2ZgXtdvp0qH",
  readByClient: "fldkXsna3wh6oY8AH",
  readByTeam: "fldM1xwnYiYce8ql2",
  attachments: "fldCPFM65ArYJMsDB",
};

const KB_F = {
  title: "fldZGLCJV2LXlBSpe",
  body: "fldCExTddFzwR6ijR",
  keywords: "fldGICA3THYD3Kahv",
  category: "fld6rQqkyObQ9xw44",
  active: "fld5wtLBsTHepOtWI",
};

type MessageSender = "team" | "client" | "luna";

function senderOf(record: AirtableRecord): MessageSender {
  const value = str(record, MSG_F.sender);
  return value === "Client" ? "client" : value === "Luna" ? "luna" : "team";
}

/** Airtable attachment cells → the shape both threads render. */
function messageAttachments(
  record: AirtableRecord,
): { url: string; filename: string; isImage: boolean }[] | undefined {
  const value = record.fields[MSG_F.attachments];
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const mapped = value.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const { url, filename, type } = item as {
      url?: unknown;
      filename?: unknown;
      type?: unknown;
    };
    if (typeof url !== "string" || url === "") return [];
    return [
      {
        url,
        filename: typeof filename === "string" ? filename : "Attachment",
        isImage: typeof type === "string" && type.startsWith("image/"),
      },
    ];
  });
  return mapped.length > 0 ? mapped : undefined;
}

const AUTOMATION_F = {
  summary: "fldfAexVOdJtehqT6",
  client: "fldvn9PIQqodIpJRS",
  event: "fld4xFULyVQRXPPP9",
  channel: "fldQ0Wp0HuCuPIxj7",
  recipient: "fldSqA6MUZIR6l64W",
  dedupeKey: "fldNhDi334loGDh9E",
  sentAt: "fld46yHYifyYYpQSg",
};

const CLIENT_F = {
  company: "fldV3aAKMwGbKweMJ",
  contactName: "fldPZiMqRPXgjI2Pi",
  email: "fldBzYYxIjn2ERqXN",
  package: "fldOf62P3opdqJ5Gx",
  started: "fldiMG1sZjsRxJuer",
  accountManager: "fld4D5xpWTRS7sMUb",
  lastActive: "fldUegCPTvsPnK5pG",
  codeHash: "fldWeUGMasJqrqla5",
  codeIssuedAt: "fldNqmk6H29F9KeB5",
  lastLoginAt: "fld3F5xoTxXJADpsr",
};

const PHASE_F = {
  title: "fldJyX52ytUEgAXJT",
  number: "fldFT9rDlGXzA8442",
  slug: "fld1ZvEe0zYjVkGLO",
  summary: "fldpMuN9n4w63QgCC",
  estimate: "fld5gyVsQjZcFSQBH",
  gateMin: "fldZ8sX5gNdrbcPLe",
  gatePrompt: "fldOtOnBM6jeqwAwx",
  gateHelp: "fldVLfUMiuvAkPBaj",
};

const TASK_F = {
  title: "fld19FvLTPM0anxAR",
  client: "fldEHOJvbSSxXELFJ",
  phase: "fldmOymKdOmuv4Emo",
  description: "fldXBJghkP2yZg8vA",
  audience: "fld69yi7AgXE4Z2qp",
  owner: "fldn32C8OALO65EqR",
  status: "fld0VjqmNbReueweZ",
  due: "fld2naX3VklPlUe6t",
  optional: "fldzxDMQptCkAgDff",
  order: "fldqdMOSlEYNIuohP",
};

const TRAINING_F = {
  title: "fldKIOlcRhoxihzup",
  phase: "fldI710IiEQZkRlSv",
  type: "fldTD6yLInq16BSx0",
  description: "fldpeIfps3RZMsbas",
  duration: "fld0xhlAC8rUXEWk3",
  url: "fld70gfp57xV8WBYw",
  order: "fld8UzTmkTmQVGNVK",
};

const COMPLETION_F = {
  label: "fldgmLJgNgpcdDHlt",
  client: "flds3wjXgGW3DHbU8",
  training: "fldYTglsiFSFO8u7M",
  completedAt: "fldkeu7S7Sg0UEMRH",
};

const DOC_F = {
  name: "fldpSycVlG2NNZQdG",
  client: "fldsbA11T61Yd87dL",
  category: "fld7lTn5nlUCPKCIs",
  fileType: "fldbU36Qz3ns4dW6H",
  status: "fldPclJz8ghYQhNjR",
  added: "fldUG8S5AlO7YhXLC",
  file: "fldTGYzEH3L5bUOZ9",
  sourceField: "fld1JeazEk7tRGwNK",
};

const NOTIF_F = {
  text: "fldVS2s856UGlX0qo",
  client: "fldSKG7ZIUIOTEiFe",
  kind: "fldPxVeVG953e5GBU",
  read: "fldzt104LVD9frRjZ",
  created: "fldhVXcH6IeyxfkwF",
};

const SUPPLIER_F = {
  name: "fldLSsHcN5ofcuT0l",
  category: "fldIOHIdyvcf4Lgh0",
  active: "fldzPuJyXXsoCylu8",
  description: "fldfMbRzmRjw1ELhn",
  features: "fldeQDdMPLxL7PSMo",
  contactEmail: "fldZb981na5QALuxE",
  contactPhone: "fldHKcrVlRL89LN9F",
  contactNotes: "flddSvIvCSGKsRPG2",
  link1Label: "fldxyeA1LQ6g5bVJ2",
  link1Url: "fldBHuSBLUusjDL5c",
  link2Label: "fldxgEvIbHm70srCL",
  link2Url: "fldHcmlP9R68r9ZUe",
  link3Label: "flddXjjm0SOdY0WXr",
  link3Url: "fldM18EpPBCINrBji",
};

/** The three (label, url) field-id pairs on the Suppliers table. */
const SUPPLIER_LINK_FIELDS: [string, string][] = [
  [SUPPLIER_F.link1Label, SUPPLIER_F.link1Url],
  [SUPPLIER_F.link2Label, SUPPLIER_F.link2Url],
  [SUPPLIER_F.link3Label, SUPPLIER_F.link3Url],
];

function supplierLinks(record: AirtableRecord): { label: string; url: string }[] {
  return SUPPLIER_LINK_FIELDS.flatMap(([labelField, urlField]) => {
    const url = str(record, urlField);
    if (!url) return [];
    return [{ label: str(record, labelField) || "Visit website", url }];
  });
}

const RESPONSE_F = {
  field: "fldEZjLopyUYE1RNg",
  client: "fldwFb8EDZWL0dLFs",
  value: "fldJcLBqUo1h9NLnl",
  updated: "fldNvFO4u1LCj5DXh",
};

const CONFIDENCE_F = {
  score: "fldVQVnDl3N9gKWvI",
  client: "fldyQlCaXeSebXLYL",
  ratedAt: "fldP0r0xkmpnqKHSS",
};

const SIGNAL_F = {
  signal: "fldg21Xnjh6Oe4oKQ",
  client: "flddwqkBckrZ7mQfW",
  detail: "fldeJqb0V3NuO1JDI",
  at: "fld8t9v2Y8VJZnTym",
};

interface AirtableRecord {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
}

/**
 * Until client auth lands, the portal is pinned to the OLDEST client record
 * (the seed client), so adding clients from the dashboard can never switch
 * whose journey the public portal shows.
 */
function oldestFirst(records: AirtableRecord[]): AirtableRecord[] {
  return [...records].sort((a, b) =>
    (a.createdTime ?? "").localeCompare(b.createdTime ?? ""),
  );
}

export interface AirtableConfig {
  pat: string;
  baseId: string;
}

/** Null when the integration isn't configured (e.g. local dev without env). */
export function airtableConfig(): AirtableConfig | null {
  const pat = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  return pat && baseId ? { pat, baseId } : null;
}

function str(record: AirtableRecord, fieldId: string): string {
  const value = record.fields[fieldId];
  return typeof value === "string" ? value : "";
}

function num(record: AirtableRecord, fieldId: string): number {
  const value = record.fields[fieldId];
  return typeof value === "number" ? value : 0;
}

function bool(record: AirtableRecord, fieldId: string): boolean {
  return record.fields[fieldId] === true;
}

function links(record: AirtableRecord, fieldId: string): string[] {
  const value = record.fields[fieldId];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function firstLink(record: AirtableRecord, fieldId: string): string {
  return links(record, fieldId)[0] ?? "";
}

/** Every cached Airtable read carries this tag; writes revalidate it. */
export const AIRTABLE_TAG = "airtable";

async function airtableFetch(
  config: AirtableConfig,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${API_URL}/${config.baseId}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.pat}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}

/**
 * Fetch every record from a table, following pagination.
 *
 * `cached` opts a read into the shared 60s data cache (tagged so write
 * routes can revalidate). The journey path uses it — the portal is
 * per-request since client auth, and this keeps Airtable traffic flat no
 * matter how many clients are browsing. Verification reads before writes
 * and the admin/cron paths stay fresh.
 */
async function listAll(
  config: AirtableConfig,
  tableId: string,
  cached = false,
): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ returnFieldsByFieldId: "true" });
    if (offset) params.set("offset", offset);

    const response = await airtableFetch(config, `${tableId}?${params}`, {
      ...(cached ? { next: { revalidate: 60, tags: [AIRTABLE_TAG] } } : {}),
    });
    if (!response.ok) {
      throw new Error(`Airtable ${tableId} responded ${response.status}`);
    }

    const page = (await response.json()) as {
      records: AirtableRecord[];
      offset?: string;
    };
    records.push(...page.records);
    offset = page.offset;
  } while (offset);

  return records;
}

/** Fetch one record by id; null when it doesn't exist. */
export async function getRecord(
  config: AirtableConfig,
  tableId: string,
  recordId: string,
): Promise<AirtableRecord | null> {
  const response = await airtableFetch(
    config,
    `${tableId}/${recordId}?returnFieldsByFieldId=true`,
  );
  if (response.status === 404 || response.status === 403) return null;
  if (!response.ok) {
    throw new Error(`Airtable ${tableId} responded ${response.status}`);
  }
  return (await response.json()) as AirtableRecord;
}

/**
 * Every write marks the shared 60s read cache stale (stale-while-
 * revalidate), so the next portal render picks up fresh data instead of
 * waiting out the timer. Safe no-op outside a request context (cron).
 */
function bustReadCache(): void {
  try {
    revalidateTag(AIRTABLE_TAG, "max");
  } catch {
    // Outside a revalidation-capable context — the 60s timer covers it.
  }
}

async function updateRecord(
  config: AirtableConfig,
  tableId: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const response = await airtableFetch(config, `${tableId}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!response.ok) {
    throw new Error(`Airtable update ${tableId} responded ${response.status}`);
  }
  bustReadCache();
}

async function createRecords(
  config: AirtableConfig,
  tableId: string,
  records: Record<string, unknown>[],
): Promise<void> {
  const response = await airtableFetch(config, tableId, {
    method: "POST",
    body: JSON.stringify({
      records: records.map((fields) => ({ fields })),
      typecast: true,
    }),
  });
  if (!response.ok) {
    throw new Error(`Airtable create ${tableId} responded ${response.status}`);
  }
  bustReadCache();
}

async function updateRecords(
  config: AirtableConfig,
  tableId: string,
  records: { id: string; fields: Record<string, unknown> }[],
): Promise<void> {
  const response = await airtableFetch(config, tableId, {
    method: "PATCH",
    body: JSON.stringify({ records, typecast: true }),
  });
  if (!response.ok) {
    throw new Error(`Airtable update ${tableId} responded ${response.status}`);
  }
  bustReadCache();
}

async function deleteRecord(
  config: AirtableConfig,
  tableId: string,
  recordId: string,
): Promise<void> {
  const response = await airtableFetch(config, `${tableId}/${recordId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Airtable delete ${tableId} responded ${response.status}`);
  }
  bustReadCache();
}

function asOwner(value: string): TaskOwner {
  return value === "client" || value === "both" ? value : "travelgenix";
}

function asStatus(value: string): TaskStatus {
  return value === "done" || value === "in-progress" ? value : "todo";
}

function asAudience(value: string): TaskAudience {
  return value === "internal" ? "internal" : "client";
}

function asKind(value: string): NotificationKind {
  const kinds: NotificationKind[] = [
    "progress",
    "reminder",
    "complete",
    "message",
    "welcome",
  ];
  return kinds.includes(value as NotificationKind)
    ? (value as NotificationKind)
    : "progress";
}

/** "2h ago" style label, computed server-side against the render time. */
function relativeLabel(createdIso: string, nowMs: number): string {
  const minutes = Math.floor((nowMs - Date.parse(createdIso)) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Phase status is derived, not stored: a phase is complete when every
 * client-facing, non-optional task is done; the first incomplete phase is
 * active; everything after is upcoming.
 */
function deriveStatuses(
  phases: Omit<JourneyPhase, "status">[],
): JourneyPhase[] {
  let activeAssigned = false;
  return phases.map((phase) => {
    const countable = phase.tasks.filter(
      (task) => task.audience === "client" && !task.optional,
    );
    const complete =
      countable.length > 0 && countable.every((task) => task.status === "done");
    if (complete) return { ...phase, status: "completed" as const };
    if (!activeAssigned) {
      activeAssigned = true;
      return { ...phase, status: "active" as const };
    }
    return { ...phase, status: "upcoming" as const };
  });
}

/** Swap the static supplier options for the live, curated Suppliers table. */
function intakeWithLiveSuppliers(
  suppliers: AirtableRecord[],
): IntakeSection[] {
  const active = suppliers.filter((record) => bool(record, SUPPLIER_F.active));
  const names = (category: string) =>
    active
      .filter((record) => str(record, SUPPLIER_F.category) === category)
      .map((record) => str(record, SUPPLIER_F.name))
      .sort((a, b) => a.localeCompare(b));

  const byField: Record<string, string[]> = {
    "suppliers-package": names("Package holidays"),
    "suppliers-accommodation": names("Accommodation"),
    "suppliers-flights": names("Flights"),
  };

  return INTAKE_SECTIONS.map((section) => ({
    ...section,
    fields: section.fields.map((field) =>
      byField[field.id] ? { ...field, options: byField[field.id] } : field,
    ),
  }));
}

/**
 * Read one client's journey from Airtable. Returns null when the
 * integration isn't configured, the client doesn't exist, or the read
 * fails — callers fall back to mock data and the portal keeps rendering.
 *
 * Every per-client table is filtered by the client link here; global
 * tables (phases, training, suppliers) pass through. Reads are cached 60s
 * and shared across clients — filtering happens in code, not per-request
 * Airtable queries.
 */
export async function fetchJourneyFromAirtable(
  clientId: string,
): Promise<OnboardingJourney | null> {
  const config = airtableConfig();
  if (!config) return null;

  try {
    // Three waves to stay inside Airtable's 5 requests/second per base.
    const [clients, phaseRecords, allTaskRecords, trainingRecords] =
      await Promise.all([
        listAll(config, TABLES.clients, true),
        listAll(config, TABLES.phases, true),
        listAll(config, TABLES.tasks, true),
        listAll(config, TABLES.training, true),
      ]);
    const [allDocumentRecords, allNotificationRecords, supplierRecords] =
      await Promise.all([
        listAll(config, TABLES.documents, true),
        listAll(config, TABLES.notifications, true),
        listAll(config, TABLES.suppliers, true),
      ]);
    const [allCompletionRecords, allResponseRecords, allConfidenceRecords, messageRecords] =
      await Promise.all([
        listAll(config, TABLES.trainingCompletions, true),
        listAll(config, TABLES.intakeResponses, true),
        listAll(config, TABLES.confidenceRatings, true),
        listAll(config, TABLES.messages, true),
      ]);

    const clientRecord = clients.find((record) => record.id === clientId);
    if (!clientRecord) return null;

    const mine = (records: AirtableRecord[], clientField: string) =>
      records.filter((record) =>
        links(record, clientField).includes(clientId),
      );
    const taskRecords = mine(allTaskRecords, TASK_F.client);
    const documentRecords = mine(allDocumentRecords, DOC_F.client);
    const notificationRecords = mine(allNotificationRecords, NOTIF_F.client);
    const completionRecords = mine(allCompletionRecords, COMPLETION_F.client);
    const responseRecords = mine(allResponseRecords, RESPONSE_F.client);
    const confidenceRecords = mine(allConfidenceRecords, CONFIDENCE_F.client);

    const client: ClientProfile = {
      company: str(clientRecord, CLIENT_F.company),
      contactName: str(clientRecord, CLIENT_F.contactName),
      plan: str(clientRecord, CLIENT_F.package) || undefined,
      onboardingStartedAt: str(clientRecord, CLIENT_F.started) || undefined,
      accountManager: str(clientRecord, CLIENT_F.accountManager) || undefined,
    };

    const tasksByPhase = new Map<string, OnboardingTask[]>();
    for (const record of [...taskRecords].sort(
      (a, b) => num(a, TASK_F.order) - num(b, TASK_F.order),
    )) {
      const phaseId = firstLink(record, TASK_F.phase);
      if (!phaseId) continue;
      const task: OnboardingTask = {
        id: record.id,
        title: str(record, TASK_F.title),
        description: str(record, TASK_F.description) || undefined,
        audience: asAudience(str(record, TASK_F.audience)),
        owner: asOwner(str(record, TASK_F.owner)),
        status: asStatus(str(record, TASK_F.status)),
        dueDate: str(record, TASK_F.due) || undefined,
        optional: bool(record, TASK_F.optional) || undefined,
      };
      tasksByPhase.set(phaseId, [...(tasksByPhase.get(phaseId) ?? []), task]);
    }

    const trainingByPhase = new Map<string, TrainingResource[]>();
    for (const record of [...trainingRecords].sort(
      (a, b) => num(a, TRAINING_F.order) - num(b, TRAINING_F.order),
    )) {
      const phaseId = firstLink(record, TRAINING_F.phase);
      if (!phaseId) continue;
      const item: TrainingResource = {
        id: record.id,
        type: str(record, TRAINING_F.type) === "article" ? "article" : "video",
        title: str(record, TRAINING_F.title),
        description: str(record, TRAINING_F.description) || undefined,
        durationLabel: str(record, TRAINING_F.duration) || undefined,
        url: str(record, TRAINING_F.url) || undefined,
      };
      trainingByPhase.set(phaseId, [
        ...(trainingByPhase.get(phaseId) ?? []),
        item,
      ]);
    }

    const phases = deriveStatuses(
      [...phaseRecords]
        .sort((a, b) => num(a, PHASE_F.number) - num(b, PHASE_F.number))
        .map((record) => {
          const gateMin = num(record, PHASE_F.gateMin);
          return {
            id: record.id,
            number: num(record, PHASE_F.number),
            slug: str(record, PHASE_F.slug),
            title: str(record, PHASE_F.title),
            summary: str(record, PHASE_F.summary),
            estimateLabel: str(record, PHASE_F.estimate) || undefined,
            tasks: tasksByPhase.get(record.id) ?? [],
            training: trainingByPhase.get(record.id) ?? [],
            gate:
              gateMin > 0
                ? {
                    minRating: gateMin,
                    prompt: str(record, PHASE_F.gatePrompt),
                    helpText: str(record, PHASE_F.gateHelp) || undefined,
                  }
                : undefined,
          };
        }),
    );

    const documents: ClientDocument[] = documentRecords.map((record) => ({
      id: record.id,
      name: str(record, DOC_F.name),
      category: str(record, DOC_F.category),
      fileType: str(record, DOC_F.fileType),
      addedAt: str(record, DOC_F.added),
      status:
        str(record, DOC_F.status) === "signed"
          ? "signed"
          : str(record, DOC_F.status) === "pending"
            ? "pending"
            : "available",
    }));

    // Uploads tagged with the intake field they came from, so the form can
    // show the client what they've already sent rather than looking empty.
    const intakeUploads: Record<string, { id: string; name: string; fileType: string }[]> = {};
    for (const record of documentRecords) {
      const fieldId = str(record, DOC_F.sourceField);
      if (!fieldId) continue;
      (intakeUploads[fieldId] ??= []).push({
        id: record.id,
        name: str(record, DOC_F.name),
        fileType: str(record, DOC_F.fileType),
      });
    }

    const nowMs = Date.now();
    const notifications: PortalNotification[] = [...notificationRecords]
      .sort(
        (a, b) =>
          Date.parse(str(b, NOTIF_F.created)) -
          Date.parse(str(a, NOTIF_F.created)),
      )
      .map((record) => ({
        id: record.id,
        kind: asKind(str(record, NOTIF_F.kind)),
        text: str(record, NOTIF_F.text),
        whenLabel: relativeLabel(str(record, NOTIF_F.created), nowMs),
        read: bool(record, NOTIF_F.read),
      }));

    const intakeResponses: Record<string, string> = {};
    for (const record of responseRecords) {
      const fieldId = str(record, RESPONSE_F.field);
      if (fieldId) intakeResponses[fieldId] = str(record, RESPONSE_F.value);
    }

    const trainingCompleted = completionRecords
      .map((record) => firstLink(record, COMPLETION_F.training))
      .filter(Boolean);

    const latestConfidence = [...confidenceRecords].sort(
      (a, b) =>
        Date.parse(str(b, CONFIDENCE_F.ratedAt)) -
        Date.parse(str(a, CONFIDENCE_F.ratedAt)),
    )[0];

    const myMessages = messageRecords
      .filter((record) => links(record, MSG_F.client).includes(clientRecord.id))
      .sort(
        (a, b) =>
          Date.parse(str(a, MSG_F.sentAt)) - Date.parse(str(b, MSG_F.sentAt)),
      );
    const messages: PortalMessage[] = myMessages.map((record) => ({
      id: record.id,
      from: senderOf(record),
      body: str(record, MSG_F.body),
      whenLabel: relativeLabel(str(record, MSG_F.sentAt), nowMs),
      attachments: messageAttachments(record),
    }));
    const unreadMessages = myMessages.filter(
      (record) =>
        str(record, MSG_F.sender) === "Team" &&
        !bool(record, MSG_F.readByClient),
    ).length;

    return {
      source: "airtable",
      asOf: ukToday(),
      client,
      phases,
      notifications,
      intake: intakeWithLiveSuppliers(supplierRecords),
      documents,
      suppliers: supplierRecords
        .filter((record) => bool(record, SUPPLIER_F.active))
        .map((record) => ({
          id: record.id,
          name: str(record, SUPPLIER_F.name),
          category: str(record, SUPPLIER_F.category),
          description: str(record, SUPPLIER_F.description) || undefined,
          features: str(record, SUPPLIER_F.features)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          links: supplierLinks(record),
          contactEmail: str(record, SUPPLIER_F.contactEmail) || undefined,
          contactPhone: str(record, SUPPLIER_F.contactPhone) || undefined,
          contactNotes: str(record, SUPPLIER_F.contactNotes) || undefined,
        }))
        .sort(
          (a, b) =>
            a.category.localeCompare(b.category) ||
            a.name.localeCompare(b.name),
        ),
      messages,
      unreadMessages,
      intakeResponses,
      intakeUploads,
      trainingCompleted,
      confidence: latestConfidence
        ? num(latestConfidence, CONFIDENCE_F.score)
        : null,
    };
  } catch (error) {
    // Server log only; the caller serves mock data so the portal stays up.
    console.error("[onboarding/airtable] read failed, serving mock data:", error);
    return null;
  }
}

/* ------------------------------------------------------------------------ */
/* Writes — used only by the validated API routes.                          */
/* ------------------------------------------------------------------------ */

/**
 * Compat lookup while CLIENT_AUTH_SECRET is unset: the portal stays pinned
 * to the OLDEST client record (the seed client). Once the secret is set,
 * sessions replace this everywhere.
 */
export async function getPortalClientId(
  config: AirtableConfig,
): Promise<string | null> {
  const clients = await listAll(config, TABLES.clients);
  return oldestFirst(clients)[0]?.id ?? null;
}

/** Login lookup: case-insensitive email match. Fresh read, never cached. */
export async function findClientByEmail(
  config: AirtableConfig,
  email: string,
): Promise<{ id: string; codeHash: string } | null> {
  const needle = email.trim().toLowerCase();
  if (!needle) return null;
  const clients = await listAll(config, TABLES.clients);
  const match = clients.find(
    (record) => str(record, CLIENT_F.email).trim().toLowerCase() === needle,
  );
  return match
    ? { id: match.id, codeHash: str(match, CLIENT_F.codeHash) }
    : null;
}

/** Store a freshly issued access code hash (replaces any previous code). */
export async function storeAccessCodeHash(
  config: AirtableConfig,
  clientId: string,
  hash: string,
): Promise<void> {
  await updateRecord(config, TABLES.clients, clientId, {
    [CLIENT_F.codeHash]: hash,
    [CLIENT_F.codeIssuedAt]: new Date().toISOString(),
  });
}

/** Stamp a successful login. */
export async function markClientLogin(
  config: AirtableConfig,
  clientId: string,
): Promise<void> {
  await updateRecord(config, TABLES.clients, clientId, {
    [CLIENT_F.lastLoginAt]: new Date().toISOString(),
  });
}

/** Append an engagement signal and bump the client's Last Active. */
export async function recordSignalAndTouch(
  config: AirtableConfig,
  clientId: string,
  signal: string,
  detail: string,
): Promise<void> {
  const now = new Date().toISOString();
  try {
    await createRecords(config, TABLES.engagementSignals, [
      {
        [SIGNAL_F.signal]: signal,
        [SIGNAL_F.client]: [clientId],
        [SIGNAL_F.detail]: detail.slice(0, 200),
        [SIGNAL_F.at]: now,
      },
    ]);
    await updateRecord(config, TABLES.clients, clientId, {
      [CLIENT_F.lastActive]: now,
    });
  } catch (error) {
    // Signals are telemetry: never fail the user's action over them.
    console.error("[onboarding/airtable] signal write failed:", error);
  }
}

/**
 * Set a task's status — only if the task belongs to the portal client, is
 * client-facing and isn't Travelgenix-owned. Returns false when the task
 * fails those checks.
 */
export async function setTaskStatus(
  config: AirtableConfig,
  clientId: string,
  taskId: string,
  status: TaskStatus,
): Promise<boolean> {
  const task = await getRecord(config, TABLES.tasks, taskId);
  if (
    !task ||
    !links(task, TASK_F.client).includes(clientId) ||
    asAudience(str(task, TASK_F.audience)) !== "client" ||
    asOwner(str(task, TASK_F.owner)) === "travelgenix"
  ) {
    return false;
  }
  await updateRecord(config, TABLES.tasks, taskId, {
    [TASK_F.status]: status,
  });
  return true;
}

/** Upsert one intake section's answers as one row per field. */
export async function saveIntakeResponses(
  config: AirtableConfig,
  clientId: string,
  values: Record<string, string>,
): Promise<void> {
  const existing = await listAll(config, TABLES.intakeResponses);
  const byField = new Map(
    existing
      .filter((record) => links(record, RESPONSE_F.client).includes(clientId))
      .map((record) => [str(record, RESPONSE_F.field), record.id]),
  );

  const now = new Date().toISOString();
  const updates: { id: string; fields: Record<string, unknown> }[] = [];
  const creates: Record<string, unknown>[] = [];

  for (const [fieldId, value] of Object.entries(values)) {
    const recordId = byField.get(fieldId);
    if (recordId) {
      updates.push({
        id: recordId,
        fields: { [RESPONSE_F.value]: value, [RESPONSE_F.updated]: now },
      });
    } else {
      creates.push({
        [RESPONSE_F.field]: fieldId,
        [RESPONSE_F.client]: [clientId],
        [RESPONSE_F.value]: value,
        [RESPONSE_F.updated]: now,
      });
    }
  }

  if (updates.length > 0) {
    await updateRecords(config, TABLES.intakeResponses, updates);
  }
  if (creates.length > 0) {
    await createRecords(config, TABLES.intakeResponses, creates);
  }
}

/** Record a confidence self-rating (every rating is kept). */
export async function saveConfidenceRating(
  config: AirtableConfig,
  clientId: string,
  score: number,
): Promise<void> {
  await createRecords(config, TABLES.confidenceRatings, [
    {
      [CONFIDENCE_F.score]: score,
      [CONFIDENCE_F.client]: [clientId],
      [CONFIDENCE_F.ratedAt]: new Date().toISOString(),
    },
  ]);
}

/**
 * Toggle a training completion. Returns false when the training item
 * doesn't exist.
 */
export async function setTrainingCompletion(
  config: AirtableConfig,
  clientId: string,
  trainingId: string,
  done: boolean,
): Promise<boolean> {
  const training = await getRecord(config, TABLES.training, trainingId);
  if (!training) return false;

  const completions = await listAll(config, TABLES.trainingCompletions);
  const mine = completions.filter(
    (record) =>
      links(record, COMPLETION_F.client).includes(clientId) &&
      links(record, COMPLETION_F.training).includes(trainingId),
  );

  if (done && mine.length === 0) {
    await createRecords(config, TABLES.trainingCompletions, [
      {
        [COMPLETION_F.label]: str(training, TRAINING_F.title).slice(0, 100),
        [COMPLETION_F.client]: [clientId],
        [COMPLETION_F.training]: [trainingId],
        [COMPLETION_F.completedAt]: new Date().toISOString(),
      },
    ]);
  }
  if (!done) {
    for (const record of mine) {
      await deleteRecord(config, TABLES.trainingCompletions, record.id);
    }
  }
  return true;
}

/** Client → team messages the team hasn't read yet. */
function countUnreadFromClient(
  messageRecords: AirtableRecord[],
  clientId: string,
): number {
  return messageRecords.filter(
    (record) =>
      links(record, MSG_F.client).includes(clientId) &&
      str(record, MSG_F.sender) === "Client" &&
      !bool(record, MSG_F.readByTeam),
  ).length;
}

/** One client's derived health summary — shared by snapshot and detail. */
function summariseClient(
  clientRecord: AirtableRecord,
  allTasks: AirtableRecord[],
  phasesSorted: AirtableRecord[],
  responseRecords: AirtableRecord[],
  messageRecords: AirtableRecord[],
  today: string,
  nowMs: number,
): AdminClientSummary {
  const clientId = clientRecord.id;
  const plan = str(clientRecord, CLIENT_F.package) || undefined;
  const tasks = allTasks.filter((record) =>
    links(record, TASK_F.client).includes(clientId),
  );

  const countable = tasks.filter(
    (record) =>
      asAudience(str(record, TASK_F.audience)) === "client" &&
      !bool(record, TASK_F.optional),
  );
  const doneCount = countable.filter(
    (record) => asStatus(str(record, TASK_F.status)) === "done",
  ).length;
  const pct =
    countable.length === 0 ? 0 : Math.round((doneCount / countable.length) * 100);

  // Overdue = tasks the CLIENT owes that have slipped.
  const overdueCount = tasks.filter((record) => {
    const due = str(record, TASK_F.due);
    return (
      asAudience(str(record, TASK_F.audience)) === "client" &&
      asOwner(str(record, TASK_F.owner)) !== "travelgenix" &&
      asStatus(str(record, TASK_F.status)) !== "done" &&
      due !== "" &&
      daysUntil(due, today) < 0
    );
  }).length;

  // First phase whose countable tasks aren't all done = where they are.
  const currentPhase = phasesSorted.find((phase) => {
    const phaseCountable = countable.filter((record) =>
      links(record, TASK_F.phase).includes(phase.id),
    );
    return (
      phaseCountable.length > 0 &&
      phaseCountable.some(
        (record) => asStatus(str(record, TASK_F.status)) !== "done",
      )
    );
  });

  const startedAt = str(clientRecord, CLIENT_F.started);
  const dayCount = startedAt ? Math.max(0, -daysUntil(startedAt, today)) : 0;

  const lastActive = str(clientRecord, CLIENT_F.lastActive) || startedAt;
  const daysQuiet = lastActive
    ? Math.max(0, Math.floor((nowMs - Date.parse(lastActive)) / 86_400_000))
    : 0;

  // Intake completion against the sections this client's tier sees.
  const tierFields = INTAKE_SECTIONS.filter(
    (section) =>
      !section.showForPlans ||
      (plan !== undefined && section.showForPlans.includes(plan)),
  )
    .flatMap((section) => section.fields)
    .filter((field) => field.type !== "upload");
  const answeredIds = new Set(
    responseRecords
      .filter(
        (record) =>
          links(record, RESPONSE_F.client).includes(clientId) &&
          str(record, RESPONSE_F.value) !== "",
      )
      .map((record) => str(record, RESPONSE_F.field)),
  );
  const answered = tierFields.filter((field) => answeredIds.has(field.id)).length;
  const intakePct =
    tierFields.length === 0 ? 0 : Math.round((answered / tierFields.length) * 100);

  const { health, reasons } = deriveHealth({
    daysQuiet,
    overdueCount,
    dayCount,
    pct,
  });

  return {
    id: clientId,
    company: str(clientRecord, CLIENT_F.company),
    contactName: str(clientRecord, CLIENT_F.contactName),
    plan,
    pct,
    phaseTitle: currentPhase ? str(currentPhase, PHASE_F.title) : "Complete",
    dayCount,
    daysQuiet,
    overdueCount,
    intakePct,
    unreadMessages: countUnreadFromClient(messageRecords, clientId),
    health,
    reasons,
  };
}

/**
 * Everything the admin dashboard needs in one read: every client with
 * derived health, plus the open team tasks. Null when Airtable isn't
 * configured — the dashboard shows a connect message instead.
 */
export async function fetchAdminSnapshot(): Promise<AdminSnapshot | null> {
  const config = airtableConfig();
  if (!config) return null;

  try {
    const [clients, phaseRecords, taskRecords, responseRecords, messageRecords] =
      await Promise.all([
        listAll(config, TABLES.clients),
        listAll(config, TABLES.phases),
        listAll(config, TABLES.tasks),
        listAll(config, TABLES.intakeResponses),
        listAll(config, TABLES.messages),
      ]);

    const today = ukToday();
    const nowMs = Date.now();
    const phasesSorted = [...phaseRecords].sort(
      (a, b) => num(a, PHASE_F.number) - num(b, PHASE_F.number),
    );

    const summaries: AdminClientSummary[] = clients.map((clientRecord) =>
      summariseClient(
        clientRecord,
        taskRecords,
        phasesSorted,
        responseRecords,
        messageRecords,
        today,
        nowMs,
      ),
    );

    const healthRank = { red: 0, amber: 1, green: 2 };
    summaries.sort(
      (a, b) =>
        healthRank[a.health] - healthRank[b.health] ||
        b.daysQuiet - a.daysQuiet,
    );

    const companyById = new Map(
      clients.map((record) => [record.id, str(record, CLIENT_F.company)]),
    );
    const teamTasks: AdminTeamTask[] = taskRecords
      .filter(
        (record) =>
          asStatus(str(record, TASK_F.status)) !== "done" &&
          (asAudience(str(record, TASK_F.audience)) === "internal" ||
            asOwner(str(record, TASK_F.owner)) === "travelgenix"),
      )
      .map((record) => {
        const due = str(record, TASK_F.due);
        let urgency: TeamTaskUrgency = "upcoming";
        if (due !== "") {
          const diff = daysUntil(due, today);
          urgency = diff < 0 ? "overdue" : diff <= 2 ? "urgent" : "upcoming";
        }
        return {
          id: record.id,
          title: str(record, TASK_F.title),
          clientCompany:
            companyById.get(firstLink(record, TASK_F.client)) ?? "",
          dueDate: due || undefined,
          urgency,
        };
      })
      .sort((a, b) =>
        (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31"),
      );

    return { clients: summaries, teamTasks };
  } catch (error) {
    console.error("[onboarding/airtable] admin snapshot failed:", error);
    return null;
  }
}

const CONTENT_URL = "https://content.airtable.com/v0";

/**
 * Store a client upload: create the Documents row, then attach the file via
 * Airtable's content endpoint. If attaching fails the row is removed again
 * so the hub never shows a received document with no file behind it.
 */
export async function createClientDocumentWithFile(
  config: AirtableConfig,
  clientId: string,
  file: {
    name: string;
    fileType: string;
    contentType: string;
    base64: string;
    /** Intake field this upload belongs to, if any (e.g. "brand-logos"). */
    sourceField?: string;
  },
): Promise<void> {
  const createResponse = await airtableFetch(config, TABLES.documents, {
    method: "POST",
    body: JSON.stringify({
      records: [
        {
          fields: {
            [DOC_F.name]: file.name,
            [DOC_F.client]: [clientId],
            [DOC_F.category]: "Your uploads",
            [DOC_F.fileType]: file.fileType,
            [DOC_F.status]: "received",
            [DOC_F.added]: ukToday(),
            ...(file.sourceField
              ? { [DOC_F.sourceField]: file.sourceField }
              : {}),
          },
        },
      ],
      typecast: true,
    }),
  });
  if (!createResponse.ok) {
    throw new Error(`Airtable create document responded ${createResponse.status}`);
  }
  bustReadCache();
  const created = (await createResponse.json()) as {
    records: { id: string }[];
  };
  const recordId = created.records[0]?.id;
  if (!recordId) throw new Error("Airtable create document returned no id");

  const uploadResponse = await fetch(
    `${CONTENT_URL}/${config.baseId}/${recordId}/${DOC_F.file}/uploadAttachment`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.pat}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contentType: file.contentType,
        file: file.base64,
        filename: file.name,
      }),
    },
  );
  if (!uploadResponse.ok) {
    await deleteRecord(config, TABLES.documents, recordId).catch(() => {});
    throw new Error(`Airtable attachment upload responded ${uploadResponse.status}`);
  }
}

/**
 * The staff view of one client: full journey including internal tasks,
 * engagement history, confidence ratings, documents, intake answers and
 * training state. Null when the client doesn't exist or Airtable is down.
 */
export async function fetchAdminClientDetail(
  clientId: string,
): Promise<AdminClientDetail | null> {
  const config = airtableConfig();
  if (!config) return null;

  try {
    const clientRecord = await getRecord(config, TABLES.clients, clientId);
    if (!clientRecord) return null;

    const [phaseRecords, taskRecords, responseRecords, signalRecords] =
      await Promise.all([
        listAll(config, TABLES.phases),
        listAll(config, TABLES.tasks),
        listAll(config, TABLES.intakeResponses),
        listAll(config, TABLES.engagementSignals),
      ]);
    const [
      confidenceRecords,
      documentRecords,
      trainingRecords,
      completionRecords,
      messageRecords,
    ] = await Promise.all([
      listAll(config, TABLES.confidenceRatings),
      listAll(config, TABLES.documents),
      listAll(config, TABLES.training),
      listAll(config, TABLES.trainingCompletions),
      listAll(config, TABLES.messages),
    ]);

    const today = ukToday();
    const nowMs = Date.now();
    const phasesSorted = [...phaseRecords].sort(
      (a, b) => num(a, PHASE_F.number) - num(b, PHASE_F.number),
    );

    const summary = summariseClient(
      clientRecord,
      taskRecords,
      phasesSorted,
      responseRecords,
      messageRecords,
      today,
      nowMs,
    );

    const clientTasks = taskRecords
      .filter((record) => links(record, TASK_F.client).includes(clientId))
      .sort((a, b) => num(a, TASK_F.order) - num(b, TASK_F.order));

    const phases = phasesSorted.map((phase) => ({
      number: num(phase, PHASE_F.number),
      title: str(phase, PHASE_F.title),
      tasks: clientTasks
        .filter((record) => links(record, TASK_F.phase).includes(phase.id))
        .map((record) => ({
          id: record.id,
          title: str(record, TASK_F.title),
          description: str(record, TASK_F.description) || undefined,
          audience: asAudience(str(record, TASK_F.audience)),
          owner: asOwner(str(record, TASK_F.owner)),
          status: asStatus(str(record, TASK_F.status)),
          dueDate: str(record, TASK_F.due) || undefined,
          optional: bool(record, TASK_F.optional),
        })),
    }));

    const signals = signalRecords
      .filter((record) => links(record, SIGNAL_F.client).includes(clientId))
      .sort(
        (a, b) =>
          Date.parse(str(b, SIGNAL_F.at)) - Date.parse(str(a, SIGNAL_F.at)),
      )
      .slice(0, 20)
      .map((record) => ({
        id: record.id,
        signal: str(record, SIGNAL_F.signal),
        detail: str(record, SIGNAL_F.detail),
        whenLabel: relativeLabel(str(record, SIGNAL_F.at), nowMs),
      }));

    const confidences = confidenceRecords
      .filter((record) => links(record, CONFIDENCE_F.client).includes(clientId))
      .sort(
        (a, b) =>
          Date.parse(str(b, CONFIDENCE_F.ratedAt)) -
          Date.parse(str(a, CONFIDENCE_F.ratedAt)),
      )
      .map((record) => ({
        id: record.id,
        score: num(record, CONFIDENCE_F.score),
        whenLabel: relativeLabel(str(record, CONFIDENCE_F.ratedAt), nowMs),
      }));

    const documents = documentRecords
      .filter((record) => links(record, DOC_F.client).includes(clientId))
      .map((record) => ({
        id: record.id,
        name: str(record, DOC_F.name),
        category: str(record, DOC_F.category),
        status: str(record, DOC_F.status),
        addedAt: str(record, DOC_F.added),
      }));

    const plan = summary.plan;
    const responsesByField = new Map(
      responseRecords
        .filter((record) => links(record, RESPONSE_F.client).includes(clientId))
        .map((record) => [
          str(record, RESPONSE_F.field),
          str(record, RESPONSE_F.value),
        ]),
    );
    const intake = INTAKE_SECTIONS.filter(
      (section) =>
        !section.showForPlans ||
        (plan !== undefined && section.showForPlans.includes(plan)),
    ).map((section) => ({
      title: section.title,
      fields: section.fields
        .filter((field) => field.type !== "upload")
        .map((field) => ({
          label: field.label,
          value: responsesByField.get(field.id) ?? "",
        })),
    }));

    const completedTrainingIds = new Set(
      completionRecords
        .filter((record) => links(record, COMPLETION_F.client).includes(clientId))
        .map((record) => firstLink(record, COMPLETION_F.training)),
    );
    const training = [...trainingRecords]
      .sort((a, b) => num(a, TRAINING_F.order) - num(b, TRAINING_F.order))
      .map((record) => ({
        id: record.id,
        title: str(record, TRAINING_F.title),
        type: (str(record, TRAINING_F.type) === "article"
          ? "article"
          : "video") as "article" | "video",
        done: completedTrainingIds.has(record.id),
      }));

    const messages = messageRecords
      .filter((record) => links(record, MSG_F.client).includes(clientId))
      .sort(
        (a, b) =>
          Date.parse(str(a, MSG_F.sentAt)) - Date.parse(str(b, MSG_F.sentAt)),
      )
      .slice(-50)
      .map((record) => ({
        id: record.id,
        from: senderOf(record),
        body: str(record, MSG_F.body),
        whenLabel: relativeLabel(str(record, MSG_F.sentAt), nowMs),
        unread:
          str(record, MSG_F.sender) === "Client" &&
          !bool(record, MSG_F.readByTeam),
        attachments: messageAttachments(record),
      }));

    return {
      summary,
      contactEmail: str(clientRecord, CLIENT_F.email) || undefined,
      startedAt: str(clientRecord, CLIENT_F.started) || undefined,
      phases,
      signals,
      confidences,
      documents,
      intake,
      training,
      messages,
      portalAccess: {
        codeIssuedAt: str(clientRecord, CLIENT_F.codeIssuedAt) || undefined,
        lastLoginAt: str(clientRecord, CLIENT_F.lastLoginAt) || undefined,
      },
    };
  } catch (error) {
    console.error("[onboarding/airtable] client detail failed:", error);
    return null;
  }
}

const SUPPLIER_CATEGORIES: SupplierCategory[] = [
  "Package holidays",
  "Accommodation",
  "Flights",
];

function asSupplierCategory(value: string): SupplierCategory {
  return SUPPLIER_CATEGORIES.includes(value as SupplierCategory)
    ? (value as SupplierCategory)
    : "Package holidays";
}

/** Every supplier (active and inactive) for the admin curation screen. */
export async function fetchAdminSuppliers(): Promise<AdminSupplier[] | null> {
  const config = airtableConfig();
  if (!config) return null;

  try {
    const records = await listAll(config, TABLES.suppliers);
    return records
      .map((record) => ({
        id: record.id,
        name: str(record, SUPPLIER_F.name),
        category: asSupplierCategory(str(record, SUPPLIER_F.category)),
        active: bool(record, SUPPLIER_F.active),
        description: str(record, SUPPLIER_F.description),
        features: str(record, SUPPLIER_F.features),
        links: supplierLinks(record),
        contactEmail: str(record, SUPPLIER_F.contactEmail),
        contactPhone: str(record, SUPPLIER_F.contactPhone),
        contactNotes: str(record, SUPPLIER_F.contactNotes),
      }))
      .sort(
        (a, b) =>
          a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
      );
  } catch (error) {
    console.error("[onboarding/airtable] suppliers read failed:", error);
    return null;
  }
}

export interface SupplierInput {
  name: string;
  category: SupplierCategory;
  description: string;
  /** Raw comma-delimited features string. */
  features: string;
  links: { label: string; url: string }[];
  contactEmail: string;
  contactPhone: string;
  contactNotes: string;
}

function supplierFields(input: SupplierInput): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    [SUPPLIER_F.name]: input.name,
    [SUPPLIER_F.category]: input.category,
    [SUPPLIER_F.description]: input.description,
    [SUPPLIER_F.features]: input.features,
    [SUPPLIER_F.contactEmail]: input.contactEmail,
    [SUPPLIER_F.contactPhone]: input.contactPhone,
    [SUPPLIER_F.contactNotes]: input.contactNotes,
  };
  SUPPLIER_LINK_FIELDS.forEach(([labelField, urlField], index) => {
    const link = input.links[index];
    fields[labelField] = link?.label ?? "";
    fields[urlField] = link?.url ?? "";
  });
  return fields;
}

/** Add a supplier. New ones are active so they show in the intake at once. */
export async function createSupplier(
  config: AirtableConfig,
  input: SupplierInput,
): Promise<void> {
  await createRecords(config, TABLES.suppliers, [
    { ...supplierFields(input), [SUPPLIER_F.active]: true },
  ]);
}

/** Update a supplier's card details. Returns false if it doesn't exist. */
export async function updateSupplier(
  config: AirtableConfig,
  supplierId: string,
  input: SupplierInput,
): Promise<boolean> {
  const record = await getRecord(config, TABLES.suppliers, supplierId);
  if (!record) return false;
  await updateRecord(config, TABLES.suppliers, supplierId, supplierFields(input));
  return true;
}

/** Show or hide a supplier in the intake without deleting it. */
export async function setSupplierActive(
  config: AirtableConfig,
  supplierId: string,
  active: boolean,
): Promise<boolean> {
  const record = await getRecord(config, TABLES.suppliers, supplierId);
  if (!record) return false;
  await updateRecord(config, TABLES.suppliers, supplierId, {
    [SUPPLIER_F.active]: active,
  });
  return true;
}

/** Remove a supplier outright (past intake answers keep the stored name). */
export async function deleteSupplier(
  config: AirtableConfig,
  supplierId: string,
): Promise<boolean> {
  const record = await getRecord(config, TABLES.suppliers, supplierId);
  if (!record) return false;
  await deleteRecord(config, TABLES.suppliers, supplierId);
  return true;
}

/* ------------------------------------------------------------------------ */
/* Messages — the client ↔ team thread.                                     */
/* ------------------------------------------------------------------------ */

/** Routes use this to reject made-up client ids before writing. */
export async function clientExists(
  config: AirtableConfig,
  clientId: string,
): Promise<boolean> {
  return (await getRecord(config, TABLES.clients, clientId)) !== null;
}

export interface MessageFile {
  name: string;
  contentType: string;
  base64: string;
}

const SENDER_LABEL: Record<MessageSender, string> = {
  team: "Team",
  client: "Client",
  luna: "Luna",
};

/**
 * Append a message; the sender's own read flag starts true. Luna replies
 * count as read on both sides — the client is mid-conversation when they
 * arrive, and the team's unread badge tracks only client messages.
 */
export async function sendMessage(
  config: AirtableConfig,
  clientId: string,
  from: MessageSender,
  body: string,
  file?: MessageFile,
): Promise<void> {
  const preview =
    body.replace(/\s+/g, " ").slice(0, 60) || (file ? `📎 ${file.name}` : "");
  const fields: Record<string, unknown> = {
    [MSG_F.preview]: preview,
    [MSG_F.client]: [clientId],
    [MSG_F.sender]: SENDER_LABEL[from],
    [MSG_F.body]: body,
    [MSG_F.sentAt]: new Date().toISOString(),
  };
  if (from !== "client") fields[MSG_F.readByTeam] = true;
  if (from !== "team") fields[MSG_F.readByClient] = from === "luna";

  // Created directly (not via createRecords) because the attachment upload
  // needs the new record's id.
  const response = await airtableFetch(config, TABLES.messages, {
    method: "POST",
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  if (!response.ok) {
    throw new Error(`Airtable create message responded ${response.status}`);
  }
  bustReadCache();
  const created = (await response.json()) as { records: { id: string }[] };
  const recordId = created.records[0]?.id;

  if (file && recordId) {
    const upload = await fetch(
      `${CONTENT_URL}/${config.baseId}/${recordId}/${MSG_F.attachments}/uploadAttachment`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.pat}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType: file.contentType,
          file: file.base64,
          filename: file.name,
        }),
      },
    );
    if (!upload.ok) {
      // The text half of the message stands; flag the lost file server-side.
      console.error(
        `[onboarding/airtable] message attachment upload responded ${upload.status}`,
      );
    }
  }

  // A human team reply also lands as a portal notification, so the bell and
  // the Messages badge both light up. Luna answers in-page — no nudge needed.
  if (from === "team") {
    await createRecords(config, TABLES.notifications, [
      {
        [NOTIF_F.text]: "New message from your Travelgenix team.",
        [NOTIF_F.client]: [clientId],
        [NOTIF_F.kind]: "message",
        [NOTIF_F.created]: new Date().toISOString(),
      },
    ]).catch((error) => {
      // The message is what matters; a missed nudge isn't worth a failure.
      console.error("[onboarding/airtable] message notification failed:", error);
    });
  }
}

/** Client messages the team hasn't read — drives the "first new" email. */
export async function countTeamUnread(
  config: AirtableConfig,
  clientId: string,
): Promise<number> {
  const records = await listAll(config, TABLES.messages);
  return countUnreadFromClient(records, clientId);
}

/** Mark everything the other side sent as read by `reader`. */
export async function markMessagesRead(
  config: AirtableConfig,
  clientId: string,
  reader: "team" | "client",
): Promise<void> {
  const otherSender = reader === "team" ? "Client" : "Team";
  const readFlag = reader === "team" ? MSG_F.readByTeam : MSG_F.readByClient;

  const records = await listAll(config, TABLES.messages);
  const unread = records.filter(
    (record) =>
      links(record, MSG_F.client).includes(clientId) &&
      str(record, MSG_F.sender) === otherSender &&
      !bool(record, readFlag),
  );

  // Airtable caps batch updates at 10 records per request.
  for (let start = 0; start < unread.length; start += 10) {
    await updateRecords(
      config,
      TABLES.messages,
      unread.slice(start, start + 10).map((record) => ({
        id: record.id,
        fields: { [readFlag]: true },
      })),
    );
  }
}

/* ------------------------------------------------------------------------ */
/* Knowledge base — the articles Luna answers from.                         */
/* ------------------------------------------------------------------------ */

export interface AdminKbArticle {
  id: string;
  title: string;
  body: string;
  keywords: string;
  category: string;
  active: boolean;
}

function kbArticle(record: AirtableRecord): AdminKbArticle {
  return {
    id: record.id,
    title: str(record, KB_F.title),
    body: str(record, KB_F.body),
    keywords: str(record, KB_F.keywords),
    category: str(record, KB_F.category) || "General",
    active: bool(record, KB_F.active),
  };
}

/** Active articles only — what Luna is allowed to answer from. */
export async function fetchActiveKnowledge(
  config: AirtableConfig,
): Promise<AdminKbArticle[]> {
  const records = await listAll(config, TABLES.knowledgeBase);
  return records.map(kbArticle).filter((article) => article.active);
}

/** Everything, for the admin curation screen. Null when not configured. */
export async function fetchAdminKnowledge(): Promise<AdminKbArticle[] | null> {
  const config = airtableConfig();
  if (!config) return null;
  try {
    const records = await listAll(config, TABLES.knowledgeBase);
    return records
      .map(kbArticle)
      .sort(
        (a, b) =>
          a.category.localeCompare(b.category) || a.title.localeCompare(b.title),
      );
  } catch (error) {
    console.error("[onboarding/airtable] knowledge read failed:", error);
    return null;
  }
}

export interface KbInput {
  title: string;
  body: string;
  keywords: string;
  category: string;
}

function kbFields(input: KbInput): Record<string, unknown> {
  return {
    [KB_F.title]: input.title,
    [KB_F.body]: input.body,
    [KB_F.keywords]: input.keywords,
    [KB_F.category]: input.category,
  };
}

/** New articles go live immediately — Luna reads them on her next answer. */
export async function createKbArticle(
  config: AirtableConfig,
  input: KbInput,
): Promise<void> {
  await createRecords(config, TABLES.knowledgeBase, [
    { ...kbFields(input), [KB_F.active]: true },
  ]);
}

export async function updateKbArticle(
  config: AirtableConfig,
  articleId: string,
  input: KbInput,
): Promise<boolean> {
  const record = await getRecord(config, TABLES.knowledgeBase, articleId);
  if (!record) return false;
  await updateRecord(config, TABLES.knowledgeBase, articleId, kbFields(input));
  return true;
}

/** Pause an article without losing it — Luna skips inactive ones. */
export async function setKbActive(
  config: AirtableConfig,
  articleId: string,
  active: boolean,
): Promise<boolean> {
  const record = await getRecord(config, TABLES.knowledgeBase, articleId);
  if (!record) return false;
  await updateRecord(config, TABLES.knowledgeBase, articleId, {
    [KB_F.active]: active,
  });
  return true;
}

export async function deleteKbArticle(
  config: AirtableConfig,
  articleId: string,
): Promise<boolean> {
  const record = await getRecord(config, TABLES.knowledgeBase, articleId);
  if (!record) return false;
  await deleteRecord(config, TABLES.knowledgeBase, articleId);
  return true;
}

export interface NewClientInput {
  company: string;
  contactName: string;
  contactEmail: string;
  plan: string;
  accountManager: string;
  startDate: string;
}

/**
 * The add-client flow: create the Clients row, stamp out the journey
 * template for their tier (due dates offset from the start date), and drop
 * the welcome notification in their bell. Returns the new client record id.
 * Login issuance joins this flow when the client-auth slice lands.
 */
export async function createClientWithJourney(
  config: AirtableConfig,
  input: NewClientInput,
): Promise<string> {
  const phaseRecords = await listAll(config, TABLES.phases);
  const phaseIdByNumber = new Map(
    phaseRecords.map((record) => [num(record, PHASE_F.number), record.id]),
  );

  const createResponse = await airtableFetch(config, TABLES.clients, {
    method: "POST",
    body: JSON.stringify({
      records: [
        {
          fields: {
            [CLIENT_F.company]: input.company,
            [CLIENT_F.contactName]: input.contactName,
            [CLIENT_F.email]: input.contactEmail,
            [CLIENT_F.package]: input.plan,
            [CLIENT_F.started]: input.startDate,
            [CLIENT_F.accountManager]: input.accountManager,
          },
        },
      ],
      typecast: true,
    }),
  });
  if (!createResponse.ok) {
    throw new Error(`Airtable create client responded ${createResponse.status}`);
  }
  const created = (await createResponse.json()) as { records: { id: string }[] };
  const clientId = created.records[0]?.id;
  if (!clientId) throw new Error("Airtable create client returned no id");

  const taskRows: Record<string, unknown>[] = [];
  for (const [numberRaw, templates] of Object.entries(TASK_TEMPLATE)) {
    const phaseId = phaseIdByNumber.get(Number(numberRaw));
    if (!phaseId) continue;
    templates
      .filter(
        (template) =>
          !template.forPlans || template.forPlans.includes(input.plan),
      )
      .forEach((template, index) => {
        taskRows.push({
          [TASK_F.title]: template.title,
          ...(template.description
            ? { [TASK_F.description]: template.description }
            : {}),
          [TASK_F.client]: [clientId],
          [TASK_F.phase]: [phaseId],
          [TASK_F.audience]: template.audience,
          [TASK_F.owner]: template.owner,
          [TASK_F.status]: "todo",
          ...(template.dueOffsetDays !== undefined
            ? {
                [TASK_F.due]: shiftDays(input.startDate, template.dueOffsetDays),
              }
            : {}),
          ...(template.optional ? { [TASK_F.optional]: true } : {}),
          [TASK_F.order]: index + 1,
        });
      });
  }
  for (let start = 0; start < taskRows.length; start += 8) {
    await createRecords(config, TABLES.tasks, taskRows.slice(start, start + 8));
  }

  await createRecords(config, TABLES.notifications, [
    {
      [NOTIF_F.text]: "Welcome to Travelgenix. Your portal is ready.",
      [NOTIF_F.client]: [clientId],
      [NOTIF_F.kind]: "welcome",
      [NOTIF_F.created]: new Date().toISOString(),
    },
  ]);

  // Welcome email through the seam (no-op until SendGrid is wired), logged.
  const firstName = input.contactName.split(" ")[0];
  const tpl = welcomeEmail(firstName, input.company);
  const result = await send({
    to: input.contactEmail,
    subject: tpl.subject,
    text: tpl.text,
    html: tpl.html,
  });
  await createRecords(config, TABLES.automationLog, [
    {
      [AUTOMATION_F.summary]: `Welcome email to ${input.company}`,
      [AUTOMATION_F.client]: [clientId],
      [AUTOMATION_F.event]: "welcome",
      [AUTOMATION_F.channel]: result.sent ? "email" : "portal",
      [AUTOMATION_F.recipient]: input.contactEmail,
      [AUTOMATION_F.dedupeKey]: `welcome:${clientId}`,
      [AUTOMATION_F.sentAt]: new Date().toISOString(),
    },
  ]);

  return clientId;
}

/* ------------------------------------------------------------------------ */
/* Automation engine — the anti-wilting nudges, milestones and alerts.      */
/* Runs from the secured daily cron. SendGrid sends are no-ops until wired; */
/* every action is logged either way so the dashboard shows what happened.  */
/* ------------------------------------------------------------------------ */

export interface AutomationRunResult {
  reminders: number;
  milestones: number;
  alerts: number;
  emailsSent: number;
  skipped: number;
}

function isoWeek(date: Date): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function runAutomation(): Promise<AutomationRunResult | null> {
  const config = airtableConfig();
  if (!config) return null;

  const result: AutomationRunResult = {
    reminders: 0,
    milestones: 0,
    alerts: 0,
    emailsSent: 0,
    skipped: 0,
  };

  // UK working days only — no weekend nudges. (The cron sets the hour.)
  const ukDay = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
  }).format(new Date());
  if (ukDay === "Sat" || ukDay === "Sun") return result;

  const [clients, phaseRecords, taskRecords, logRecords] = await Promise.all([
    listAll(config, TABLES.clients),
    listAll(config, TABLES.phases),
    listAll(config, TABLES.tasks),
    listAll(config, TABLES.automationLog),
  ]);

  const today = ukToday();
  const nowMs = Date.now();
  const week = isoWeek(new Date());
  const phasesSorted = [...phaseRecords].sort(
    (a, b) => num(a, PHASE_F.number) - num(b, PHASE_F.number),
  );

  const sentKeys = new Set(
    logRecords.map((record) => str(record, AUTOMATION_F.dedupeKey)),
  );
  // Clients who already had an email today (one-email-per-client-per-day).
  const emailedToday = new Set(
    logRecords
      .filter(
        (record) =>
          str(record, AUTOMATION_F.channel) === "email" &&
          str(record, AUTOMATION_F.sentAt).slice(0, 10) === today,
      )
      .map((record) => firstLink(record, AUTOMATION_F.client)),
  );

  const staffAlertEmail = process.env.STAFF_ALERT_EMAIL;
  const appBase = process.env.APP_BASE_URL || "https://tg-onboarding-gamma.vercel.app";

  const logRows: Record<string, unknown>[] = [];
  const notificationRows: Record<string, unknown>[] = [];

  async function emailClient(
    clientId: string,
    to: string,
    tpl: { subject: string; text: string; html: string },
    event: "reminder" | "milestone",
    summary: string,
    dedupeKey: string,
  ): Promise<void> {
    // One email per client per day; portal notification still goes out.
    if (emailedToday.has(clientId)) {
      result.skipped += 1;
      return;
    }
    const res = await send({ to, subject: tpl.subject, text: tpl.text, html: tpl.html });
    emailedToday.add(clientId);
    if (res.sent) result.emailsSent += 1;
    logRows.push({
      [AUTOMATION_F.summary]: summary,
      [AUTOMATION_F.client]: [clientId],
      [AUTOMATION_F.event]: event,
      [AUTOMATION_F.channel]: res.sent ? "email" : "portal",
      [AUTOMATION_F.recipient]: to,
      [AUTOMATION_F.dedupeKey]: dedupeKey,
      [AUTOMATION_F.sentAt]: new Date().toISOString(),
    });
    sentKeys.add(dedupeKey);
  }

  for (const clientRecord of clients) {
    const clientId = clientRecord.id;
    const email = str(clientRecord, CLIENT_F.email);
    const firstName = str(clientRecord, CLIENT_F.contactName).split(" ")[0] || "there";
    // Empty responses/messages: the engine's rules don't use intake or
    // unread counts, so skipping those reads keeps the cron light.
    const summary = summariseClient(
      clientRecord,
      taskRecords,
      phasesSorted,
      [],
      [],
      today,
      nowMs,
    );

    // 1. Task reminders: client-owed, not done, due in 2 days or 1 day overdue.
    const clientTasks = taskRecords.filter(
      (record) =>
        links(record, TASK_F.client).includes(clientId) &&
        asAudience(str(record, TASK_F.audience)) === "client" &&
        asOwner(str(record, TASK_F.owner)) !== "travelgenix" &&
        asStatus(str(record, TASK_F.status)) !== "done",
    );
    for (const task of clientTasks) {
      const due = str(task, TASK_F.due);
      if (!due) continue;
      const diff = daysUntil(due, today);
      let whenLabel: string | null = null;
      let bucket = "";
      if (diff === 2) {
        whenLabel = "due in 2 days";
        bucket = "soon";
      } else if (diff === -1) {
        whenLabel = "now a day overdue";
        bucket = "missed";
      }
      if (!whenLabel) continue;

      const dedupeKey = `reminder:${task.id}:${bucket}`;
      if (sentKeys.has(dedupeKey)) continue;
      sentKeys.add(dedupeKey);
      result.reminders += 1;

      const title = str(task, TASK_F.title);
      // In-portal nudge always (anti-wilting rule); references the task.
      notificationRows.push({
        [NOTIF_F.text]: `${title} is ${whenLabel}`,
        [NOTIF_F.client]: [clientId],
        [NOTIF_F.kind]: "reminder",
        [NOTIF_F.created]: new Date().toISOString(),
      });
      if (email) {
        await emailClient(
          clientId,
          email,
          reminderEmail(firstName, title, whenLabel),
          "reminder",
          `Reminder to ${summary.company}: ${title}`,
          dedupeKey,
        );
      }
    }

    // 2. Milestones at 50% and 75% (once each).
    for (const mark of [75, 50]) {
      if (summary.pct >= mark) {
        const dedupeKey = `milestone:${mark}:${clientId}`;
        if (!sentKeys.has(dedupeKey)) {
          sentKeys.add(dedupeKey);
          result.milestones += 1;
          if (email) {
            await emailClient(
              clientId,
              email,
              milestoneEmail(firstName, mark),
              "milestone",
              `${summary.company} reached ${mark}%`,
              dedupeKey,
            );
          }
        }
        break; // highest milestone reached is enough for this run
      }
    }

    // 3. Wilting alert to staff on amber/red, at most once per week per level.
    if (summary.health !== "green") {
      const dedupeKey = `wilting:${clientId}:${summary.health}:${week}`;
      if (!sentKeys.has(dedupeKey)) {
        sentKeys.add(dedupeKey);
        result.alerts += 1;
        const clientUrl = `${appBase}/admin/clients/${clientId}`;
        let emailed = false;
        if (staffAlertEmail) {
          const manager = str(clientRecord, CLIENT_F.accountManager) || "team";
          const res = await send({
            to: staffAlertEmail,
            ...wiltingAlertEmail(
              manager,
              summary.company,
              summary.contactName,
              summary.reasons,
              clientUrl,
            ),
          });
          emailed = res.sent;
          if (res.sent) result.emailsSent += 1;
        }
        logRows.push({
          [AUTOMATION_F.summary]: `Wilting alert: ${summary.company} (${summary.reasons.join(", ")})`,
          [AUTOMATION_F.client]: [clientId],
          [AUTOMATION_F.event]: "wilting-alert",
          [AUTOMATION_F.channel]: emailed ? "email" : "portal",
          [AUTOMATION_F.recipient]: staffAlertEmail ?? "(no staff email set)",
          [AUTOMATION_F.dedupeKey]: dedupeKey,
          [AUTOMATION_F.sentAt]: new Date().toISOString(),
        });
      }
    }
  }

  // Persist in batches (max 10 per Airtable call).
  for (let start = 0; start < notificationRows.length; start += 10) {
    await createRecords(
      config,
      TABLES.notifications,
      notificationRows.slice(start, start + 10),
    );
  }
  for (let start = 0; start < logRows.length; start += 10) {
    await createRecords(
      config,
      TABLES.automationLog,
      logRows.slice(start, start + 10),
    );
  }

  return result;
}

export interface AutomationLogEntry {
  id: string;
  summary: string;
  event: string;
  channel: string;
  whenLabel: string;
}

/** Recent automation activity for the dashboard panel. */
export async function fetchAutomationLog(
  limit = 12,
): Promise<AutomationLogEntry[] | null> {
  const config = airtableConfig();
  if (!config) return null;
  try {
    const records = await listAll(config, TABLES.automationLog);
    const nowMs = Date.now();
    return records
      .sort(
        (a, b) =>
          Date.parse(str(b, AUTOMATION_F.sentAt)) -
          Date.parse(str(a, AUTOMATION_F.sentAt)),
      )
      .slice(0, limit)
      .map((record) => ({
        id: record.id,
        summary: str(record, AUTOMATION_F.summary),
        event: str(record, AUTOMATION_F.event),
        channel: str(record, AUTOMATION_F.channel),
        whenLabel: relativeLabel(str(record, AUTOMATION_F.sentAt), nowMs),
      }));
  } catch (error) {
    console.error("[onboarding/airtable] automation log read failed:", error);
    return null;
  }
}
