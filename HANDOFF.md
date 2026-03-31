# FULL PROJECT HANDOFF — PhysicsStudy App
**Date:** 2026-03-31 | **Branch:** `claude/agent-management-system-J5wTy`

---

## Who You Are / What You're Doing

You are the successor to a long-running Claude Code session that built a physics study app. Your job is to **complete and ship the full app** — no partial features, no placeholders, no "coming soon."

The user is a **physics university student** using a **Samsung Galaxy Tab S10 with an S Pen**. He is not a developer. He wants one app that replaces:
- Samsung Notes (handwriting + typed notes)
- Google Docs (rich text, Word-like editing)
- AI chat (physics tutor, AI-powered tools)
- Physics simulations
- Personal knowledge management (Obsidian-style)

**Everything works 100% offline. No hosting. No server. Android APK only.**

The user communicates casually and trusts you to make technical calls without asking permission on every file. Code everything, commit, push — don't wait for approval on implementation details.

---

## Distribution Model

1. Code lives on GitHub branch `claude/agent-management-system-J5wTy`
2. GitHub Actions (`.github/workflows/build-apk.yml`) builds the APK on every push
3. APK lands in GitHub Releases as `PhysicsStudy.apk`
4. User downloads directly to his Samsung Tab S10 and installs

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React + TypeScript + Vite |
| Mobile | Capacitor → Android APK (`com.study0101.physics`) |
| Editor | Tiptap v3 (NOT v2 — API is different) |
| State | Zustand + persist → localStorage (offline) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin, NOT PostCSS) |
| AI | OpenAI API (user provides key) — gpt-4o + text-embedding-3-small |
| Equations | KaTeX |
| Canvas | Excalidraw + custom stroke-based HandwritingCanvas |
| Knowledge graph | react-force-graph |
| Simulations | Canvas API (pendulum, projectile, harmonic, wave) |
| Search/RAG | IndexedDB via `idb`, cosine similarity |

---

## Architecture Rules — Read Before Touching Code

### Data / State
- All data in Zustand with `persist` → localStorage. **Never `localStorage` directly.**
- Store: `src/store/app.ts` | Types: `src/types/index.ts`
- **Always update types → store → UI in that order**
- `uid()` comes from `src/store/app.ts` — never use `crypto.randomUUID()`

### Tiptap v3 Gotchas
- `BubbleMenu` is NOT exported from `@tiptap/react` in v3 → use custom `createPortal` impl in `BubbleMenu.tsx`
- Custom nodes: `(props: ReactNodeViewProps)` signature required, NOT typed component props
- Slash commands use `Suggestion` extension (`SlashMenu.tsx`)
- WikiLink `[[` uses same `Suggestion` pattern (`WikiLink.ts`)

### Canvas / Handwriting
- **Stroke model** — `InkStroke[]` with normalised (0–1) coords. NOT PNG blobs.
- Use `updateStrokes(noteId, strokes)` from store. Deprecated: `handwritingData: string`
- Canvas sizing: use `ResizeObserver` — container is 0px at mount, never initialise in `useEffect` with empty deps
- Always `ctx.scale(devicePixelRatio, devicePixelRatio)` — Tab S10 has 2× DPR
- `getCoalescedEvents()` in `onPointerMove` for smooth S Pen strokes

### Styling
- CSS vars wrapped: `hsl(var(--primary))` not `var(--primary)`
- Dark mode: `.dark` class on `document.documentElement`
- Do NOT add PostCSS config — Tailwind v4 uses Vite plugin only

### Build check
```bash
npm run build   # must pass 0 TypeScript errors (chunk warnings are fine)
```

---

## What Is Already Built

