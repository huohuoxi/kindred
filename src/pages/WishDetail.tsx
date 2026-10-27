import { useState } from "react";
import {
  ArrowLeft,
  Share2,
  Bookmark,
  Check,
  Clock3,
  LockKeyhole,
  ExternalLink,
  Gift,
  ShieldCheck,
  MessageSquareWarning,
  ArrowUpRight,
} from "lucide-react";
import { useApp } from "../app/Provider";
import {
  balance,
  wallet,
  escrow,
  money,
  date,
  dateInput,
  fromDateInput,
  participants,
  key,
  distributionText,
  enrollmentOpen,
  GRACE,
} from "../domain/model";
import type { Wish } from "../domain/model";
import {
  Avatar,
  Illustration,
  Status,
  Modal,
  TrustNote,
} from "../components/UI";
import { Share } from "../components/Share";
import { DemoControls } from "../components/DemoControls";
export function WishDetail({ id }: { id: string }) {
  const { state } = useApp();
  const wish = state.wishes[id];
  if (!wish)
    return (
      <div className="empty">
        <h1>This wish wandered off.</h1>
        <p>
          A custom wish exists only in the browser where it was created. Seeded
          wishes have portable links.
        </p>
        <a className="button primary" href="#/">
          Discover wishes
        </a>
      </div>
    );
  return <Detail key={wish.id} wish={wish} />;
}
function Detail({ wish: w }: { wish: Wish }) {
  const { state, run, inform } = useApp();
  const [share, setShare] = useState(() => location.hash.endsWith("?share=1"));
  const [evidence, setEvidence] = useState(false);
  const [objecting, setObjecting] = useState(false);
  const [summary, setSummary] = useState("");
  const [source, setSource] = useState(w.source);
  const [occurred, setOccurred] = useState(
    dateInput(Math.min(state.clock, w.deadline)),
  );
  const [reason, setReason] = useState("");
  const [evidenceError, setEvidenceError] = useState("");
  const user = state.currentUser;
  const creator = user === w.creator;
  const d = w.distribution;
  const people = participants(state, w.id);
  const joined = people.find((p) => p.user === user);
  const designated = d.mode === "personal" && d.recipient === user;
  const eligible = creator || !!joined || designated;
  const open = enrollmentOpen(state, w);
  const full = d.mode === "first" && people.length >= d.slots;
  const followed = state.follows.includes(key(w.id, user));
  const proposal = w.proposalId ? state.proposals[w.proposalId] : null;
  const closed = w.status === "settled";
  const receipt = w.receipt;
  const archives = Object.values(state.proposals).filter(
    (p) => p.wish === w.id && p.rejected,
  );
  const position = closed
    ? "This promise is settled. Its recipients and outcome are locked."
    : creator
      ? "You created this wish. Your gift is fully committed."
      : designated
        ? "This personal gift is for you. No enrollment needed."
        : joined
          ? `You joined for free${d.mode === "first" ? ` · recipient position ${people.findIndex((p) => p.user === user) + 1} of ${d.slots}` : ""}.`
          : d.mode === "personal"
            ? `A personal gift for ${state.users[d.recipient].name}. Public enrollment is unavailable.`
            : !open
              ? "Enrollment has closed and will not reopen."
              : full
                ? "All recipient slots have been filled."
                : "A little future to root for. Join for free.";
  return (
    <div className="detail-page">
      <div className="detail-top">
        <a className="back-link" href="#/">
          <ArrowLeft size={16} />
          All wishes
        </a>
        <div className="button-row">
          <button
            className="button secondary compact"
            aria-pressed={followed}
            onClick={() => run({ type: "toggleFollow", wishId: w.id })}
          >
            <Bookmark size={16} fill={followed ? "currentColor" : "none"} />
            {followed ? "Following" : "Follow"}
          </button>
          <button
            className="button secondary compact"
            onClick={() => setShare(true)}
          >
            <Share2 size={16} />
            Share wish
          </button>
        </div>
      </div>
      <div className="detail-grid">
        <div className="detail-main">
          <div
            className={`detail-art art-${w.category.toLowerCase().replace(" ", "-")}`}
          >
            <Illustration category={w.category} />
            <span className="category-tag">{w.category}</span>
            <span className="illustrative-tag">Illustrative demo promise</span>
          </div>
          <div className="detail-title">
            <Status wish={w} />
            <h1>{w.title}</h1>
            <div className="creator">
              <Avatar user={w.creator} />
              <span>
                A promise by <strong>{state.users[w.creator].name}</strong>
                <small>Created {date(w.createdAt)}</small>
              </span>
            </div>
            <p className="story">{w.story}</p>
          </div>
          <section className="detail-section promise-box">
            <span className="eyebrow">THE PROMISE</span>
            <h2>
              <em>If</em> {w.condition}
            </h2>
            <p>
              <em>Then</em> {money(w.committed)} in demo gifts.{" "}
              {distributionText(d)}.
            </p>
            <div className="detail-facts">
              <span>
                <Clock3 size={17} />
                <span>
                  Event deadline<strong>{date(w.deadline)}</strong>
                </span>
              </span>
              <span>
                <LockKeyhole size={17} />
                <span>
                  Terms locked<strong>Fully funded by one creator</strong>
                </span>
              </span>
            </div>
          </section>
          <section className="detail-section">
            <div className="subheading">
              <h2>How we’ll know</h2>
              <ShieldCheck size={21} />
            </div>
            <p>{w.criteria}</p>
            <a
              className="text-link"
              href={w.source}
              target="_blank"
              rel="noopener noreferrer"
            >
              Suggested source <ExternalLink size={14} />
            </a>
            <p className="fine-print">
              Links are recorded for simulated human review. The demo does not
              fetch or authenticate sources, or claim that the event is true.
            </p>
            <div className="rules-grid">
              <div>
                <strong>Event by the deadline</strong>
                <p>The event must occur on or before {date(w.deadline)}.</p>
              </div>
              <div>
                <strong>72 hours for evidence</strong>
                <p>
                  Submit evidence through {date(w.deadline + GRACE)}. This does
                  not extend the event window.
                </p>
              </div>
              <div>
                <strong>24 hours for objections</strong>
                <p>
                  A proposal closes enrollment immediately. An objection keeps
                  all funds held until arbitration.
                </p>
              </div>
            </div>
          </section>
          <section className="detail-section">
            <div className="subheading">
              <h2>Evidence & resolution</h2>
              {w.status === "disputed" && (
                <span className="warning-tag">Funds held during dispute</span>
              )}
            </div>
            {proposal ? (
              <article className="evidence-card">
                <div className="evidence-label">
                  <span className="eyebrow">
                    PROPOSED{" "}
                    {proposal.outcome === "success"
                      ? "YES · CONDITION MET"
                      : "NO · CONDITION NOT MET"}
                  </span>
                  <span>By {state.users[proposal.proposer].name}</span>
                </div>
                <p>{proposal.summary}</p>
                {proposal.occurredAt !== null && (
                  <p className="muted">
                    Reported occurrence: {date(proposal.occurredAt)}
                  </p>
                )}
                {proposal.url && (
                  <a
                    className="text-link"
                    href={proposal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Submitted source <ExternalLink size={14} />
                  </a>
                )}
                <p className="fine-print">
                  Evidence completeness check:{" "}
                  {proposal.outcome === "success"
                    ? "summary, source URL, and occurrence time provided. This does not verify the event."
                    : "evidence grace period has ended. No automatic refund is made."}
                </p>
                <div className="review-window">
                  <Clock3 size={16} />
                  Objections close {date(proposal.reviewAt)}
                </div>
                {proposal.objections.map((o) => (
                  <div className="objection" key={o.user}>
                    <strong>
                      <MessageSquareWarning size={16} />
                      {state.users[o.user].name} objected
                    </strong>
                    <p>{o.reason}</p>
                    <small>{date(o.at)}</small>
                  </div>
                ))}
                {proposal.history.map((h, i) => (
                  <div className="review-history" key={i}>
                    <strong>Simulated human review · {h.action}</strong>
                    <p>{h.rationale}</p>
                  </div>
                ))}
                {!closed &&
                  eligible &&
                  state.clock < proposal.reviewAt &&
                  !proposal.objections.some((o) => o.user === user) && (
                    <button
                      className="button secondary"
                      onClick={() => setObjecting(true)}
                    >
                      Object with a reason
                    </button>
                  )}
                {!closed && (
                  <p className="fine-print">
                    {eligible
                      ? "Eligible people may object before the review deadline."
                      : "Only the creator, enrolled participants, or the designated recipient may object."}{" "}
                    Review actions are in Demo controls below.
                  </p>
                )}
              </article>
            ) : (
              <div className="evidence-empty">
                <ShieldCheck size={28} />
                <h3>
                  {archives.length
                    ? "The previous proposal was rejected."
                    : "Every good promise deserves clear evidence."}
                </h3>
                <p>
                  {state.clock <= w.deadline + GRACE
                    ? "Submit a YES proposal when the condition has occurred. Occurrence must be on or before the deadline and no later than the demo clock."
                    : "The evidence window is closed. A NO proposal can now open the refund review."}
                </p>
                {!closed && (
                  <div className="button-row">
                    <button
                      className="button primary"
                      disabled={state.clock > w.deadline + GRACE}
                      onClick={() => {
                        setOccurred(
                          dateInput(Math.min(state.clock, w.deadline)),
                        );
                        setEvidence(true);
                      }}
                    >
                      Submit evidence · propose YES
                    </button>
                    <button
                      className="button secondary"
                      disabled={state.clock <= w.deadline + GRACE}
                      onClick={() =>
                        run({
                          type: "submitProposal",
                          wishId: w.id,
                          outcome: "failure",
                          summary: "",
                          url: "",
                          occurredAt: null,
                        })
                      }
                    >
                      Propose NO · refund
                    </button>
                  </div>
                )}
                <small>
                  NO becomes available strictly after {date(w.deadline + GRACE)}
                  . Advancing time alone does not release money.
                </small>
              </div>
            )}
            {archives.map((p) => (
              <details className="archive" key={p.id}>
                <summary>
                  Archived {p.outcome === "success" ? "YES" : "NO"} proposal ·
                  rejected
                </summary>
                <p>{p.summary}</p>
                {p.history.map((h, i) => (
                  <p key={i}>
                    {h.action}: {h.rationale}
                  </p>
                ))}
                <p>
                  Enrollment remained closed. A fresh proposal follows the
                  current evidence window.
                </p>
              </details>
            ))}
          </section>
          <section className="detail-section">
            <div className="subheading">
              <h2>
                {d.mode === "personal"
                  ? "A gift with your name on it"
                  : "People rooting for this"}
              </h2>
              <span className="muted">
                {d.mode === "personal"
                  ? "1 designated recipient"
                  : `${people.length} joined`}
              </span>
            </div>
            {d.mode === "personal" ? (
              <div className="person-row">
                <Avatar user={d.recipient} />
                <strong>{state.users[d.recipient].name}</strong>
                <span>Designated · no enrollment needed</span>
              </div>
            ) : people.length ? (
              people.map((p, i) => (
                <div className="person-row" key={p.user}>
                  <Avatar user={p.user} />
                  <strong>{state.users[p.user].name}</strong>
                  <span>
                    {d.mode === "first"
                      ? `Slot ${i + 1} of ${d.slots}`
                      : `Enrollment #${i + 1}`}
                  </span>
                  <small>{date(p.at)}</small>
                </div>
              ))
            ) : (
              <p className="muted">
                No one has joined yet. If a successful public wish has no
                eligible recipients, all funds return to the creator.
              </p>
            )}
          </section>
          <section className="detail-section">
            <h2>The story so far</h2>
            <ol className="timeline">
              {state.activities
                .filter((a) => a.wish === w.id)
                .map((a) => (
                  <li key={a.id}>
                    <span className="timeline-dot" />
                    <div>
                      <p>
                        <strong>
                          {state.users[a.actor]?.name.split(" ")[0]}
                        </strong>{" "}
                        · {a.text}
                      </p>
                      <small>{date(a.at)}</small>
                    </div>
                  </li>
                ))}
            </ol>
            {w.closedAt !== null && (
              <p className="fine-print">
                Enrollment permanently closed: {date(w.closedAt)}.
              </p>
            )}
          </section>
          <DemoControls wish={w} />
        </div>
        <aside className="detail-sidebar">
          <div className="gift-panel">
            <div className="gift-panel-heading">
              <Gift size={21} />
              <span>THE GIFT IS ALREADY HERE.</span>
            </div>
            <strong className="big-money">{money(w.committed)}</strong>
            <span className="muted">demo funds committed</span>
            <p>{distributionText(d)}</p>
            {d.mode === "first" && (
              <>
                <div className="slot-track">
                  <span
                    style={{ width: `${(people.length / d.slots) * 100}%` }}
                  />
                </div>
                <div className="slot-caption">
                  <span>
                    {people.length} of {d.slots} recipient slots
                  </span>
                  <span>{d.slots - people.length} remaining</span>
                </div>
              </>
            )}
            {d.mode === "split" && (
              <div className="estimate">
                {people.length
                  ? `${money(Math.floor(w.committed / people.length))} per person${open ? " · estimate" : " · base share"}`
                  : "Per-person amount depends on enrollment."}
                <small>
                  Leftover cents go in join order. A share may be $0.
                </small>
              </div>
            )}
            <div
              className={`viewer-position ${joined || designated ? "is-joined" : ""}`}
            >
              {(joined || designated) && <Check size={18} />}
              <span>{position}</span>
            </div>
            {!closed && d.mode !== "personal" && !creator && !joined && (
              <button
                className="button primary full-width"
                disabled={!open || full}
                onClick={() => {
                  if (run({ type: "joinWish", wishId: w.id }))
                    inform(
                      "You joined for free. Your wallet balance did not change.",
                    );
                }}
              >
                {!open
                  ? "Enrollment closed"
                  : full
                    ? "All slots filled"
                    : "Join this wish · free"}
                {open && !full && <ArrowUpRight size={17} />}
              </button>
            )}
            {!closed && !creator && (
              <small className="center-note">
                You never put money in. The creator supplies the gift.
              </small>
            )}
            <dl className="money-breakdown">
              <div>
                <dt>Originally committed</dt>
                <dd>{money(w.committed)}</dd>
              </div>
              <div>
                <dt>Currently held</dt>
                <dd>{money(balance(state, escrow(w.id)))}</dd>
              </div>
              <div>
                <dt>Gifted</dt>
                <dd>{money(receipt?.gifted || 0)}</dd>
              </div>
              <div>
                <dt>Refunded to creator</dt>
                <dd>{money(receipt?.refunded || 0)}</dd>
              </div>
            </dl>
            <small>One creator. USD simulation. No fees or interest.</small>
          </div>
          {receipt && (
            <section className="receipt">
              <div className="receipt-icon">
                <Check size={25} />
              </div>
              <span className="eyebrow">PROMISE RESOLVED</span>
              <h2>
                {receipt.outcome === "failure"
                  ? "Funds returned."
                  : receipt.gifted
                    ? "A little joy, delivered."
                    : "Condition met. Funds returned."}
              </h2>
              <p>{receipt.note}</p>
              <dl>
                {receipt.payments.map((p) => (
                  <div key={p.user}>
                    <dt>{state.users[p.user].name}</dt>
                    <dd>{money(p.cents)}</dd>
                  </div>
                ))}
                <div>
                  <dt>Refund · {state.users[w.creator].name.split(" ")[0]}</dt>
                  <dd>{money(receipt.refunded)}</dd>
                </div>
                <div className="receipt-total">
                  <dt>Total reconciled</dt>
                  <dd>{money(receipt.gifted + receipt.refunded)}</dd>
                </div>
              </dl>
              <small>
                Settled {date(receipt.at)} · Escrow{" "}
                {money(balance(state, escrow(w.id)))}
              </small>
              <a className="text-link" href="#/my-wishes">
                View wallet activity <ArrowUpRight size={15} />
              </a>
            </section>
          )}
          <div className="sidebar-note">
            <LockKeyhole size={18} />
            <p>
              Once funded, a promise cannot be edited or cancelled. If it
              doesn’t happen, the creator gets their funds back through the
              review flow.
            </p>
          </div>
          <div className="mini-wallet">
            <Avatar user={user} small />
            <span>
              {state.users[user].name.split(" ")[0]}’s available demo balance
              <strong>{money(balance(state, wallet(user)))}</strong>
            </span>
          </div>
        </aside>
      </div>
      <TrustNote />
      {share && (
        <Share
          wish={w}
          onClose={() => {
            setShare(false);
            if (location.hash.endsWith("?share=1"))
              history.replaceState(
                null,
                "",
                location.href.replace("?share=1", ""),
              );
          }}
        />
      )}
      {evidence && (
        <Modal
          title="Bring your promise to life."
          onClose={() => setEvidence(false)}
        >
          <p>
            Propose YES using evidence of an event that occurred by the
            deadline. This closes enrollment permanently.
          </p>
          <button
            className="button secondary compact"
            onClick={() => {
              setSummary(
                `Illustrative sample evidence: the required record confirms this fictional condition was met before the deadline. ${w.criteria}`,
              );
              setSource(w.source);
              setOccurred(
                dateInput(
                  Math.max(w.createdAt, Math.min(state.clock, w.deadline)),
                ),
              );
            }}
          >
            Fill sample evidence
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!summary.trim() || !source || !occurred) {
                setEvidenceError(
                  "Complete the evidence summary, source URL, and occurrence time.",
                );
                return;
              }
              if (
                run({
                  type: "submitProposal",
                  wishId: w.id,
                  outcome: "success",
                  summary,
                  url: source.trim(),
                  occurredAt: fromDateInput(occurred),
                })
              ) {
                setEvidence(false);
                inform(
                  "YES proposal submitted. The 24-hour objection window is open.",
                );
              }
            }}
          >
            <label className="field">
              Evidence summary
              <textarea
                required
                minLength={10}
                maxLength={1500}
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </label>
            <label className="field">
              Source URL · HTTP(S)
              <input
                required
                type="url"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </label>
            <label className="field">
              When did the event occur? · UTC
              <input
                required
                type="datetime-local"
                min={dateInput(w.createdAt)}
                max={dateInput(Math.min(state.clock, w.deadline))}
                value={occurred}
                onChange={(e) => setOccurred(e.target.value)}
              />
              <small>
                Demo clock: {date(state.clock)}. Event deadline:{" "}
                {date(w.deadline)}.
              </small>
            </label>
            <div className="inline-note">
              Sample evidence is illustrative. The completeness check validates
              required fields only. It does not establish whether an external
              event is true.
            </div>
            {evidenceError && (
              <p className="field-error" role="alert">
                {evidenceError}
              </p>
            )}
            <button className="button primary" type="submit">
              Submit YES proposal
            </button>
          </form>
        </Modal>
      )}
      {objecting && (
        <Modal
          title="A good promise welcomes a closer look."
          onClose={() => setObjecting(false)}
        >
          <p>
            Your objection will hold all funds and require simulated human
            arbitration.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (run({ type: "objectToProposal", wishId: w.id, reason })) {
                setObjecting(false);
                setReason("");
              }
            }}
          >
            <label className="field">
              Reason for objection
              <textarea
                required
                minLength={5}
                maxLength={1000}
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="What is missing or inconsistent in this evidence?"
              />
            </label>
            <button className="button primary">
              Submit objection & hold funds
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
