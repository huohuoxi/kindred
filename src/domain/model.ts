import { z } from "zod";
export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
export const GRACE = 72 * HOUR;
export const REVIEW = 24 * HOUR;
export const categories = [
  "Community",
  "Personal goals",
  "Science",
  "Sports",
  "Culture",
] as const;
const cents = z.number().int().nonnegative().max(100_000_000);
const time = z.number().int().nonnegative().max(8_000_000_000_000_000);
export const httpUrl = z
  .string()
  .max(2000)
  .refine((value) => {
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Enter a valid HTTP(S) URL.");
const text = (min: number, max: number) => z.string().trim().min(min).max(max);
export const distributionSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("first"),
    perPerson: cents.positive(),
    slots: z.number().int().min(1).max(1000),
  }),
  z.object({ mode: z.literal("split"), pool: cents.positive() }),
  z.object({
    mode: z.literal("personal"),
    amount: cents.positive(),
    recipient: text(1, 60),
  }),
]);
export const termsSchema = z.object({
  title: text(5, 100),
  story: text(10, 800),
  category: z.enum(categories),
  condition: text(10, 500),
  deadline: time,
  criteria: text(10, 800),
  source: httpUrl,
  distribution: distributionSchema,
});
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  selectable: z.boolean(),
});
const receiptSchema = z.object({
  at: time,
  outcome: z.enum(["success", "failure"]),
  gifted: cents,
  refunded: cents,
  payments: z.array(z.object({ user: z.string(), cents })),
  note: z.string(),
});
const wishSchema = termsSchema.extend({
  id: z.string(),
  creator: z.string(),
  committed: cents.positive(),
  status: z.enum(["open", "under_review", "disputed", "settled"]),
  createdAt: time,
  seeded: z.boolean(),
  closedAt: time.nullable(),
  proposalId: z.string().nullable(),
  receipt: receiptSchema.nullable(),
});
const participationSchema = z.object({
  wish: z.string(),
  user: z.string(),
  at: time,
  sequence: z.number().int().positive(),
});
const proposalSchema = z.object({
  id: z.string(),
  wish: z.string(),
  proposer: z.string(),
  outcome: z.enum(["success", "failure"]),
  summary: z.string(),
  url: z.string(),
  occurredAt: time.nullable(),
  createdAt: time,
  reviewAt: time,
  objections: z.array(
    z.object({ user: z.string(), reason: z.string(), at: time }),
  ),
  history: z.array(
    z.object({
      actor: z.string(),
      action: z.enum(["upheld", "rejected", "finalized"]),
      rationale: z.string(),
      at: time,
    }),
  ),
  rejected: z.boolean(),
});
const transactionSchema = z.object({
  id: z.string(),
  commandId: z.string(),
  wish: z.string().nullable(),
  at: time,
  kind: z.enum(["opening", "commitment", "settlement"]),
  entries: z.array(z.object({ account: z.string(), cents: z.number().int() })),
});
export const stateSchema = z.object({
  version: z.literal(1),
  clock: time,
  currentUser: z.string(),
  users: z.record(z.string(), userSchema),
  wishes: z.record(z.string(), wishSchema),
  participations: z.record(z.string(), participationSchema),
  follows: z.array(z.string()),
  proposals: z.record(z.string(), proposalSchema),
  ledger: z.array(transactionSchema),
  activities: z.array(
    z.object({
      id: z.string(),
      wish: z.string(),
      actor: z.string(),
      at: time,
      text: z.string(),
    }),
  ),
  applied: z.array(z.string()),
  joinSequence: z.number().int().nonnegative(),
});
export type Distribution = z.infer<typeof distributionSchema>;
export type Terms = z.infer<typeof termsSchema>;
export type Wish = z.infer<typeof wishSchema>;
export type User = z.infer<typeof userSchema>;
export type Proposal = z.infer<typeof proposalSchema>;
export type Receipt = z.infer<typeof receiptSchema>;
export type AppState = z.infer<typeof stateSchema>;
export type Command = { id: string; actor: string } & (
  | { type: "commitWish"; wishId: string; terms: Terms; seeded?: boolean }
  | { type: "joinWish"; wishId: string }
  | { type: "toggleFollow"; wishId: string }
  | {
      type: "submitProposal";
      wishId: string;
      outcome: "success" | "failure";
      summary: string;
      url: string;
      occurredAt: number | null;
    }
  | { type: "objectToProposal"; wishId: string; reason: string }
  | { type: "finalizeProposal"; wishId: string }
  | {
      type: "arbitrateProposal";
      wishId: string;
      uphold: boolean;
      rationale: string;
    }
  | { type: "advanceClock"; to: number }
  | { type: "switchUser"; user: string }
);
export type CommandInput = Command extends infer C
  ? C extends Command
    ? Omit<C, "id" | "actor">
    : never
  : never;
export const wallet = (id: string) => `wallet:${id}`;
export const escrow = (id: string) => `escrow:${id}`;
export const key = (wish: string, user: string) => `${wish}:${user}`;
export function balance(s: AppState, account: string): number {
  return s.ledger.reduce(
    (sum, tx) =>
      sum +
      tx.entries
        .filter((e) => e.account === account)
        .reduce((n, e) => n + e.cents, 0),
    0,
  );
}
export function participants(s: AppState, wish: string) {
  return Object.values(s.participations)
    .filter((p) => p.wish === wish)
    .sort((a, b) => a.sequence - b.sequence);
}
export function commitment(d: Distribution) {
  return d.mode === "first"
    ? d.perPerson * d.slots
    : d.mode === "split"
      ? d.pool
      : d.amount;
}
export function enrollmentOpen(s: AppState, w: Wish) {
  return w.status === "open" && w.closedAt === null && s.clock < w.deadline;
}
export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value % 100 ? 2 : 0,
  }).format(value / 100);
}
export function parseMoney(input: string): number {
  const value = input.trim();
  if (!/^(0|[1-9]\d{0,6})(\.\d{1,2})?$/.test(value))
    throw new Error(
      "Use a positive USD amount with at most two decimal places.",
    );
  const [dollars, fraction = ""] = value.split(".");
  const result = Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));
  if (result <= 0 || result > 100_000_000)
    throw new Error("Gift amounts must be between $0.01 and $1,000,000.");
  return result;
}
export function distributionText(d: Distribution) {
  return d.mode === "first"
    ? `${money(d.perPerson)} each · first ${d.slots} people`
    : d.mode === "split"
      ? "Shared equally among everyone who joins"
      : `A personal gift for ${d.recipient.charAt(0).toUpperCase() + d.recipient.slice(1)}`;
}
export function badge(w: Wish) {
  if (w.status === "settled")
    return w.receipt?.outcome === "failure"
      ? "Refunded"
      : w.receipt?.gifted === 0
        ? "Condition met · funds returned"
        : "Gifts sent";
  return w.status === "under_review"
    ? "Evidence in review"
    : w.status === "disputed"
      ? "Under dispute"
      : w.closedAt !== null
        ? "Awaiting resolution"
        : w.distribution.mode === "personal"
          ? "Personal gift"
          : "Open to join";
}
export function date(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(value);
}
export const dateInput = (value: number) =>
  new Date(value).toISOString().slice(0, 16);
export const fromDateInput = (value: string) => Date.parse(`${value}:00Z`);
