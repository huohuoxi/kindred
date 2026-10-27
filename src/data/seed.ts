import { execute } from "../domain/commands";
import { DAY, HOUR, REVIEW } from "../domain/model";
import type { AppState, Terms, CommandInput } from "../domain/model";
export function createSeed(now: number): AppState {
  now = Math.floor(now / 60_000) * 60_000;
  let s: AppState = {
    version: 1,
    clock: now - 4 * DAY,
    currentUser: "maya",
    users: {
      maya: {
        id: "maya",
        name: "Maya Chen",
        color: "#e8c5b3",
        selectable: true,
      },
      alex: {
        id: "alex",
        name: "Alex Rivera",
        color: "#c6d7e1",
        selectable: true,
      },
      jordan: {
        id: "jordan",
        name: "Jordan Ellis",
        color: "#d9d1aa",
        selectable: true,
      },
    },
    wishes: {},
    participations: {},
    follows: [],
    proposals: {},
    ledger: [],
    activities: [],
    applied: [],
    joinSequence: 0,
  };
  for (const user of Object.values(s.users)) {
    const id = `opening-${user.id}`;
    s.applied.push(id);
    s.ledger.push({
      id,
      commandId: id,
      wish: null,
      at: s.clock,
      kind: "opening",
      entries: [
        { account: "source", cents: -100_000 },
        { account: `wallet:${user.id}`, cents: 100_000 },
      ],
    });
  }
  let i = 0;
  const act = (actor: string, command: CommandInput) => {
    s = execute(s, { ...command, actor, id: `seed-${++i}` });
  };
  const make = (wishId: string, actor: string, terms: Terms) =>
    act(actor, { type: "commitWish", wishId, terms, seeded: true });
  make("a-greener-block", "maya", {
    title: "A greener block, a little gift.",
    category: "Community",
    story:
      "Good things grow when we show up together. If our fictional neighborhood plants its next ten trees, coffee is on me for the first five neighbors.",
    condition:
      "The illustrative Oak Street volunteer team records 10 newly planted trees in its signed planting log.",
    deadline: now + 5 * DAY,
    criteria:
      "A dated planting log naming all 10 tree locations, signed by the fictional volunteer coordinator, with an occurrence date on or before the deadline.",
    source: "https://example.org/oak-street/planting-log",
    distribution: { mode: "first", perPerson: 1000, slots: 5 },
  });
  act("alex", { type: "joinWish", wishId: "a-greener-block" });
  act("jordan", { type: "joinWish", wishId: "a-greener-block" });
  make("a-small-step-for-science", "alex", {
    title: "A small step. A shared celebration.",
    category: "Science",
    story:
      "Some discoveries deserve a shared moment of wonder. Here is a little celebration for a fictional community science milestone.",
    condition:
      "The fictional Aurora student observatory publishes its first confirmed image of Saturn’s rings in its public project log.",
    deadline: now + 12 * DAY,
    criteria:
      "The project log must contain a dated image with a caption confirming it was captured by the Aurora student team, on or before the deadline.",
    source: "https://example.org/aurora/project-log",
    distribution: { mode: "split", pool: 10001 },
  });
  act("maya", { type: "joinWish", wishId: "a-small-step-for-science" });
  act("jordan", { type: "joinWish", wishId: "a-small-step-for-science" });
  make("your-first-finish-line", "jordan", {
    title: "Your first finish line is just the start.",
    category: "Personal goals",
    story:
      "Maya has been training for her very first 5K. A finish-line brunch is my way of saying: I knew you could do it.",
    condition:
      "Maya finishes the fictional Riverside 5K, with her name recorded in the event’s official finish list.",
    deadline: now + 3 * DAY,
    criteria:
      "A dated finish list from the fictional Riverside race organizer showing Maya Chen as a finisher before the deadline.",
    source: "https://example.org/riverside/results",
    distribution: { mode: "personal", amount: 7500, recipient: "maya" },
  });
  make("home-team-heart", "maya", {
    title: "For the team that never gave up.",
    category: "Sports",
    story:
      "Our fictional neighborhood team has made the final. Win or lose, we are proud. If they lift the cup, we will celebrate together.",
    condition:
      "The fictional Parkside FC wins its community league final as recorded in the league’s match report.",
    deadline: now - DAY,
    criteria:
      "A final match report naming Parkside FC as the winner, with a match date on or before the deadline.",
    source: "https://example.org/parkside/final-report",
    distribution: { mode: "first", perPerson: 1500, slots: 4 },
  });
  act("alex", { type: "joinWish", wishId: "home-team-heart" });
  make("one-more-encore", "alex", {
    title: "One more encore for the neighborhood.",
    category: "Culture",
    story:
      "A fictional free concert is our favorite kind of night out. If the community choir makes its debut, let’s make an evening of it.",
    condition:
      "The fictional Willow Choir performs its debut public concert, documented by the community venue’s program.",
    deadline: now - DAY,
    criteria:
      "A dated venue program and a completion note confirming that the advertised public performance took place before the deadline.",
    source: "https://example.org/willow/venue-program",
    distribution: { mode: "split", pool: 6000 },
  });
  act("jordan", { type: "joinWish", wishId: "one-more-encore" });
  make("the-library-lives-on", "jordan", {
    title: "A new chapter, for all of us.",
    category: "Community",
    story:
      "The fictional Little Elm reading room opened its doors. Two neighbors get a small thank-you for being part of this story.",
    condition:
      "The fictional Little Elm reading room holds its first public opening, confirmed in its opening-day report.",
    deadline: now - 2 * DAY,
    criteria:
      "The dated opening-day report confirms that the reading room admitted visitors before the deadline.",
    source: "https://example.org/little-elm/opening-report",
    distribution: { mode: "first", perPerson: 1250, slots: 3 },
  });
  act("maya", { type: "joinWish", wishId: "the-library-lives-on" });
  act("alex", { type: "joinWish", wishId: "the-library-lives-on" });
  act("jordan", {
    type: "submitProposal",
    wishId: "the-library-lives-on",
    outcome: "success",
    summary:
      "Illustrative evidence: the opening-day report records the reading room admitting visitors.",
    url: "https://example.org/little-elm/opening-report",
    occurredAt: s.clock,
  });
  act("maya", { type: "advanceClock", to: s.clock + REVIEW + 60_000 });
  act("jordan", { type: "finalizeProposal", wishId: "the-library-lives-on" });
  act("maya", { type: "advanceClock", to: now - 2 * HOUR });
  act("maya", {
    type: "submitProposal",
    wishId: "home-team-heart",
    outcome: "success",
    summary:
      "Illustrative match report: Parkside FC is listed as the winner of the final.",
    url: "https://example.org/parkside/final-report",
    occurredAt: now - DAY - HOUR,
  });
  act("alex", {
    type: "submitProposal",
    wishId: "one-more-encore",
    outcome: "success",
    summary:
      "Illustrative venue program lists the Willow Choir debut as completed.",
    url: "https://example.org/willow/venue-program",
    occurredAt: now - DAY - HOUR,
  });
  act("jordan", {
    type: "objectToProposal",
    wishId: "one-more-encore",
    reason:
      "The sample program does not confirm that the full advertised concert took place. Please review the completion note.",
  });
  act("maya", { type: "advanceClock", to: now });
  act("maya", { type: "toggleFollow", wishId: "your-first-finish-line" });
  return s;
}
