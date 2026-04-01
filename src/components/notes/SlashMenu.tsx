import React from 'react'
import { Extension } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Heading1, Heading2, Heading3, List, ListOrdered, Code2, Quote, Minus, FlaskConical, FunctionSquare, CheckSquare, LayoutTemplate, BookOpen, FlaskRound, Microscope, Sigma, Network } from 'lucide-react'
import tippy, { type Instance } from 'tippy.js'
import type { Editor } from '@tiptap/core'
import { useAppStore } from '@/store/app'

interface Command {
  title: string
  description: string
  icon: React.ReactNode
  command: (editor: Editor) => void
}

const COMMANDS: Command[] = [
  {
    title: 'Heading 1', description: 'Large section heading', icon: <Heading1 size={16} />,
    command: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2', description: 'Medium section heading', icon: <Heading2 size={16} />,
    command: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3', description: 'Small heading', icon: <Heading3 size={16} />,
    command: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List', description: 'Unordered list', icon: <List size={16} />,
    command: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Numbered List', description: 'Ordered list', icon: <ListOrdered size={16} />,
    command: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Task List', description: 'Checklist', icon: <CheckSquare size={16} />,
    command: (e) => e.chain().focus().toggleTaskList().run(),
  },
  {
    title: 'Code Block', description: 'Syntax highlighted code', icon: <Code2 size={16} />,
    command: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Quote', description: 'Blockquote', icon: <Quote size={16} />,
    command: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Divider', description: 'Horizontal rule', icon: <Minus size={16} />,
    command: (e) => e.chain().focus().setHorizontalRule().run(),
  },
  {
    title: 'Equation', description: 'Block LaTeX equation', icon: <FunctionSquare size={16} />,
    command: (e) => e.chain().focus().insertContent({ type: 'blockEquation', attrs: { latex: '' } }).run(),
  },
  {
    title: 'Simulation', description: 'Pendulum simulation', icon: <FlaskConical size={16} />,
    command: (e) => e.chain().focus().insertContent({ type: 'simWidget', attrs: { simType: 'pendulum' } }).run(),
  },
  {
    title: 'Sim: Circular Motion', description: 'Centripetal force simulation', icon: <FlaskConical size={16} />,
    command: (e) => e.chain().focus().insertContent({ type: 'simWidget', attrs: { simType: 'circular' } }).run(),
  },
  {
    title: 'Sim: Energy', description: 'KE/PE conservation simulation', icon: <FlaskConical size={16} />,
    command: (e) => e.chain().focus().insertContent({ type: 'simWidget', attrs: { simType: 'energy' } }).run(),
  },
  {
    title: 'Sim: Collision', description: '1D elastic/inelastic collision', icon: <FlaskConical size={16} />,
    command: (e) => e.chain().focus().insertContent({ type: 'simWidget', attrs: { simType: 'collision' } }).run(),
  },
  {
    title: 'Cornell Layout', description: 'Switch to Cornell note-taking layout', icon: <LayoutTemplate size={16} />,
    command: (_e) => {
      const { activeView, updateNote } = useAppStore.getState()
      if (activeView.type === 'note') {
        updateNote(activeView.noteId, { template: 'cornell' })
      }
    },
  },
  {
    title: 'Outline', description: 'Study outline scaffold', icon: <BookOpen size={16} />,
    command: (e) => e.chain().focus().insertContent({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Topic' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'I. Main Concept' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Key point' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'II. Second Concept' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Key point' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'III. Third Concept' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Key point' }] }] }] },
      ],
    }).run(),
  },
  {
    title: 'Problem Set', description: 'Physics problem scaffold', icon: <FlaskRound size={16} />,
    command: (e) => e.chain().focus().insertContent({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Problem' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'State the problem here.' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Given' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Variable = value' }] }] }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Find' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'What are you solving for?' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Solution' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Show your work…' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Answer' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Final answer with units.' }] },
      ],
    }).run(),
  },
  {
    title: 'Lab Report', description: 'Lab report scaffold', icon: <Microscope size={16} />,
    command: (e) => e.chain().focus().insertContent({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Lab Report' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Hypothesis' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'State your hypothesis.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Method' }] },
        { type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step 1' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Results' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Describe your observations and data.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Analysis' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Analyse the results.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Conclusion' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Summarise findings and relate to hypothesis.' }] },
      ],
    }).run(),
  },
  {
    title: 'Derivation',
    description: 'Scaffold for deriving a formula step-by-step',
    icon: <Sigma size={16} />,
    command: (editor) => editor.chain().focus().clearContent().insertContent({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Derivation: [Name]' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Goal' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Prove or derive: ' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Starting Point' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Begin with: ' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Key Principles Used' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '1. ' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '2. ' }] }] },
        ]},
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Steps' }] },
        { type: 'orderedList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step 1: ' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step 2: ' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step 3: ' }] }] },
        ]},
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Result' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Therefore: ' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Sanity Check' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Dimensional analysis: ' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Limiting cases: ' }] },
      ],
    }).run(),
  },
  {
    title: 'Formula Reference',
    description: 'Structured formula card with variables and usage',
    icon: <FunctionSquare size={16} />,
    command: (editor) => editor.chain().focus().clearContent().insertContent({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Formula: [Name]' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Equation' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '[Write equation here using $...$]' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Variables' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'symbol — name (SI unit)' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'symbol — name (SI unit)' }] }] },
        ]},
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'When to Use' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Apply this formula when: ' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Assumptions / Conditions' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Condition 1' }] }] },
        ]},
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Common Mistakes' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Mistake 1' }] }] },
        ]},
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Related Formulas' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '[[link to related note]]' }] },
      ],
    }).run(),
  },
  {
    title: 'Concept Map',
    description: 'Core concept with connections, misconceptions, and examples',
    icon: <Network size={16} />,
    command: (editor) => editor.chain().focus().clearContent().insertContent({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Concept: [Name]' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Core Idea (one sentence)' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Mathematical Form' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '[Main equation]' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Physical Intuition' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Think of it like...' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'When It Applies' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Condition' }] }] },
        ]},
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Common Misconceptions' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '❌ Wrong belief → ✓ Correct understanding' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '❌ Wrong belief → ✓ Correct understanding' }] }] },
        ]},
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Worked Example' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Given: ...' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Find: ...' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Solution: ...' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Connected Concepts' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '[[Related concept]] — [[Another concept]]' }] },
      ],
    }).run(),
  },
]

