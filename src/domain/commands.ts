import {
  commitment,
  balance,
  wallet,
  escrow,
  key,
  participants,
  enrollmentOpen,
  termsSchema,
  stateSchema,
  httpUrl,
  GRACE,
  REVIEW,
} from "./model";
import type { AppState, Command, Wish, Receipt } from "./model";
function requireThat(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
export function allocate(
  s: AppState,
  w: Wish,
  outcome: "success" | "failure",
): Receipt {
  const people = participants(s, w.id);
  let payments: { user: string; cents: number }[] = [];
  const d = w.distribution;
  if (outcome === "success") {
    if (d.mode === "personal")
      payments = [{ user: d.recipient, cents: w.committed }];
    else if (people.length)
      payments = people.map((p, i) => ({
        user: p.user,
        cents:
          d.mode === "first"
            ? d.perPerson
            : Math.floor(w.committed / people.length) +
              (i < w.committed % people.length ? 1 : 0),
      }));
  }
  const gifted = payments.reduce((sum, p) => sum + p.cents, 0);
  return {
    at: s.clock,
    outcome,
    payments,
    gifted,
    refunded: w.committed - gifted,
    note:
      outcome === "failure"
        ? "Condition not met; all funds returned."
        : !payments.length
          ? "Condition met; no eligible recipients; funds returned."
          : w.distribution.mode === "first"
            ? "Condition met; gifts sent. Unused slots returned to the creator."
            : "Condition met; gifts sent to eligible recipients.",
  };
}
export function execute(state: AppState, c: Command): AppState {
  if (state.applied.includes(c.id)) return state;
  requireThat(c.id.length > 0, "A command ID is required.");
  requireThat(
    state.users[c.actor]?.selectable,
    "Choose a fictional demo person.",
  );
  const s = structuredClone(state);
  const activity = (wish: string, text: string) =>
    s.activities.push({
      id: `${c.id}:${wish}:activity`,
      wish,
      actor: c.actor,
      at: s.clock,
      text,
    });
  const transfer = (
    kind: "commitment" | "settlement",
    wish: string,
    entries: { account: string; cents: number }[],
  ) =>
    s.ledger.push({
      id: `${c.id}:tx`,
      commandId: c.id,
      wish,
      at: s.clock,
      kind,
      entries,
    });
  if (c.type === "switchUser") {
    requireThat(
      s.users[c.user]?.selectable,
      "That demo person is unavailable.",
    );
    s.currentUser = c.user;
  } else if (c.type === "advanceClock") {
    requireThat(
      Number.isSafeInteger(c.to) &&
        c.to > s.clock &&
        c.to <= 8_000_000_000_000_000,
      "The demo clock can only move forward to a valid time.",
    );
    s.clock = c.to;
    for (const w of Object.values(s.wishes))
      if (w.closedAt === null && s.clock >= w.deadline) {
        w.closedAt = w.deadline;
        activity(w.id, "Enrollment closed at the event deadline.");
      }
  } else if (c.type === "commitWish") {
    const parsed = termsSchema.safeParse(c.terms);
    requireThat(
      parsed.success,
      parsed.error?.issues[0]?.message || "Check your promise details.",
    );
    const t = parsed.data;
    requireThat(
      t.deadline > s.clock,
      "Choose a future deadline relative to the demo clock.",
    );
    requireThat(
      !s.wishes[c.wishId] && /^[a-zA-Z0-9-]+$/.test(c.wishId),
      "This wish ID is unavailable.",
    );
    const amount = commitment(t.distribution);
    requireThat(
      Number.isSafeInteger(amount) && amount > 0 && amount <= 100_000_000,
      "The total commitment is too large.",
    );
    if (t.distribution.mode === "personal")
      requireThat(
        s.users[t.distribution.recipient]?.selectable &&
          t.distribution.recipient !== c.actor,
        "Choose a designated recipient other than the creator.",
      );
    requireThat(
      balance(s, wallet(c.actor)) >= amount,
      "Not enough available demo funds.",
    );
    s.wishes[c.wishId] = {
      ...t,
      id: c.wishId,
      creator: c.actor,
      committed: amount,
      status: "open",
      createdAt: s.clock,
      seeded: c.seeded ?? false,
      closedAt: null,
      proposalId: null,
      receipt: null,
    };
    transfer("commitment", c.wishId, [
      { account: wallet(c.actor), cents: -amount },
      { account: escrow(c.wishId), cents: amount },
    ]);
    activity(
      c.wishId,
      "Created this promise and committed the full gift in demo funds.",
    );
  } else {
    const w = s.wishes[c.wishId];
    requireThat(w, "This wish could not be found.");
    if (c.type === "toggleFollow") {
      const followKey = key(w.id, c.actor);
      s.follows = s.follows.includes(followKey)
        ? s.follows.filter((x) => x !== followKey)
        : [...s.follows, followKey];
    } else {
      requireThat(
        w.status !== "settled",
        "This wish is settled. Its outcome, recipients, and funds are locked.",
      );
      if (c.type === "joinWish") {
        requireThat(
          w.distribution.mode !== "personal",
          "This gift has one designated recipient.",
        );
        requireThat(
          c.actor !== w.creator,
          "Creators cannot join their own wish.",
        );
        requireThat(
          !s.participations[key(w.id, c.actor)],
          "You have already joined.",
        );
        requireThat(
          enrollmentOpen(s, w),
          "Enrollment has closed and will not reopen.",
        );
        requireThat(
          w.distribution.mode !== "first" ||
            participants(s, w.id).length < w.distribution.slots,
          "All recipient slots are filled.",
        );
        s.joinSequence++;
        s.participations[key(w.id, c.actor)] = {
          wish: w.id,
          user: c.actor,
          at: s.clock,
          sequence: s.joinSequence,
        };
        activity(w.id, "Joined for free. No demo funds were debited.");
      } else if (c.type === "submitProposal") {
        requireThat(
          w.status === "open" && !w.proposalId,
          "A proposal is already active.",
        );
        requireThat(
          ["success", "failure"].includes(c.outcome),
          "Choose a valid proposal outcome.",
        );
        if (c.outcome === "success") {
          requireThat(
            s.clock <= w.deadline + GRACE,
            "The 72-hour evidence submission window has closed.",
          );
          requireThat(
            c.summary.trim().length >= 10 && c.summary.trim().length <= 1500,
            "Provide an evidence summary of 10–1,500 characters.",
          );
          requireThat(
            httpUrl.safeParse(c.url).success,
            "Evidence requires a valid HTTP(S) source URL.",
          );
          requireThat(
            c.occurredAt !== null &&
              Number.isSafeInteger(c.occurredAt) &&
              c.occurredAt >= w.createdAt &&
              c.occurredAt <= Math.min(s.clock, w.deadline),
            "Occurrence must be during this wish, no later than the demo clock and event deadline.",
          );
        } else
          requireThat(
            s.clock > w.deadline + GRACE,
            "A NO proposal is available only after the 72-hour evidence grace period.",
          );
        if (w.closedAt === null) w.closedAt = Math.min(s.clock, w.deadline);
        const proposalId = `${c.id}-proposal`;
        s.proposals[proposalId] = {
          id: proposalId,
          wish: w.id,
          proposer: c.actor,
          outcome: c.outcome,
          summary:
            c.outcome === "success"
              ? c.summary.trim()
              : "Condition not met by the deadline; evidence grace period has ended.",
          url: c.outcome === "success" ? c.url : "",
          occurredAt: c.outcome === "success" ? c.occurredAt : null,
          createdAt: s.clock,
          reviewAt: s.clock + REVIEW,
          objections: [],
          history: [],
          rejected: false,
        };
        w.proposalId = proposalId;
        w.status = "under_review";
        activity(
          w.id,
          `Proposed ${c.outcome === "success" ? "YES" : "NO"}. The 24-hour objection window is open.`,
        );
      } else {
        const p = w.proposalId ? s.proposals[w.proposalId] : null;
        requireThat(p && !p.rejected, "No active proposal.");
        if (c.type === "objectToProposal") {
          requireThat(
            (w.status === "under_review" || w.status === "disputed") &&
              s.clock < p.reviewAt,
            "The objection window has closed.",
          );
          requireThat(
            c.actor === w.creator ||
              s.participations[key(w.id, c.actor)] ||
              (w.distribution.mode === "personal" &&
                c.actor === w.distribution.recipient),
            "Only the creator or an eligible recipient can object.",
          );
          requireThat(
            !p.objections.some((o) => o.user === c.actor),
            "You already objected to this proposal.",
          );
          requireThat(
            c.reason.trim().length >= 5 && c.reason.trim().length <= 1000,
            "Give a reason of 5–1,000 characters.",
          );
          p.objections.push({
            user: c.actor,
            reason: c.reason.trim(),
            at: s.clock,
          });
          w.status = "disputed";
          activity(w.id, "Objected to the proposal. All funds remain held.");
        } else {
          if (c.type === "finalizeProposal") {
            requireThat(
              w.status === "under_review" && !p.objections.length,
              "An objection blocks normal finalization. Use simulated arbitration.",
            );
            requireThat(
              s.clock >= p.reviewAt,
              "The 24-hour objection window has not ended.",
            );
            p.history.push({
              actor: c.actor,
              action: "finalized",
              rationale:
                "Simulated human reviewer finalized after the objection window.",
              at: s.clock,
            });
          } else {
            requireThat(
              w.status === "disputed",
              "Only disputed proposals need arbitration.",
            );
            requireThat(
              c.rationale.trim().length >= 5 &&
                c.rationale.trim().length <= 1000,
              "Give an arbitration rationale of 5–1,000 characters.",
            );
            p.history.push({
              actor: c.actor,
              action: c.uphold ? "upheld" : "rejected",
              rationale: c.rationale.trim(),
              at: s.clock,
            });
            if (!c.uphold) {
              p.rejected = true;
              w.status = "open";
              w.proposalId = null;
              activity(
                w.id,
                `Proposal rejected: ${c.rationale.trim()} Enrollment remains closed.`,
              );
              s.applied.push(c.id);
              assertIntegrity(s);
              return s;
            }
          }
          const receipt = allocate(s, w, p.outcome);
          const entries = [
            { account: escrow(w.id), cents: -w.committed },
            ...receipt.payments
              .filter((x) => x.cents > 0)
              .map((x) => ({ account: wallet(x.user), cents: x.cents })),
          ];
          if (receipt.refunded)
            entries.push({
              account: wallet(w.creator),
              cents: receipt.refunded,
            });
          transfer("settlement", w.id, entries);
          w.status = "settled";
          w.receipt = receipt;
          activity(w.id, receipt.note);
        }
      }
    }
  }
  s.applied.push(c.id);
  assertIntegrity(s);
  return s;
}
export function assertIntegrity(s: AppState) {
  requireThat(
    s.users[s.currentUser]?.selectable,
    "Invalid current demo identity.",
  );
  requireThat(
    new Set(s.applied).size === s.applied.length,
    "Duplicate applied commands.",
  );
  requireThat(
    new Set(s.ledger.map((t) => t.id)).size === s.ledger.length,
    "Duplicate ledger transaction.",
  );
  const accounts: Record<string, number> = {};
  for (const tx of s.ledger) {
    requireThat(
      tx.entries.length >= 2 &&
        tx.entries.reduce((n, e) => n + e.cents, 0) === 0,
      "Unbalanced ledger transaction.",
    );
    requireThat(s.applied.includes(tx.commandId), "Ledger command is missing.");
    if (tx.wish)
      requireThat(s.wishes[tx.wish], "Ledger refers to a missing wish.");
    for (const e of tx.entries) {
      requireThat(Number.isSafeInteger(e.cents), "Invalid money in ledger.");
      requireThat(
        e.account === "source" ||
          (e.account.startsWith("wallet:") && s.users[e.account.slice(7)]) ||
          (e.account.startsWith("escrow:") && s.wishes[e.account.slice(7)]),
        "Unknown ledger account.",
      );
      accounts[e.account] = (accounts[e.account] || 0) + e.cents;
      requireThat(
        e.account === "source" || accounts[e.account] >= 0,
        "Negative wallet or escrow.",
      );
    }
  }
  requireThat(
    accounts.source === -300_000,
    "Opening credits do not reconcile.",
  );
  requireThat(
    Object.entries(accounts)
      .filter(([a]) => a !== "source")
      .reduce((n, [, b]) => n + b, 0) === 300_000,
    "Money conservation failed.",
  );
  const sequences = new Set<number>();
  for (const [k, p] of Object.entries(s.participations)) {
    const w = s.wishes[p.wish];
    requireThat(
      w &&
        s.users[p.user] &&
        p.user !== w.creator &&
        k === key(p.wish, p.user) &&
        w.distribution.mode !== "personal",
      "Invalid recipient eligibility.",
    );
    requireThat(
      p.at >= w.createdAt &&
        p.at < w.deadline &&
        (w.closedAt === null || p.at <= w.closedAt),
      "Enrollment outside its window.",
    );
    requireThat(
      !sequences.has(p.sequence) && p.sequence <= s.joinSequence,
      "Invalid enrollment sequence.",
    );
    sequences.add(p.sequence);
  }
  for (const [id, w] of Object.entries(s.wishes)) {
    requireThat(
      id === w.id &&
        s.users[w.creator] &&
        w.deadline > w.createdAt &&
        w.committed === commitment(w.distribution),
      "Invalid wish terms.",
    );
    requireThat(
      w.distribution.mode !== "personal" ||
        (s.users[w.distribution.recipient] &&
          w.distribution.recipient !== w.creator),
      "Invalid personal gift.",
    );
    requireThat(
      w.closedAt !== null || s.clock < w.deadline,
      "Missing enrollment closure.",
    );
    if (w.closedAt !== null)
      requireThat(
        w.closedAt >= w.createdAt &&
          w.closedAt <= Math.min(s.clock, w.deadline),
        "Invalid enrollment closure.",
      );
    const joins = participants(s, w.id);
    requireThat(
      w.distribution.mode !== "first" || joins.length <= w.distribution.slots,
      "Too many recipients.",
    );
    const funding = s.ledger.filter(
      (t) => t.wish === id && t.kind === "commitment",
    );
    requireThat(
      funding.length === 1 &&
        funding[0].entries.length === 2 &&
        funding[0].entries.some(
          (e) => e.account === wallet(w.creator) && e.cents === -w.committed,
        ) &&
        funding[0].entries.some(
          (e) => e.account === escrow(id) && e.cents === w.committed,
        ),
      "Invalid funding transfer.",
    );
    const settlements = s.ledger.filter(
      (t) => t.wish === id && t.kind === "settlement",
    );
    const active = w.proposalId ? s.proposals[w.proposalId] : null;
    if (w.status === "under_review" || w.status === "disputed")
      requireThat(
        active && active.wish === id && !active.rejected && w.closedAt !== null,
        "Invalid active proposal.",
      );
    if (w.status === "disputed")
      requireThat(active && active.objections.length, "Missing dispute.");
    if (w.status === "under_review")
      requireThat(
        active && !active.objections.length,
        "Dispute state mismatch.",
      );
    if (w.status === "settled") {
      const r = w.receipt;
      requireThat(
        r &&
          active &&
          r.outcome === active.outcome &&
          settlements.length === 1 &&
          balance(s, escrow(id)) === 0,
        "Invalid settlement.",
      );
      const expected = allocate(s, w, r.outcome);
      requireThat(
        r.gifted + r.refunded === w.committed &&
          r.gifted === expected.gifted &&
          r.refunded === expected.refunded &&
          JSON.stringify(r.payments) === JSON.stringify(expected.payments),
        "Receipt does not reconcile.",
      );
      const expectedEntries = [
        { account: escrow(id), cents: -w.committed },
        ...r.payments
          .filter((p) => p.cents > 0)
          .map((p) => ({ account: wallet(p.user), cents: p.cents })),
        ...(r.refunded
          ? [{ account: wallet(w.creator), cents: r.refunded }]
          : []),
      ];
      requireThat(
        JSON.stringify(settlements[0].entries) ===
          JSON.stringify(expectedEntries),
        "Receipt and ledger disagree.",
      );
    } else
      requireThat(
        !w.receipt &&
          !settlements.length &&
          balance(s, escrow(id)) === w.committed,
        "Escrow does not match commitment.",
      );
  }
  for (const [id, p] of Object.entries(s.proposals)) {
    const w = s.wishes[p.wish];
    requireThat(
      id === p.id &&
        w &&
        s.users[p.proposer] &&
        p.reviewAt === p.createdAt + REVIEW &&
        p.createdAt <= s.clock &&
        w.closedAt !== null,
      "Invalid proposal.",
    );
    if (p.outcome === "success")
      requireThat(
        httpUrl.safeParse(p.url).success &&
          p.summary.trim().length >= 10 &&
          p.occurredAt !== null &&
          p.occurredAt >= w.createdAt &&
          p.occurredAt <= Math.min(p.createdAt, w.deadline) &&
          p.createdAt <= w.deadline + GRACE,
        "Invalid evidence.",
      );
    else
      requireThat(p.createdAt > w.deadline + GRACE, "Premature NO proposal.");
    requireThat(
      new Set(p.objections.map((o) => o.user)).size === p.objections.length,
      "Duplicate objections.",
    );
    for (const o of p.objections)
      requireThat(
        s.users[o.user] &&
          o.reason.trim().length >= 5 &&
          o.at >= p.createdAt &&
          o.at < p.reviewAt &&
          (o.user === w.creator ||
            s.participations[key(w.id, o.user)] ||
            (w.distribution.mode === "personal" &&
              w.distribution.recipient === o.user)),
        "Invalid objection.",
      );
  }
  for (const f of s.follows)
    requireThat(
      Object.values(s.wishes).some((w) =>
        Object.values(s.users).some((u) => f === key(w.id, u.id)),
      ),
      "Invalid follow.",
    );
}
export function validateState(data: unknown): AppState {
  const s = stateSchema.parse(data);
  assertIntegrity(s);
  return s;
}
