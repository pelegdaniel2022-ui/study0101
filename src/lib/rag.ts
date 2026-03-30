import { openDB, type IDBPDatabase } from 'idb'
import OpenAI from 'openai'

interface EmbeddingRecord {
  id: string
  noteId: string
  chunkIndex: number
  text: string
  embedding: number[]
  updatedAt: number
}

let db: IDBPDatabase | null = null

async function getDB() {
  if (!db) {
    db = await openDB('physics-study-rag', 1, {
      upgrade(database) {
        database.createObjectStore('embeddings', { keyPath: 'id' })
      },
    })
  }
  return db
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

function chunkText(text: string, size = 500, overlap = 50): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  for (let i = 0; i < words.length; i += size - overlap) {
    chunks.push(words.slice(i, i + size).join(' '))
    if (i + size >= words.length) break
  }
  return chunks
}

export async function embedNote(apiKey: string, noteId: string, text: string): Promise<void> {
  if (!apiKey || !text.trim()) return
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  const database = await getDB()

  // Delete old chunks for this note
  const tx = database.transaction('embeddings', 'readwrite')
  const store = tx.objectStore('embeddings')
  const all = await store.getAll() as EmbeddingRecord[]
  for (const rec of all) {
    if (rec.noteId === noteId) await store.delete(rec.id)
  }
  await tx.done

  const chunks = chunkText(text)
  if (chunks.length === 0) return

  const resp = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: chunks,
  })

  const writeTx = database.transaction('embeddings', 'readwrite')
  const writeStore = writeTx.objectStore('embeddings')
  for (let i = 0; i < chunks.length; i++) {
    const record: EmbeddingRecord = {
      id: `${noteId}-${i}`,
      noteId,
      chunkIndex: i,
      text: chunks[i],
      embedding: resp.data[i].embedding,
      updatedAt: Date.now(),
    }
    await writeStore.put(record)
  }
  await writeTx.done
}

export async function searchNotes(
  apiKey: string,
  query: string,
  topK = 5
): Promise<Array<{ noteId: string; text: string; score: number }>> {
  if (!apiKey || !query.trim()) return []
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  const database = await getDB()

  const resp = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: [query],
  })
  const queryVec = resp.data[0].embedding

  const all = await database.getAll('embeddings') as EmbeddingRecord[]
  const scored = all.map((rec) => ({
    noteId: rec.noteId,
    text: rec.text,
    score: cosineSimilarity(queryVec, rec.embedding),
  }))

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((r) => r.score > 0.3)
}
