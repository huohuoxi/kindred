import { useLocale } from "../i18n/context";
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
  const { t } = useLocale();
  const { state } = useApp();
  const wish = state.wishes[id];
  if (!wish)
    return (
      <div className="empty">
        <h1>{t("This wish wandered off.")}</h1>
        <p>
          {t(
            "A custom wish exists only in the browser where it was created. Seeded wishes have portable links.",
          )}
        </p>
        <a className="button primary" href="#/">
          {t("Discover wishes")}
        </a>
      </div>
    );
  return <Detail key={wish.id} wish={wish} />;
}
function Detail({ wish: w }: { wish: Wish }) {
  const { t, date, language, wishText } = useLocale();
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
          {t("All wishes")}
        </a>
        <div className="button-row">
          <button
            className="button secondary compact"
            aria-pressed={followed}
            onClick={() => run({ type: "toggleFollow", wishId: w.id })}
          >
            <Bookmark size={16} fill={followed ? "currentColor" : "none"} />
            {t(followed ? "Following" : "Follow")}
          </button>
          <button
            className="button secondary compact"
            onClick={() => setShare(true)}
          >
            <Share2 size={16} />
            {t("Share wish")}
          </button>
        </div>
      </div>
      <div className="detail-grid">
        <div className="detail-main">
          <div
            className={`detail-art art-${w.category.toLowerCase().replace(" ", "-")}`}
          >
            <Illustration category={w.category} />
            <span className="category-tag">{t(w.category)}</span>
            <span className="illustrative-tag">
              {t("Illustrative demo promise")}
            </span>
          </div>
          <div className="detail-title">
            <Status wish={w} />
            <h1>{wishText(w, "title")}</h1>
            <div className="creator">
              <Avatar user={w.creator} />
              <span>
                {t("A promise by ")}
                <strong>{t(state.users[w.creator].name)}</strong>
                <small>
                  {language === "zh" ? `${t("Created on")} ` : "Created "}
                  {t(date(w.createdAt))}
                </small>
              </span>
            </div>
            <p className="story">{wishText(w, "story")}</p>
          </div>
          <section className="detail-section promise-box">
            <span className="eyebrow">{t("THE PROMISE")}</span>
            <h2>
              <em>{t("If")}</em> {wishText(w, "condition")}
            </h2>
            <p>
              {language === "zh" ? (
                <>
                  我会送出 {money(w.committed)} 礼金，{t(distributionText(d))}。
                </>
              ) : (
                <>
                  <em>Then</em> {money(w.committed)} in demo gifts.{" "}
                  {distributionText(d)}.
                </>
              )}
            </p>
            <div className="detail-facts">
              <span>
                <Clock3 size={17} />
                <span>
                  {t("Event deadline")}
                  <strong>{t(date(w.deadline))}</strong>
                </span>
              </span>
              <span>
                <LockKeyhole size={17} />
                <span>
                  {t("Terms locked")}
                  <strong>{t("Fully funded by one creator")}</strong>
                </span>
              </span>
            </div>
          </section>
          <section className="detail-section">
            <div className="subheading">
              <h2>{t("How we\u2019ll know")}</h2>
              <ShieldCheck size={21} />
            </div>
            <p>{wishText(w, "criteria")}</p>
            <a
              className="text-link"
              href={w.source}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("Suggested source ")}
              <ExternalLink size={14} />
            </a>
            <p className="fine-print">
              {t(
                "Links are recorded for simulated human review. The demo does not fetch or authenticate sources, or claim that the event is true.",
              )}
            </p>
            <div className="rules-grid">
              <div>
                <strong>{t("Event by the deadline")}</strong>
                <p>
                  {t("The event must occur on or before ")}
                  {t(date(w.deadline))}
                  {language === "zh" ? "。" : "."}
                </p>
              </div>
              <div>
                <strong>{t("72 hours for evidence")}</strong>
                <p>
                  {t("Submit evidence through ")}
                  {t(date(w.deadline + GRACE))}
                  {t(". This does not extend the event window.")}
                </p>
              </div>
              <div>
                <strong>{t("24 hours for objections")}</strong>
                <p>
                  {t(
                    "A proposal closes enrollment immediately. An objection keeps all funds held until arbitration.",
                  )}
                </p>
              </div>
            </div>
          </section>
          <section className="detail-section">
            <div className="subheading">
              <h2>{t("Evidence & resolution")}</h2>
              {w.status === "disputed" && (
                <span className="warning-tag">
                  {t("Funds held during dispute")}
                </span>
              )}
            </div>
            {proposal ? (
              <article className="evidence-card">
                <div className="evidence-label">
                  <span className="eyebrow">
                    {t("PROPOSED")}
                    {t(" ")}
                    {t(
                      proposal.outcome === "success"
                        ? "YES · CONDITION MET"
                        : "NO · CONDITION NOT MET",
                    )}
                  </span>
                  <span>
                    {t("By ")}
                    {t(state.users[proposal.proposer].name)}
                  </span>
                </div>
                <p>{t(proposal.summary)}</p>
                {proposal.occurredAt !== null && (
                  <p className="muted">
                    {t("Reported occurrence: ")}
                    {t(date(proposal.occurredAt))}
                  </p>
                )}
                {t(
                  proposal.url && (
                    <a
                      className="text-link"
                      href={proposal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("Submitted source ")}
                      <ExternalLink size={14} />
                    </a>
                  ),
                )}
                <p className="fine-print">
                  {t("Evidence completeness check:")}
                  {t(" ")}
                  {t(
                    proposal.outcome === "success"
                      ? "summary, source URL, and occurrence time provided. This does not verify the event."
                      : "evidence grace period has ended. No automatic refund is made.",
                  )}
                </p>
                <div className="review-window">
                  <Clock3 size={16} />
                  {t("Objections close ")}
                  {t(date(proposal.reviewAt))}
                </div>
                {proposal.objections.map((o) => (
                  <div className="objection" key={o.user}>
                    <strong>
                      <MessageSquareWarning size={16} />
                      {t(state.users[o.user].name)}
                      {t(" objected")}
                    </strong>
                    <p>{t(o.reason)}</p>
                    <small>{t(date(o.at))}</small>
                  </div>
                ))}
                {proposal.history.map((h, i) => (
                  <div className="review-history" key={i}>
                    <strong>
                      {t("Simulated human review \u00B7 ")}
                      {t(h.action)}
                    </strong>
                    <p>{t(h.rationale)}</p>
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
                      {t("Object with a reason")}
                    </button>
                  )}
                {!closed && (
                  <p className="fine-print">
                    {t(
                      eligible
                        ? "Eligible people may object before the review deadline."
                        : "Only the creator, enrolled participants, or the designated recipient may object.",
                    )}
                    {t(" ")}
                    {t("Review actions are in Demo controls below.")}
                  </p>
                )}
              </article>
            ) : (
              <div className="evidence-empty">
                <ShieldCheck size={28} />
                <h3>
                  {t(
                    archives.length
                      ? "The previous proposal was rejected."
                      : "Every good promise deserves clear evidence.",
                  )}
                </h3>
                <p>
                  {t(
                    state.clock <= w.deadline + GRACE
                      ? "Submit a YES proposal when the condition has occurred. Occurrence must be on or before the deadline and no later than the demo clock."
                      : "The evidence window is closed. A NO proposal can now open the refund review.",
                  )}
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
                      {t("Submit evidence \u00B7 propose YES")}
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
                      {t("Propose NO \u00B7 refund")}
                    </button>
                  </div>
                )}
                <small>
                  {t("NO becomes available strictly after ")}
                  {t(date(w.deadline + GRACE))}
                  {t(". Advancing time alone does not release money.")}
                </small>
              </div>
            )}
            {archives.map((p) => (
              <details className="archive" key={p.id}>
                <summary>
                  {t("Archived ")}
                  {t(p.outcome === "success" ? "YES" : "NO")}
                  {t(" proposal \u00B7 rejected")}
                </summary>
                <p>{t(p.summary)}</p>
                {p.history.map((h, i) => (
                  <p key={i}>
                    {t(h.action)}
                    {t(": ")}
                    {t(h.rationale)}
                  </p>
                ))}
                <p>
                  {t(
                    "Enrollment remained closed. A fresh proposal follows the current evidence window.",
                  )}
                </p>
              </details>
            ))}
          </section>
          <section className="detail-section">
            <div className="subheading">
              <h2>
                {t(
                  d.mode === "personal"
                    ? "A gift with your name on it"
                    : "People rooting for this",
                )}
              </h2>
              <span className="muted">
                {t(
                  d.mode === "personal"
                    ? "1 designated recipient"
                    : `${people.length} joined`,
                )}
              </span>
            </div>
            {d.mode === "personal" ? (
              <div className="person-row">
                <Avatar user={d.recipient} />
                <strong>{t(state.users[d.recipient].name)}</strong>
                <span>{t("Designated \u00B7 no enrollment needed")}</span>
              </div>
            ) : people.length ? (
              people.map((p, i) => (
                <div className="person-row" key={p.user}>
                  <Avatar user={p.user} />
                  <strong>{t(state.users[p.user].name)}</strong>
                  <span>
                    {t(
                      d.mode === "first"
                        ? `Slot ${i + 1} of ${d.slots}`
                        : `Enrollment #${i + 1}`,
                    )}
                  </span>
                  <small>{t(date(p.at))}</small>
                </div>
              ))
            ) : (
              <p className="muted">
                {t(
                  "No one has joined yet. If a successful public wish has no eligible recipients, all funds return to the creator.",
                )}
              </p>
            )}
          </section>
          <section className="detail-section">
            <h2>{t("The story so far")}</h2>
            <ol className="timeline">
              {state.activities
                .filter((a) => a.wish === w.id)
                .map((a) => (
                  <li key={a.id}>
                    <span className="timeline-dot" />
                    <div>
                      <p>
                        <strong>
                          {t(state.users[a.actor]?.name.split(" ")[0])}
                        </strong>
                        {t(" ")}
                        {t("\u00B7 ")}
                        {t(a.text)}
                      </p>
                      <small>{t(date(a.at))}</small>
                    </div>
                  </li>
                ))}
            </ol>
            {w.closedAt !== null && (
              <p className="fine-print">
                {t("Enrollment permanently closed: ")}
                {t(date(w.closedAt))}
                {language === "zh" ? "。" : "."}
              </p>
            )}
          </section>
          <DemoControls wish={w} />
        </div>
        <aside className="detail-sidebar">
          <div className="gift-panel">
            <div className="gift-panel-heading">
              <Gift size={21} />
              <span>{t("THE GIFT IS ALREADY HERE.")}</span>
            </div>
            <strong className="big-money">{t(money(w.committed))}</strong>
            <span className="muted">{t("demo funds committed")}</span>
            <p>{t(distributionText(d))}</p>
            {d.mode === "first" && (
              <>
                <div className="slot-track">
                  <span
                    style={{ width: `${(people.length / d.slots) * 100}%` }}
                  />
                </div>
                <div className="slot-caption">
                  <span>
                    {people.length}
                    {t(" of ")}
                    {d.slots}
                    {t(" recipient slots")}
                  </span>
                  <span>
                    {d.slots - people.length}
                    {t(" remaining")}
                  </span>
                </div>
              </>
            )}
            {d.mode === "split" && (
              <div className="estimate">
                {t(
                  people.length
                    ? `${money(Math.floor(w.committed / people.length))} per person${open ? " · estimate" : " · base share"}`
                    : "Per-person amount depends on enrollment.",
                )}
                <small>
                  {t("Leftover cents go in join order. A share may be $0.")}
                </small>
              </div>
            )}
            <div
              className={`viewer-position ${joined || designated ? "is-joined" : ""}`}
            >
              {(joined || designated) && <Check size={18} />}
              <span>{t(position)}</span>
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
                {t(
                  !open
                    ? "Enrollment closed"
                    : full
                      ? "All slots filled"
                      : "Join this wish · free",
                )}
                {open && !full && <ArrowUpRight size={17} />}
              </button>
            )}
            {!closed && !creator && (
              <small className="center-note">
                {t("You never put money in. The creator supplies the gift.")}
              </small>
            )}
            <dl className="money-breakdown">
              <div>
                <dt>{t("Originally committed")}</dt>
                <dd>{t(money(w.committed))}</dd>
              </div>
              <div>
                <dt>{t("Currently held")}</dt>
                <dd>{t(money(balance(state, escrow(w.id))))}</dd>
              </div>
              <div>
                <dt>{t("Gifted")}</dt>
                <dd>{t(money(receipt?.gifted || 0))}</dd>
              </div>
              <div>
                <dt>{t("Refunded to creator")}</dt>
                <dd>{t(money(receipt?.refunded || 0))}</dd>
              </div>
            </dl>
            <small>
              {t("One creator. USD simulation. No fees or interest.")}
            </small>
          </div>
          {receipt && (
            <section className="receipt">
              <div className="receipt-icon">
                <Check size={25} />
              </div>
              <span className="eyebrow">{t("PROMISE RESOLVED")}</span>
              <h2>
                {t(
                  receipt.outcome === "failure"
                    ? "Funds returned."
                    : receipt.gifted
                      ? "A little joy, delivered."
                      : "Condition met. Funds returned.",
                )}
              </h2>
              <p>{t(receipt.note)}</p>
              <dl>
                {receipt.payments.map((p) => (
                  <div key={p.user}>
                    <dt>{t(state.users[p.user].name)}</dt>
                    <dd>{t(money(p.cents))}</dd>
                  </div>
                ))}
                <div>
                  <dt>
                    {t("Refund \u00B7 ")}
                    {t(state.users[w.creator].name.split(" ")[0])}
                  </dt>
                  <dd>{t(money(receipt.refunded))}</dd>
                </div>
                <div className="receipt-total">
                  <dt>{t("Total reconciled")}</dt>
                  <dd>{t(money(receipt.gifted + receipt.refunded))}</dd>
                </div>
              </dl>
              <small>
                {t("Settled ")}
                {t(date(receipt.at))}
                {t(" \u00B7 Escrow")}
                {t(" ")}
                {t(money(balance(state, escrow(w.id))))}
              </small>
              <a className="text-link" href="#/my-wishes">
                {t("View wallet activity ")}
                <ArrowUpRight size={15} />
              </a>
            </section>
          )}
          <div className="sidebar-note">
            <LockKeyhole size={18} />
            <p>
              {t(
                "Once funded, a promise cannot be edited or cancelled. If it doesn\u2019t happen, the creator gets their funds back through the review flow.",
              )}
            </p>
          </div>
          <div className="mini-wallet">
            <Avatar user={user} small />
            <span>
              {t(state.users[user].name.split(" ")[0])}
              {t("\u2019s available demo balance")}
              <strong>{t(money(balance(state, wallet(user))))}</strong>
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
          title={t("Bring your promise to life.")}
          onClose={() => setEvidence(false)}
        >
          <p>
            {t(
              "Propose YES using evidence of an event that occurred by the deadline. This closes enrollment permanently.",
            )}
          </p>
          <button
            className="button secondary compact"
            onClick={() => {
              setSummary(
                t(
                  `Illustrative sample evidence: the required record confirms this fictional condition was met before the deadline. ${w.criteria}`,
                ),
              );
              setSource(w.source);
              setOccurred(
                dateInput(
                  Math.max(w.createdAt, Math.min(state.clock, w.deadline)),
                ),
              );
            }}
          >
            {t("Fill sample evidence")}
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
              {t("Evidence summary")}
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
              {t("Source URL \u00B7 HTTP(S)")}
              <input
                required
                type="url"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </label>
            <label className="field">
              {t("When did the event occur? \u00B7 UTC")}
              <input
                required
                type="datetime-local"
                min={dateInput(w.createdAt)}
                max={dateInput(Math.min(state.clock, w.deadline))}
                value={occurred}
                onChange={(e) => setOccurred(e.target.value)}
              />
              <small>
                {t("Demo clock: ")}
                {t(date(state.clock))}
                {t(". Event deadline:")}
                {t(" ")}
                {t(date(w.deadline))}
                {language === "zh" ? "。" : "."}
              </small>
            </label>
            <div className="inline-note">
              {t(
                "Sample evidence is illustrative. The completeness check validates required fields only. It does not establish whether an external event is true.",
              )}
            </div>
            {t(
              evidenceError && (
                <p className="field-error" role="alert">
                  {t(evidenceError)}
                </p>
              ),
            )}
            <button className="button primary" type="submit">
              {t("Submit YES proposal")}
            </button>
          </form>
        </Modal>
      )}
      {objecting && (
        <Modal
          title={t("A good promise welcomes a closer look.")}
          onClose={() => setObjecting(false)}
        >
          <p>
            {t(
              "Your objection will hold all funds and require simulated human arbitration.",
            )}
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
              {t("Reason for objection")}
              <textarea
                required
                minLength={5}
                maxLength={1000}
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t(
                  "What is missing or inconsistent in this evidence?",
                )}
              />
            </label>
            <button className="button primary">
              {t("Submit objection & hold funds")}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
