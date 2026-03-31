// @ts-ignore
import { ForceGraph2D } from 'react-force-graph'
import { useCallback, useMemo, useState } from 'react'
import { useAppStore } from '@/store/app'

interface GraphNode {
  id: string
  name: string
  color: string
  val: number
  courseId: string
  courseName: string
}

interface GraphLink {
  source: string
  target: string
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export function KnowledgeGraphView() {
  const { notes, courses, setActiveView, darkMode } = useAppStore()
  const [filterCourseId, setFilterCourseId] = useState<string>('all')
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)

  const courseMap = useMemo(() => {
    return new Map(courses.map((c) => [c.id, c]))
  }, [courses])

  const filteredNotes = useMemo(() => {
    if (filterCourseId === 'all') return notes
    return notes.filter((n) => n.courseId === filterCourseId)
  }, [notes, filterCourseId])

  const graphData: GraphData = useMemo(() => {
    const nodeIds = new Set(filteredNotes.map((n) => n.id))

    const nodes: GraphNode[] = filteredNotes.map((note) => {
      const course = courseMap.get(note.courseId)
      return {
        id: note.id,
        name: note.title || 'Untitled',
        color: course?.color ?? '#6366f1',
        val: (note.linkedNoteIds?.length ?? 0) + 1,
        courseId: note.courseId,
        courseName: course?.name ?? 'Unknown course',
      }
    })

    const links: GraphLink[] = []
    const seen = new Set<string>()

    for (const note of filteredNotes) {
      for (const targetId of note.linkedNoteIds ?? []) {
        if (!nodeIds.has(targetId)) continue
        // Deduplicate bidirectional links
        const key = [note.id, targetId].sort().join('|')
        if (!seen.has(key)) {
          seen.add(key)
          links.push({ source: note.id, target: targetId })
        }
      }
    }

    return { nodes, links }
  }, [filteredNotes, courseMap])

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setActiveView({ type: 'note', noteId: node.id })
    },
    [setActiveView]
  )

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node)
  }, [])

  const bgColor = darkMode ? '#0f0f0f' : '#ffffff'
  const linkColor = darkMode ? 'rgba(148,163,184,0.3)' : 'rgba(100,116,139,0.3)'

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] shrink-0 z-10">
        <h2 className="text-base font-semibold">Knowledge Graph</h2>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {graphData.nodes.length} notes · {graphData.links.length} links
        </span>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-[hsl(var(--muted-foreground))]">Filter by course:</label>
          <select
            value={filterCourseId}
            onChange={(e) => setFilterCourseId(e.target.value)}
            className="text-xs px-2 py-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))]"
          >
            <option value="all">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Graph canvas */}
      <div className="flex-1 relative">
        {graphData.nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[hsl(var(--muted-foreground))] text-sm">
            No notes to display. Create some notes and link them with <code className="mx-1 px-1 py-0.5 rounded bg-[hsl(var(--muted))] text-xs">[[WikiLinks]]</code> to see the graph.
          </div>
        ) : (
          <ForceGraph2D
            graphData={graphData}
            backgroundColor={bgColor}
            nodeLabel={(node: GraphNode) => `${node.name}\n${node.courseName}`}
            nodeColor={(node: GraphNode) => node.color}
            nodeVal={(node: GraphNode) => node.val}
            linkColor={() => linkColor}
            linkWidth={1.5}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            nodeCanvasObjectMode={() => 'after'}
            nodeCanvasObject={(node: GraphNode & { x?: number; y?: number }, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.name
              const fontSize = Math.max(8, 12 / globalScale)
              ctx.font = `${fontSize}px Sans-Serif`
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)'
              ctx.fillText(label, node.x ?? 0, (node.y ?? 0) + Math.sqrt(node.val) * 4 + fontSize)
            }}
            cooldownTicks={80}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
          />
        )}

        {/* Tooltip on hover */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg shadow-lg px-3 py-2 text-xs pointer-events-none z-20">
            <div className="font-semibold">{hoveredNode.name}</div>
            <div className="text-[hsl(var(--muted-foreground))]">{hoveredNode.courseName}</div>
          </div>
        )}
      </div>
    </div>
  )
}
