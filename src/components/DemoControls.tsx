import { useLocale } from "../i18n/context";
import { useState } from "react";
import {
  Clock3,
  FastForward,
  RotateCcw,
  Gavel,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../app/Provider";
import { DAY, GRACE } from "../domain/model";
import type { Wish } from "../domain/model";
export function DemoControls({ wish }: { wish?: Wish }) {
  const { t, date } = useLocale();
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
          <h3>{t("Demo controls")}</h3>
          <p>{t("Simulated time and human review. You control the story.")}</p>
        </div>
        <span className="demo-chip">{t("SIMULATION")}</span>
      </div>
      <div className="clock-display">
        <small>{t("SHARED DEMO CLOCK \u00B7 UTC")}</small>
        <strong>{t(date(state.clock))}</strong>
        <p>
          {t(
            "Time advances only here. Changes affect every wish in this browser.",
          )}
        </p>
      </div>
      <div className="demo-action-grid">
        {(wish
          ? [
              { label: "To event deadline", value: wish.deadline },
              {
                label: "Past evidence grace period",
                value: wish.deadline + GRACE + 60000,
              },
              ...(proposal
                ? [
                    {
                      label: "Past review window",
                      value: proposal.reviewAt + 60000,
                    },
                  ]
                : []),
            ]
          : [{ label: "Advance one day", value: state.clock + DAY }]
        ).map((clockTarget) => (
          <button
            key={clockTarget.label}
            className="button secondary"
            disabled={clockTarget.value <= state.clock}
            onClick={() => {
              setTarget(clockTarget.value);
              setReset(false);
            }}
          >
            <FastForward size={15} />
            {t(clockTarget.label)}
          </button>
        ))}
      </div>
      {target && (
        <div className="confirmation" role="status">
          <strong>{t("Move the clock forward for all wishes?")}</strong>
          <p>
            {t("New simulated time: ")}
            <b>{t(date(target))}</b>
            {t(
              ". Enrollment deadlines may close. Time cannot move backward. No funds move automatically.",
            )}
          </p>
          <div className="button-row">
            <button className="button primary" onClick={() => advance(target)}>
              {t("Confirm time advance")}
            </button>
            <button
              className="button secondary"
              onClick={() => setTarget(null)}
            >
              {t("Cancel")}
            </button>
          </div>
        </div>
      )}
      {wish && proposal && wish.status === "under_review" && (
        <div className="review-control">
          <h4>
            <ShieldCheck size={17} />
            {t("Simulated human reviewer")}
          </h4>
          <p>
            {t(
              state.clock < proposal.reviewAt
                ? `Objections remain open until ${date(proposal.reviewAt)}.`
                : "The objection window has ended. Finalizing will settle this wish exactly once.",
            )}
          </p>
          <button
            className="button primary"
            disabled={state.clock < proposal.reviewAt}
            onClick={() => run({ type: "finalizeProposal", wishId: wish.id })}
          >
            {t("Finalize")}
            {t(" ")}
            {t(
              proposal.outcome === "success"
                ? "YES · send gifts"
                : "NO · refund creator",
            )}
          </button>
        </div>
      )}
      {wish?.status === "disputed" && (
        <div className="review-control">
          <h4>
            <Gavel size={17} />
            {t("Simulated human arbitrator")}
          </h4>
          <p>
            {t(
              "Normal finalization is blocked. Review the evidence and objections, then record a reasoned decision.",
            )}
          </p>
          <label className="field">
            {t("Decision")}
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            >
              <option value="uphold">{t("Uphold proposal and settle")}</option>
              <option value="reject">
                {t("Reject proposal and keep funds held")}
              </option>
            </select>
          </label>
          <label className="field">
            {t("Rationale")}
            <textarea
              rows={3}
              minLength={5}
              maxLength={1000}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder={t("Explain this simulated decision…")}
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
            {t("Record arbitration decision")}
          </button>
          <small>
            {t(
              "Rejecting never reopens enrollment. After the evidence cutoff, only a new NO proposal may be submitted. This is simplified demo governance.",
            )}
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
          {t("Reset demo")}
        </button>
        <small>
          {t("Identity switching is a demo control, not authentication.")}
        </small>
      </div>
      {reset && (
        <div className="confirmation danger">
          <strong>
            {t("Delete all browser-local creations and progress?")}
          </strong>
          <p>
            {t(
              "This restores a fresh seed demo and resets the clock. This action cannot be undone.",
            )}
          </p>
          <div className="button-row">
            <button
              className="button danger-button"
              onClick={() => {
                setReset(false);
                resetDemo();
              }}
            >
              {t("Delete local progress & reset")}
            </button>
            <button
              className="button secondary"
              onClick={() => setReset(false)}
            >
              {t("Keep my progress")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
