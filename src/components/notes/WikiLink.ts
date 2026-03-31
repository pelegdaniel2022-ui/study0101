import { Node, mergeAttributes } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import tippy, { type Instance } from 'tippy.js'
import type { Editor } from '@tiptap/core'
import { useAppStore } from '@/store/app'
import type { Note } from '@/types'
import { createElement } from 'react'

// ── WikiLink List Popup ────────────────────────────────────────────────────

interface WikiLinkListProps {
  items: Note[]
  command: (item: Note) => void
}

export const WikiLinkList = forwardRef<{ onKeyDown: (e: KeyboardEvent) => boolean }, WikiLinkListProps>(
  ({ items, command }, ref) => {
    const [selected, setSelected] = useState(0)

    useImperativeHandle(ref, () => ({
      onKeyDown({ key }: KeyboardEvent) {
        if (key === 'ArrowUp') { setSelected((s) => (s - 1 + items.length) % items.length); return true }
        if (key === 'ArrowDown') { setSelected((s) => (s + 1) % items.length); return true }
        if (key === 'Enter') { if (items[selected]) command(items[selected]); return true }
        return false
      },
    }))

    useEffect(() => setSelected(0), [items])

    if (!items.length) {
      return createElement(
        'div',
        {
          className: 'bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl shadow-lg py-1 w-64 z-50',
        },
        createElement(
          'div',
          { className: 'px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]' },
          'No notes found'
        )
      )
    }

    return createElement(
      'div',
      {
        className: 'bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl shadow-lg py-1 w-64 max-h-72 overflow-y-auto z-50',
      },
      items.map((note, i) =>
        createElement(
          'button',
          {
            key: note.id,
            className: `w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[hsl(var(--muted))] transition-colors ${i === selected ? 'bg-[hsl(var(--muted))]' : ''}`,
            onClick: () => command(note),
          },
          createElement(
            'div',
            null,
            createElement('div', { className: 'text-sm font-medium' }, note.title || 'Untitled'),
            note.tags?.length
              ? createElement(
                  'div',
                  { className: 'text-xs text-[hsl(var(--muted-foreground))]' },
                  note.tags.join(', ')
                )
              : null
          )
        )
      )
    )
  }
)
WikiLinkList.displayName = 'WikiLinkList'

// ── WikiLink Node Extension ────────────────────────────────────────────────

export function createWikiLinkExtension(getCurrentNoteId: () => string) {
  return Node.create({
    name: 'wikiLink',
    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
      return {
        noteId: { default: '' },
        title: { default: '' },
      }
    },

    parseHTML() {
      return [{ tag: 'span[data-wiki-link]' }]
    },

    renderHTML({ HTMLAttributes }) {
      return ['span', mergeAttributes(HTMLAttributes, { 'data-wiki-link': true, class: 'wiki-link-chip' }), `[[${HTMLAttributes.title}]]`]
    },

    addNodeView() {
      return ({ node }) => {
        const dom = document.createElement('span')
        dom.className =
          'inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors'
        dom.setAttribute('data-wiki-link', 'true')
        dom.setAttribute('data-note-id', node.attrs.noteId)
        dom.textContent = `[[${node.attrs.title || 'Untitled'}]]`
        dom.addEventListener('click', () => {
          useAppStore.getState().setActiveView({ type: 'note', noteId: node.attrs.noteId })
        })
        return { dom }
      }
    },

    addProseMirrorPlugins() {
      const getCurrentNoteIdFn = getCurrentNoteId
      return [
        Suggestion({
          editor: this.editor,
          char: '[[',
          allowSpaces: true,
          startOfLine: false,
          items({ query }: { query: string }) {
            const { notes } = useAppStore.getState()
            const q = query.toLowerCase().trim()
            if (!q) return notes.slice(0, 20)
            return notes.filter((n) =>
              n.title.toLowerCase().includes(q) ||
              n.tags?.some((t) => t.toLowerCase().includes(q))
            ).slice(0, 20)
          },
          command({
            editor,
            range,
            props,
          }: {
            editor: Editor
            range: { from: number; to: number }
            props: Note
          }) {
            const currentNoteId = getCurrentNoteIdFn()
            // Link the notes bidirectionally in the store
            if (currentNoteId && props.id && currentNoteId !== props.id) {
              useAppStore.getState().linkNotes(currentNoteId, props.id)
            }
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent({
                type: 'wikiLink',
                attrs: { noteId: props.id, title: props.title || 'Untitled' },
              })
              .run()
          },
          render() {
            let component: ReactRenderer<{ onKeyDown: (e: KeyboardEvent) => boolean }>
            let popup: Instance[]

            return {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onStart(props: any) {
                component = new ReactRenderer(WikiLinkList, { props, editor: props.editor })
                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                })
              },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onUpdate(props: any) {
                component.updateProps(props)
                popup[0].setProps({ getReferenceClientRect: props.clientRect })
              },
              onKeyDown(props: { event: KeyboardEvent }) {
                if (props.event.key === 'Escape') { popup[0].hide(); return true }
                return component.ref?.onKeyDown(props.event) ?? false
              },
              onExit() {
                popup[0].destroy()
                component.destroy()
              },
            }
          },
        }),
      ]
    },
  })
}
