/**
 * Luna AI — the contextual help layer.
 *
 * This is the integration seam, stubbed for Phase 1. Luna is the differentiator
 * no competitor can match: contextual, in-product help that knows where the
 * client is in their journey. When we wire it up, the real call goes here —
 * server-side and env-keyed, never with a key in the client bundle.
 */

export interface LunaContext {
  /** Where in the journey the question was asked. */
  phaseSlug?: string;
  phaseTitle?: string;
  taskId?: string;
}

export interface LunaHelpResponse {
  answer: string;
  /** Optional links/citations Luna used. */
  sources?: string[];
}

/** Flip to true (behind an env flag) once the Luna service is wired up. */
export const LUNA_ENABLED = false;

export async function askLuna(
  _question: string,
  _context?: LunaContext,
): Promise<LunaHelpResponse> {
  // Phase 1 stub. Later: call the Luna AI service from a server route.
  return {
    answer:
      "Luna, your in-product guide, is coming soon. In the meantime your onboarding specialist is just a message away.",
  };
}
