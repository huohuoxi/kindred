import { useState } from "react";
import { Copy, Share2, Check, Link } from "lucide-react";
import { Modal } from "./UI";
import { date, distributionText, money } from "../domain/model";
import type { Wish } from "../domain/model";
export function Share({ wish, onClose }: { wish: Wish; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const homepage = `${location.origin}${location.pathname}#/`;
  const url = wish.seeded
    ? `${location.origin}${location.pathname}#/wish/${wish.id}`
    : homepage;
  const text = `${wish.title}\nIf ${wish.condition}\nThen ${money(wish.committed)} in demo gifts: ${distributionText(wish.distribution)}.\nDeadline: ${date(wish.deadline)}.\n${wish.seeded ? "Explore this illustrative promise. Progress is stored separately in each browser." : "This wish is browser-local. Live participation is not synchronized. Explore the demo homepage to try your own."}\nInteractive demo. No real money. Joining is free.\n${url}`;
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Copied to clipboard.");
    } catch {
      setMessage(
        "Clipboard access was unavailable. Select and copy the text below.",
      );
    }
  }
  async function share() {
    try {
      await navigator.share({ title: wish.title, text, url });
      setMessage("Opened your device’s share flow.");
    } catch (e) {
      setMessage(
        e instanceof Error && e.name === "AbortError"
          ? "Share cancelled. You can still copy the promise."
          : "Sharing was unavailable. Select or copy the promise below.",
      );
    }
  }
  return (
    <Modal title="Good promises travel." onClose={onClose}>
      <p>Invite someone into a future worth celebrating.</p>
      <div className="inline-note">
        <Link size={18} />
        <span>
          {wish.seeded
            ? "This example has a portable link. Each browser has independent demo data."
            : "This new wish lives in your browser. Share its promise text and the demo homepage; participation is not synchronized."}
        </span>
      </div>
      <label className="field">
        Your shareable promise
        <textarea
          readOnly
          rows={9}
          value={text}
          onFocus={(e) => e.target.select()}
        />
      </label>
      <div className="button-row">
        {typeof navigator.share === "function" && (
          <button className="button primary" onClick={share}>
            <Share2 size={16} />
            Share
          </button>
        )}
        <button className="button primary" onClick={() => copy(text)}>
          <Copy size={16} />
          Copy promise
        </button>
        {wish.seeded && (
          <button className="button secondary" onClick={() => copy(url)}>
            Copy link
          </button>
        )}
      </div>
      {message && (
        <p className="success-message" role="status">
          <Check size={16} />
          {message}
        </p>
      )}
    </Modal>
  );
}
