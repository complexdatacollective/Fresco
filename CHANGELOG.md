# fresco

## 4.1.4

### Patch Changes

- 019c1c0: Interview pages now send an origin-only `Referer`, so URL-restricted Mapbox tokens work with Fresco.

  Fresco set `Referrer-Policy: no-referrer` on `/interview/*` and `/onboard/*` so that the interview id in those URLs could never reach a third party. That also withheld the site's origin, and Mapbox evaluates a token's URL restrictions from the `Referer` header — so a Geospatial stage backed by a URL-restricted token failed with 403 on every map load, leaving researchers no choice but an unrestricted token. Those routes now use `strict-origin-when-cross-origin`, the policy every other Fresco route already carried: a cross-origin request carries only the scheme and host, an HTTPS→HTTP downgrade carries nothing, and the full URL, interview id included, is sent only to same-origin requests, which already know it. The protection the old policy provided is unchanged; Mapbox can now see the origin it needs.

  Existing deployments must upgrade to this version to benefit. A deployment on an earlier release still sends no `Referer`, so its Mapbox token has to stay unrestricted.

- Updated dependencies ([b387946](https://github.com/complexdatacollective/network-canvas-monorepo/commit/b387946d706f5779779e11956af04e0e4904d474), [b4b21ed](https://github.com/complexdatacollective/network-canvas-monorepo/commit/b4b21ed955b96bc3c59aeefd18f6f7d5bc3ea19a), [05ea832](https://github.com/complexdatacollective/network-canvas-monorepo/commit/05ea8325b4a5c93e2f8081309db45e3ecba948b2), [0666674](https://github.com/complexdatacollective/network-canvas-monorepo/commit/0666674c95a4865227bddc103b131720926ab7c8))
  - @codaco/protocol-validation@13.0.1
  - @codaco/fresco-ui@6.4.0
  - @codaco/tailwind-config@1.4.0

## 4.1.3

### Patch Changes

- 77c3736: Replace the interview text-size choices with an accessible percentage input that supports plus and minus controls, arrow keys, and direct entry.
- Updated dependencies ([080d355](https://github.com/complexdatacollective/network-canvas-monorepo/commit/080d355e7bb30b7d9cf7c8653582a81103b6b8b5), [cead6fc](https://github.com/complexdatacollective/network-canvas-monorepo/commit/cead6fca6412f9322403896d09606bfcb1be1e58), [77c3736](https://github.com/complexdatacollective/network-canvas-monorepo/commit/77c37364a043f12fa38d97ec0004514c77636b88), [0584c69](https://github.com/complexdatacollective/network-canvas-monorepo/commit/0584c69b1b210e533c1a18d7456a7808934989e7))
  - @codaco/fresco-ui@6.3.0
  - @codaco/interview@9.0.1

## 4.1.2

### Patch Changes

- b51ef59: Prevent malicious form field paths from modifying object prototypes while preserving dotted protocol variable identifiers and nested field namespaces.
- 873f3bf: Deployments with analytics disabled no longer contact the Network Canvas analytics service.

  Analytics previously started as soon as a page loaded, before the deployment's own setting had been read. A deployment that set `DISABLE_ANALYTICS` or turned analytics off in its settings still requested configuration, supporting scripts, and feature flags on every page load, and could send one anonymous event before the setting took effect. Each new browser also created a new anonymous person record.

  Analytics is now loaded only once the server confirms it is enabled, so a deployment with it disabled makes no requests at all. If the setting cannot be read, nothing is sent. Errors reported from the server now honour the setting too.

  Turning analytics off part-way through a study now takes effect on the server straight away. A deployment that had analytics enabled kept sending server errors until it was restarted, because those reports came from a handler that was set up once and never consulted the setting again. Every server report is now checked against the setting as it is made, including reports of background failures that happen outside a request.

- e9a6522: Network Composer's Undo and Redo controls now retain keyboard focus at the end of the history during interviews hosted by Fresco.
- 79db1ca: Participant interview links no longer reach the analytics service.

  A participant's interview URL contains the identifier that grants access to that interview, and an onboarding link also carries the participant identifier a researcher assigned. Fresco already refuses to send those URLs as a referrer, but on deployments with analytics enabled they were still attached to analytics events as the current page address, including the link address of anything clicked.

  Those identifiers are now removed before any event is sent, on every route a participant sees. Session replay is also switched off for those pages, both when one is opened directly and when a researcher opens an interview from the dashboard — replay stores the page address in a form the removal cannot reach, and a recording of someone answering interview questions is research data rather than analytics.

- 06bc1e9: The quick add usage hint on name generator stages no longer promises that the box stays open when only one more item can be added during interviews hosted by Fresco.
- e9a6522: Fresco now handles recruitment links, activity reporting, hosted interview dialogs, and operational errors more reliably.

  - Recruitment links for missing protocols show an actionable invalid-link page instead of a generic application error.
  - Activity feed writes complete before a request finishes, and the corresponding analytics reports are flushed reliably. Uninstalling a protocol is now recorded as activity.
  - Analytics receives activity types and counts without researcher or participant descriptions, and server events are correlated with the originating browser session.
  - Interview confirmations restore focus to the control that opened them, while import and synchronization failures use concise messages without internal stack traces.

- 79db1ca: Fresco now reports the failures that stop it starting in a participant's browser.

  A browser that failed to start the application showed its error page but had no way to send the report. Deciding whether a deployment collects analytics needs a database read, so the answer was applied by a component inside the page — and when the page failed to start, that component failed with it. A deployment could be broken for every participant with nothing recorded anywhere.

  The answer now reaches the browser independently of the page rendering, so these failures are reported like any other. Deployments with analytics disabled still make no requests at all.

- e9a6522: Fresco normalizes older stored and synchronized sessions at its read boundaries, so interviews containing nullish entity attributes continue to hydrate and synchronize. Malformed synchronization JSON now returns a controlled bad-request response.
- 3f3e86b: An interview no longer loses its most recent answers when two saves are in flight at once. When a tab is hidden or closed, the browser sends the outstanding answers straight away rather than waiting behind a save already on its way to the server — so the two can overlap, and the server could finish them in either order. If the older one finished last it overwrote the newer answers with the state from a few seconds earlier. Each save now carries its position in the browser's own sequence, and the server keeps a save only when it is newer than the one the interview already holds; one that lost its race is discarded instead of rolling the participant's answers back.
- bd06a52: Interviews no longer lose their most recent answers when the app locks. If the device was put away while the last few answers were still waiting to be saved, and the security timeout had passed by the time the app was reopened, it locked before those answers reached storage and up to a few seconds of responses were discarded. Answers now reach storage within a fraction of a second of being given rather than waiting out a shared timer, and anything still outstanding is written the moment the app is put into the background — before the device can suspend it.

  **Breaking for hosts of `@codaco/interview`.** The engine no longer batches writes on the host's behalf, and no longer holds a change back while an earlier write is unresolved. `onSync` is called for every change as it happens, because only the host knows what one write costs. Hosts wrap their handler in the new `createDebouncedSyncHandler`, which rate-limits ordinary changes to one write per interval carrying the newest state, and never runs two writes at once. A host writing its own handler must not run its writes concurrently: a slow earlier write landing after a newer one would persist stale answers.

  `SyncHandler` gains a third argument. `immediate` marks the writes that must not be deferred — the participant exiting or finishing — and a batching host must stop batching when it sees it. `unloading` additionally marks the ones the document may not survive: it is being hidden or unloaded and may never run script again, so the host should use a transport that outlives it and must not queue the write behind a request that will die with it. Handlers that ignore the argument keep type-checking, so hosts that write eagerly need no change.

  The Shell also now flushes on `visibilitychange` and `pagehide`. A hidden document is not promised any more script, so anything still outstanding goes out while there is still a page to write from — which is what makes an installed PWA safe to put to sleep seconds after an answer.

- c37a801: Applications now derive their protocol schema compatibility from the interview runtime they embed, instead of hard-coding a version number, and each application can upgrade stored protocols when a future schema version ships.

  - `@codaco/interview` exports its supported protocol schema version as `COMPATIBLE_PROTOCOL_SCHEMA_VERSION` (from `@codaco/interview/protocol-schema-version`). Fresco and Interviewer read it for import limits, stored-data migration, and interview payloads; Architect derives its own compatibility from `@codaco/protocol-validation` directly.
  - Interviewer checks stored protocols at launch. A protocol saved under an older schema version is migrated, re-identified under its new content hash, and its interview sessions and media follow it in a single transaction, with a notification when this happens. A protocol that cannot be migrated is left untouched, with a message directing you to repair it in Architect.
  - Architect upgrades a library protocol automatically when you open it, with a notification, leaving the protocol untouched if the upgrade cannot complete. Protocols made with a newer version of Architect are refused with an explanation instead of opening incorrectly.
  - Fresco's deployment migration targets the runtime's supported version rather than a fixed number, and an interview can no longer start from a protocol stored under a version the runtime does not support — it reports the mismatch instead.

  Nothing changes for existing data today — every stored protocol is already at the current schema version. This machinery exists so a future schema version change cannot orphan interview sessions or mislabel stored protocols.

- 1a5adac: Render edge glyphs in interview network summaries with their configured dark edge colors.
- Updated dependencies ([c599dac](https://github.com/complexdatacollective/network-canvas-monorepo/commit/c599dacf78b18efb7d0c5c5fad4d38644a57e775), [9a34469](https://github.com/complexdatacollective/network-canvas-monorepo/commit/9a3446969d5fcc7a3640d8eb5597f807a4fee810), [e3e7b2c](https://github.com/complexdatacollective/network-canvas-monorepo/commit/e3e7b2c9cfbc1758754afc0c3959c50ae6518363), [eec63f8](https://github.com/complexdatacollective/network-canvas-monorepo/commit/eec63f8c62bd6cfb030c88e396933c4aab384be9), [3e10128](https://github.com/complexdatacollective/network-canvas-monorepo/commit/3e10128db1d1a1abc56f8293d66bf9f7dd75c722), [b51ef59](https://github.com/complexdatacollective/network-canvas-monorepo/commit/b51ef598343c67c95edd4e165c0bac91a7a82571), [43c7746](https://github.com/complexdatacollective/network-canvas-monorepo/commit/43c774665b781cb5cc71acf8ed8c8ca48838ca64), [eb73319](https://github.com/complexdatacollective/network-canvas-monorepo/commit/eb7331942683e879328530e997e554fb12fef52a), [e08ebbf](https://github.com/complexdatacollective/network-canvas-monorepo/commit/e08ebbf8547c2507f5f2a37f7cbab1169dd392cd), [88d7db0](https://github.com/complexdatacollective/network-canvas-monorepo/commit/88d7db04ea3ba323be2fb18f55f6b11d6274740f), [ae3c616](https://github.com/complexdatacollective/network-canvas-monorepo/commit/ae3c616ed4edc55c294be9097e4ae724b249601e), [e9a6522](https://github.com/complexdatacollective/network-canvas-monorepo/commit/e9a652266ef9ddfa7fc42de1c8123bd7011c52a1), [23d0fab](https://github.com/complexdatacollective/network-canvas-monorepo/commit/23d0fab63d4de8da1ba3574cb151ac1c76580d9a), [59f131c](https://github.com/complexdatacollective/network-canvas-monorepo/commit/59f131c2af206c8b1f668b90edf21fbcb3b0b7b7), [06bc1e9](https://github.com/complexdatacollective/network-canvas-monorepo/commit/06bc1e991df40ab3e115da361cfe0ebfe391bbd8), [bd06a52](https://github.com/complexdatacollective/network-canvas-monorepo/commit/bd06a5256b64b82b2718c15b6d3bc825b4ba95c5), [7ca985f](https://github.com/complexdatacollective/network-canvas-monorepo/commit/7ca985fe57ca03dda02a96a6013c5dac55dc0123), [c78135c](https://github.com/complexdatacollective/network-canvas-monorepo/commit/c78135cd461d1e482ce248b1eb6337359bafc189), [dcbc7aa](https://github.com/complexdatacollective/network-canvas-monorepo/commit/dcbc7aad21ec995bf3a598eb5b208a681789eb4f), [4ea26a7](https://github.com/complexdatacollective/network-canvas-monorepo/commit/4ea26a74dfab5bc02495bc8fa03c31aa5f987dad), [c37a801](https://github.com/complexdatacollective/network-canvas-monorepo/commit/c37a801a3a0a8e6cc82fce3cfe64d031003af207), [0f20ff5](https://github.com/complexdatacollective/network-canvas-monorepo/commit/0f20ff594e3fd9b38f393d3d71e9f7bdcc078955), [4a4a9f4](https://github.com/complexdatacollective/network-canvas-monorepo/commit/4a4a9f49d4c449e09e07558a0032d6a3b8015743), [fdb3b56](https://github.com/complexdatacollective/network-canvas-monorepo/commit/fdb3b56440f6cad89a44718d24ff725be3bb5e15), [71baa6c](https://github.com/complexdatacollective/network-canvas-monorepo/commit/71baa6c3c376bc287958e5f06659daa1df617e08), [54650ab](https://github.com/complexdatacollective/network-canvas-monorepo/commit/54650ab4bb357d39db88a46f5c3ab8b82375f647), [469d404](https://github.com/complexdatacollective/network-canvas-monorepo/commit/469d4041bd1c86fbfc92eaf2a368f1689858bbd2), [a9825f4](https://github.com/complexdatacollective/network-canvas-monorepo/commit/a9825f4067cc6cddd08b64a76e8d88a4b96ae998), [1391fa8](https://github.com/complexdatacollective/network-canvas-monorepo/commit/1391fa879011e988a1e8c250a4c80a96797d5d47), [f03b1e4](https://github.com/complexdatacollective/network-canvas-monorepo/commit/f03b1e45f425cf3c97ba2137765073a462ee9c9f))
  - @codaco/interview@9.0.0
  - @codaco/protocol-utilities@4.0.0
  - @codaco/protocol-validation@13.0.0
  - @codaco/fresco-ui@6.1.0
  - @codaco/tailwind-config@1.3.0
  - @codaco/network-exporters@2.0.0
  - @codaco/shared-consts@6.0.0

## 4.1.1

### Patch Changes

- e349137: Update runtime dependencies to resolve security vulnerabilities in analytics sanitization, uploads, and form state handling.
- Updated dependencies [52a3fbb]
- Updated dependencies [fec9536]
- Updated dependencies [90e0178]
- Updated dependencies [90e0178]
- Updated dependencies [e349137]
- Updated dependencies [13e5e99]
- Updated dependencies [673d5f3]
- Updated dependencies [ea06b66]
  - @codaco/fresco-ui@6.0.0
  - @codaco/interview@8.0.0
  - @codaco/protocol-utilities@3.2.1
  - @codaco/protocol-validation@12.1.1

## 4.1.0

### Minor Changes

- e84f2d1: Participants can now adjust the interview's text size. The interview navigation
  carries a settings menu with a "Text size" control offering 90%–130% of the
  default size, scaling text, spacing, and touch targets together. The change
  previews live while the menu is open and lasts for the rest of the session. The
  control is fully keyboard operable and announces its state to screen readers.

  This release also picks up the latest Network Canvas interview and interface
  updates:

  - Tablets render the interview at its full text size again. Every viewport
    narrower than 1280px had been rendering below the intended base size, which
    also shrank spacing and touch targets. Editable fields never render below 16px
    now either, so focusing one no longer makes iOS Safari zoom the page.
  - Nodes stay fully visible when moved to the edge of the Sociogram, Narrative,
    and Network Composer canvases, instead of being partially cut off on wide
    displays.
  - A scrolled roster stays where it was after an item is dragged out of it,
    rather than jumping back to the top.
  - Exporting large interviews no longer stalls the progress display, and
    cancelling an export releases the partially built archive immediately.
  - Timestamps in the dashboard's tables render immediately instead of appearing a
    moment after the row, so selecting a row no longer makes them flicker.
  - Unchecked options in dropdown menus no longer show a check indicator.

### Patch Changes

- 215e2ef: Exported interview data now identifies each case by the participant's
  identifier rather than their label. A label is optional and need not be unique,
  so any study using labels was exporting cases under a name that could repeat
  between participants and did not match the identifier used by recruitment links
  and the participants table.

  Clearing a participant's label now removes it. The edit appeared to succeed
  while the old label was silently kept.

  Editing a participant's identifier now refreshes the interviews table, which
  previously kept showing the old identifier until something else changed.

- Updated dependencies [3c8fe35]
- Updated dependencies [fa88ae4]
- Updated dependencies [2325d34]
  - @codaco/protocol-utilities@3.2.0
  - @codaco/fresco-ui@5.1.0
  - @codaco/interview@7.1.1
  - @codaco/shared-consts@5.6.1
