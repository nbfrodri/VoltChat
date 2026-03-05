/**
 * Client-side content filter for opt-in profanity/slur filtering.
 * Applied on incoming messages only — does not affect what others see.
 */

// Curated word list — common profanity and slurs
// Each entry is a regex pattern to handle common obfuscation
const FILTER_PATTERNS: { pattern: RegExp; severity: "low" | "medium" | "high" }[] = [
  // Low: severe slurs only
  { pattern: /\bn[i1!|][g9][g9][e3][r]+s?\b/gi, severity: "low" },
  { pattern: /\bf[a@][g9][g9]?[o0]?t?s?\b/gi, severity: "low" },
  { pattern: /\bk[i1!][k]+[e3]s?\b/gi, severity: "low" },
  { pattern: /\bch[i1!]nk+s?\b/gi, severity: "low" },
  { pattern: /\bsp[i1!]c+s?\b/gi, severity: "low" },
  { pattern: /\btr[a@]nn[yi1!][e3]?s?\b/gi, severity: "low" },
  { pattern: /\br[e3]t[a@]rd+s?\b/gi, severity: "low" },

  // Medium: general profanity
  { pattern: /\bf+u+c+k+\w*/gi, severity: "medium" },
  { pattern: /\bs+h+[i1!]+t+\w*/gi, severity: "medium" },
  { pattern: /\bb+[i1!]+t+c+h+\w*/gi, severity: "medium" },
  { pattern: /\ba+s+s+h+[o0]+l+e+s?\b/gi, severity: "medium" },
  { pattern: /\bd+[i1!]+c+k+\w*/gi, severity: "medium" },
  { pattern: /\bc+u+n+t+s?\b/gi, severity: "medium" },
  { pattern: /\bw+h+[o0]+r+e+s?\b/gi, severity: "medium" },
  { pattern: /\bp+[u]+s+s+[yi1!]+\w*/gi, severity: "medium" },
  { pattern: /\bd+[a@]+m+n+\w*/gi, severity: "medium" },
  { pattern: /\bh+[e3]+l+l+\b/gi, severity: "medium" },

  // High: aggressive / threatening
  { pattern: /\bk[i1!]ll\s*(your|my|ur)?\s*self\b/gi, severity: "high" },
  { pattern: /\bkys\b/gi, severity: "high" },
  { pattern: /\bst[a@]lk/gi, severity: "high" },
  { pattern: /\bd[o0]x+/gi, severity: "high" },
  { pattern: /\bswatt?ing\b/gi, severity: "high" },
  { pattern: /\brap[e3]\b/gi, severity: "high" },
];

export type FilterLevel = "low" | "medium" | "high";

const SEVERITY_RANK: Record<string, number> = { low: 0, medium: 1, high: 2 };

export function filterMessage(
  text: string,
  level: FilterLevel = "medium"
): { filtered: string; wasFiltered: boolean } {
  const levelRank = SEVERITY_RANK[level];
  let filtered = text;
  let wasFiltered = false;

  for (const { pattern, severity } of FILTER_PATTERNS) {
    if (SEVERITY_RANK[severity] > levelRank) continue;
    const regex = new RegExp(pattern.source, pattern.flags);
    if (regex.test(filtered)) {
      wasFiltered = true;
      filtered = filtered.replace(new RegExp(pattern.source, pattern.flags), (match) =>
        "*".repeat(match.length)
      );
    }
  }

  return { filtered, wasFiltered };
}