| Feature | Status | Key Files |
|---|---|---|
| Tiptap rich text editor | ✅ | `NoteEditor.tsx`, `NoteToolbar.tsx` |
| RTL/LTR toggle (per-note) | ✅ | `NoteToolbar.tsx` |
| Word-like page layout | ✅ | `index.css` `.note-page-container` |
| KaTeX equations (inline + block) | ✅ | `EquationNode.tsx` |
| 4 physics simulations | ✅ | `PendulumSim`, `ProjectileSim`, `HarmonicSim`, `WaveSim` |
| Slash commands (/) | ✅ | `SlashMenu.tsx` |
| Excalidraw canvas mode | ✅ | `CanvasEditor.tsx` |
| Handwriting (S Pen, stroke-based) | ✅ | `HandwritingCanvas.tsx` |
| File attachments (PDF/image/text) | ✅ | `FileAttachments.tsx` |
| AI tutor + RAG | ✅ | `AISidebar.tsx`, `src/lib/rag.ts` |
| Flashcard generation | ✅ | `StudyTools.tsx` |
| SM-2 algorithm | ✅ | `src/lib/sm2.ts` |
| Daily review session | ✅ | `DailyReviewView.tsx` |
| [[WikiLink]] in editor | ✅ | `WikiLink.ts` |
| Backlinks panel | ✅ | `NoteMetaBar.tsx` |
| Knowledge Graph | ✅ | `KnowledgeGraphView.tsx` |
| Cornell Notes layout | ✅ | `NoteEditor.tsx` (conditional) |
| Note types (Fleeting/Lit/Perm) | ✅ | `NoteMetaBar.tsx` |
| Course → Lecture → Note tree | ✅ | `Sidebar.tsx` |
| Full-text search (Cmd+K) | ✅ | `SearchModal.tsx` |
| Research panel (Perplexity) | ✅ | `ResearchPanel.tsx` |
| OCR scan (OpenAI Vision) | ✅ | `ScanUpload.tsx` |
| Dark/light mode | ✅ | `App.tsx` |
| APK build (GitHub Actions) | ✅ fixed | `.github/workflows/build-apk.yml` (Java 21) |

---

## What Is NOT Built Yet — Your Tasks

### 🔴 Critical (build these first)

**1. Visual redesign — apply Sofia's design system**

The app looks functional but generic. Apply this design to `src/index.css` and components:

Colors (update CSS custom properties):
```css
/* Dark theme */
--background: 240 15% 5%;        /* #0d0d14 */
--surface: 240 14% 9%;           /* #1a1a24 */
--surface-hover: 240 13% 13%;    /* #242430 */
--border: 240 12% 19%;           /* #32323f */
--foreground: 240 10% 95%;       /* #f0f0f5 */
--muted-foreground: 240 6% 60%;  /* #9898a8 */
--primary: 263 69% 50%;          /* #6d28d9 */
--primary-foreground: 0 0% 100%;

/* Light theme */
--background: 0 0% 98%;          /* #fafafa */
--foreground: 0 0% 10%;          /* #1a1a1a */
--surface: 0 0% 100%;            /* #ffffff */
--border: 240 6% 90%;            /* #e5e5e7 */
--primary: 263 69% 50%;          /* #6d28d9 */
```

Typography:
- Load Inter from Google Fonts (already in `preview.html`, move to `index.html`)
- Body: 14px / weight 400 / line-height 1.65
- UI text (sidebar, toolbar): 13px / weight 500
- Note title: 28px / weight 700
- Headings H1: 28px, H2: 22px, H3: 18px — apply to ProseMirror styles in `index.css`

Sidebar redesign:
- Width: 280px
- Nav items: 40px height, 18px icons, 14px padding horizontal
- Section labels: 11px / weight 600 / uppercase / letter-spacing 0.5px
- Active item: `hsl(var(--primary))` text, subtle background tint
- Course tree: breathing room between items

Toolbar redesign:
- Button size: 32×32px (from ~26px)
- Icon size: 16px
- Group buttons semantically: [Undo/Redo] | [Bold/Italic/Underline] | [Headings/Align] | [Lists] | [Special]

**2. Daily Notes (Journal)**

Create `src/components/layout/DailyNoteView.tsx`:
- On mount: find or create a note titled `new Date().toLocaleDateString('en-CA')` (e.g. `2026-03-31`) in a special "Journal" course (auto-create if needed)
- Renders `<NoteEditor>` for that note
- Add "Today" nav item to `Sidebar.tsx` with a calendar icon
- Wire `activeView: { type: 'daily-note' }` in `ActiveView` union in `types/index.ts` and `MainContent.tsx`

**3. Persist SM-2 flashcards**

In `StudyTools.tsx`, when flashcards are generated via AI:
- Store them on the note: `updateNote(noteId, { flashcards: cards.map(c => ({ ...c, id: uid(), reviewData: defaultReviewData() })) })`
- Add `flashcards?: FlashCard[]` to `Note` type in `types/index.ts`
- In `DailyReviewView.tsx`: also pull due flashcards from all notes and review them card by card (not just whole notes)

**4. Obsidian Markdown Export**

