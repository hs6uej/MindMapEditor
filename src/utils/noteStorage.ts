const NOTES_STORAGE_KEY = 'mind_map_notes'

export interface NoteData {
  [nodeId: string]: string
}

export const saveNote = async (
  nodeId: string,
  content: string,
): Promise<void> => {
  try {
    const notesJson = localStorage.getItem(NOTES_STORAGE_KEY) || '{}'
    const notes: NoteData = JSON.parse(notesJson)
    notes[nodeId] = content
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes))
    return Promise.resolve()
  } catch (error) {
    console.error('Error saving note:', error)
    return Promise.reject(error)
  }
}

export const loadNote = async (nodeId: string): Promise<string> => {
  try {
    const notesJson = localStorage.getItem(NOTES_STORAGE_KEY) || '{}'
    const notes: NoteData = JSON.parse(notesJson)
    return Promise.resolve(notes[nodeId] || '')
  } catch (error) {
    console.error('Error loading note:', error)
    return Promise.reject(error)
  }
}

// NEW: Function to load all notes
export const loadAllNotes = async (): Promise<NoteData> => {
  try {
    const notesJson = localStorage.getItem(NOTES_STORAGE_KEY) || '{}'
    return Promise.resolve(JSON.parse(notesJson))
  } catch (error) {
    console.error('Error loading all notes:', error)
    return Promise.resolve({}) // Return empty object on error
  }
}