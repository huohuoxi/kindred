import { useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Gift,
  Users,
  UserRound,
  LockKeyhole,
  Sprout,
  Flag,
  Sparkles,
} from "lucide-react";
import { useApp } from "../app/Provider";
import {
  categories,
  DAY,
  dateInput,
  fromDateInput,
  money,
  parseMoney,
  wallet,
  balance,
  termsSchema,
  commitment,
  date,
  distributionText,
} from "../domain/model";
import type { Distribution, Terms } from "../domain/model";
import { TrustNote } from "../components/UI";
const steps = ["The promise", "The gift", "How we know", "Review & commit"];
type Form = {
  title: string;
  story: string;
  category: (typeof categories)[number];
  condition: string;
  deadline: string;
  mode: Distribution["mode"];
  amount: string;
  slots: string;
  recipient: string;
  criteria: string;
  source: string;
};
export function Create() {
  const { state, run, clearError } = useApp();
  const actor = state.currentUser;
  const blank: Form = {
    title: "",
    story: "",
    category: "Community",
    condition: "",
    deadline: dateInput(state.clock + 7 * DAY),
    mode: "first",
    amount: "10",
    slots: "3",
    recipient: actor === "alex" ? "jordan" : "alex",
    criteria: "",
    source: "",
  };
  const template = (type: string): Form =>
    type === "personal"
      ? {
          ...blank,
          title: "Here’s to your next finish line.",
          story:
            "Every small step counts. I want to celebrate your next milestone with a gift from me.",
          category: "Personal goals",
          condition:
            "The designated recipient finishes the fictional Riverside 5K, as recorded in the official finish list.",
          mode: "personal",
          amount: "50",
          criteria:
            "The fictional race organizer’s dated finish list must show the designated recipient as a finisher before the deadline.",
          source: "https://example.org/riverside/results",
        }
      : type === "community"
        ? {
            ...blank,
            title: "A new chapter for our neighborhood.",
            story:
              "Good things happen when we build them together. Let’s celebrate a little more green on our block.",
            mode: "split",
            amount: "100",
            condition:
              "The fictional Oak Street volunteer team records 10 new trees planted in its signed project log.",
            criteria:
              "A dated and signed planting log lists 10 tree locations and confirms planting on or before the deadline.",
            source: "https://example.org/oak-street/planting-log",
          }
        : {
            ...blank,
            title: "Three little gifts for a greener block.",
            story:
              "Let’s root for our neighborhood. When the next ten trees go into the ground, coffee is on me.",
            condition:
              "The fictional Oak Street volunteer team records 10 new trees planted in its signed project log.",
            criteria:
              "A dated and signed planting log lists 10 tree locations and confirms planting on or before the deadline.",
            source: "https://example.org/oak-street/planting-log",
          };
  const [form, setForm] = useState<Form>(() =>
    location.hash.includes("template=")
      ? template(location.hash.split("template=")[1])
      : blank,
  );
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const submission = useRef({
    id: crypto.randomUUID(),
    wishId: `wish-${crypto.randomUUID()}`,
  });
  const locked = useRef(false);
  function update<K extends keyof Form>(field: K, value: Form[K]) {
    setForm({ ...form, [field]: value });
    setErrors((prev) => ({ ...prev, [field]: "" }));
    clearError();
  }
  function buildTerms(): Terms {
    const amount = parseMoney(form.amount);
    const distribution: Distribution =
      form.mode === "first"
        ? { mode: "first", perPerson: amount, slots: Number(form.slots) }
        : form.mode === "split"
          ? { mode: "split", pool: amount }
          : { mode: "personal", amount, recipient: form.recipient };
    return {
      title: form.title.trim(),
      story: form.story.trim(),
      category: form.category,
      condition: form.condition.trim(),
      deadline: fromDateInput(form.deadline),
      criteria: form.criteria.trim(),
      source: form.source.trim(),
      distribution,
    };
  }
  const validate = () => {
    const next: Record<string, string> = {};
    if (step === 0 || step === 3) {
      for (const [field, min, max] of [
        ["title", 5, 100],
        ["story", 10, 800],
        ["condition", 10, 500],
      ] as const)
        if (form[field].trim().length < min || form[field].trim().length > max)
          next[field] = `Use ${min}–${max} characters.`;
      if (
        !Number.isFinite(fromDateInput(form.deadline)) ||
        fromDateInput(form.deadline) <= state.clock
      )
        next.deadline = "Choose a future deadline after the demo clock.";
    }
    if (step === 1 || step === 3) {
      try {
        const amount = parseMoney(form.amount);
        const total =
          form.mode === "first" ? amount * Number(form.slots) : amount;
        if (total > balance(state, wallet(actor)))
          next.amount = "This gift exceeds your available demo balance.";
      } catch (e) {
        next.amount = (e as Error).message;
      }
      if (
        form.mode === "first" &&
        (!/^\d+$/.test(form.slots) ||
          Number(form.slots) < 1 ||
          Number(form.slots) > 1000)
      )
        next.slots = "Choose 1–1,000 whole recipient slots.";
      if (
        form.mode === "personal" &&
        (!state.users[form.recipient] || form.recipient === actor)
      )
        next.recipient = "Choose someone other than yourself.";
    }
    if (step === 2 || step === 3) {
      if (form.criteria.trim().length < 10 || form.criteria.trim().length > 800)
        next.criteria =
          "Use 10–800 characters for objective evidence requirements.";
      if (!termsSchema.shape.source.safeParse(form.source.trim()).success)
        next.source = "Use a valid HTTP(S) source URL.";
    }
    if (step === 3 && !confirmed)
      next.confirmed =
        "Confirm that these funds and all payments are simulated.";
    setErrors(next);
    if (Object.keys(next).length)
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
    return Object.keys(next).length === 0;
  };
  let total = 0;
  try {
    total = commitment(buildTerms().distribution);
  } catch {
    /* Live preview stays empty until a valid amount exists. */
  }
  const field = (
    name: keyof Form,
    label: string,
    input: ReactNode,
    hint?: string,
  ) => (
    <label className="field">
      {label}
      {input}
      {hint && <small>{hint}</small>}
      {errors[name] && (
        <span id={`error-${name}`} className="field-error">
          {errors[name]}
        </span>
      )}
    </label>
  );
  const attrs = (name: keyof Form) => ({
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `error-${name}` : undefined,
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    const terms = buildTerms();
    const command = submission.current;
    if (
      run({ type: "commitWish", wishId: command.wishId, terms }, command.id)
    ) {
      location.hash = `/wish/${command.wishId}?share=1`;
    } else {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="create-page">
      <a className="back-link" href="#/">
        <ArrowLeft size={16} />
        Back to wishes
      </a>
      <div className="page-heading">
        <span className="eyebrow">A LITTLE PROMISE CAN MEAN A LOT.</span>
        <h1>What future will you celebrate?</h1>
        <p>Make it meaningful. Make it clear. We’ll help with the rest.</p>
      </div>
      <ol className="wizard-steps">
        {steps.map((name, i) => (
          <li
            key={name}
            className={i === step ? "active" : i < step ? "complete" : ""}
            aria-current={i === step ? "step" : undefined}
          >
            <span>{i < step ? <Check size={16} /> : i + 1}</span>
            {name}
          </li>
        ))}
      </ol>
      <div className="create-grid">
        <form className="form-panel" onSubmit={submit} noValidate>
          <div className="step-label">STEP {step + 1} OF 4</div>
          <h2>{steps[step]}</h2>
          {step === 0 && (
            <>
              <p>Start with a moment that matters to you.</p>
              <div className="template-buttons">
                {[
                  ["community", "Community", Sprout],
                  ["personal", "Milestone", Flag],
                  ["first", "First-N gift", Sparkles],
                ].map(([type, label, Icon]) => {
                  const I = Icon as typeof Sprout;
                  return (
                    <button
                      key={String(type)}
                      type="button"
                      onClick={() => {
                        setForm(template(String(type)));
                        setErrors({});
                      }}
                    >
                      <I size={17} />
                      {String(label)}
                    </button>
                  );
                })}
              </div>
              <small className="muted">
                Optional templates fill the form. Nothing is published yet.
              </small>
              {field(
                "title",
                "Give your wish a title",
                <input
                  {...attrs("title")}
                  value={form.title}
                  maxLength={100}
                  placeholder="A greener block, a little gift."
                  onChange={(e) => update("title", e.target.value)}
                />,
              )}
              {field(
                "category",
                "Category",
                <select
                  value={form.category}
                  onChange={(e) =>
                    update("category", e.target.value as Form["category"])
                  }
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>,
              )}
              {field(
                "story",
                "Tell your people why",
                <textarea
                  {...attrs("story")}
                  value={form.story}
                  maxLength={800}
                  rows={3}
                  placeholder="The story behind your promise…"
                  onChange={(e) => update("story", e.target.value)}
                />,
              )}
              {field(
                "condition",
                "If this happens…",
                <textarea
                  {...attrs("condition")}
                  value={form.condition}
                  maxLength={500}
                  rows={3}
                  placeholder="A precise event that can be checked objectively."
                  onChange={(e) => update("condition", e.target.value)}
                />,
                "Name the event, who is involved, and what counts as success.",
              )}
              {field(
                "deadline",
                "Event deadline · UTC",
                <input
                  {...attrs("deadline")}
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => update("deadline", e.target.value)}
                />,
                `All entered times are UTC. Demo clock: ${date(state.clock)}.`,
              )}
            </>
          )}
          {step === 1 && (
            <>
              <p>
                One creator. One fully committed gift. Free for everyone else.
              </p>
              <fieldset className="mode-options">
                <legend className="sr-only">Distribution mode</legend>
                {(
                  [
                    {
                      mode: "first",
                      icon: Gift,
                      title: "First N people",
                      text: "A fixed gift for each of the first people to join.",
                    },
                    {
                      mode: "split",
                      icon: Users,
                      title: "Share a gift pool",
                      text: "Split equally among everyone who joins.",
                    },
                    {
                      mode: "personal",
                      icon: UserRound,
                      title: "One personal gift",
                      text: "A little something for someone you choose.",
                    },
                  ] as const
                ).map(({ mode, icon: Icon, title, text }) => (
                  <label
                    key={mode}
                    className={form.mode === mode ? "selected" : ""}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={mode}
                      checked={form.mode === mode}
                      onChange={() => update("mode", mode)}
                    />
                    <Icon size={21} />
                    <span>
                      <strong>{title}</strong>
                      <small>{text}</small>
                    </span>
                  </label>
                ))}
              </fieldset>
              {field(
                "amount",
                form.mode === "first"
                  ? "Gift per person · USD"
                  : "Total gift · USD",
                <div className="money-input">
                  <span>$</span>
                  <input
                    {...attrs("amount")}
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(e) => update("amount", e.target.value)}
                  />
                </div>,
              )}
              {form.mode === "first" &&
                field(
                  "slots",
                  "Recipient slots",
                  <input
                    {...attrs("slots")}
                    type="number"
                    min={1}
                    max={1000}
                    value={form.slots}
                    onChange={(e) => update("slots", e.target.value)}
                  />,
                )}
              {form.mode === "personal" &&
                field(
                  "recipient",
                  "Who is this gift for?",
                  <select
                    {...attrs("recipient")}
                    value={form.recipient}
                    onChange={(e) => update("recipient", e.target.value)}
                  >
                    {Object.values(state.users)
                      .filter((u) => u.id !== actor)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>,
                )}
              {form.mode === "split" && (
                <div className="inline-note">
                  The per-person amount is an estimate until enrollment closes.
                  Leftover cents go in enrollment order. Very small pools may
                  produce $0 shares.
                </div>
              )}
              <div className="funding-total">
                <span>Total demo commitment</span>
                <strong>{money(total)}</strong>
              </div>
              <p className="muted">
                Available to {state.users[actor].name.split(" ")[0]}:{" "}
                {money(balance(state, wallet(actor)))}. No fees or interest in
                this demo.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <p>Good promises start with a clear way to know.</p>
              {field(
                "criteria",
                "What evidence will count?",
                <textarea
                  {...attrs("criteria")}
                  rows={5}
                  maxLength={800}
                  value={form.criteria}
                  onChange={(e) => update("criteria", e.target.value)}
                  placeholder="Describe the document, official record, or result needed to confirm the condition."
                />,
              )}
              {field(
                "source",
                "Suggested authoritative source URL",
                <input
                  {...attrs("source")}
                  type="url"
                  value={form.source}
                  placeholder="https://example.org/official-results"
                  onChange={(e) => update("source", e.target.value)}
                />,
              )}
              <div className="inline-note">
                <LockKeyhole size={19} />
                <span>
                  Evidence can arrive up to 72 hours after the event deadline.
                  The event must still occur by the original deadline. A
                  proposal opens a 24-hour objection window.
                </span>
              </div>
              <p className="muted">
                Source links are recorded for simulated human review. This demo
                never fetches or authenticates them.
              </p>
            </>
          )}
          {step === 3 && (
            <>
              <p>One final look before your promise is committed.</p>
              <dl className="review-list">
                <dt>The condition</dt>
                <dd>{form.condition}</dd>
                <dt>Deadline</dt>
                <dd>{date(fromDateInput(form.deadline))}</dd>
                <dt>The gift</dt>
                <dd>
                  {distributionText(buildTerms().distribution)} · {money(total)}{" "}
                  total
                </dd>
                <dt>Evidence requirements</dt>
                <dd>{form.criteria}</dd>
                <dt>Suggested source</dt>
                <dd>{form.source}</dd>
                <dt>Funding from</dt>
                <dd>
                  {state.users[actor].name}’s demo wallet · exact debit{" "}
                  {money(total)}
                </dd>
              </dl>
              <div className="inline-note">
                Material terms are locked after funding. Committed funds cannot
                be withdrawn or cancelled. If the condition fails, all funds
                return to you. Unused first-N slots are refunded; a successful
                public wish with no recipients is fully refunded. Advancing time
                alone never releases funds.
              </div>
              <label className="checkbox-line">
                <input
                  aria-invalid={!!errors.confirmed}
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span>
                  I understand this is a simulation. No real money, escrow,
                  identity, or payment is involved.
                </span>
              </label>
              {errors.confirmed && (
                <p className="field-error">{errors.confirmed}</p>
              )}
            </>
          )}
          {Object.keys(errors).length > 0 && step === 3 && (
            <p className="field-error" role="alert">
              Please check the highlighted fields. Use Back to revise earlier
              steps.
            </p>
          )}
          <div className="wizard-actions">
            <button
              type="button"
              className="button secondary"
              disabled={step === 0 || busy}
              onClick={() => {
                setStep(step - 1);
                setErrors({});
              }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <button type="submit" className="button primary" disabled={busy}>
              {step === 3
                ? busy
                  ? "Committing…"
                  : `Commit ${money(total)} demo funds`
                : "Continue"}
              {step === 3 ? (
                <LockKeyhole size={16} />
              ) : (
                <ArrowRight size={16} />
              )}
            </button>
          </div>
        </form>
        <aside className="live-summary">
          <span className="eyebrow">YOUR PROMISE, TAKING SHAPE</span>
          <div className="summary-sprout">
            <Sprout size={35} />
          </div>
          <h3>{form.title || "Something worth celebrating."}</h3>
          <p>If {form.condition || "your meaningful moment happens…"}</p>
          <div className="summary-gift">
            <small>THEN I’LL GIVE</small>
            <strong>{money(total)}</strong>
            <span>in fully committed demo funds</span>
          </div>
          <p>
            {form.mode === "first"
              ? `${money(total && Number(form.slots) ? total / Number(form.slots) : 0)} each for the first ${form.slots || "—"} people.`
              : form.mode === "split"
                ? "Shared equally among everyone who joins."
                : `One gift for ${state.users[form.recipient]?.name || "someone special"}.`}
          </p>
          <div className="summary-footer">
            <Check size={16} />
            Free for recipients. Always.
          </div>
        </aside>
      </div>
      <TrustNote />
    </div>
  );
}
