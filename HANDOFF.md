# FULL PROJECT HANDOFF — PhysicsStudy App
**For the successor agent. Read every word of this before touching any code.**

---

## Who You Are / What You're Doing

You are the successor to a long-running Claude Code session that built a physics study app from scratch. The user is a physics university student using a **Samsung Galaxy Tab S10 with an S Pen**. He wants a single app that replaces Samsung Notes + Google Docs + AI chat + physics simulations + knowledge management — all working **100% offline, no hosting, no server**.

The user speaks casually, mixes Hebrew and English, and is not a developer. He trusts you to make the right technical calls without asking for permission on every file. He does want to **approve designs before you implement them visually**.

---

## The App — What It Is

**PhysicsStudy** — A unified study workspace (PKM + Notes + AI), like OneNote but with AI + physics focus.

- **Platform:** Android APK, installed directly on Samsung Galaxy Tab S10
- **Distribution:** GitHub Actions builds the APK → GitHub Releases → user downloads on tablet
- **Stack:** React + TypeScript + Vite + Capacitor + Tiptap v3 + Zustand + Tailwind CSS v4
- **Repo branch:** `claude/agent-management-system-J5wTy`
- **App ID:** `com.study0101.physics`

---

## Architecture — Read This First

### Data Layer
- **Zustand + persist** → `localStorage` (100% offline, no backend ever)
- Store: `src/store/app.ts` — all CRUD + PKM actions
- Types: `src/types/index.ts` — always update types first, then store, then UI
- **Never use `localStorage` directly** — always use `useAppStore()`

### Notes Editor
- **Tiptap v3** (not v2 — API differs significantly)
- Custom inline nodes: `EquationNode`, `SimWidget`, `WikiLink` — all use `ReactNodeViewRenderer`
- Node view components MUST use `(props: ReactNodeViewProps)` signature
- Slash commands (`/`): `SlashMenu.tsx` uses Tiptap `Suggestion` extension
- WikiLink (`[[`): `WikiLink.ts` uses same `Suggestion` pattern
- BubbleMenu: NOT from `@tiptap/react` (not exported in v3) — custom `createPortal` in `BubbleMenu.tsx`

### Handwriting Canvas
- **Stroke-based model** — stores `InkStroke[]` with normalised (0–1) coords
- NOT PNG — the old `handwritingData: string` field is deprecated
- Uses `updateStrokes(noteId, strokes)` from store
- `ResizeObserver` for canvas sizing (never set width/height at mount — container is 0px then)
- Always scale by `window.devicePixelRatio` — Tab S10 has 2× DPR
- `getCoalescedEvents()` for smooth S Pen input in `onPointerMove`
- Pen-only mode: rejects touch when `e.pointerType === 'touch'` and pen is active

### Styling
- Tailwind CSS v4 with `@tailwindcss/vite` plugin (NOT PostCSS plugin)
- CSS custom properties (HSL): `hsl(var(--background))`, `hsl(var(--primary))` etc.
- Dark mode: `.dark` class on `document.documentElement` — toggled in `App.tsx`
- Do NOT use arbitrary Tailwind values when a CSS var exists

### Android / Capacitor / CI
- `capacitor.config.ts` — app ID `com.study0101.physics`, webDir `dist`
- `.github/workflows/build-apk.yml` — GitHub Actions build
- **Java 21** required (not 17) — `sourceCompatibility = JavaVersion.VERSION_21`
- Pre-installed Android SDK at `/usr/local/lib/android/sdk` on `ubuntu-latest`
- APK output → GitHub Releases as `PhysicsStudy.apk`

---

## Full Feature Map — Current State

