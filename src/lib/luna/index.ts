import Anthropic from "@anthropic-ai/sdk";

/**
 * Luna AI — the contextual help layer, now answering for real.
 *
 * Luna fronts the Messages thread: when a client asks something the
 * Travelgenix knowledge base covers, she answers instantly; everything
 * else stays with the team (who see every message either way).
 *
 * Two tiers, decided by environment:
 * - ANTHROPIC_API_KEY set → Claude composes a reply grounded ONLY in the
 *   matched knowledge-base articles (instructed to decline otherwise).
 * - No key → deterministic keyword retrieval returns the best article's
 *   staff-written body verbatim. No model, no invention, zero cost.
 *
 * SERVER-SIDE ONLY — the key must never reach a client bundle.
 */

export interface KnowledgeArticle {
  id: string;
  title: string;
  /** Staff-written, client-facing answer. */
  body: string;
  /** Comma-separated trigger phrases. */
  keywords: string;
  category: string;
}

export interface LunaReply {
  body: string;
  /** Which tier produced it — logged, never shown to clients. */
  via: "model" | "retrieval";
}

const STOPWORDS = new Set([
  "a", "an", "and", "are", "be", "can", "do", "does", "for", "get", "how",
  "i", "in", "is", "it", "me", "my", "of", "on", "or", "the", "to", "we",
  "what", "when", "where", "which", "who", "why", "will", "with", "you",
  "your",
]);

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
}

function tokens(text: string): string[] {
  return normalise(text)
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word));
}

/**
 * Score one article against the question: 3 points per keyword phrase the
 * question contains, 1 per meaningful title word. Pure and testable.
 */
export function scoreArticle(question: string, article: KnowledgeArticle): number {
  const haystack = ` ${normalise(question).replace(/\s+/g, " ").trim()} `;
  let score = 0;

  for (const raw of article.keywords.split(",")) {
    const phrase = normalise(raw).trim().replace(/\s+/g, " ");
    if (phrase.length > 1 && haystack.includes(` ${phrase} `)) score += 3;
  }

  const questionTokens = new Set(tokens(question));
  for (const word of tokens(article.title)) {
    if (questionTokens.has(word)) score += 1;
  }

  return score;
}

/** An article must clear this to be considered a real match. */
const MATCH_THRESHOLD = 3;

export function matchArticles(
  question: string,
  articles: KnowledgeArticle[],
): KnowledgeArticle[] {
  return articles
    .map((article) => ({ article, score: scoreArticle(question, article) }))
    .filter(({ score }) => score >= MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ article }) => article);
}

const SIGN_OFF =
  "If that doesn't quite cover it, just say so. The team sees every message and will pick this up.";

const NO_ANSWER = "NO_ANSWER";

async function composeWithClaude(
  question: string,
  matched: KnowledgeArticle[],
): Promise<string | null> {
  const client = new Anthropic();

  const articles = matched
    .map(
      (article, index) =>
        `<article index="${index + 1}" title="${article.title}">\n${article.body}\n</article>`,
    )
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    system: `You are Luna, Travelgenix's onboarding helper, replying inside a client's message thread.

Answer ONLY from the knowledge-base articles provided. If they don't genuinely answer the question, reply with exactly ${NO_ANSWER} and nothing else — a human will take over.

Voice: warm, plain English, British spelling, contractions fine. Two to four sentences. No bullet lists, no headings, no "Great question". Never invent features, prices, dates or promises. Don't mention articles, sources or being an AI. End without a sign-off line; one is added automatically.`,
    messages: [
      {
        role: "user",
        content: `${articles}\n\nThe client asks: ${question}`,
      },
    ],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  if (!text || text.includes(NO_ANSWER)) return null;
  return text;
}

/**
 * Luna's instant answer for a client message, or null when the knowledge
 * base doesn't cover it — silence beats a wrong answer, and the team sees
 * the thread either way.
 */
export async function lunaAnswer(
  question: string,
  articles: KnowledgeArticle[],
): Promise<LunaReply | null> {
  if (question.trim().length < 8) return null;

  const matched = matchArticles(question, articles);
  if (matched.length === 0) return null;

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const composed = await composeWithClaude(question, matched);
      if (composed) {
        return { body: `${composed}\n\n${SIGN_OFF}`, via: "model" };
      }
      return null;
    } catch (error) {
      // Model down ≠ Luna down: fall through to the retrieval tier.
      console.error("[luna] model call failed, using retrieval:", error);
    }
  }

  return { body: `${matched[0].body}\n\n${SIGN_OFF}`, via: "retrieval" };
}
