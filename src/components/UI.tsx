import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  X,
  ArrowUpRight,
  Bookmark,
  Check,
  ShieldCheck,
  Leaf,
  ArrowRight,
} from "lucide-react";
import type { Wish } from "../domain/model";
import {
  badge,
  money,
  distributionText,
  participants,
  key,
  date,
} from "../domain/model";
import { useApp } from "../app/Provider";
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    const cancel = (event: Event) => {
      event.preventDefault();
      closeRef.current();
    };
    dialog.addEventListener("cancel", cancel);
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.removeEventListener("cancel", cancel);
      dialog.close();
      document.body.style.overflow = priorOverflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      aria-labelledby="dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Avatar({
  user,
  small = false,
}: {
  user: string;
  small?: boolean;
}) {
  const { state } = useApp();
  const person = state.users[user];
  return (
    <span
      className={`avatar ${small ? "small" : ""}`}
      style={{ backgroundColor: person?.color }}
      aria-label={person?.name}
    >
      {person?.name
        .split(" ")
        .map((n) => n[0])
        .join("")}
    </span>
  );
}
export function Status({ wish }: { wish: Wish }) {
  return (
    <span className={`status ${wish.status}`}>
      <span />
      {badge(wish)}
    </span>
  );
}
export function Illustration({
  category,
  hero = false,
}: {
  category: string;
  hero?: boolean;
}) {
  const common = {
    stroke: "#285a43",
    strokeWidth: 3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg
      viewBox="0 0 400 220"
      className={`illustration ${hero ? "hero-art" : ""}`}
      aria-hidden="true"
    >
      {category === "Community" ? (
        <>
          <ellipse
            cx="204"
            cy="197"
            rx="124"
            ry="10"
            fill="#bacbb1"
            opacity=".5"
          />
          <path
            d="M125 187V108m0 35-25-25m25 4 24-25"
            fill="none"
            {...common}
          />
          <circle cx="113" cy="83" r="41" fill="#8baa80" />
          <circle cx="145" cy="104" r="34" fill="#a4bc95" />
          <circle cx="94" cy="111" r="28" fill="#92ad82" />
          <path d="M265 190V93m0 47-26-28m26 6 22-25" fill="none" {...common} />
          <circle cx="260" cy="64" r="48" fill="#587e5b" />
          <circle cx="290" cy="93" r="36" fill="#6c9368" />
          <circle cx="232" cy="103" r="33" fill="#769c70" />
          <path
            d="M194 191v-42m0 10c-28 0-27-27-27-27s27-2 27 27Zm0 8c0-27 29-33 29-33s1 29-29 33Z"
            fill="#668f62"
            {...common}
          />
          <path d="m181 194 5-17h18l5 17" fill="#ce967c" />
          <circle cx="346" cy="45" r="15" fill="#e4b593" />
          <path d="m47 49 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#f5f3e7" />
        </>
      ) : category === "Science" ? (
        <>
          <circle cx="200" cy="113" r="62" fill="#9bacc1" />
          <ellipse
            cx="200"
            cy="113"
            rx="112"
            ry="27"
            transform="rotate(-25 200 113)"
            fill="none"
            stroke="#f4e8d2"
            strokeWidth="15"
          />
          <path
            d="m85 55 4 10 10 4-10 4-4 10-4-10-10-4 10-4Zm231 107 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"
            fill="#f9f5e8"
          />
          <circle cx="307" cy="42" r="4" fill="#f9f5e8" />
          <circle cx="106" cy="183" r="3" fill="#f9f5e8" />
        </>
      ) : category === "Personal goals" ? (
        <>
          <path
            d="M52 181h292M72 158h252"
            stroke="#c8b8a6"
            strokeWidth="2"
            strokeDasharray="9 8"
          />
          <path
            d="m113 132 35-26 30 20 17-37 40 9 22 42 35 13-5 28H168l-55-18Z"
            fill="#f3ebd7"
            stroke="#486753"
            strokeWidth="3"
          />
          <path
            d="m166 108 31 15m-23-32 31 15m-27-31 34 14"
            stroke="#486753"
            strokeWidth="4"
          />
          <path d="M116 161h171" stroke="#d48f70" strokeWidth="8" />
          <path
            d="m254 60 22-20m-4 39 30-7m-68-25 10-24"
            stroke="#ae7a50"
            strokeWidth="3"
          />
        </>
      ) : category === "Sports" ? (
        <>
          <circle
            cx="200"
            cy="112"
            r="76"
            fill="#f0e9d6"
            stroke="#6a7a59"
            strokeWidth="3"
          />
          <path
            d="m200 77 34 25-13 39h-42l-13-39Zm-74 21 40 4m-29 53 42-14m21 47v-47m63 14-42-14m53-43-40 4m-34-66v41"
            fill="#718468"
            stroke="#6a7a59"
            strokeWidth="3"
          />
          <path
            d="m81 63 16-13m206 118 18 8"
            stroke="#d3ad7d"
            strokeWidth="5"
          />
        </>
      ) : (
        <>
          <path
            d="M182 149V58l91-17v93"
            fill="none"
            stroke="#6e5d86"
            strokeWidth="13"
            strokeLinejoin="round"
          />
          <ellipse
            cx="164"
            cy="153"
            rx="25"
            ry="18"
            fill="#6e5d86"
            transform="rotate(-20 164 153)"
          />
          <ellipse
            cx="255"
            cy="138"
            rx="25"
            ry="18"
            fill="#6e5d86"
            transform="rotate(-20 255 138)"
          />
          <path
            d="M104 122V76l38-7"
            fill="none"
            stroke="#ab8eaa"
            strokeWidth="7"
          />
          <ellipse cx="94" cy="124" rx="15" ry="10" fill="#ab8eaa" />
          <path
            d="m306 70 5 12 12 5-12 5-5 12-5-12-12-5 12-5Z"
            fill="#d7b27e"
          />
        </>
      )}
    </svg>
  );
}
export function WishCard({ wish }: { wish: Wish }) {
  const { state, run } = useApp();
  const followed = state.follows.includes(key(wish.id, state.currentUser));
  const joined = participants(state, wish.id);
  return (
    <article className="wish-card">
      <div
        className={`card-art art-${wish.category.toLowerCase().replace(" ", "-")}`}
      >
        <a href={`#/wish/${wish.id}`} tabIndex={-1} aria-hidden="true">
          <Illustration category={wish.category} />
        </a>
        <span className="category-tag">{wish.category}</span>
        <button
          className={`save-button ${followed ? "saved" : ""}`}
          aria-label={`${followed ? "Unfollow" : "Follow"} ${wish.title}`}
          aria-pressed={followed}
          onClick={() => run({ type: "toggleFollow", wishId: wish.id })}
        >
          <Bookmark size={17} fill={followed ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="card-body">
        <div className="creator">
          <Avatar user={wish.creator} small />
          <span>{state.users[wish.creator].name}</span>
          <Status wish={wish} />
        </div>
        <a className="card-title" href={`#/wish/${wish.id}`}>
          <h3>{wish.title}</h3>
        </a>
        <p className="card-condition">
          If {wish.condition.replace(/^The /, "the ")}
        </p>
        <div className="card-gift">
          <span className="gift-icon">
            <Leaf size={19} />
          </span>
          <div>
            <strong>
              {money(wish.committed)} <span>demo funds committed</span>
            </strong>
            <small>{distributionText(wish.distribution)}</small>
          </div>
        </div>
        <div className="card-bottom">
          <span>
            {wish.distribution.mode === "personal"
              ? "One personal gift"
              : `${joined.length} ${wish.distribution.mode === "first" ? `/ ${wish.distribution.slots} slots joined` : joined.length === 1 ? "person joined" : "people joined"}`}
          </span>
          <span>
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            }).format(wish.deadline)}{" "}
            <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </article>
  );
}
export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <Leaf size={32} />
      <h3>{title}</h3>
      <p>{text}</p>
      <a href="#/create" className="text-link">
        Create a wish <ArrowRight size={16} />
      </a>
    </div>
  );
}
export function TrustNote() {
  return (
    <div className="trust-note">
      <ShieldCheck size={17} />
      <span>
        Fully committed demo funds. Free to join. Clear rules from the start.
      </span>
    </div>
  );
}
export function TimeNote({ value }: { value: number }) {
  return <time dateTime={new Date(value).toISOString()}>{date(value)}</time>;
}
export function CheckLine({ children }: { children: ReactNode }) {
  return (
    <div className="check-line">
      <Check size={16} />
      {children}
    </div>
  );
}
