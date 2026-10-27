import { useLocale } from "../i18n/context";
import {
  ArrowRight,
  Gift,
  Users,
  ShieldCheck,
  Sparkles,
  Clock3,
  Sprout,
} from "lucide-react";
export function HowItWorks() {
  const { t } = useLocale();
  return (
    <div className="how-page">
      <div className="page-heading centered">
        <span className="eyebrow">{t("PROMISES WORTH KEEPING.")}</span>
        <h1>
          {t("A gift for a future")}
          <br />
          {t("you believe in.")}
        </h1>
        <p>
          {t("One person makes a promise. Others join for free.")}
          <br />
          {t("A clear condition decides what happens next.")}
        </p>
      </div>
      <div className="how-steps">
        {[
          {
            icon: Gift,
            title: "1. Make a promise",
            text: "Choose a precise event, deadline, and gift rule. The creator commits the full amount upfront. There is no fundraising target.",
          },
          {
            icon: Users,
            title: "2. Invite your people",
            text: "Recipients join without paying. First-N gifts reserve slots; a shared pool divides equally; a personal gift goes to one named person.",
          },
          {
            icon: ShieldCheck,
            title: "3. Review, then celebrate",
            text: "Evidence opens a 24-hour objection window. A simulated human reviewer resolves the outcome. Gifts are sent on success; failed conditions return all funds.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <article key={title}>
            <Icon size={27} />
            <h2>{t(title)}</h2>
            <p>{t(text)}</p>
          </article>
        ))}
      </div>
      <section className="how-section">
        <div>
          <span className="eyebrow">
            {t("CLEAR RULES. ROOM FOR A CLOSER LOOK.")}
          </span>
          <h2>
            {t("Trust starts before")}
            <br />
            {t("the promise is made.")}
          </h2>
        </div>
        <div>
          <p>
            {t(
              "Terms lock at funding. Enrollment closes at the event deadline or first proposal, whichever happens first, and never reopens. The event must occur by its deadline. Evidence may arrive through 72 hours after that deadline.",
            )}
          </p>
          <p>
            {t(
              "A YES proposal needs a summary, HTTP(S) source, and valid occurrence time. A NO proposal becomes available only after the evidence grace period. Every proposal has a 24-hour objection window. The creator, enrolled people, and designated recipients may object before it closes.",
            )}
          </p>
          <p>
            {t(
              "An objection holds all funds. A simulated human arbitrator can uphold and settle, or reject the proposal and keep the funds held. After rejection, enrollment stays closed; only NO can be newly proposed once the evidence cutoff has passed. This is simplified demo policy, not production dispute governance.",
            )}
          </p>
          <p>
            {t(
              "Advancing the demo clock never transfers money by itself. A reviewer must finalize, or an arbitrator must uphold, before funds move.",
            )}
          </p>
        </div>
      </section>
      <section className="how-section business">
        <div>
          <span className="eyebrow">{t("A FUTURE PROPOSAL")}</span>
          <h2>{t("Business model")}</h2>
          <Sprout size={45} />
        </div>
        <div>
          <p>
            {t(
              "In a future authorized operating model, appropriate financial partners might hold committed money. Potential net returns could help cover operating costs and lower fees. Returns are uncertain; costs, losses, reserves, and liquidity needs matter.",
            )}
          </p>
          <p>
            {t(
              "Lending and mortgage-related assets are possibilities in the original vision. They carry credit risk, duration mismatch, and liquidity risk. They are not equivalent to cash, and are neither implemented nor endorsed allocations here.",
            )}
          </p>
          <div className="principal-note">
            <strong>{t("Principal remains owed. Always.")}</strong>
            <p>
              {t(
                "Every committed dollar belongs in payout or refund obligations. Platform revenue would be distinct from that principal. Investment income cannot guarantee principal, liquidity, or free operation.",
              )}
            </p>
          </div>
          <div
            className="growth-loop"
            aria-label={t("Hypothetical growth loop")}
          >
            <span>{t("More wishes")}</span>
            <ArrowRight size={14} />
            <span>{t("More commitments")}</span>
            <ArrowRight size={14} />
            <span>{t("Potential net returns")}</span>
            <ArrowRight size={14} />
            <span>{t("Potentially lower fees")}</span>
            <ArrowRight size={14} />
            <span>{t("More participation")}</span>
          </div>
          <small>
            {t(
              "This growth loop is a hypothesis. No fees, interest, or investment returns accrue in this demo.",
            )}
          </small>
        </div>
      </section>
      <section className="how-section">
        <div>
          <span className="eyebrow">{t("LOOKING FURTHER AHEAD")}</span>
          <h2>
            {t("Future AI")}
            <br />
            {t("liquidity planning")}
          </h2>
          <Sparkles size={36} />
        </div>
        <div>
          <p>
            {t(
              "Forecasting could estimate when principal might be needed: event probabilities, likely timing, correlated outcomes, payout and refund calendars, stress scenarios, reserve levels, and asset maturities.",
            )}
          </p>
          <div className="liquidity-timeline">
            <div>
              <Clock3 size={17} />
              <strong>{t("Today")}</strong>
              <span>{t("Committed principal held")}</span>
            </div>
            <div>
              <Clock3 size={17} />
              <strong>{t("Near-term events")}</strong>
              <span>{t("Liquid reserves for gifts and refunds")}</span>
            </div>
            <div>
              <Clock3 size={17} />
              <strong>{t("Later obligations")}</strong>
              <span>{t("Match asset maturities to stress-tested needs")}</span>
            </div>
          </div>
          <p>
            <strong>
              {t(
                "Forecasting concerns when principal is needed, not whether it is owed.",
              )}
            </strong>
            {t(" ")}
            {t(
              "Correlated events may create simultaneous obligations. Forecasts cannot guarantee liquidity or replace appropriate reserves and oversight.",
            )}
          </p>
          <small>
            {t(
              "This is an illustrative concept. There is no AI call, investment dashboard, or live liquidity model.",
            )}
          </small>
        </div>
      </section>
      <section className="faq-section">
        <span className="eyebrow">{t("A FEW THINGS YOU MIGHT WONDER")}</span>
        <h2>{t("Good questions.")}</h2>
        {[
          [
            "Is this betting or fundraising?",
            "The creator supplies the entire gift. Recipients put in no money, buy no position, and trade nothing. There are no pooled contributions, random draws, or donation requests.",
          ],
          [
            "Is it free to join?",
            "Yes. Joining and following never debit a recipient’s wallet. Creators cannot join their own wishes. Personal gifts have a designated recipient instead of public enrollment.",
          ],
          [
            "Is any of the money real?",
            "No. Identities, wallet balances, escrow, verification, events, and payments are simulated. Each of the three fictional demo people starts with $1,000 before seeded activity.",
          ],
          [
            "What if the event does not happen?",
            "After the 72-hour evidence grace period, submit a NO proposal. Complete the 24-hour review and finalization, or arbitration if disputed, to return all principal to the creator. Time advancement alone never releases funds.",
          ],
          [
            "What happens to unused recipient slots?",
            "In a first-N gift, unfilled slots are refunded on success. For example, $1 × 100 slots with 73 eligible joins sends $73 and returns $27. A successful public wish with zero recipients returns the whole amount while keeping the successful outcome.",
          ],
          [
            "How does a shared pool handle cents?",
            "Shares use integer division; remaining cents go one at a time in stable enrollment order. $10 among three people becomes $3.34, $3.33, and $3.33. Estimates change while enrollment is open. Very small pools may produce zero-cent shares.",
          ],
          [
            "Can I dispute evidence?",
            "The creator, enrolled participants, and designated recipient may object with a reason before the 24-hour review window ends. A dispute holds all funds until simulated human arbitration. Source URLs are not fetched or authenticated.",
          ],
          [
            "Where is my progress saved?",
            "Only in this browser’s localStorage. Newly created wishes and live participation are not synchronized. Multiple tabs editing concurrently are unsupported. Data is validated on reload but this is not tamper-proof financial infrastructure. Use Demo controls to reset.",
          ],
          [
            "Can I share a wish?",
            "Seeded examples have portable detail links, but progress remains independent per browser. For browser-local wishes, share their complete promise text and the demo homepage. External reposts are not verified; repost-based eligibility is only a future integration concept.",
          ],
          [
            "What would a real service need?",
            "A genuinely shared service would need durable server state, identity, fraud controls, trustworthy resolution, appropriate financial partners, an authorized operating model, and legal and operational review. This prototype demonstrates one-browser workflows.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{t(q)}</summary>
            <p>{t(a)}</p>
          </details>
        ))}
      </section>
      <div className="bottom-invite">
        <div>
          <h2>
            {t("A future worth celebrating")}
            <br />
            {t("starts with a little promise.")}
          </h2>
          <p>{t("Try it with demo funds and three fictional people.")}</p>
        </div>
        <a className="button primary" href="#/create">
          {t("Create a wish ")}
          <ArrowRight size={17} />
        </a>
      </div>
    </div>
  );
}