interface SlashListProps {
  items: Command[]
  command: (item: Command) => void
}

export const SlashList = forwardRef<{ onKeyDown: (e: KeyboardEvent) => boolean }, SlashListProps>(
  ({ items, command }, ref) => {
    const [selected, setSelected] = useState(0)

    useImperativeHandle(ref, () => ({
      onKeyDown({ key }: KeyboardEvent) {
        if (key === 'ArrowUp') { setSelected((s) => (s - 1 + items.length) % items.length); return true }
        if (key === 'ArrowDown') { setSelected((s) => (s + 1) % items.length); return true }
        if (key === 'Enter') { command(items[selected]); return true }
        return false
      },
    }))

    useEffect(() => setSelected(0), [items])

    if (!items.length) return null

    return (
      <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl shadow-lg py-1 w-64 max-h-72 overflow-y-auto z-50">
        {items.map((item, i) => (
          <button
            key={item.title}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[hsl(var(--muted))] transition-colors ${i === selected ? 'bg-[hsl(var(--muted))]' : ''}`}
            onClick={() => command(item)}
          >
            <span className="text-[hsl(var(--muted-foreground))] shrink-0">{item.icon}</span>
            <div>
              <div className="text-sm font-medium">{item.title}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    )
  }
)
SlashList.displayName = 'SlashList'

export const SlashCommands = Extension.create({
  name: 'slashCommands',
  addOptions() {
    return {
      suggestion: {
        char: '/',
        command({ editor, range, props }: { editor: Editor; range: { from: number; to: number }; props: Command }) {
          props.command(editor)
          editor.chain().focus().deleteRange(range).run()
        },
        items({ query }: { query: string }) {
          return COMMANDS.filter((c) =>
            c.title.toLowerCase().includes(query.toLowerCase()) ||
            c.description.toLowerCase().includes(query.toLowerCase())
          )
        },
        render() {
          let component: ReactRenderer<{ onKeyDown: (e: KeyboardEvent) => boolean }>
          let popup: Instance[]

          return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onStart(props: any) {
              component = new ReactRenderer(SlashList, { props, editor: props.editor })
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
      },
    }
  },
  addProseMirrorPlugins() {
    return [Suggestion({ editor: this.editor, ...this.options.suggestion })]
  },
})
