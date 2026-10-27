# Kindred — Promises worth keeping

A complete, browser-local demo of conditional social gifting: **“If this happens by this date, I will give this much to these people.”** The creator supplies the full gift. Recipients join for free. All identities, escrow, verification, events, money, and payments are simulated.

![Kindred desktop demo](docs/screenshots/discover-desktop.jpg)

[Mobile screenshot](docs/screenshots/discover-mobile.jpg) · [Verified success receipt](docs/screenshots/success-desktop.jpg)

## Run locally

Use Node.js 24 and npm (a reproducible lockfile is included).

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite. To verify and preview a production build:

```sh
npm run check
npm run preview
```

| Script               | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Local Vite server on `127.0.0.1`              |
| `npm run typecheck`  | Strict TypeScript validation                  |
| `npm test`           | Focused domain and persistence tests          |
| `npm run test:watch` | Watch tests while editing                     |
| `npm run build`      | Type checking and production build in `dist/` |
| `npm run preview`    | Serve the current production build locally    |
| `npm run check`      | Tests, type checking, and build               |
| `npm run format`     | Format source, workflows, and documentation   |

## Language / 界面语言

首次打开默认使用简体中文。点击页头的 **English / 中文** 即可一键切换，语言偏好独立保存在 `kindred-language-v1`，刷新后仍然有效。切换不重置页面、表单草稿、钱包或演示进度。示例内容提供中文展示，自行填写的愿望内容保留原文。金额仍以美元计，所有截止时间仍按 UTC 解释。

First visits default to Simplified Chinese. Use **English / 中文** in the header to switch instantly. Language preference is separate from demo state; switching preserves the current route, draft, and progress. New custom wish text retains its original language. USD and UTC semantics are unchanged.

[中文桌面截图](docs/screenshots/discover-zh-desktop.jpg) · [中文手机截图](docs/screenshots/discover-zh-mobile.jpg)

## The two-minute journey

1. Choose **Try a demo story** on Discover.
2. Switch to Maya and create a wish with the first-N template: $10 × 3 slots = $30 committed. Review and confirm the simulation notice.
3. The new wish opens with its share panel. Copy the promise or close the dialog.
4. Switch to Alex and **Join this wish · free**. Alex’s wallet is unchanged by joining.
5. Choose **Submit evidence · propose YES**, **Fill sample evidence**, then submit.
6. Under **Demo controls**, choose **Past review window**, review the proposed global time, and confirm. Finalize YES using simulated human review.
7. The receipt shows $10 to Alex, $20 returned to Maya, and $0 escrow. Switch identities on **My wishes** to inspect both wallet entries.

For a refund, open the personal finish-line example, advance past the evidence grace period, propose NO, advance past review, and finalize. For arbitration, open the disputed choir example and record a rationale before upholding or rejecting its proposal.

Full instructions: [Demo guide](docs/DEMO_GUIDE.md).

## What is included

- Discover with combined search/category filters, sorting, cards, and reversible follows.
- Four-step creation wizard with templates, validation, retained fields, live gift summary, and atomic funding.
- All three distribution modes: first-N fixed gifts, deterministic equal split, and designated personal gift.
- Maya, Alex, and Jordan: switchable fictional identities, each with $1,000 opening credit before seeded transactions.
- Precise deadlines in UTC, one persisted demo clock, evidence grace period, objections, review, arbitration, payouts, refunds, and reconciled receipts.
- Derived wallet balances, escrow accounts, auditable balanced ledger entries, versioned persistence, corrupt-state recovery, and visible storage-error reporting.
- Honest sharing with native Web Share, clipboard, and selectable-text fallbacks.
- Business-model proposal, principal obligations, liquidity risks, and conceptual future AI planning.
- Local SVG illustrations, favicon and preview artwork, responsive layouts, dialog focus management, keyboard support, and reduced-motion styling.

## Architecture

React + TypeScript + Vite, ordinary CSS, Lucide icons, and Zod validation. One application provider dispatches pure commands that return a new state atomically. Every state transition checks financial and lifecycle invariants. Money is integer USD cents; balances come from the ledger rather than copied counters.

See [Architecture](docs/ARCHITECTURE.md), [Concept](docs/CONCEPT.md), and [Verification](docs/VERIFICATION.md).

## Limits

This is one-browser software, not a shared service. State lives under `kindred-demo-v1` in localStorage. No server, real authentication, payment processing, investment, source fetching, live AI, notifications, or social repost verification exists. Multi-tab concurrent editing is unsupported. Browser data can be modified manually; validation does not make this financial infrastructure tamper-proof.

Seeded wishes have portable detail URLs but each visitor’s progress is independent. Newly created wishes must be shared as complete promise text plus the demo homepage. Custom wish URLs do not synchronize participation.

A reset requires confirmation and deletes local creations and progress. If storage is unavailable, a visible warning explains that changes cannot be saved.

## Publish to GitHub Pages

No remote repository or public deployment has been created; no destination was supplied. The local project includes CI and a Pages workflow using official upload/deploy actions.

1. Create your intended GitHub repository; initialize this folder as a Git repository if needed, add that repository as `origin`, and push the source and lockfile to its default branch.
2. In repository **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. Push to the default branch, or manually run **Deploy to GitHub Pages** from that branch. Deployment is restricted to the repository’s default branch, including manual dispatches.
4. For repository hosting, the workflow derives `/<repository-name>/`. Account-root repositories ending in `.github.io` use `/`.
5. For a custom domain, set the repository Actions variable `BASE_PATH` to `/` and configure the domain through GitHub Pages. DNS/domain access is separate and has not been configured.
6. Read the workflow’s actual Pages deployment URL after it succeeds. No live URL is assumed here.

To test a repository subpath locally:

```sh
BASE_PATH=/kindred/ npm run build
BASE_PATH=/kindred/ npm run preview
```

Open the printed preview origin at `/kindred/#/wish/a-greener-block`, then refresh. To return to a root build, run `npm run build` again without `BASE_PATH`.

The implementation follows [Vite’s base-path deployment guidance](https://vite.dev/guide/static-deploy) and [GitHub’s Pages publishing configuration](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## License and provenance

No software license has been selected. The owner’s licensing decision remains open. Kindred is a working demo name; no trademark availability or legal exclusivity is claimed. A future public commit or deployment may document publication of this version, not exclusive ownership of the underlying idea.
