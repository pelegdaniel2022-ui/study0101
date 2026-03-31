# CLAUDE.md — PhysicsStudy App

Agent orientation file. Read this before touching any code.

---

## What This App Is

A **100% offline Android APK** for a physics university student on a **Samsung Galaxy Tab S10**
with an S Pen. No hosting, no server. Built with:

- React + TypeScript + Vite
- Capacitor → Android APK (`com.study0101.physics`)
- Tiptap v3 (rich text notes)
- Zustand + persist (offline state, localStorage)
- GitHub Actions → builds APK → GitHub Releases → user downloads to tablet

---

## Key Architecture Decisions

### State / Data
- All data lives in Zustand with `persist` middleware → localStorage
- **Never use `localStorage` directly** — always go through `useAppStore()`
- Store is at `src/store/app.ts` — read it before adding state
- Types are in `src/types/index.ts` — always update types first, then store, then UI

### Notes Editor
- Tiptap v3 — **not v2**. API differs significantly.
- Custom nodes: `EquationNode`, `SimWidget`, `WikiLink` — all use `ReactNodeViewRenderer`
- Node view components must use `(props: ReactNodeViewProps)` signature (not typed component props)
- Slash commands (`/`) use Tiptap `Suggestion` extension via `SlashMenu.tsx`
- WikiLink (`[[`) uses the same `Suggestion` pattern — see `WikiLink.ts`
- **BubbleMenu**: NOT imported from `@tiptap/react` (it's not exported in v3). Uses custom `createPortal` implementation in `BubbleMenu.tsx`

### Handwriting Canvas (HandwritingCanvas.tsx)
- **Stroke-based model** — stores `InkStroke[]` with normalised (0–1) coordinates
- **NOT PNG-based** — old `handwritingData: string` field is deprecated
- Use `updateStrokes(noteId, strokes)` from the store, NOT `updateNote(..., { handwritingData })`
- `ResizeObserver` handles canvas sizing — never set canvas width/height at mount time
- Always scale context by `window.devicePixelRatio` — Tab S10 has 2× DPR
- `getCoalescedEvents()` for smooth S Pen input — always use it in `onPointerMove`
- Pen-only mode rejects touch events when `e.pointerType === 'pen'` is active

### Styling
- Tailwind CSS v4 with `@tailwindcss/vite` plugin (NOT the PostCSS plugin)
- CSS custom properties (HSL) for theming: `hsl(var(--background))`, `hsl(var(--primary))` etc.
- Dark mode: `.dark` class on `document.documentElement` — toggled in `App.tsx`
- Do NOT use arbitrary Tailwind values when a CSS variable exists

### AI Features
- Requires user-supplied OpenAI API key (stored in `src/store/ai.ts`)
- RAG pipeline in `src/lib/rag.ts` — uses IndexedDB via `idb`, cosine similarity
- Physics-specific system prompt in `AISidebar.tsx` — don't water it down

### Android / Capacitor
- `capacitor.config.ts` — app ID: `com.study0101.physics`
- GitHub Actions workflow: `.github/workflows/build-apk.yml`
- Java **21** required (NOT 17) — the Android Gradle project uses `sourceCompatibility = JavaVersion.VERSION_21`
- Pre-installed Android SDK at `/usr/local/lib/android/sdk` on `ubuntu-latest` runners
- APK output → GitHub Releases as `PhysicsStudy.apk`

---

## PKM Features — Current State (as of this session)

The data model is complete. Most PKM UI has been built. Here's what exists:

| Feature | Data | UI | Notes |
|---|---|---|---|
| Bidirectional links | ✅ `linkNotes()` in store | ✅ `WikiLink.ts` Tiptap extension | `[[` trigger |
| Backlinks panel | ✅ `getLinkedNotes()` | ✅ `NoteMetaBar.tsx` | |
| Knowledge Graph | ✅ `linkedNoteIds` | ✅ `KnowledgeGraphView.tsx` | `react-force-graph` |
| Spaced repetition (SM-2) | ✅ `ReviewData` type, `updateReviewData()` | ✅ `DailyReviewView.tsx` | `src/lib/sm2.ts` |
| Cornell Notes | ✅ `template: 'cornell'`, `cornellCues`, `cornellSummary` | ✅ `NoteEditor.tsx` conditional | `/cornell` slash command |
| Note types | ✅ `noteType: fleeting\|literature\|permanent` | ✅ `NoteMetaBar.tsx` pills | |
| Daily Notes | — | ⏳ Not yet built | Use `DailyReviewView` as reference |
| Obsidian export | — | ⏳ Not yet built | `src/lib/tiptapToMarkdown.ts` to create |
| RTL support | ✅ `isRTL` on Note | ✅ Toolbar toggle, `dir` attr | |
| File attachments | ✅ `NoteAttachment[]` | ✅ `FileAttachments.tsx` | Base64 stored locally |

---

## Things That Were Tried and Failed

1. **`android-actions/setup-android@v3` in GitHub Actions** — unreliable. Use pre-installed SDK at `/usr/local/lib/android/sdk`.
2. **Java 17 in GitHub Actions** — causes `invalid source release: 21`. Must use Java 21.
3. **`BubbleMenu` from `@tiptap/react`** — not exported in v3. Use custom `createPortal` implementation.
4. **PNG-based handwriting** — fragile on resize (DPR mismatch), not editable. Replaced with stroke model.
5. **Canvas width/height set at mount** — container size is 0 at mount due to flex layout. Always use `ResizeObserver`.
6. **Design preview HTML via agent** — agents timeout writing large single-file HTML. Write it directly with `Write` tool.

---

## Conventions

- File naming: `PascalCase.tsx` for components, `camelCase.ts` for libs/stores
- Store actions are named as verbs: `addNote`, `updateNote`, `linkNotes`, `toggleFavorite`
- All `uid()` calls come from `src/store/app.ts` — don't use `crypto.randomUUID()` for compat
- CSS variables are always wrapped: `hsl(var(--border))` not `var(--border)`
- Agents should never commit — the main session commits after verifying build

---

## Build / Run

```bash
npm ci          # install deps
npm run build   # TypeScript check + Vite build (must pass 0 errors)
npm run dev     # local dev server at localhost:5173
```

Build warnings about chunk size are expected and acceptable (Excalidraw + KaTeX are large).