| Feature | Data model | UI built | Location |
|---|---|---|---|
| Rich text notes (Tiptap) | ✅ | ✅ | `NoteEditor.tsx` |
| RTL / LTR toggle | ✅ `isRTL` | ✅ toolbar button | `NoteToolbar.tsx` |
| Word-like page layout | — | ✅ centered 740px card | `index.css` `.note-page-container` |
| Equations (KaTeX) | ✅ | ✅ inline + block | `EquationNode.tsx` |
| Physics simulations (4 types) | ✅ | ✅ embedded in notes | `SimWidget.tsx`, `*Sim.tsx` |
| Slash commands | — | ✅ | `SlashMenu.tsx` |
| Excalidraw canvas | ✅ `canvasData` | ✅ | `CanvasEditor.tsx` |
| Handwriting (S Pen) | ✅ `InkStroke[]` | ✅ stroke-based | `HandwritingCanvas.tsx` |
| File attachments | ✅ `NoteAttachment[]` | ✅ base64 local | `FileAttachments.tsx` |
| AI tutor (OpenAI) | ✅ | ✅ RAG + chat | `AISidebar.tsx` |
| Flashcard generation | ✅ `FlashCard` | ✅ | `StudyTools.tsx` |
| SM-2 spaced repetition | ✅ `ReviewData` | ✅ review session | `DailyReviewView.tsx`, `sm2.ts` |
| [[WikiLink]] autocomplete | ✅ `linkedNoteIds` | ✅ Tiptap extension | `WikiLink.ts` |
| Backlinks panel | ✅ | ✅ | `NoteMetaBar.tsx` |
| Knowledge Graph | ✅ | ✅ force-directed | `KnowledgeGraphView.tsx` |
| Cornell Notes | ✅ `template:'cornell'` | ✅ 3-region layout | `NoteEditor.tsx` |
| Note types (Fleeting/Lit/Perm) | ✅ `noteType` | ✅ pills | `NoteMetaBar.tsx` |
| Favorites | ✅ `isFavorite` | ✅ toggle | `NoteMetaBar.tsx` |
| Full-text search | ✅ `searchNotes()` | ✅ Cmd+K | `SearchModal.tsx` |
| Research panel (Perplexity) | ✅ | ✅ | `ResearchPanel.tsx` |
| OCR scan (OpenAI Vision) | ✅ | ✅ | `ScanUpload.tsx` |
| Course→Lecture→Note tree | ✅ | ✅ | `Sidebar.tsx` |
| Dark mode | ✅ | ✅ | `App.tsx` |
| Daily Notes (journal) | ⏳ not built | ⏳ not built | — |
| Obsidian export | ⏳ not built | ⏳ not built | `tiptapToMarkdown.ts` to create |
| Visual redesign (Sofia's spec) | — | ⏳ PENDING APPROVAL | see below |

---

## The Design Situation — IMPORTANT

A senior designer named "Sofia" reviewed the app and produced a full design specification. **The user has NOT yet approved or seen this design as a mockup.** He asked for an interactive HTML preview file to look at before any design changes are made to the real app.

**The design preview file (`design-preview.html`) in the repo is currently EMPTY (1 line).**

The previous agent started it and never finished. This is the first thing to do.

### Sofia's Design Spec (summarised)

**Color palette — Dark theme ("Midnight Studio"):**
- Background: `#0d0d14`
- Surface (sidebar/panels): `#1a1a24`
- Surface hover: `#242430`
- Border: `#32323f`
- Border strong: `#4a4a5f`
- Text primary: `#f0f0f5`
- Text secondary: `#9898a8`
- Text tertiary: `#6a6a7e`
- Primary (accent): `#6d28d9`
- Primary light: `#8b5cf6`
- Success: `#10b981`
- Warning: `#f59e0b`
- Danger: `#ef4444`

**Color palette — Light theme:**
- Background: `#fafafa`
- Surface: `#ffffff`
- Border: `#e5e5e7`
- Text primary: `#1a1a1a`
- Primary: `#6d28d9`

**Typography:**
- Font: `Inter` (already loaded), fallback `-apple-system, BlinkMacSystemFont`
- Mono: `JetBrains Mono`
- Body: 13–15px / weight 400 / line-height 1.65
- Headings: 22–28px / weight 700
- Labels: 11–13px / weight 500–600

**Direction:** Modern + mature (Notion + Linear + Arc Browser). NOT childish. Professional workspace.

**Key layout changes:**
- Sidebar: 280px, generous padding, section labels, breathing room
- Toolbar: grouped semantically (History | Format | Blocks | Special)
- Editor content: max-width 740px, centered, generous padding
- Buttons: 32×32px, 16px icons
- All touch targets ≥ 44×44px for Tab S10

---

## How to Write the Design Preview HTML

**Write it directly using the `Write` tool in one call. Do NOT delegate to a sub-agent — they time out on large HTML files.**

The file should be: `/home/user/study0101/design-preview.html`

It must show 3 interactive "screens" switchable via tabs:
1. **Main workspace** — sidebar (left, 280px) + note editor (center, Word-like) + collapsed AI icon (right)
2. **Note + AI panel open** — same layout but AI sidebar (360px) slides in from right
3. **Knowledge Graph** — force-graph placeholder (circles connected by lines, fake data)

Each screen must look realistic — not wireframe, not sketch. Use the exact hex colors above. Use Inter from Google Fonts. Show real sample content (a physics note about Newton's Laws, with a heading, some equations in LaTeX-style, a bullet list). Include a dark/light mode toggle button in the top right.

The sidebar should show:
- App name "PhysicsStudy ⚛" in the header
- Nav items: Home, AI Tutor, Simulations, Research, Graph, Daily Review
- A course tree: "Classical Mechanics" with lectures and notes under it
- Bottom: Settings gear + dark mode toggle

The note editor should show:
- A large note title "Newton's Laws of Motion"
- A toolbar with grouped buttons
- The actual note content with headings, body text, a blockquote
- A meta bar at the bottom (tags, word count, backlinks)

---

## Things That Were Tried and FAILED

1. `android-actions/setup-android@v3` → unreliable, removed. Use pre-installed SDK.
2. Java 17 in GitHub Actions → `invalid source release: 21`. Must use Java 21.
3. `BubbleMenu` from `@tiptap/react` → not exported in v3. Custom `createPortal`.
4. PNG-based handwriting → breaks on DPR mismatch on Tab S10. Use stroke model.
5. Canvas `width/height` set at mount → container is 0px at that point. Use `ResizeObserver`.
6. Design preview HTML via sub-agent → they time out. Use `Write` tool directly.

---

## Priorities for This Session

1. **Write `design-preview.html`** — user needs to approve it before visual redesign
2. **Show it to user and wait for approval**
3. **If approved: implement the visual redesign** in `src/index.css` (CSS custom properties)
4. **Daily Notes** — "Today" view that auto-creates a dated journal note
5. **Wire SM-2 to flashcard generation** — persist cards with `reviewData` in `StudyTools.tsx`
6. **Obsidian markdown export** — `src/lib/tiptapToMarkdown.ts` + Settings export button

---

## Local AI Question (User Asked)

The user asked if he can avoid paying for OpenAI/Perplexity API. Options researched:

- **WebLLM** (`@mlc-ai/web-llm`) — runs Phi-3 Mini / Gemma 2B in the browser via WebGPU. The Tab S10's Snapdragon 8 Gen 3 supports WebGPU. Model download is ~2–4GB (needs WiFi once). This is the best path forward for offline AI.
- For web search (replacing Perplexity): no good free option — DuckDuckGo has a free API but it's limited.
- **Decision:** Keep OpenAI API for now, add WebLLM as an "offline mode" option in Settings.

---

## Conventions

- File naming: `PascalCase.tsx` for components, `camelCase.ts` for libs/stores
- Store actions: named as verbs (`addNote`, `updateNote`, `linkNotes`, `toggleFavorite`)
- `uid()` from `src/store/app.ts` — never use `crypto.randomUUID()` (compat)
- CSS variables always wrapped: `hsl(var(--border))` not `var(--border)`
- Build check: `npm run build` — must pass 0 TypeScript errors (chunk warnings are fine)
- **Agents do not commit** — the main session commits after verifying build

---

## Build / Run

```bash
npm ci          # install deps
npm run build   # TypeScript + Vite build — must pass 0 errors
npm run dev     # dev server at localhost:5173
```

---

## First Thing to Do

1. Read `src/types/index.ts` and `src/store/app.ts` to understand the data model
2. Read `src/components/notes/NoteEditor.tsx` to understand the editor
3. Read `src/components/sidebar/Sidebar.tsx` to understand navigation
4. **Then write `design-preview.html` directly** using the `Write` tool — single call, complete file
5. Tell the user "the design preview is ready" and explain what screens it shows
6. Wait for his feedback / approval before touching any production CSS
