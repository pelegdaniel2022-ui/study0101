import { openDB } from 'idb'

let db: Awaited<ReturnType<typeof openDB>> | null = null

async function getDB() {
  if (!db) {
    db = await openDB('physics-study-attachments', 1, {
      upgrade(database) {
        database.createObjectStore('files', { keyPath: 'id' })
      },
    })
  }
  return db
}

export async function saveAttachmentData(id: string, dataUrl: string): Promise<void> {
  const database = await getDB()
  await database.put('files', { id, dataUrl })
}

export async function getAttachmentData(id: string): Promise<string | null> {
  const database = await getDB()
  const record = await database.get('files', id) as { id: string; dataUrl: string } | undefined
  return record?.dataUrl ?? null
}

export async function deleteAttachmentData(id: string): Promise<void> {
  const database = await getDB()
  await database.delete('files', id)
}
