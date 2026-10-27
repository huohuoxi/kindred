import { useLocale } from "../i18n/context";
import { ArrowUpRight, Check, Play, X } from "lucide-react";
import { useApp } from "../app/Provider";
import { participants } from "../domain/model";
export function Guide({ onClose }: { onClose: () => void }) {
  const { t } = useLocale();
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
          {t("YOUR TWO-MINUTE DEMO STORY")}
        </span>
        <button
          aria-label={t("Close demo story")}
          className="icon-button"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <ol>
        <li className={w ? "done" : ""}>
          <span>{t(w ? <Check size={14} /> : "1")}</span>
          <div>
            <strong>{t("Be Maya. Make a three-slot gift.")}</strong>
            <p>{t("Use the first-N template, then commit $30.")}</p>
            <a
              href="#/create?template=first"
              onClick={() => run({ type: "switchUser", user: "maya" })}
            >
              {t("Switch to Maya & create ")}
              <ArrowUpRight size={13} />
            </a>
          </div>
        </li>
        <li className={joined ? "done" : ""}>
          <span>{t(joined ? <Check size={14} /> : "2")}</span>
          <div>
            <strong>{t("Be Alex. Join for free.")}</strong>
            <p>{t("Your available balance stays the same.")}</p>
            <a
              href={w ? `#/wish/${w.id}` : "#/create?template=first"}
              onClick={() => run({ type: "switchUser", user: "alex" })}
            >
              {t("Switch to Alex & open wish ")}
              <ArrowUpRight size={13} />
            </a>
          </div>
        </li>
        <li>
          <span>{t("3")}</span>
          <div>
            <strong>{t("Share a little possibility.")}</strong>
            <p>
              {t(
                "Open Share wish and copy its promise text. New wishes stay browser-local.",
              )}
            </p>
          </div>
        </li>
        <li className={proposed ? "done" : ""}>
          <span>{t(proposed ? <Check size={14} /> : "4")}</span>
          <div>
            <strong>{t("Bring sample evidence.")}</strong>
            <p>
              {t(
                "On your wish, choose Submit evidence, then Fill sample evidence.",
              )}
            </p>
          </div>
        </li>
        <li className={settled ? "done" : ""}>
          <span>{t(settled ? <Check size={14} /> : "5")}</span>
          <div>
            <strong>{t("Give the review a little time.")}</strong>
            <p>
              {t(
                "In Demo controls, advance past review, confirm, and finalize YES.",
              )}
            </p>
          </div>
        </li>
        <li className={settled ? "done" : ""}>
          <span>{t(settled ? <Check size={14} /> : "6")}</span>
          <div>
            <strong>{t("A gift for Alex. Unused slots back to Maya.")}</strong>
            <p>{t("With one join: $10 gifted, $20 refunded.")}</p>
            <a href="#/my-wishes">
              {t("See wallet activity ")}
              <ArrowUpRight size={13} />
            </a>
          </div>
        </li>
      </ol>
      <div className="guide-extras">
        <a href="#/wish/your-first-finish-line">
          {t("Try a failure & refund")}
        </a>
        <small>
          {t(
            "Advance past grace, propose NO, advance past review, then finalize.",
          )}
        </small>
        <a href="#/wish/one-more-encore">{t("Explore a dispute")}</a>
        <small>
          {t("Review the objection and record an arbitration decision.")}
        </small>
      </div>
    </aside>
  );
}
