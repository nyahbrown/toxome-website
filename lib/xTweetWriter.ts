// Server-only: draft lowercase viral tweets in Toxome's X voice. Two kinds,
// news-reaction (react -> reframe -> stakes off a real headline) and evergreen
// hooks. Encodes the researched playbook (see memory: toxome-x-distribution).
// NEVER import this into a client component, it uses the Anthropic API key.
import Anthropic from "@anthropic-ai/sdk";
import type { NewsItem } from "@/lib/xNews";

// Voice quality matters here, so Sonnet over Haiku. Volume is ~5 tweets/day, so
// the cost is trivial.
const MODEL = "claude-sonnet-4-6";

export type DraftTweet = {
  body: string;
  source_url: string | null;
  kind: "news" | "evergreen";
  angle: string; // short label of the hook/format used
};

const VOICE = `you write tweets for toxome, a "fashion wellness" brand that helps women find toxins, plastic and synthetic fibers in their clothing (think "yuka for clothes"). the audience is ~89% women who care about health, hormones and removing toxins from their life, mid-budget not luxury.

NON-NEGOTIABLE STYLE RULES:
- everything lowercase. the ONLY exceptions are established acronyms (PFAS, EU, BPA, FDA, EWG) and real brand names. lowercase the start of every sentence and the word "i".
- one tweet = one idea. put the surprising claim or the hero number in the first 7 words.
- exactly one hero stat per tweet, specific (e.g. "59% polyester", not "lots of plastic"). for a scary health claim, name the source inline (e.g. "per a 2024 study,").
- use whitespace: break the hook from the payoff with line breaks. short lines.
- end on a reply-pulling line when it fits (a real question, "what's on your tag right now?", "name one..."). that is how the post earns reach.
- NEVER put a link in the tweet body.
- no em dashes. no exclamation points. at most one emoji, prefer zero. at most one hashtag, prefer zero.
- credible but punchy. educated-woman energy (think casey means), not conspiracy theorist. never fearmonger past what the source supports.
- never sound like ad copy or a press release. banned words: discover, unlock, elevate, game-changer, "in a world where", "say goodbye to".

NEWS TWEETS follow react -> reframe -> stakes: react (gut line to the headline), reframe (what it actually means, usually "the source nobody connects: the synthetic clothes against your skin all day"), stakes (why she should care or what she can do). 2 to 4 short lines.

EVERGREEN TWEETS use one of these angles with fresh wording each time: recycled-polyester-is-still-plastic, the-fiber-tag-is-the-whole-test (avoid polyester/nylon/acrylic/elastane, choose cotton/linen/wool/silk/hemp), 60%-of-the-average-closet-is-plastic, vegan-leather-is-plastic, polyester-sheds-microplastics-in-the-wash, you-detoxed-everything-but-your-closet, bamboo-viscose-is-chemically-processed-rayon.

return tweets ready to post verbatim.`;

const TOOL: Anthropic.Tool = {
  name: "save_tweets",
  description: "Return the drafted tweets.",
  input_schema: {
    type: "object",
    properties: {
      tweets: {
        type: "array",
        items: {
          type: "object",
          properties: {
            body: { type: "string", description: "the tweet text, lowercase, ready to post" },
            kind: { type: "string", enum: ["news", "evergreen"] },
            angle: { type: "string", description: "short label of the hook/format used" },
            source_url: { type: ["string", "null"], description: "the news url for a news tweet, else null" },
          },
          required: ["body", "kind", "angle"],
        },
      },
    },
    required: ["tweets"],
  },
};

export async function writeTweets(opts: {
  news: NewsItem[]; // fresh stories to react to (one tweet each)
  evergreenCount: number; // how many evergreen hooks to add
  avoidBodies?: string[]; // recent tweet bodies to not repeat
  dateLabel?: string; // e.g. "2026-06-10", nudges day-to-day variety
}): Promise<DraftTweet[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey });

  const newsList = opts.news.map((n, i) => `${i + 1}. "${n.title}" (${n.source || "source"}) ${n.url}`).join("\n");
  const avoid = (opts.avoidBodies || [])
    .slice(0, 25)
    .map((b) => `- ${b.replace(/\s+/g, " ").slice(0, 120)}`)
    .join("\n");

  const userMsg =
    `write ${opts.news.length} news tweet(s) and ${opts.evergreenCount} evergreen tweet(s).` +
    (opts.dateLabel ? ` today is ${opts.dateLabel}.` : "") +
    `\n\nNEWS STORIES (one tweet each, set source_url to its url):\n${newsList || "(none today, make every tweet evergreen instead)"}` +
    (avoid ? `\n\nDO NOT repeat the angle or wording of these recent tweets:\n${avoid}` : "");

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: VOICE,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "save_tweets" },
    messages: [{ role: "user", content: userMsg }],
  });

  const block = resp.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "save_tweets"
  );
  const tweets = block
    ? (block.input as { tweets: Array<{ body: string; kind: "news" | "evergreen"; angle: string; source_url?: string | null }> }).tweets
    : [];

  return tweets
    .filter((t) => t.body && t.body.trim())
    .map((t) => ({ body: t.body.trim(), source_url: t.source_url || null, kind: t.kind, angle: t.angle }));
}
