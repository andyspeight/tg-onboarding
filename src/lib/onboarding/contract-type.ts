/**
 * Contract type — which onboarding journey a client is on.
 *
 * Travelgenix sell two contracts: a full website build, and a lighter
 * "widget only" engagement where we need less from the client. Rather than
 * maintaining two whole journey templates, the widget journey is the full one
 * minus the items flagged `hideForContract: ["widget"]` on tasks and intake
 * sections/fields. The account manager picks the contract type first when
 * creating a client; legacy/blank clients read as "full".
 *
 * Pure module, no Airtable — one source of truth for the rules, shared by the
 * data layer and the UI.
 */

import type { ContractType, IntakeSection } from "./types";

export type { ContractType };

/** Labels as stored in the Airtable "Contract type" single-select. */
export const CONTRACT_LABEL: Record<ContractType, string> = {
  full: "Full website",
  widget: "Widget only",
};

/** Order shown in the setup form. */
export const CONTRACT_TYPE_OPTIONS: { id: ContractType; label: string }[] = [
  { id: "full", label: CONTRACT_LABEL.full },
  { id: "widget", label: CONTRACT_LABEL.widget },
];

export function isContractType(value: string): value is ContractType {
  return value === "full" || value === "widget";
}

/** The stored Airtable label → id. Blank or unrecognised reads as "full". */
export function contractFromStored(
  raw: string | undefined | null,
): ContractType {
  return raw === CONTRACT_LABEL.widget ? "widget" : "full";
}

function hidden(list: ContractType[] | undefined, contract: ContractType) {
  return Boolean(list?.includes(contract));
}

/**
 * The intake sections (and fields within them) a client actually sees, after
 * both package-tier gating (`showForPlans`) and contract gating
 * (`hideForContract`). Used everywhere intake is rendered or counted, so the
 * client form, the admin answers view and the completion % all agree.
 */
export function visibleIntakeSections(
  sections: IntakeSection[],
  plan: string | undefined,
  contract: ContractType,
): IntakeSection[] {
  return sections
    .filter(
      (section) =>
        (!section.showForPlans ||
          (plan !== undefined && section.showForPlans.includes(plan))) &&
        !hidden(section.hideForContract, contract),
    )
    .map((section) => ({
      ...section,
      fields: section.fields.filter(
        (field) => !hidden(field.hideForContract, contract),
      ),
    }));
}
