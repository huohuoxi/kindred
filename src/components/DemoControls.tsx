import { useState } from "react";
import {
  Clock3,
  FastForward,
  RotateCcw,
  Gavel,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../app/Provider";
import { DAY, GRACE, date } from "../domain/model";
import type { Wish } from "../domain/model";
export function DemoControls({ wish }: { wish?: Wish }) {
  const { state, run, resetDemo } = useApp();
  const [target, setTarget] = useState<number | null>(null);
  const [reset, setReset] = useState(false);
  const [rationale, setRationale] = useState("");
  const [decision, setDecision] = useState("uphold");
  const proposal = wish?.proposalId ? state.proposals[wish.proposalId] : null;
  function advance(to: number) {
    if (run({ type: "advanceClock", to })) setTarget(null);
  }
  return (
    <section className="demo-controls">
      <div className="demo-controls-title">
        <Clock3 size={19} />
        <div>
          <h3>Demo controls</h3>
          <p>Simulated time and human review. You control the story.</p>
        </div>
        <span className="demo-chip">SIMULATION</span>
      </div>
      <div className="clock-display">
        <small>SHARED DEMO CLOCK · UTC</small>
        <strong>{date(state.clock)}</strong>
        <p>
          Time advances only here. Changes affect every wish in this browser.
        </p>
      </div>
      <div className="demo-action-grid">
        {(wish
          ? [
              { label: "To event deadline", value: wish.deadline },
              {
                label: "Past evidence grace period",
                value: wish.deadline + GRACE + 60_000,
              },
              ...(proposal
                ? [
                    {
                      label: "Past review window",
                      value: proposal.reviewAt + 60_000,
                    },
                  ]
                : []),
            ]
          : [{ label: "Advance one day", value: state.clock + DAY }]
        ).map((t) => (
          <button
            key={t.label}
            className="button secondary"
            disabled={t.value <= state.clock}
            onClick={() => {
              setTarget(t.value);
              setReset(false);
            }}
          >
            <FastForward size={15} />
            {t.label}
          </button>
        ))}
      </div>
      {target && (
        <div className="confirmation" role="status">
          <strong>Move the clock forward for all wishes?</strong>
          <p>
            New simulated time: <b>{date(target)}</b>. Enrollment deadlines may
            close. Time cannot move backward. No funds move automatically.
          </p>
          <div className="button-row">
            <button className="button primary" onClick={() => advance(target)}>
              Confirm time advance
            </button>
            <button
              className="button secondary"
              onClick={() => setTarget(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {wish && proposal && wish.status === "under_review" && (
        <div className="review-control">
          <h4>
            <ShieldCheck size={17} />
            Simulated human reviewer
          </h4>
          <p>
            {state.clock < proposal.reviewAt
              ? `Objections remain open until ${date(proposal.reviewAt)}.`
              : "The objection window has ended. Finalizing will settle this wish exactly once."}
          </p>
          <button
            className="button primary"
            disabled={state.clock < proposal.reviewAt}
            onClick={() => run({ type: "finalizeProposal", wishId: wish.id })}
          >
            Finalize{" "}
            {proposal.outcome === "success"
              ? "YES · send gifts"
              : "NO · refund creator"}
          </button>
        </div>
      )}
      {wish?.status === "disputed" && (
        <div className="review-control">
          <h4>
            <Gavel size={17} />
            Simulated human arbitrator
          </h4>
          <p>
            Normal finalization is blocked. Review the evidence and objections,
            then record a reasoned decision.
          </p>
          <label className="field">
            Decision
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            >
              <option value="uphold">Uphold proposal and settle</option>
              <option value="reject">
                Reject proposal and keep funds held
              </option>
            </select>
          </label>
          <label className="field">
            Rationale
            <textarea
              rows={3}
              minLength={5}
              maxLength={1000}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Explain this simulated decision…"
            />
          </label>
          <button
            className="button primary"
            disabled={rationale.trim().length < 5}
            onClick={() => {
              if (
                run({
                  type: "arbitrateProposal",
                  wishId: wish.id,
                  uphold: decision === "uphold",
                  rationale,
                })
              )
                setRationale("");
            }}
          >
            Record arbitration decision
          </button>
          <small>
            Rejecting never reopens enrollment. After the evidence cutoff, only
            a new NO proposal may be submitted. This is simplified demo
            governance.
          </small>
        </div>
      )}
      <div className="reset-row">
        <button
          className="text-link"
          onClick={() => {
            setReset(true);
            setTarget(null);
          }}
        >
          <RotateCcw size={14} />
          Reset demo
        </button>
        <small>Identity switching is a demo control, not authentication.</small>
      </div>
      {reset && (
        <div className="confirmation danger">
          <strong>Delete all browser-local creations and progress?</strong>
          <p>
            This restores a fresh seed demo and resets the clock. This action
            cannot be undone.
          </p>
          <div className="button-row">
            <button
              className="button danger-button"
              onClick={() => {
                setReset(false);
                resetDemo();
              }}
            >
              Delete local progress & reset
            </button>
            <button
              className="button secondary"
              onClick={() => setReset(false)}
            >
              Keep my progress
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
