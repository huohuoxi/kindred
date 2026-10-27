import { useLocale } from "../i18n/context";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  Sprout,
  Gift,
  Users,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../app/Provider";
import { categories, money, balance } from "../domain/model";
import {
  Illustration,
  WishCard,
  Empty,
  Avatar,
  TrustNote,
} from "../components/UI";
export function Discover({ startGuide }: { startGuide: () => void }) {
  const { t, language, wishText } = useLocale();
  const { state } = useApp();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All wishes");
  const [sort, setSort] = useState("featured");
  const wishes = useMemo(
    () =>
      Object.values(state.wishes)
        .filter(
          (w) =>
            (category === "All wishes" || w.category === category) &&
            `${w.title} ${w.story} ${w.condition} ${state.users[w.creator].name} ${wishText(w, "title")} ${wishText(w, "story")} ${wishText(w, "condition")} ${t(state.users[w.creator].name)}`
              .toLowerCase()
              .includes(search.toLowerCase().trim()),
        )
        .sort((a, b) =>
          sort === "deadline"
            ? a.deadline - b.deadline
            : sort === "newest"
              ? b.createdAt - a.createdAt
              : Number(a.status === "settled") - Number(b.status === "settled"),
        ),
    [state, category, search, sort, language],
  );
  const totalHeld = Object.keys(state.wishes).reduce(
    (sum, id) => sum + balance(state, `escrow:${id}`),
    0,
  );
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="tiny-star">{t("\u2733")}</span>
            {t(" A LITTLE GENEROSITY. A SHARED TOMORROW.")}
          </span>
          <h1>
            {language === "zh" ? (
              <>
                为值得<em>庆祝的未来，</em>
                <br />
                许下一个愿望。
              </>
            ) : (
              <>
                Make a promise to
                <br />a future worth <em>celebrating.</em>
              </>
            )}
          </h1>
          <p>
            {t("Commit a gift. Invite your people.")}
            <br className="desktop-br" />
            {t(" If it happens, they receive it.")}
          </p>
          <div className="button-row">
            <a className="button primary" href="#/create">
              {t("Create a wish ")}
              <ArrowUpRight size={17} />
            </a>
            <button className="button text-button" onClick={startGuide}>
              {t("Try a demo story ")}
              <ArrowRight size={17} />
            </button>
          </div>
          <div className="hero-fine">
            <span className="dot" />
            {t("You bring the gift. Your people join for free.")}
          </div>
        </div>
        <a href="#/wish/a-greener-block" className="hero-feature">
          <div className="feature-top">
            <span>
              <Sprout size={16} />
              {t(" SMALL ACTIONS, SHARED JOY")}
            </span>
            <ArrowUpRight size={21} />
          </div>
          <Illustration category="Community" hero />
          <div className="feature-promise">
            <span className="handwritten">
              {t("A greener tomorrow starts here.")}
            </span>
            <h2>
              {t("Ten new trees.")}
              <br />
              {t("Five coffees on Maya.")}
            </h2>
            <div className="feature-foot">
              <div className="avatar-stack">
                <Avatar user="maya" small />
                <Avatar user="alex" small />
                <Avatar user="jordan" small />
              </div>
              <div>
                <strong>{t("$50 committed")}</strong>
                <small>{t("$10 each \u00B7 first 5 neighbors")}</small>
              </div>
              <span className="round-arrow">
                <ArrowUpRight size={20} />
              </span>
            </div>
          </div>
        </a>
      </section>
      <div className="principles">
        <span>
          <Gift size={19} />
          <strong>{t("A gift, fully committed.")}</strong>
          {t(" No fundraising targets.")}
        </span>
        <span>
          <Users size={19} />
          <strong>{t("Everyone joins free.")}</strong>
          {t(" Always.")}
        </span>
        <span>
          <Sprout size={19} />
          <strong>{t("A clear outcome.")}</strong>
          {t(" Gifts sent or funds returned.")}
        </span>
      </div>
      <section className="discover-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t("GOOD THINGS ON THE HORIZON")}</span>
            <h2>{t("Find a future to root for.")}</h2>
          </div>
          <a href="#/how-it-works" className="text-link">
            {t("How Kindred works ")}
            <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="filter-row">
          <div
            className="filter-tabs"
            aria-label={t("Filter wishes by category")}
          >
            {["All wishes", ...categories].map((c) => (
              <button
                className={category === c ? "active" : ""}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                key={c}
              >
                {t(c)}
              </button>
            ))}
          </div>
          <div className="search-sort">
            <label className="search">
              <Search size={17} />
              <input
                aria-label={t("Search wishes")}
                placeholder={t("Find a wish…")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label className="sort">
              <SlidersHorizontal size={16} />
              <select
                aria-label={t("Sort wishes")}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="featured">{t("Featured")}</option>
                <option value="newest">{t("Newest")}</option>
                <option value="deadline">{t("Deadline")}</option>
              </select>
            </label>
          </div>
        </div>
        <div className="feed-meta">
          <span>
            {wishes.length}
            {t(" illustrative wishes")}
          </span>
          <span>
            {t(money(totalHeld))}
            {t(" currently held \u00B7 demo data")}
          </span>
        </div>
        {wishes.length ? (
          <div className="wish-grid">
            {wishes.map((w) => (
              <WishCard key={w.id} wish={w} />
            ))}
          </div>
        ) : (
          <>
            <Empty
              title={t("A little quiet here.")}
              text="Try a different search or category, or plant the seed for a new wish."
            />
            <button
              className="button secondary"
              onClick={() => {
                setSearch("");
                setCategory("All wishes");
              }}
            >
              {t("Clear filters")}
            </button>
          </>
        )}
      </section>
      <section className="bottom-invite">
        <div>
          <span className="eyebrow">
            {t("WHAT FUTURE ARE YOU ROOTING FOR?")}
          </span>
          <h2>{t("Give your \u201Cwhat if\u201D a little heart.")}</h2>
          <p>
            {t(
              "A milestone. A community moment. A reason to celebrate together.",
            )}
          </p>
        </div>
        <a className="button primary" href="#/create">
          {t("Make your first promise ")}
          <ChevronRight size={17} />
        </a>
      </section>
      <TrustNote />
    </>
  );
}
