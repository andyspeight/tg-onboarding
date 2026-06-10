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
import { ukToday } from "./dates";

/**
 * Airtable read layer for the TG Onboarding base (appOSIsT3wpkTmit9).
 *
 * SERVER-SIDE ONLY. This module is reached exclusively through `data.ts`,
 * which only server components import — the PAT must never appear in any
 * client bundle. Credentials come from env (AIRTABLE_PAT, AIRTABLE_BASE_ID);
 * when they're absent or Airtable errors, callers fall back to mock data so
 * the portal always renders.
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
  documents: "tblmnJ1x0av9sQw0N",
  notifications: "tblx5z4eV3YGWaEBq",
};

const CLIENT_F = {
  company: "fldV3aAKMwGbKweMJ",
  contactName: "fldPZiMqRPXgjI2Pi",
  package: "fldOf62P3opdqJ5Gx",
  started: "fldiMG1sZjsRxJuer",
  accountManager: "fld4D5xpWTRS7sMUb",
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

const DOC_F = {
  name: "fldpSycVlG2NNZQdG",
  category: "fld7lTn5nlUCPKCIs",
  fileType: "fldbU36Qz3ns4dW6H",
  status: "fldPclJz8ghYQhNjR",
  added: "fldUG8S5AlO7YhXLC",
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

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
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

function firstLink(record: AirtableRecord, fieldId: string): string {
  const value = record.fields[fieldId];
  return Array.isArray(value) && typeof value[0] === "string" ? value[0] : "";
}

/** Fetch every record from a table, following pagination. */
async function listAll(
  pat: string,
  baseId: string,
  tableId: string,
): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ returnFieldsByFieldId: "true" });
    if (offset) params.set("offset", offset);

    const response = await fetch(`${API_URL}/${baseId}/${tableId}?${params}`, {
      headers: { Authorization: `Bearer ${pat}` },
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
  const pat = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!pat || !baseId) return null;

  try {
    // Two waves to stay inside Airtable's 5 requests/second per base.
    const [clients, phaseRecords, taskRecords, trainingRecords] =
      await Promise.all([
        listAll(pat, baseId, TABLES.clients),
        listAll(pat, baseId, TABLES.phases),
        listAll(pat, baseId, TABLES.tasks),
        listAll(pat, baseId, TABLES.training),
      ]);
    const [documentRecords, notificationRecords, supplierRecords] =
      await Promise.all([
        listAll(pat, baseId, TABLES.documents),
        listAll(pat, baseId, TABLES.notifications),
        listAll(pat, baseId, TABLES.suppliers),
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

    return {
      source: "airtable",
      asOf: ukToday(),
      client,
      phases,
      notifications,
      intake: intakeWithLiveSuppliers(supplierRecords),
      documents,
    };
  } catch (error) {
    // Server log only; the caller serves mock data so the portal stays up.
    console.error("[onboarding/airtable] read failed, serving mock data:", error);
    return null;
  }
}
