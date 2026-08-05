# fresco

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
