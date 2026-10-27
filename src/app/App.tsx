import { useLocale } from "../i18n/context";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Clock3,
  Menu,
  X,
  Sprout,
  AlertTriangle,
  Check,
  Play,
} from "lucide-react";
import { useApp } from "./Provider";
import { balance, wallet, money } from "../domain/model";
import { Avatar, Modal } from "../components/UI";
import { DemoControls } from "../components/DemoControls";
import { Guide } from "../components/Guide";
import { Discover } from "../pages/Discover";
import { Create } from "../pages/Create";
import { WishDetail } from "../pages/WishDetail";
import { MyWishes } from "../pages/MyWishes";
import { HowItWorks } from "../pages/HowItWorks";
function readRoute() {
  return location.hash.slice(1) || "/";
}
export function App() {
  const { t, date, language, setLanguage, wishText } = useLocale();
  const {
    state,
    run,
    recovery,
    storageError,
    error,
    notice,
    clearError,
    inform,
  } = useApp();
  const [route, setRoute] = useState(readRoute);
  const [controls, setControls] = useState(false);
  const [guide, setGuide] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const change = () => {
      setRoute(readRoute());
      setMobile(false);
      clearError();
      window.scrollTo(0, 0);
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>("main")
          ?.focus({ preventScroll: true }),
      );
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, [clearError]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => inform(""), 6000);
    return () => clearTimeout(timer);
  }, [notice, inform]);
  const path = route.split("?")[0];
  useEffect(() => {
    const wish = path.startsWith("/wish/") ? state.wishes[path.slice(6)] : null;
    const title = wish
      ? wishText(wish, "title")
      : t(
          path === "/create"
            ? "Create a wish"
            : path === "/my-wishes"
              ? "My wishes"
              : path === "/how-it-works"
                ? "How it works"
                : path.startsWith("/wish/")
                  ? "Wish not found"
                  : "Promises worth keeping",
        );
    document.title = `${title} · Kindred`;
  }, [path, state.wishes, language]);
  const links = [
    ["/", "Discover"],
    ["/my-wishes", "My wishes"],
    ["/how-it-works", "How it works"],
  ];
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        {t("Skip to main content")}
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#/" aria-label={t("Kindred home")}>
            <span className="brand-symbol">
              {t("k")}
              <span />
            </span>
            {t("kindred")}
            <span className="brand-period">{t(".")}</span>
          </a>
          <nav
            className={mobile ? "open" : ""}
            aria-label={t("Main navigation")}
          >
            {links.map(([url, label]) => (
              <a
                key={url}
                href={`#${url}`}
                className={path === url ? "active" : ""}
                aria-current={path === url ? "page" : undefined}
              >
                {t(label)}
              </a>
            ))}
          </nav>
          <div className="header-right">
            <button
              className="language-toggle"
              type="button"
              onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
              aria-label={
                language === "zh" ? "切换为英文" : "Switch to Chinese"
              }
              title={language === "zh" ? "切换为英文" : "Switch to Chinese"}
            >
              <span aria-hidden="true">文 / A</span>
              {language === "zh" ? "English" : "中文"}
            </button>
            <span className="demo-badge">
              <span />
              {t("Interactive demo \u00B7 No real money")}
            </span>
            <label className="identity-switch">
              <Avatar user={state.currentUser} small />
              <span className="sr-only">{t("Demo identity")}</span>
              <select
                aria-label={t("Switch demo identity")}
                value={state.currentUser}
                onChange={(e) =>
                  run({ type: "switchUser", user: e.target.value })
                }
              >
                {Object.values(state.users)
                  .filter((u) => u.selectable)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {t(u.name.split(" ")[0])}
                    </option>
                  ))}
              </select>
              <ChevronDown size={13} />
              <span className="header-balance">
                {t(money(balance(state, wallet(state.currentUser))))}
              </span>
            </label>
            <a className="button primary header-create" href="#/create">
              {t("Create a wish ")}
              <ArrowUpRight size={15} />
            </a>
            <button
              className="menu-toggle icon-button"
              aria-expanded={mobile}
              aria-label={t("Toggle navigation")}
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <div className="clock-strip">
        <div>
          <span>
            <span className="demo-dot" />
            {t(" Interactive demo \u00B7 No real money")}
          </span>
          <button onClick={() => setControls(true)}>
            <Clock3 size={13} />
            {t("Demo clock: ")}
            {t(date(state.clock))}
            <ChevronDown size={12} />
          </button>
        </div>
      </div>
      {(recovery || storageError) && (
        <div role="alert" className="recovery-banner">
          <AlertTriangle size={20} />
          <div>
            <strong>
              {t(
                recovery
                  ? "Saved demo data needs recovery."
                  : "Changes cannot be saved.",
              )}
            </strong>
            <p>
              {t(
                recovery
                  ? "Your saved state is incompatible or corrupt. It has not been overwritten. Open Demo controls and confirm reset to restore a coherent demo."
                  : "Your current session works in memory, but progress may be lost on reload. Check browser storage settings.",
              )}
            </p>
          </div>
          <button
            className="button secondary"
            onClick={() => setControls(true)}
          >
            {t("Open demo controls")}
          </button>
        </div>
      )}
      <main id="main" tabIndex={-1} className="main-content">
        {path === "/" ? (
          <Discover startGuide={() => setGuide(true)} />
        ) : path === "/create" ? (
          <Create key={route} />
        ) : path === "/my-wishes" ? (
          <MyWishes />
        ) : path === "/how-it-works" ? (
          <HowItWorks />
        ) : /^\/wish\/[^/]+$/.test(path) ? (
          <WishDetail id={path.slice(6)} />
        ) : (
          <div className="empty">
            <h1>{t("A new path, perhaps?")}</h1>
            <p>
              {t(
                "We couldn\u2019t find that page. There are still good things on the horizon.",
              )}
            </p>
            <a className="button primary" href="#/">
              {t("Back to discover")}
            </a>
          </div>
        )}
      </main>
      <footer className="site-footer">
        <div>
          <a className="brand" href="#/">
            {t("kindred.")}
          </a>
          <p>{t("Promises worth keeping.")}</p>
        </div>
        <div>
          <span>
            <Sprout size={16} />
            {t("A little generosity. A shared tomorrow.")}
          </span>
          <p>
            {t(
              "Browser-local prototype \u00B7 Simulated funds \u00B7 No real payments",
            )}
          </p>
        </div>
        <div>
          <button className="text-link" onClick={() => setControls(true)}>
            <Clock3 size={14} />
            {t("Demo controls")}
          </button>
          <button className="text-link" onClick={() => setGuide(true)}>
            <Play size={14} />
            {t("Try a demo story")}
          </button>
        </div>
      </footer>
      {guide && <Guide onClose={() => setGuide(false)} />}
      {controls && (
        <Modal
          title={t("You control the demo.")}
          onClose={() => setControls(false)}
        >
          <DemoControls />
        </Modal>
      )}
      {t(
        error && (
          <div className="toast error-toast" role="alert">
            <AlertTriangle size={20} />
            <span>{t(error)}</span>
            <button
              aria-label={t("Dismiss error")}
              className="icon-button"
              onClick={clearError}
            >
              <X size={16} />
            </button>
          </div>
        ),
      )}
      {t(
        notice && !error && (
          <div className="toast" role="status">
            <Check size={20} />
            <span>{t(notice)}</span>
            <button
              aria-label={t("Dismiss notification")}
              className="icon-button"
              onClick={() => inform("")}
            >
              <X size={16} />
            </button>
          </div>
        ),
      )}
    </>
  );
}
