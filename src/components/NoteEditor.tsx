import React, { useEffect, useState } from 'react'
import { saveNote, loadNote } from '../utils/noteStorage'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useTheme } from '../contexts/ThemeContext'
import {
  XIcon,
  BoldIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  QuoteIcon,
  CodeIcon,
  StrikethroughIcon,
} from 'lucide-react'

interface NoteEditorProps {
  selectedNodeId: string | null
  onClose: () => void
  onNoteSaved: () => void
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  selectedNodeId,
  onClose,
  onNoteSaved,
}) => {
  const { theme } = useTheme()
  const [isSaving, setIsSaving] = useState(false)
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(
    null,
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 ${
          theme === 'dark' ? 'prose-invert' : ''
        }`,
      },
    },
    onUpdate: ({ editor }) => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
      const timer = setTimeout(() => {
        if (selectedNodeId) {
          handleSaveNote(false)
        }
      }, 1500)
      setAutoSaveTimer(timer)
    },
  })

  useEffect(() => {
    const fetchNote = async () => {
      if (selectedNodeId && editor) {
        // Prevent setting content if the editor is already focused to avoid cursor jumping
        if (!editor.isFocused) {
            const noteContent = await loadNote(selectedNodeId)
            editor.commands.setContent(noteContent || '', false)
        }
      }
    }
    fetchNote()
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
    }
  }, [selectedNodeId, editor])

  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: `prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 ${
              theme === 'dark' ? 'prose-invert' : ''
            }`,
          },
        },
      })
    }
  }, [theme, editor])

  const handleSaveNote = async (showFeedback = true) => {
    if (!selectedNodeId || !editor) return
    if (showFeedback) {
      setIsSaving(true)
    }
    const html = editor.getHTML()
    await saveNote(selectedNodeId, html)
    onNoteSaved()
    if (showFeedback) {
      setTimeout(() => setIsSaving(false), 500) // Add a small delay for better UX
    }
  }

  if (!selectedNodeId) return null

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-md">
      <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          Notes
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleSaveNote(true)}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg shadow-sm text-white transition-colors duration-200 ${
              isSaving
                ? 'bg-gray-400 dark:bg-gray-500 cursor-not-allowed'
                : 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XIcon size={20} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 font-mono">
          Node ID: {selectedNodeId}
        </div>

        {editor && (
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-t-lg p-2">
            <div className="flex flex-wrap gap-1">
              {/* Heading Controls */}
              <div className="flex border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  title="Heading 1"
                >
                  <Heading1Icon size={16} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  title="Heading 2"
                >
                  <Heading2Icon size={16} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  title="Heading 3"
                >
                  <Heading3Icon size={16} />
                </button>
              </div>

              {/* Text Formatting */}
              <div className="flex border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  title="Bold"
                >
                  <BoldIcon size={16} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  title="Italic"
                >
                  <ItalicIcon size={16} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('strike') ? 'bg-gray-200 dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  title="Strikethrough"
                >
                  <StrikethroughIcon size={16} />
                </button>
              </div>

              {/* Lists */}
              <div className="flex border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
                <button
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  title="Bullet List"
                >
                  <ListIcon size={16} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  title="Numbered List"
                >
                  <ListOrderedIcon size={16} />
                </button>
              </div>

              {/* Block Formatting */}
              <div className="flex">
                <button
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  title="Blockquote"
                >
                  <QuoteIcon size={16} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${editor.isActive('codeBlock') ? 'bg-gray-200 dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  title="Code Block"
                >
                  <CodeIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="border border-t-0 border-gray-200 dark:border-gray-600 rounded-b-lg bg-white dark:bg-gray-800">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}

export default NoteEditor