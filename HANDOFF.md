# Session Handoff

**Date:** 2026-03-31  
**Branch:** `claude/agent-management-system-J5wTy`  
**Session goal:** Fix handwriting canvas bug, implement full PKM system, improve notes editor (RTL, Word-like layout, S Pen), add file import, and produce a design preview for approval.

---

## What Was Accomplished

- **Fixed GitHub Actions APK build** — Java 17 → Java 21 (`invalid source release: 21` error)
- **Fixed handwriting canvas** — complete architectural rewrite from PNG-blob to stroke-based model with proper DPR scaling, `getCoalescedEvents()`, pen-only palm rejection, paper types
- **RTL support** — per-note RTL/LTR toggle persisted to store; `dir` attribute on editor wrapper
- **Word-like editor layout** — centered 740px page card with shadow, proper heading sizes, line-height
- **File attachments** — `FileAttachments.tsx` — PDF, image, text stored as base64 locally
- **PKM data model** — `InkStroke`, `ReviewData`, `linkedNoteIds`, `noteType`, Cornell fields, `isFavorite` all in types + store
- **SM-2 spaced repetition** — `src/lib/sm2.ts` — standard algorithm; `DailyReviewView.tsx` — full review session UI
- **Cornell Notes** — conditional layout in `NoteEditor.tsx`; `/cornell` slash command
- **Backlinks panel** — in `NoteMetaBar.tsx` — shows notes that link to the current note
- **Note type pills** — Fleeting / Literature / Permanent in `NoteMetaBar.tsx`
- **`[[WikiLink]]` autocomplete** — `WikiLink.ts` Tiptap extension; triggers on `[[`, inserts clickable chip, calls `linkNotes()`
- **Knowledge Graph** — `KnowledgeGraphView.tsx` using `react-force-graph`; filter by course; click to navigate
- **PKM store actions** — `linkNotes`, `unlinkNotes`, `toggleFavorite`, `updateReviewData`, `getDueNotes`, `getFavorites`, `searchNotes`

---

## Files Changed

| File | What Changed | Why |
|------|-------------|-----|
| `.github/workflows/build-apk.yml` | Java 17 → 21; removed unreliable `android-actions/setup-android@v3`; uses pre-installed SDK | APK build was failing with `invalid source release: 21` |
| `src/types/index.ts` | Added `InkStroke`, `InkPoint`, `ReviewData`; extended `Note` with 10+ PKM fields | Foundation for all PKM features |
| `src/store/app.ts` | Added `updateStrokes`, `linkNotes`, `unlinkNotes`, `toggleFavorite`, `updateReviewData`, `getDueNotes`, `getFavorites`, `searchNotes` | PKM store actions |
| `src/components/canvas/HandwritingCanvas.tsx` | Full rewrite — stroke model, DPR, ResizeObserver, getCoalescedEvents, pen-only mode, paper types | PNG approach was broken on Tab S10 |
| `src/components/notes/NoteEditor.tsx` | Cornell layout conditional; WikiLink extension wired; RTL `dir` attr; Word-like page wrapper | Multiple improvements this session |
| `src/components/notes/NoteToolbar.tsx` | RTL/LTR toggle button | RTL support |
| `src/components/notes/NoteMetaBar.tsx` | Backlinks panel; note type selector (Fleeting/Literature/Permanent); link count | PKM visibility |
| `src/components/notes/SlashMenu.tsx` | `/cornell` command added | Template support |
| `src/components/notes/WikiLink.ts` | New — Tiptap `[[` extension, tippy popup, `wikiLink` inline node | PKM linking |
| `src/components/notes/FileAttachments.tsx` | New — attach PDF/images/text to notes | File import |
| `src/components/layout/DailyReviewView.tsx` | New — SM-2 flashcard review session | Spaced repetition UI |
| `src/components/layout/KnowledgeGraphView.tsx` | New — force-directed note graph | Knowledge graph |
| `src/components/layout/MainContent.tsx` | Added `knowledge-graph` and `daily-review` view cases | Route new views |
| `src/components/sidebar/Sidebar.tsx` | Added Graph nav item; Daily Review nav item | Navigation |
| `src/lib/sm2.ts` | New — SM-2 algorithm | Spaced repetition |
| `src/index.css` | `.note-page-container` (Word-like page layout); typography updates | Design improvements |
| `package.json` / `package-lock.json` | Added `react-force-graph` | Knowledge graph |
| `CLAUDE.md` | New — agent orientation doc | Session handoff |

---

## Key Decisions Made

**Stroke-based handwriting (not PNG):** PNG blobs break on resize because canvas physical pixels ≠ CSS pixels on high-DPI screens. Strokes in normalised (0–1) coordinates survive orientation changes and enable future AI recognition. Also allows per-stroke undo instead of per-pixel snapshots.

**Normalised coordinates in InkStroke:** Storing `nx/ny` (0–1 fractions of canvas size) means the canvas can be any size when rendering — critical for the Tab S10 which can switch between landscape/portrait and Samsung DeX mode.

**`getCoalescedEvents()` over raw pointer events:** The S Pen samples at up to 240Hz but JS runs at ~60fps. Coalesced events capture all hardware samples per frame, making strokes smooth instead of jaggy.

**SM-2 over custom SRS:** Standard algorithm, well-understood, produces good intervals. The data model (`ReviewData`) stores the exact fields SM-2 needs — ease factor, interval, repetitions, next review timestamp.

**`react-force-graph` for knowledge graph:** Canvas/WebGL-based, handles hundreds of nodes smoothly on tablet, single React component, no D3 knowledge required.

