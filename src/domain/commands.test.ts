import { describe, expect, it } from "vitest";
import { createSeed } from "../data/seed";
import { execute, assertIntegrity, allocate } from "./commands";
import {
  parseMoney,
  balance,
  wallet,
  escrow,
  DAY,
  GRACE,
  REVIEW,
  key,
} from "./model";
import type { AppState, Command, Terms, Distribution } from "./model";
import { restore } from "../lib/persistence";
const NOW = Date.UTC(2026, 9, 27, 12);
const terms = (
  d: Distribution = { mode: "first", perPerson: 1000, slots: 3 },
): Terms => ({
  title: "Our test promise",
  story: "A precise illustrative promise for a test.",
  condition: "The fictional team records ten trees planted.",
  category: "Community",
  deadline: NOW + DAY,
  criteria: "A dated signed project log naming all ten tree locations.",
  source: "https://example.org/log",
  distribution: d,
});
let counter = 0;
function command(
  s: AppState,
  c: Omit<Command, "id" | "actor"> | Record<string, unknown>,
  actor = "maya",
  id = `test-${++counter}`,
) {
  return execute(s, { ...c, actor, id } as Command);
}
function funded(d?: Distribution) {
  return command(createSeed(NOW), {
    type: "commitWish",
    wishId: "test-wish",
    terms: terms(d),
  });
}
function join(s: AppState, actor = "alex") {
  return command(s, { type: "joinWish", wishId: "test-wish" }, actor);
}
function propose(s: AppState, outcome: "success" | "failure" = "success") {
  return command(s, {
    type: "submitProposal",
    wishId: "test-wish",
    outcome,
    summary: "The illustrative signed log confirms the condition.",
    url: "https://example.org/log",
    occurredAt: NOW,
  });
}
function advance(s: AppState, to: number) {
  return command(s, { type: "advanceClock", to });
}
function finish(s: AppState) {
  const p = s.proposals[s.wishes["test-wish"].proposalId!];
  return command(advance(s, p.reviewAt), {
    type: "finalizeProposal",
    wishId: "test-wish",
  });
}
describe("money and funding", () => {
  it("parses cents from strings without floating point multiplication", () => {
    expect(parseMoney("0.29")).toBe(29);
    expect(parseMoney(" 12.1 ")).toBe(1210);
    expect(parseMoney("0.01")).toBe(1);
  });
  it.each([
    "0",
    "-1",
    "1.001",
    "1e3",
    "NaN",
    "",
    ".5",
    "1,000",
    "1000001",
    "01.00",
  ])("rejects invalid monetary input %s", (value) =>
    expect(() => parseMoney(value)).toThrow(),
  );
  it("seeds a coherent ledger and correct success receipt", () => {
    const s = createSeed(NOW);
    assertIntegrity(s);
    expect(s.wishes["the-library-lives-on"].receipt).toMatchObject({
      gifted: 2500,
      refunded: 1250,
      outcome: "success",
    });
    expect(Object.keys(s.wishes)).toHaveLength(6);
  });
  it("funds exact cents atomically and deduplicates a repeated command ID", () => {
    const before = createSeed(NOW);
    const c = { type: "commitWish", wishId: "test-wish", terms: terms() };
    const after = command(before, c, "maya", "fund-once");
    expect(
      balance(before, wallet("maya")) - balance(after, wallet("maya")),
    ).toBe(3000);
    expect(balance(after, escrow("test-wish"))).toBe(3000);
    expect(command(after, c, "maya", "fund-once")).toBe(after);
    expect(before.wishes["test-wish"]).toBeUndefined();
  });
  it("rejects insufficient balance and invalid terms without changes", () => {
    const s = createSeed(NOW);
    const saved = JSON.stringify(s);
    expect(() =>
      command(s, {
        type: "commitWish",
        wishId: "test-wish",
        terms: terms({ mode: "split", pool: 100001 }),
      }),
    ).toThrow(/Not enough/);
    expect(() =>
      command(s, {
        type: "commitWish",
        wishId: "test-wish",
        terms: { ...terms(), title: " " },
      }),
    ).toThrow();
    expect(JSON.stringify(s)).toBe(saved);
  });
  it("rejects non-HTTP evidence sources and personal self-gifts", () => {
    expect(() =>
      command(createSeed(NOW), {
        type: "commitWish",
        wishId: "x",
        terms: { ...terms(), source: "javascript:alert(1)" },
      }),
    ).toThrow();
    expect(() =>
      funded({ mode: "personal", amount: 100, recipient: "maya" }),
    ).toThrow(/recipient/);
  });
});
describe("free enrollment and distribution", () => {
  it("joins for free, rejects duplicate and self enrollment", () => {
    const s = funded();
    const after = join(s);
    expect(after.ledger).toEqual(s.ledger);
    expect(balance(s, wallet("alex"))).toBe(balance(after, wallet("alex")));
    expect(() => join(after)).toThrow(/already joined/);
    expect(() => join(s, "maya")).toThrow(/Creators/);
  });
  it("rejects full and late enrollment at exact deadline", () => {
    const s = join(funded({ mode: "first", perPerson: 1, slots: 1 }));
    expect(() => join(s, "jordan")).toThrow(/filled/);
    const late = advance(funded(), NOW + DAY);
    expect(late.wishes["test-wish"].closedAt).toBe(NOW + DAY);
    expect(() => join(late)).toThrow(/closed/);
  });
  it("orders same-clock joins monotonically", () => {
    const s = join(join(funded()), "jordan");
    const a = s.participations[key("test-wish", "alex")];
    const j = s.participations[key("test-wish", "jordan")];
    expect(a.at).toBe(j.at);
    expect(a.sequence).toBeLessThan(j.sequence);
  });
  it("returns unused first-N slots and empties escrow", () => {
    const s = finish(propose(join(funded())));
    expect(s.wishes["test-wish"].receipt).toMatchObject({
      gifted: 1000,
      refunded: 2000,
      outcome: "success",
    });
    expect(balance(s, escrow("test-wish"))).toBe(0);
    assertIntegrity(s);
  });
  it("keeps outcome successful with zero recipients and returns whole pool", () => {
    const s = finish(propose(funded({ mode: "split", pool: 1000 })));
    expect(s.wishes["test-wish"].receipt).toMatchObject({
      outcome: "success",
      gifted: 0,
      refunded: 1000,
      payments: [],
    });
  });
  it("equal split deterministically assigns leftover cents in join order", () => {
    const s = join(join(funded({ mode: "split", pool: 1001 })), "jordan");
    const r = finish(propose(s)).wishes["test-wish"].receipt!;
    expect(r.payments).toEqual([
      { user: "alex", cents: 501 },
      { user: "jordan", cents: 500 },
    ]);
  });
  it("demonstrates the exact three-person split and honest zero-cent shares", () => {
    const s = join(join(funded({ mode: "split", pool: 1000 })), "jordan");
    s.participations.extra = {
      wish: "test-wish",
      user: "illustrative-third",
      sequence: 100,
      at: NOW,
    };
    expect(
      allocate(s, s.wishes["test-wish"], "success").payments.map(
        (p) => p.cents,
      ),
    ).toEqual([334, 333, 333]);
    s.wishes["test-wish"].committed = 1;
    expect(
      allocate(s, s.wishes["test-wish"], "success").payments.map(
        (p) => p.cents,
      ),
    ).toEqual([1, 0, 0]);
  });
  it("pays only the designated person without public enrollment", () => {
    const s = funded({ mode: "personal", recipient: "alex", amount: 2301 });
    expect(() => join(s)).toThrow(/designated/);
    const after = finish(propose(s));
    expect(after.wishes["test-wish"].receipt?.payments).toEqual([
      { user: "alex", cents: 2301 },
    ]);
    expect(after.wishes["test-wish"].receipt?.refunded).toBe(0);
  });
  it("following is reversible and never changes recipients or money, including settled wishes", () => {
    const s = finish(propose(join(funded())));
    const a = command(s, { type: "toggleFollow", wishId: "test-wish" });
    const b = command(a, { type: "toggleFollow", wishId: "test-wish" });
    expect(b.follows).toEqual(s.follows);
    expect(b.ledger).toEqual(s.ledger);
    expect(b.participations).toEqual(s.participations);
  });
});
describe("evidence clock and lifecycle", () => {
  it("rejects future or after-deadline occurrence times", () => {
    const s = advance(funded(), NOW + 2 * DAY);
    for (const occurredAt of [NOW + DAY + 1, s.clock + 1, NOW - 1])
      expect(() =>
        command(s, {
          type: "submitProposal",
          wishId: "test-wish",
          outcome: "success",
          summary: "Detailed valid summary",
          url: "https://example.org",
          occurredAt,
        }),
      ).toThrow(/Occurrence/);
  });
  it("YES allows exact deadline and exact grace cutoff, but not later", () => {
    const s = advance(funded(), NOW + DAY + GRACE);
    const p = command(s, {
      type: "submitProposal",
      wishId: "test-wish",
      outcome: "success",
      summary: "Detailed valid summary",
      url: "https://example.org",
      occurredAt: NOW + DAY,
    });
    expect(p.wishes["test-wish"].status).toBe("under_review");
    expect(() => propose(advance(s, s.clock + 1))).toThrow(/closed/);
  });
  it("NO is rejected through grace cutoff; time advancement never settles", () => {
    const start = funded();
    const cutoff = advance(start, NOW + DAY + GRACE);
    expect(() => propose(cutoff, "failure")).toThrow(/only after/);
    const s = propose(advance(cutoff, cutoff.clock + 1), "failure");
    expect(s.wishes["test-wish"].status).toBe("under_review");
    expect(balance(s, escrow("test-wish"))).toBe(3000);
  });
  it("failure refunds all funds after review and conserves principal", () => {
    const s = finish(
      propose(advance(join(funded()), NOW + DAY + GRACE + 1), "failure"),
    );
    expect(s.wishes["test-wish"].receipt).toMatchObject({
      outcome: "failure",
      gifted: 0,
      refunded: 3000,
    });
    assertIntegrity(s);
  });
  it("proposing freezes enrollment even before the deadline", () => {
    const s = propose(funded());
    expect(s.wishes["test-wish"].closedAt).toBe(NOW);
    expect(() => join(s)).toThrow(/closed/);
  });
  it("requires a full review window; exact review boundary finalizes and ends objections", () => {
    const s = propose(join(funded()));
    const p = s.proposals[s.wishes["test-wish"].proposalId!];
    expect(() =>
      command(s, { type: "finalizeProposal", wishId: "test-wish" }),
    ).toThrow(/not ended/);
    const atReview = advance(s, p.reviewAt);
    expect(() =>
      command(
        atReview,
        {
          type: "objectToProposal",
          wishId: "test-wish",
          reason: "Reasoned objection",
        },
        "alex",
      ),
    ).toThrow(/closed/);
    expect(
      command(atReview, { type: "finalizeProposal", wishId: "test-wish" })
        .wishes["test-wish"].status,
    ).toBe("settled");
  });
  it("eligible objections hold all funds, reject duplicate or outsider objections, and block finalization", () => {
    const s = propose(join(funded()));
    expect(() =>
      command(
        s,
        {
          type: "objectToProposal",
          wishId: "test-wish",
          reason: "Reasoned objection",
        },
        "jordan",
      ),
    ).toThrow(/Only/);
    const a = command(
      s,
      {
        type: "objectToProposal",
        wishId: "test-wish",
        reason: "The source is incomplete.",
      },
      "alex",
    );
    expect(a.ledger).toEqual(s.ledger);
    expect(a.wishes["test-wish"].status).toBe("disputed");
    expect(() =>
      command(
        a,
        {
          type: "objectToProposal",
          wishId: "test-wish",
          reason: "Second objection",
        },
        "alex",
      ),
    ).toThrow(/already/);
    expect(() =>
      command(advance(a, a.clock + REVIEW), {
        type: "finalizeProposal",
        wishId: "test-wish",
      }),
    ).toThrow(/blocks/);
  });
  it("arbitration can uphold and settle the exact proposed outcome", () => {
    const s = command(
      propose(join(funded())),
      {
        type: "objectToProposal",
        wishId: "test-wish",
        reason: "The source is incomplete.",
      },
      "alex",
    );
    const a = command(s, {
      type: "arbitrateProposal",
      wishId: "test-wish",
      uphold: true,
      rationale: "The dated log fulfills every condition.",
    });
    expect(a.wishes["test-wish"].status).toBe("settled");
    assertIntegrity(a);
  });
  it("rejection archives a proposal and never reopens enrollment", () => {
    const a = command(propose(join(funded())), {
      type: "objectToProposal",
      wishId: "test-wish",
      reason: "The source is incomplete.",
    });
    const b = command(a, {
      type: "arbitrateProposal",
      wishId: "test-wish",
      uphold: false,
      rationale: "Required dates are missing.",
    });
    expect(b.wishes["test-wish"]).toMatchObject({
      status: "open",
      proposalId: null,
      closedAt: NOW,
    });
    expect(() => join(b, "jordan")).toThrow(/closed/);
    expect(
      Object.values(b.proposals).some(
        (p) => p.wish === "test-wish" && p.rejected,
      ),
    ).toBe(true);
    expect(propose(b).wishes["test-wish"].status).toBe("under_review");
  });
  it("a rejected YES after cutoff admits only NO; rejected NO can be proposed again", () => {
    let s = command(propose(join(funded())), {
      type: "objectToProposal",
      wishId: "test-wish",
      reason: "Missing dated record.",
    });
    s = advance(s, NOW + DAY + GRACE + 1);
    s = command(s, {
      type: "arbitrateProposal",
      wishId: "test-wish",
      uphold: false,
      rationale: "The required record is missing.",
    });
    expect(() => propose(s)).toThrow(/closed/);
    s = propose(s, "failure");
    s = command(s, {
      type: "objectToProposal",
      wishId: "test-wish",
      reason: "A review is still required.",
    });
    s = command(s, {
      type: "arbitrateProposal",
      wishId: "test-wish",
      uphold: false,
      rationale: "Reconsider this illustrative outcome.",
    });
    expect(propose(s, "failure").wishes["test-wish"].status).toBe(
      "under_review",
    );
  });
  it("clock never moves backwards", () =>
    expect(() => advance(funded(), NOW - 1)).toThrow(/forward/));
  it("reload preserves settlement, prevents repeated payouts, and rejects new mutations", () => {
    const s = restore(JSON.stringify(finish(propose(join(funded())))));
    const saved = JSON.stringify(s);
    for (const type of ["finalizeProposal", "joinWish", "submitProposal"])
      expect(() => command(s, { type, wishId: "test-wish" })).toThrow(
        /settled/,
      );
    expect(JSON.stringify(s)).toBe(saved);
    assertIntegrity(s);
  });
});
describe("persistence and corruption recovery", () => {
  it("deduplicates the same settlement command after restoring saved state", () => {
    let s = propose(join(funded()));
    s = advance(s, s.proposals[s.wishes["test-wish"].proposalId!].reviewAt);
    const c = { type: "finalizeProposal", wishId: "test-wish" };
    s = command(s, c, "maya", "settlement-once");
    const saved = restore(JSON.stringify(s));
    expect(command(saved, c, "maya", "settlement-once")).toBe(saved);
    expect(
      saved.ledger.filter(
        (t) => t.wish === "test-wish" && t.kind === "settlement",
      ),
    ).toHaveLength(1);
  });
  it("restores the complete seed and custom progress", () => {
    const s = join(funded());
    expect(restore(JSON.stringify(s))).toEqual(s);
  });
  it.each(["{", "{}", '{"version":99}'])(
    "rejects incompatible or malformed state %s",
    (raw) => expect(() => restore(raw)).toThrow(),
  );
  it("rejects valid-shaped tampered ledger and receipt data", () => {
    const s = createSeed(NOW);
    s.ledger[0].entries[1].cents++;
    expect(() => restore(JSON.stringify(s))).toThrow();
    const settled = finish(propose(join(funded())));
    settled.wishes["test-wish"].receipt!.gifted++;
    expect(() => restore(JSON.stringify(settled))).toThrow();
  });
  it("preserves conservation through success, failure, disputes, and unused-slot refunds", () => {
    let s = join(funded());
    s = finish(propose(s));
    s = advance(s, s.clock + 10 * DAY);
    assertIntegrity(s);
    const total =
      Object.keys(s.users).reduce((n, u) => n + balance(s, wallet(u)), 0) +
      Object.keys(s.wishes).reduce((n, w) => n + balance(s, escrow(w)), 0);
    expect(total).toBe(300000);
  });
});
