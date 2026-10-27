# Verification record

Date: **October 27, 2026**. Checks were performed locally; there is no remote CI result or deployed public URL.

## Automated

`npm run check` runs the focused Vitest suite, strict TypeScript checking, and the Vite production build. The suite verifies:

- Exact monetary string parsing and invalid-input rejection.
- Coherent six-wish seed with reconciled receipts.
- Atomic funding, insufficient-balance rejection, and duplicate-command idempotency.
- Free enrollment, self/duplicate/late/full-slot rejection, and deterministic equal-time join order.
- Equal-split leftover cents, zero-cent shares, first-N unused slots, success with no public recipients, and personal eligibility.
- HTTP(S) restrictions and positive-proposal occurrence boundaries.
- Exact deadline, grace, and review boundaries; no premature NO proposals or finalization.
- Irreversible enrollment closure, eligible objections, duplicate objections, arbitration, rejected YES/NO proposals, and resubmission policy.
- Full refunds, success settlement, zero terminal escrow, principal conservation, repeated settlement after reload, and repeated settlement command IDs.
- Persistence round trips, incompatible/malformed state, and tampered ledger/receipt rejection.

**Final result:** 43 tests passed; strict TypeScript checking and the production build passed. Vite reported harmless third-party Zod annotation warnings and removed those comments during bundling.

The production build was also run with `BASE_PATH=/kindred/`.

## Browser interaction performed

The local app was exercised through the Codex in-app browser, with desktop and 390px mobile viewports.

- An empty wizard showed inline required-field errors and focused the first invalid field.
- Maya created a new first-N promise and committed $30 for three $10 slots. The app navigated to the new wish and opened its share panel.
- Copy promise succeeded and included the explicit browser-local participation boundary.
- Switching to Alex and joining left Alex’s available balance unchanged.
- Sample evidence opened the review window. A confirmed global time advance enabled finalization. Success delivered $10 to Alex, returned $20 to Maya, and showed $0 escrow and a $30 reconciled receipt.
- A seeded personal wish followed NO proposal → review → full $75 refund. Reload retained its terminal state and receipt.
- The seeded dispute held $60 and exposed arbitration rather than normal finalization. An explicit rationale and uphold decision settled the proposed successful outcome.
- New equal-split ($100) and personal ($50) wishes were also funded through the mobile wizard. The personal gift had a designated recipient and no public join button.
- Combined Science filtering and a nonmatching search produced the intentional empty state. Clear filters restored the feed.
- Mobile navigation and wallet/detail/creation screens were exercised. Measured document width matched the 390px viewport with no horizontal overflow on those checked screens.
- The share dialog received focus; Escape closed it and focus returned to Share wish.
- A production build served from `/kindred/#/wish/a-greener-block` rendered and survived direct refresh. The loaded JavaScript and stylesheet URLs included `/kindred/assets/`. No errors or warnings were reported in the production tab’s captured console during this check.

- Unknown routes and missing wish IDs showed helpful recovery links.
- Reset cancellation preserved progress; confirming reset removed the test-created wishes and restored all six seeded wishes, Maya’s $902.50 available balance, and the coherent $345.01 total demo escrow. The final handoff is reset to this seed.

Screenshots in `docs/screenshots/` are actual browser captures, not mockups.

## Scope of verification

Reduced-motion behavior is implemented with CSS and was inspected in source; a separate operating-system reduced-motion preference was not toggled. Native Web Share’s external destination flow was not completed. Clipboard-denial and storage-quota failures are handled in code but were not forced through browser settings. This is not a full assistive-technology or cross-browser certification.

The GitHub workflows and publishing instructions are prepared locally. GitHub authentication, remote repository creation, actual Actions execution, DNS, and public deployment remain unperformed because no destination was supplied. No public repository or live-demo URL is claimed.