Create `src/lib/tiptapToMarkdown.ts`:
- Convert Tiptap JSON to Markdown: headings `#`, bold `**`, italic `_`, lists `-`, code blocks ` ``` `
- WikiLinks as `[[Note Title]]`
- Equations as `$latex$` (inline) and `$$latex$$` (block)
- Export a single note or all notes as `.zip`

In `SettingsPanel.tsx`, add an "Export all notes (Markdown)" button that:
- Calls `tiptapToMarkdown` for each note
- Downloads a `.zip` file using JSZip (install it: `npm install jszip`)
- Zip structure: `CourseName/LectureName/NoteTitle.md`

### 🟡 Important (build after critical items)

**5. Local AI — WebLLM (no API cost)**

The user specifically asked: "can we have all the AI in the app without API use?"

Install: `npm install @mlc-ai/web-llm`

In `SettingsPanel.tsx`:
- Add "AI Mode" toggle: "Cloud (OpenAI)" vs "Local (on-device)"
- When Local selected: show model picker (Phi-3 Mini 3.8B, Gemma 2B) and a "Download model" button
- Show download progress (WebLLM streams progress)
- Store selection in `src/store/ai.ts`

In `AISidebar.tsx`:
- Check `aiMode` from store
- If local: use `@mlc-ai/web-llm` `CreateMLCEngine` instead of `openai` fetch
- The Tab S10 Snapdragon 8 Gen 3 supports WebGPU — this will run at ~10-20 tokens/sec

**6. More Physics Simulations**

Prof. Chen (reviewer) noted the app covers ~20% of intro physics. Add:
- **Circular motion** — ball on string, centripetal force visualization
- **Energy conservation** — potential vs kinetic energy bar chart, rollercoaster track
- **Collision simulation** — 1D elastic/inelastic, momentum conservation

Wire each to the slash menu as `/sim-circular`, `/sim-energy`, `/sim-collision`.

**7. Spaced Repetition Improvements**

- In `DailyReviewView.tsx`: add a "Study Streak" counter (days reviewed consecutively), persist in store
- In `Sidebar.tsx`: show badge count of notes due today next to "Daily Review" nav item
- In `NoteMetaBar.tsx`: show next review date for the current note

**8. Note Templates**

Add to slash menu:
- `/outline` — creates H1, H2, H2, H2 scaffold
- `/problem-set` — creates "Problem | Given | Find | Solution" sections
- `/lab-report` — creates "Hypothesis | Method | Results | Analysis | Conclusion"

**9. Quick Capture**

A floating "+" button always visible in bottom-right corner of the screen (not just in sidebar). Tapping it creates a new Fleeting note in the currently selected course (or a default "Inbox" course) and immediately opens it. Key for capturing ideas mid-lecture.

**10. Tag Management UI**

Tags exist in the data but have no dedicated UI. Add:
- A "Tags" section in the sidebar listing all unique tags with note counts
- Clicking a tag filters the note list to show only tagged notes
- In `NoteMetaBar.tsx`: clicking the `+` next to tags shows an autocomplete input

---

## Things That Failed — Do Not Repeat

1. `android-actions/setup-android@v3` → removed; use pre-installed SDK at `/usr/local/lib/android/sdk`
2. Java 17 in GitHub Actions → `invalid source release: 21`; must use Java 21
3. `BubbleMenu` from `@tiptap/react` → not exported in v3
4. PNG-based handwriting → fragile on DPR mismatch; use stroke model
5. Canvas sizing at mount → container is 0px; use `ResizeObserver`
6. Writing large HTML files via sub-agent → they time out; use `Write` tool directly
7. `crypto.randomUUID()` → use `uid()` from `src/store/app.ts` for compat

---

## Agent Workflow

1. Read `src/types/index.ts` and `src/store/app.ts` to fully understand the data model
2. Read `src/components/notes/NoteEditor.tsx` and `src/components/sidebar/Sidebar.tsx`
3. Work through the task list above in priority order
4. After each major feature: `npm run build` — must pass 0 TypeScript errors
5. When done with a set of features: commit with a descriptive message and push
6. Use sub-agents for parallelisable work (e.g. run simulation + export + WebLLM simultaneously)
7. **Do not ask for permission on implementation details** — code it, build it, push it

---

## Commit Convention

```bash
git commit -m "feat: <what you built>

<brief description of changes>

https://claude.ai/code/session_014bNay3HAURWfyVGUhCk6S9"
git push -u origin claude/agent-management-system-J5wTy
```
