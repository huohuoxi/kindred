import { ArrowUpRight, Check, Play, X } from "lucide-react";
import { useApp } from "../app/Provider";
import { participants } from "../domain/model";
export function Guide({ onClose }: { onClose: () => void }) {
  const { state, run } = useApp();
  const w = Object.values(state.wishes)
    .filter(
      (w) =>
        !w.seeded &&
        w.creator === "maya" &&
        w.distribution.mode === "first" &&
        w.distribution.slots === 3,
    )
    .at(-1);
  const joined = w && participants(state, w.id).some((p) => p.user === "alex");
  const proposed =
    w && Object.values(state.proposals).some((p) => p.wish === w.id);
  const settled = w?.status === "settled";
  return (
    <aside className="guide">
      <div className="guide-heading">
        <span>
          <Play size={15} />
          YOUR TWO-MINUTE DEMO STORY
        </span>
        <button
          aria-label="Close demo story"
          className="icon-button"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <ol>
        <li className={w ? "done" : ""}>
          <span>{w ? <Check size={14} /> : "1"}</span>
          <div>
            <strong>Be Maya. Make a three-slot gift.</strong>
            <p>Use the first-N template, then commit $30.</p>
            <a
              href="#/create?template=first"
              onClick={() => run({ type: "switchUser", user: "maya" })}
            >
              Switch to Maya & create <ArrowUpRight size={13} />
            </a>
          </div>
        </li>
        <li className={joined ? "done" : ""}>
          <span>{joined ? <Check size={14} /> : "2"}</span>
          <div>
            <strong>Be Alex. Join for free.</strong>
            <p>Your available balance stays the same.</p>
            <a
              href={w ? `#/wish/${w.id}` : "#/create?template=first"}
              onClick={() => run({ type: "switchUser", user: "alex" })}
            >
              Switch to Alex & open wish <ArrowUpRight size={13} />
            </a>
          </div>
        </li>
        <li>
          <span>3</span>
          <div>
            <strong>Share a little possibility.</strong>
            <p>
              Open Share wish and copy its promise text. New wishes stay
              browser-local.
            </p>
          </div>
        </li>
        <li className={proposed ? "done" : ""}>
          <span>{proposed ? <Check size={14} /> : "4"}</span>
          <div>
            <strong>Bring sample evidence.</strong>
            <p>
              On your wish, choose Submit evidence, then Fill sample evidence.
            </p>
          </div>
        </li>
        <li className={settled ? "done" : ""}>
          <span>{settled ? <Check size={14} /> : "5"}</span>
          <div>
            <strong>Give the review a little time.</strong>
            <p>
              In Demo controls, advance past review, confirm, and finalize YES.
            </p>
          </div>
        </li>
        <li className={settled ? "done" : ""}>
          <span>{settled ? <Check size={14} /> : "6"}</span>
          <div>
            <strong>A gift for Alex. Unused slots back to Maya.</strong>
            <p>With one join: $10 gifted, $20 refunded.</p>
            <a href="#/my-wishes">
              See wallet activity <ArrowUpRight size={13} />
            </a>
          </div>
        </li>
      </ol>
      <div className="guide-extras">
        <a href="#/wish/your-first-finish-line">Try a failure & refund</a>
        <small>
          Advance past grace, propose NO, advance past review, then finalize.
        </small>
        <a href="#/wish/one-more-encore">Explore a dispute</a>
        <small>Review the objection and record an arbitration decision.</small>
      </div>
    </aside>
  );
}