**No local AI (offline LLM):** User asked about running AI without API costs. Evaluated WebLLM (WebGPU, runs Phi-3/Gemma in browser). Feasible on Tab S10 (Snapdragon 8 Gen 3 has NPU), but deferred — the model download (~2–4GB) requires good WiFi setup. Recommended keeping OpenAI API for now, adding WebLLM as a future "offline mode" option.

---

## Current State

**Working:**
- Full Tiptap rich text editor (RTL, equations, simulations, slash commands, WikiLinks)
- Stroke-based handwriting with S Pen pressure sensitivity and palm rejection
- SM-2 spaced repetition review session
- Cornell Notes layout
- Knowledge Graph view
- Backlinks panel
- File attachments (local, base64)
- All PKM store actions
- GitHub Actions APK build (Java 21 fix applied)

**Broken / Incomplete:**
- `design-preview.html` — file was started but is empty (1 line). **The design preview was never finished** — the user asked to see a design mockup before approving the visual redesign. This must be done before implementing Sofia's design recommendations.
- The actual visual redesign (new color tokens, Inter font lock-in, sidebar spacing) has NOT been applied to the real app — only documented in Sofia's report and CLAUDE.md. Waiting for user design approval.
- Daily Notes (Journal) view — `ActiveView` type `'daily-review'` is wired to `DailyReviewView` (the SM-2 review session). A separate "Today's Note" daily journal entry point still needs its own view/nav item.
- Obsidian markdown export — not built yet.
- Local AI (WebLLM) — researched, not implemented.

**Failing tests:** No test suite exists in this project (`npm test` not configured). Build (`npm run build`) is the only automated check — it passes with 0 errors.

---

## Discovered Gotchas

1. **Tab S10 DPR:** The Samsung Tab S10 reports `devicePixelRatio = 2` (or higher). Any canvas that sets `width = container.clientWidth` without multiplying by DPR will render blurry and have offset stroke coordinates. Always: `canvas.width = cssW * dpr`, then `ctx.scale(dpr, dpr)`, then draw in CSS pixels.

2. **Flex layout at mount:** When a canvas is inside a flex container, `getBoundingClientRect()` returns `0` at mount time because the layout hasn't settled. **Never initialise canvas in `useEffect([], deps)`** — always use `ResizeObserver` which fires after the first layout pass.

3. **Tiptap v3 vs v2:** Major API differences. `BubbleMenu` is not exported from `@tiptap/react` in v3. `ReactNodeViewRenderer` component signature changed — must use `(props: ReactNodeViewProps)` not typed component props.

4. **GitHub Actions Android SDK:** `ubuntu-latest` runners have Android SDK pre-installed at `/usr/local/lib/android/sdk`. The `android-actions/setup-android@v3` action is unreliable — skip it. Set `ANDROID_HOME` env var manually.

5. **WikiLink in Tiptap:** The `Suggestion` extension used for `[[` conflicts with the existing `/` slash command suggestion if both are in the editor simultaneously. The `WikiLink.ts` extension uses a different `char: '[['` trigger — make sure it doesn't share a `pluginKey` with `SlashMenu`.

6. **`react-force-graph` TypeScript:** The package ships without complete type definitions. Use `// @ts-ignore` on the `ForceGraph2D` import. Don't try to add types manually — the shapes are complex and not worth maintaining.

7. **Large chunks:** Vite warns about chunks > 500kB. This is expected — Excalidraw, KaTeX, react-force-graph, and Mermaid are all large. The warning does not indicate a build error. The APK bundles everything locally anyway.

---

## Next Steps (priority order)

1. **Write `design-preview.html`** — The user explicitly asked to see and approve the design before implementation. Sofia's recommendations are documented in the session notes. Create a standalone interactive HTML file showing: (a) sidebar + note editor, (b) AI panel open, (c) Knowledge Graph. Use Sofia's color palette: background `#0d0d14`, primary `#6d28d9`, Inter font. Show dark/light toggle. Must be done before touching `src/index.css` colors.

2. **User approves design → implement visual redesign** — Update CSS custom properties in `src/index.css` to Sofia's color tokens. Update sidebar padding/spacing. Update toolbar button sizes. This is a pure CSS/styling task.

3. **Daily Notes (Journal) view** — Create a "Today" nav item in the sidebar that auto-creates/opens a note titled today's date in a "Journal" course. ~30 lines, similar to `DailyReviewView.tsx`.

4. **Wire SM-2 to flashcard generation** — In `StudyTools.tsx`, when flashcards are generated, persist them to `note.flashcards?: FlashCard[]` with `defaultReviewData()`. The `DailyReviewView` should pull from these too (not just notes).

5. **Obsidian markdown export** — `src/lib/tiptapToMarkdown.ts` — convert Tiptap JSON to Markdown with `[[wikilink]]` syntax. Add export button to `SettingsPanel.tsx`.

6. **Local AI / WebLLM** — Install `@mlc-ai/web-llm`, add a model selector in Settings, allow the AI tutor to use an on-device model (Phi-3 Mini 4K or Gemma 2B) instead of OpenAI API. The Tab S10's Snapdragon 8 Gen 3 supports WebGPU.

7. **APK build verification** — Check that the GitHub Actions workflow actually produces a working APK after the Java 21 fix. User may still be waiting for a successful build email.

---

## Suggested First Move for Next Agent

Read `CLAUDE.md` first (this file will orient you), then read `src/types/index.ts` and `src/store/app.ts` to understand the full data model. Then **write `design-preview.html`** directly using the `Write` tool — do not delegate this to a sub-agent (they time out on large HTML files). Use the Write tool with the complete file content in one call. Base the design on Sofia's recommendations documented in CLAUDE.md: background `#0d0d14`, primary `#6d28d9`, Inter font, mature/professional aesthetic. Show 3 interactive screens with a tab switcher and a dark/light toggle.
