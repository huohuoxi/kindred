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
import { balance, wallet, money, date } from "../domain/model";
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
    document.title = `${path === "/create" ? "Create a wish" : path === "/my-wishes" ? "My wishes" : path === "/how-it-works" ? "How it works" : path.startsWith("/wish/") ? state.wishes[path.slice(6)]?.title || "Wish not found" : "Promises worth keeping"} · Kindred`;
  }, [path, state.wishes]);
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
        Skip to main content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#/" aria-label="Kindred home">
            <span className="brand-symbol">
              k<span />
            </span>
            kindred<span className="brand-period">.</span>
          </a>
          <nav className={mobile ? "open" : ""} aria-label="Main navigation">
            {links.map(([url, label]) => (
              <a
                key={url}
                href={`#${url}`}
                className={path === url ? "active" : ""}
                aria-current={path === url ? "page" : undefined}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="header-right">
            <span className="demo-badge">
              <span />
              Interactive demo · No real money
            </span>
            <label className="identity-switch">
              <Avatar user={state.currentUser} small />
              <span className="sr-only">Demo identity</span>
              <select
                aria-label="Switch demo identity"
                value={state.currentUser}
                onChange={(e) =>
                  run({ type: "switchUser", user: e.target.value })
                }
              >
                {Object.values(state.users)
                  .filter((u) => u.selectable)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name.split(" ")[0]}
                    </option>
                  ))}
              </select>
              <ChevronDown size={13} />
              <span className="header-balance">
                {money(balance(state, wallet(state.currentUser)))}
              </span>
            </label>
            <a className="button primary header-create" href="#/create">
              Create a wish <ArrowUpRight size={15} />
            </a>
            <button
              className="menu-toggle icon-button"
              aria-expanded={mobile}
              aria-label="Toggle navigation"
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
            <span className="demo-dot" /> Interactive demo · No real money
          </span>
          <button onClick={() => setControls(true)}>
            <Clock3 size={13} />
            Demo clock: {date(state.clock)}
            <ChevronDown size={12} />
          </button>
        </div>
      </div>
      {(recovery || storageError) && (
        <div role="alert" className="recovery-banner">
          <AlertTriangle size={20} />
          <div>
            <strong>
              {recovery
                ? "Saved demo data needs recovery."
                : "Changes cannot be saved."}
            </strong>
            <p>
              {recovery
                ? "Your saved state is incompatible or corrupt. It has not been overwritten. Open Demo controls and confirm reset to restore a coherent demo."
                : "Your current session works in memory, but progress may be lost on reload. Check browser storage settings."}
            </p>
          </div>
          <button
            className="button secondary"
            onClick={() => setControls(true)}
          >
            Open demo controls
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
            <h1>A new path, perhaps?</h1>
            <p>
              We couldn’t find that page. There are still good things on the
              horizon.
            </p>
            <a className="button primary" href="#/">
              Back to discover
            </a>
          </div>
        )}
      </main>
      <footer className="site-footer">
        <div>
          <a className="brand" href="#/">
            kindred.
          </a>
          <p>Promises worth keeping.</p>
        </div>
        <div>
          <span>
            <Sprout size={16} />A little generosity. A shared tomorrow.
          </span>
          <p>Browser-local prototype · Simulated funds · No real payments</p>
        </div>
        <div>
          <button className="text-link" onClick={() => setControls(true)}>
            <Clock3 size={14} />
            Demo controls
          </button>
          <button className="text-link" onClick={() => setGuide(true)}>
            <Play size={14} />
            Try a demo story
          </button>
        </div>
      </footer>
      {guide && <Guide onClose={() => setGuide(false)} />}
      {controls && (
        <Modal title="You control the demo." onClose={() => setControls(false)}>
          <DemoControls />
        </Modal>
      )}
      {error && (
        <div className="toast error-toast" role="alert">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button
            aria-label="Dismiss error"
            className="icon-button"
            onClick={clearError}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {notice && !error && (
        <div className="toast" role="status">
          <Check size={20} />
          <span>{notice}</span>
          <button
            aria-label="Dismiss notification"
            className="icon-button"
            onClick={() => inform("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
