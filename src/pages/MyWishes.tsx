import { useLocale } from "../i18n/context";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  LockKeyhole,
  Gift,
} from "lucide-react";
import { useApp } from "../app/Provider";
import { balance, wallet, escrow, money, key } from "../domain/model";
import { Avatar, WishCard, Empty } from "../components/UI";
export function MyWishes() {
  const { t, date, wishText } = useLocale();
  const { state } = useApp();
  const [tab, setTab] = useState("Created");
  const user = state.currentUser;
  const all = Object.values(state.wishes);
  const created = all.filter((w) => w.creator === user);
  const held = created.reduce(
    (sum, w) => sum + balance(state, escrow(w.id)),
    0,
  );
  const received = all.reduce(
    (sum, w) =>
      sum +
      (w.receipt?.payments
        .filter((p) => p.user === user)
        .reduce((n, p) => n + p.cents, 0) || 0),
    0,
  );
  const wishes =
    tab === "Created"
      ? created
      : tab === "Joined & designated"
        ? all.filter(
            (w) =>
              state.participations[key(w.id, user)] ||
              (w.distribution.mode === "personal" &&
                w.distribution.recipient === user),
          )
        : all.filter((w) => state.follows.includes(key(w.id, user)));
  const txs = state.ledger
    .filter((t) => t.entries.some((e) => e.account === wallet(user)))
    .reverse();
  return (
    <div className="my-page">
      <div className="page-heading">
        <span className="eyebrow">
          {t("THE GOOD THINGS YOU\u2019RE PART OF")}
        </span>
        <h1>{t("Your promises. Your people.")}</h1>
        <p>{t("Creating, joining, or simply rooting for something good.")}</p>
      </div>
      <div className="wallet-heading">
        <Avatar user={user} />
        <strong>
          {t(state.users[user].name)}
          {t("\u2019s demo wallet")}
        </strong>
        <span>
          {t("No real money \u00B7 identity switching is not authentication")}
        </span>
      </div>
      <div className="wallet-cards">
        <div>
          <Wallet size={21} />
          <small>{t("AVAILABLE BALANCE")}</small>
          <strong>{t(money(balance(state, wallet(user))))}</strong>
          <span>{t("Ready for your next promise")}</span>
        </div>
        <div>
          <LockKeyhole size={21} />
          <small>{t("HELD FOR YOUR WISHES")}</small>
          <strong>{t(money(held))}</strong>
          <span>{t("Already committed, still owed")}</span>
        </div>
        <div>
          <Gift size={21} />
          <small>{t("GIFTS RECEIVED \u00B7 LIFETIME")}</small>
          <strong>{t(money(received))}</strong>
          <span>{t("Already included in available balance")}</span>
        </div>
      </div>
      <div className="tabs" aria-label={t("Your wishes")}>
        {["Created", "Joined & designated", "Following"].map((tabName) => (
          <button
            aria-pressed={tab === tabName}
            className={tab === tabName ? "active" : ""}
            key={tabName}
            onClick={() => setTab(tabName)}
          >
            {t(tabName)}
          </button>
        ))}
      </div>
      {wishes.length ? (
        <div className="wish-grid">
          {wishes.map((w) => (
            <WishCard key={w.id} wish={w} />
          ))}
        </div>
      ) : (
        <Empty
          title={t(
            `No wishes ${tab === "Created" ? "created" : tab === "Following" ? "followed" : "joined"} yet.`,
          )}
          text="Your next shared celebration could start with one little promise."
        />
      )}
      <section className="activity-section" id="wallet">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {t("EVERY DEMO CENT, ACCOUNTED FOR")}
            </span>
            <h2>{t("Wallet activity")}</h2>
          </div>
          <span className="muted">
            {t("$1,000 opening demo credit per person")}
          </span>
        </div>
        <div className="transaction-list">
          {txs.map((tx) => {
            const delta = tx.entries
              .filter((e) => e.account === wallet(user))
              .reduce((sum, e) => sum + e.cents, 0);
            const w = tx.wish ? state.wishes[tx.wish] : null;
            const gift = w?.receipt?.payments.some((p) => p.user === user);
            return (
              <div className="transaction" key={tx.id}>
                <span
                  className={`transaction-icon ${delta > 0 ? "positive" : ""}`}
                >
                  {delta > 0 ? (
                    <ArrowDownLeft size={20} />
                  ) : (
                    <ArrowUpRight size={20} />
                  )}
                </span>
                <div>
                  <strong>
                    {t(
                      tx.kind === "opening"
                        ? "Opening demo credit"
                        : tx.kind === "commitment"
                          ? "Gift fully committed"
                          : gift
                            ? "Gift received"
                            : "Unused or failed-event funds returned",
                    )}
                  </strong>
                  {w ? (
                    <a href={`#/wish/${w.id}`}>{wishText(w, "title")}</a>
                  ) : (
                    <span>{t("Simulated funding source")}</span>
                  )}
                  <small>
                    {t(date(tx.at))}
                    {t(" \u00B7 transaction ")}
                    {t(tx.id)}
                  </small>
                </div>
                <strong className={delta > 0 ? "positive" : ""}>
                  {t(delta > 0 ? "+" : "−")}
                  {t(money(Math.abs(delta)))}
                </strong>
              </div>
            );
          })}
        </div>
        <details className="ledger-details">
          <summary>{t("Inspect balanced ledger entries")}</summary>
          <p className="muted">
            {t(
              "Each transaction sums to zero. Opening credits debit the fictional funding-source account. No user wallet or wish escrow may become negative.",
            )}
          </p>
          {txs.map((ledgerItem) => (
            <div className="ledger-row" key={ledgerItem.id}>
              <strong>{t(ledgerItem.id)}</strong>
              {ledgerItem.entries.map((e, i) => (
                <code key={i}>
                  {t(e.account)}
                  {t(": ")}
                  {e.cents}
                  {t(" cents")}
                </code>
              ))}
            </div>
          ))}
        </details>
      </section>
    </div>
  );
}
