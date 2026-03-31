/**
 * Converts a Tiptap JSON document to Obsidian-compatible Markdown.
 * Preserves [[wikilinks]], headings, lists, code blocks, bold/italic, and tasks.
 */

type TiptapMark = {
  type: string
  attrs?: Record<string, unknown>
}

type TiptapNode = {
  type: string
  text?: string
  content?: TiptapNode[]
  marks?: TiptapMark[]
  attrs?: Record<string, unknown>
}

function markText(text: string, marks: TiptapMark[] = []): string {
  let out = text
  const types = marks.map((m) => m.type)
  if (types.includes('bold')) out = `**${out}**`
  if (types.includes('italic')) out = `*${out}*`
  if (types.includes('code')) out = `\`${out}\``
  if (types.includes('underline')) out = `<u>${out}</u>`
  if (types.includes('strike')) out = `~~${out}~~`
  const highlight = marks.find((m) => m.type === 'highlight')
  if (highlight) out = `==${out}==`
  const link = marks.find((m) => m.type === 'link')
  if (link) out = `[${out}](${link.attrs?.href ?? ''})`
  return out
}

function inlineContent(nodes: TiptapNode[] = []): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') return markText(n.text ?? '', n.marks)
      if (n.type === 'wikiLink') return `[[${n.attrs?.title ?? n.attrs?.id ?? ''}]]`
      if (n.type === 'hardBreak') return '  \n'
      if (n.type === 'inlineEquation') return `$${n.attrs?.latex ?? ''}$`
      return inlineContent(n.content)
    })
    .join('')
}

function nodeToMarkdown(node: TiptapNode, listDepth = 0, listType = ''): string {
  const indent = '  '.repeat(listDepth)

  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map((n) => nodeToMarkdown(n)).join('\n')

    case 'paragraph': {
      const text = inlineContent(node.content)
      return text ? `${text}\n` : '\n'
    }

    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1
      const prefix = '#'.repeat(level)
      return `${prefix} ${inlineContent(node.content)}\n`
    }

    case 'bulletList':
      return (node.content ?? [])
        .map((item) => nodeToMarkdown(item, listDepth, 'bullet'))
        .join('')

    case 'orderedList':
      return (node.content ?? [])
        .map((item, i) => nodeToMarkdown(item, listDepth, `${i + 1}.`))
        .join('')

    case 'taskList':
      return (node.content ?? [])
        .map((item) => nodeToMarkdown(item, listDepth, 'task'))
        .join('')

    case 'listItem': {
      const children = node.content ?? []
      const firstPara = children[0]
      const rest = children.slice(1)
      const bullet = listType === 'task'
        ? `- [ ] `
        : listType.match(/^\d/)
          ? `${indent}${listType} `
          : `${indent}- `
      const firstLine = `${bullet}${inlineContent(firstPara?.content)}\n`
      const nested = rest.map((n) => nodeToMarkdown(n, listDepth + 1)).join('')
      return firstLine + nested
    }

    case 'taskItem': {
      const checked = node.attrs?.checked ? 'x' : ' '
      const children = node.content ?? []
      const firstPara = children[0]
      const rest = children.slice(1)
      const firstLine = `${indent}- [${checked}] ${inlineContent(firstPara?.content)}\n`
      const nested = rest.map((n) => nodeToMarkdown(n, listDepth + 1)).join('')
      return firstLine + nested
    }

    case 'blockquote':
      return (node.content ?? [])
        .map((n) => `> ${nodeToMarkdown(n).trimEnd()}\n`)
        .join('')

    case 'codeBlock': {
      const lang = (node.attrs?.language as string) ?? ''
      const code = (node.content ?? []).map((n) => n.text ?? '').join('')
      return `\`\`\`${lang}\n${code}\n\`\`\`\n`
    }

    case 'horizontalRule':
      return `---\n`

    case 'blockEquation':
      return `$$\n${node.attrs?.latex ?? ''}\n$$\n`

    case 'image': {
      const src = (node.attrs?.src as string) ?? ''
      const alt = (node.attrs?.alt as string) ?? ''
      return `![${alt}](${src})\n`
    }

    default:
      // Fallback: render inline content if any
      if (node.content?.length) return nodeToMarkdown({ ...node, type: 'paragraph' })
      return ''
  }
}

export function tiptapJsonToMarkdown(json: string): string {
  try {
    const doc = JSON.parse(json) as TiptapNode
    return nodeToMarkdown(doc).trim()
  } catch {
    return json
  }
}

export interface ObsidianNote {
  filename: string
  content: string
}

export function notesToObsidianVault(
  notes: Array<{ title: string; content: string; tags: string[]; createdAt: number; linkedNoteIds?: string[] }>
): ObsidianNote[] {
  return notes.map((note) => {
    const safeName = note.title.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'Untitled'
    const filename = `${safeName}.md`

    // YAML frontmatter
    const date = new Date(note.createdAt).toISOString().slice(0, 10)
    const tagsYaml = note.tags.length ? `\ntags: [${note.tags.map((t) => `"${t}"`).join(', ')}]` : ''
    const frontmatter = `---\ntitle: "${note.title.replace(/"/g, '\\"')}"\ndate: ${date}${tagsYaml}\n---\n\n`

    const body = tiptapJsonToMarkdown(note.content)
    return { filename, content: frontmatter + body }
  })
}
