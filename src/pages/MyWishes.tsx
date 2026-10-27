import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  LockKeyhole,
  Gift,
} from "lucide-react";
import { useApp } from "../app/Provider";
import { balance, wallet, escrow, money, date, key } from "../domain/model";
import { Avatar, WishCard, Empty } from "../components/UI";
export function MyWishes() {
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
        <span className="eyebrow">THE GOOD THINGS YOU’RE PART OF</span>
        <h1>Your promises. Your people.</h1>
        <p>Creating, joining, or simply rooting for something good.</p>
      </div>
      <div className="wallet-heading">
        <Avatar user={user} />
        <strong>{state.users[user].name}’s demo wallet</strong>
        <span>No real money · identity switching is not authentication</span>
      </div>
      <div className="wallet-cards">
        <div>
          <Wallet size={21} />
          <small>AVAILABLE BALANCE</small>
          <strong>{money(balance(state, wallet(user)))}</strong>
          <span>Ready for your next promise</span>
        </div>
        <div>
          <LockKeyhole size={21} />
          <small>HELD FOR YOUR WISHES</small>
          <strong>{money(held)}</strong>
          <span>Already committed, still owed</span>
        </div>
        <div>
          <Gift size={21} />
          <small>GIFTS RECEIVED · LIFETIME</small>
          <strong>{money(received)}</strong>
          <span>Already included in available balance</span>
        </div>
      </div>
      <div className="tabs" aria-label="Your wishes">
        {["Created", "Joined & designated", "Following"].map((t) => (
          <button
            aria-pressed={tab === t}
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
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
          title={`No wishes ${tab === "Created" ? "created" : tab === "Following" ? "followed" : "joined"} yet.`}
          text="Your next shared celebration could start with one little promise."
        />
      )}
      <section className="activity-section" id="wallet">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EVERY DEMO CENT, ACCOUNTED FOR</span>
            <h2>Wallet activity</h2>
          </div>
          <span className="muted">$1,000 opening demo credit per person</span>
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
                    {tx.kind === "opening"
                      ? "Opening demo credit"
                      : tx.kind === "commitment"
                        ? "Gift fully committed"
                        : gift
                          ? "Gift received"
                          : "Unused or failed-event funds returned"}
                  </strong>
                  {w ? (
                    <a href={`#/wish/${w.id}`}>{w.title}</a>
                  ) : (
                    <span>Simulated funding source</span>
                  )}
                  <small>
                    {date(tx.at)} · transaction {tx.id}
                  </small>
                </div>
                <strong className={delta > 0 ? "positive" : ""}>
                  {delta > 0 ? "+" : "−"}
                  {money(Math.abs(delta))}
                </strong>
              </div>
            );
          })}
        </div>
        <details className="ledger-details">
          <summary>Inspect balanced ledger entries</summary>
          <p className="muted">
            Each transaction sums to zero. Opening credits debit the fictional
            funding-source account. No user wallet or wish escrow may become
            negative.
          </p>
          {txs.map((t) => (
            <div className="ledger-row" key={t.id}>
              <strong>{t.id}</strong>
              {t.entries.map((e, i) => (
                <code key={i}>
                  {e.account}: {e.cents} cents
                </code>
              ))}
            </div>
          ))}
        </details>
      </section>
    </div>
  );
}
