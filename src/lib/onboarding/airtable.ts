import type {
  ClientDocument,
  ClientProfile,
  IntakeSection,
  JourneyPhase,
  NotificationKind,
  OnboardingJourney,
  OnboardingTask,
  PortalNotification,
  TaskAudience,
  TaskOwner,
  TaskStatus,
  TrainingResource,
} from "./types";
import { INTAKE_SECTIONS } from "./mock-data";
import { daysUntil, ukToday } from "./dates";
import {
  deriveHealth,
  type AdminClientSummary,
  type AdminSnapshot,
  type AdminTeamTask,
  type TeamTaskUrgency,
} from "./health";

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
};

const CLIENT_F = {
  company: "fldV3aAKMwGbKweMJ",
  contactName: "fldPZiMqRPXgjI2Pi",
  package: "fldOf62P3opdqJ5Gx",
  started: "fldiMG1sZjsRxJuer",
  accountManager: "fld4D5xpWTRS7sMUb",
  lastActive: "fldUegCPTvsPnK5pG",
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
};

const NOTIF_F = {
  text: "fldVS2s856UGlX0qo",
  kind: "fldPxVeVG953e5GBU",
  read: "fldzt104LVD9frRjZ",
  created: "fldhVXcH6IeyxfkwF",
};

const SUPPLIER_F = {
  name: "fldLSsHcN5ofcuT0l",
  category: "fldIOHIdyvcf4Lgh0",
  active: "fldzPuJyXXsoCylu8",
};

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
  fields: Record<string, unknown>;
}

interface AirtableConfig {
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

/** Fetch every record from a table, following pagination. */
async function listAll(
  config: AirtableConfig,
  tableId: string,
): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ returnFieldsByFieldId: "true" });
    if (offset) params.set("offset", offset);

    const response = await airtableFetch(config, `${tableId}?${params}`);
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
 * Read the full journey from Airtable. Returns null when the integration
 * isn't configured or the read fails — callers fall back to mock data and
 * the portal keeps rendering.
 */
export async function fetchJourneyFromAirtable(): Promise<OnboardingJourney | null> {
  const config = airtableConfig();
  if (!config) return null;

  try {
    // Three waves to stay inside Airtable's 5 requests/second per base.
    const [clients, phaseRecords, taskRecords, trainingRecords] =
      await Promise.all([
        listAll(config, TABLES.clients),
        listAll(config, TABLES.phases),
        listAll(config, TABLES.tasks),
        listAll(config, TABLES.training),
      ]);
    const [documentRecords, notificationRecords, supplierRecords] =
      await Promise.all([
        listAll(config, TABLES.documents),
        listAll(config, TABLES.notifications),
        listAll(config, TABLES.suppliers),
      ]);
    const [completionRecords, responseRecords, confidenceRecords] =
      await Promise.all([
        listAll(config, TABLES.trainingCompletions),
        listAll(config, TABLES.intakeResponses),
        listAll(config, TABLES.confidenceRatings),
      ]);

    const clientRecord = clients[0];
    if (!clientRecord) return null;

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

    return {
      source: "airtable",
      asOf: ukToday(),
      client,
      phases,
      notifications,
      intake: intakeWithLiveSuppliers(supplierRecords),
      documents,
      intakeResponses,
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
 * Phase 1 is single-tenant: routes resolve the demo client server-side and
 * never trust a client id from the browser. Real auth replaces this lookup
 * in a later phase.
 */
export async function getPortalClientId(
  config: AirtableConfig,
): Promise<string | null> {
  const clients = await listAll(config, TABLES.clients);
  return clients[0]?.id ?? null;
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

/**
 * Everything the admin dashboard needs in one read: every client with
 * derived health, plus the open team tasks. Null when Airtable isn't
 * configured — the dashboard shows a connect message instead.
 */
export async function fetchAdminSnapshot(): Promise<AdminSnapshot | null> {
  const config = airtableConfig();
  if (!config) return null;

  try {
    const [clients, phaseRecords, taskRecords, responseRecords] =
      await Promise.all([
        listAll(config, TABLES.clients),
        listAll(config, TABLES.phases),
        listAll(config, TABLES.tasks),
        listAll(config, TABLES.intakeResponses),
      ]);

    const today = ukToday();
    const nowMs = Date.now();
    const phasesSorted = [...phaseRecords].sort(
      (a, b) => num(a, PHASE_F.number) - num(b, PHASE_F.number),
    );

    const summaries: AdminClientSummary[] = clients.map((clientRecord) => {
      const clientId = clientRecord.id;
      const plan = str(clientRecord, CLIENT_F.package) || undefined;
      const tasks = taskRecords.filter((record) =>
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
        countable.length === 0
          ? 0
          : Math.round((doneCount / countable.length) * 100);

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
      const dayCount = startedAt
        ? Math.max(0, -daysUntil(startedAt, today))
        : 0;

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
      const answered = tierFields.filter((field) =>
        answeredIds.has(field.id),
      ).length;
      const intakePct =
        tierFields.length === 0
          ? 0
          : Math.round((answered / tierFields.length) * 100);

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
        phaseTitle: currentPhase
          ? str(currentPhase, PHASE_F.title)
          : "Complete",
        dayCount,
        daysQuiet,
        overdueCount,
        intakePct,
        health,
        reasons,
      };
    });

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
          },
        },
      ],
      typecast: true,
    }),
  });
  if (!createResponse.ok) {
    throw new Error(`Airtable create document responded ${createResponse.status}`);
  }
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
