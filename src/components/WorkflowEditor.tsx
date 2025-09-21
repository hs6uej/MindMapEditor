import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  memo,
} from 'react'
import { saveMap, loadMap } from '../utils/mapStorage'
import { loadAllNotes, NoteData } from '../utils/noteStorage'
import CustomContextMenu from './CustomContextMenu'
import { useTheme } from '../contexts/ThemeContext'
import {
  LockIcon,
  UnlockIcon,
  MaximizeIcon,
  MinimizeIcon,
  XCircle,
} from 'lucide-react'
import { Node, MindMap, Connection } from '../types/mindMap'

export const nodeTypes = {
  topic: { name: 'Topic', icon: '📝' },
  subtopic: { name: 'Subtopic', icon: '📌' },
  question: { name: 'Key Question', icon: '❓' },
  idea: { name: 'Idea', icon: '💡' },
  note: { name: 'Note', icon: '📄' },
  decision: { name: 'Decision', icon: '🔄' },
  imageNode: { name: 'Image', icon: '🖼️' },
}

export const defaultMindMap: MindMap = {
  properties: {},
  nodes: [
    {
      id: 'root',
      type: 'topic',
      name: 'Main Topic',
      properties: { description: 'Click to edit' },
      x: 400,
      y: 100,
    },
  ],
  connections: [],
}

export type MindMapAction =
  | { type: 'SET_MIND_MAP'; payload: MindMap }
  | { type: 'ADD_NODE'; payload: { node: Node } }
  | { type: 'UPDATE_NODE'; payload: { nodeId: string; updates: Partial<Node> } }
  | { type: 'DELETE_NODE'; payload: { nodeId: string } }
  | { type: 'ADD_CONNECTION'; payload: { sourceId: string; targetId: string } }
  | { type: 'REMOVE_CONNECTION'; payload: { connectionId: string } }
  | { type: 'MOVE_NODE'; payload: { nodeId: string; x: number; y: number } }

export const mindMapReducer = (
  state: MindMap,
  action: MindMapAction,
): MindMap => {
  switch (action.type) {
    case 'SET_MIND_MAP':
      return { ...action.payload, connections: action.payload.connections || [] }

    case 'ADD_NODE':
      return { ...state, nodes: [...state.nodes, action.payload.node] }

    case 'UPDATE_NODE': {
      const { nodeId, updates } = action.payload
      return {
        ...state,
        nodes: state.nodes.map((node) =>
          node.id === nodeId ? { ...node, ...updates } : node,
        ),
      }
    }

    case 'DELETE_NODE': {
      const { nodeId } = action.payload
      const updatedNodes = state.nodes.filter((node) => node.id !== nodeId)
      const updatedConnections = state.connections.filter(
        (c) => c.from !== nodeId && c.to !== nodeId,
      )
      return { ...state, nodes: updatedNodes, connections: updatedConnections }
    }

    case 'ADD_CONNECTION': {
      const { sourceId, targetId } = action.payload
      if (
        sourceId === targetId ||
        state.connections.some(
          (c) => c.from === sourceId && c.to === targetId,
        )
      ) {
        return state
      }
      const newConnection: Connection = {
        id: `conn-${Date.now()}`,
        from: sourceId,
        to: targetId,
      }
      return { ...state, connections: [...state.connections, newConnection] }
    }

    case 'REMOVE_CONNECTION': {
      return {
        ...state,
        connections: state.connections.filter(
          (c) => c.id !== action.payload.connectionId,
        ),
      }
    }

    case 'MOVE_NODE': {
      const { nodeId, x, y } = action.payload
      return {
        ...state,
        nodes: state.nodes.map((node) =>
          node.id === nodeId ? { ...node, x, y } : node,
        ),
      }
    }
    default:
      return state
  }
}

interface WorkflowEditorProps {
  mindMap: MindMap
  dispatch: React.Dispatch<MindMapAction>
  selectedNode: Node | null
  onNodeSelected: (node: Node | null) => void
  noteUpdateKey: number
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = memo(
  ({ mindMap, dispatch, selectedNode, onNodeSelected, noteUpdateKey }) => {
    const [allNotes, setAllNotes] = useState<NoteData>({})
    const [mapId] = useState('my-first-map')
    const [isDragging, setIsDragging] = useState(false)
    const [isReadOnly, setIsReadOnly] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [contextMenu, setContextMenu] = useState<{
      show: boolean
      x: number
      y: number
      type: 'canvas' | 'node'
      nodeId?: string
    }>({ show: false, x: 0, y: 0, type: 'canvas' })
    const [copiedNode, setCopiedNode] = useState<Node | null>(null)
    const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 })
    const [isDrawingConnection, setIsDrawingConnection] = useState(false)
    const [connectionStart, setConnectionStart] = useState<{
      nodeId: string
      x: number
      y: number
    } | null>(null)
    const [connectionEnd, setConnectionEnd] = useState<{
      x: number
      y: number
    } | null>(null)
    const canvasRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { theme } = useTheme()

    const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
    const [editingText, setEditingText] = useState('')

    useEffect(() => {
      const loadInitialData = async () => {
        try {
          const savedMap = await loadMap(mapId)
          if (savedMap) {
            dispatch({ type: 'SET_MIND_MAP', payload: savedMap })
          }
          const savedNotes = await loadAllNotes()
          setAllNotes(savedNotes)
        } catch (error) {
          console.error('Error loading initial data:', error)
        }
      }
      loadInitialData()
    }, [mapId, dispatch])

    useEffect(() => {
      const fetchNotes = async () => {
        const savedNotes = await loadAllNotes()
        setAllNotes(savedNotes)
      }
      if (noteUpdateKey > 0) {
        fetchNotes()
      }
    }, [noteUpdateKey])

    const zoom = useCallback(
      (amount: number, clientX?: number, clientY?: number) => {
        setViewTransform((prev) => {
          const newScale = Math.max(0.2, Math.min(3, prev.scale + amount))
          if (!canvasRef.current) return { ...prev, scale: newScale }
          const rect = canvasRef.current.getBoundingClientRect()
          const mouseX = (clientX ?? rect.width / 2) - rect.left
          const mouseY = (clientY ?? rect.height / 2) - rect.top
          const newX = prev.x - (mouseX / prev.scale - mouseX / newScale)
          const newY = prev.y - (mouseY / prev.scale - mouseY / newScale)
          return { x: newX, y: newY, scale: newScale }
        })
      },
      [],
    )

    const addImageNode = useCallback(
      (imageData: string) => {
        if (isReadOnly || !canvasRef.current) return
        const rect = canvasRef.current.getBoundingClientRect()
        const x = (rect.width / 2 - viewTransform.x) / viewTransform.scale
        const y = (rect.height / 2 - viewTransform.y) / viewTransform.scale
        const newNode: Node = {
          id: `node-${Date.now()}`,
          type: 'imageNode',
          name: 'Pasted Image',
          properties: { imageData },
          x: x - 100,
          y: y - 75,
        }
        dispatch({
          type: 'ADD_NODE',
          payload: { node: newNode },
        })
      },
      [isReadOnly, viewTransform, dispatch],
    )

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
          e.preventDefault()
          zoom(0.1)
        } else if (e.ctrlKey && e.key === '-') {
          e.preventDefault()
          zoom(-0.1)
        }
      }
      const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey) {
          e.preventDefault()
          const zoomAmount = e.deltaY > 0 ? -0.1 : 0.1
          zoom(zoomAmount, e.clientX, e.clientY)
        }
      }
      const handlePaste = async (e: ClipboardEvent) => {
        if (!e.clipboardData) return
        const items = Array.from(e.clipboardData.items)
        const imageItem = items.find((item) =>
          item.type.startsWith('image/'),
        )
        if (imageItem) {
          e.preventDefault()
          const file = imageItem.getAsFile()
          if (!file) return
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64Data = reader.result as string
            if (base64Data) {
              addImageNode(base64Data)
            }
          }
          reader.readAsDataURL(file)
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('wheel', handleWheel, { passive: false })
      window.addEventListener('paste', handlePaste)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('wheel', handleWheel)
        window.removeEventListener('paste', handlePaste)
      }
    }, [zoom, addImageNode])

    const toggleFullscreen = useCallback(() => {
      if (!document.fullscreenElement) {
        canvasRef.current?.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`)
        })
        setIsFullscreen(true)
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
          setIsFullscreen(false)
        }
      }
    }, [])

    useEffect(() => {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement)
      }
      document.addEventListener('fullscreenchange', handleFullscreenChange)
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange)
      }
    }, [])

    const handleCanvasClick = useCallback(
      (e: React.MouseEvent) => {
        if (
          e.target === canvasRef.current ||
          e.target === canvasRef.current?.firstChild
        ) {
          onNodeSelected(null)
        }
      },
      [onNodeSelected],
    )

    const handleNodeClick = useCallback(
      (node: Node, e: React.MouseEvent) => {
        if (isReadOnly || editingNodeId === node.id) return
        e.stopPropagation()
        onNodeSelected(node)
      },
      [onNodeSelected, isReadOnly, editingNodeId],
    )

    const handleNodeDoubleClick = useCallback(
      (nodeId: string, currentName: string) => {
        if (isReadOnly) return
        setEditingNodeId(nodeId)
        setEditingText(currentName)
      },
      [isReadOnly],
    )

    const handleNameChange = useCallback(() => {
      if (!editingNodeId || editingText.trim() === '') {
        setEditingNodeId(null)
        return
      }
      dispatch({
        type: 'UPDATE_NODE',
        payload: { nodeId: editingNodeId, updates: { name: editingText } },
      })
      setEditingNodeId(null)
      setEditingText('')
    }, [editingNodeId, editingText, dispatch])

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleNameChange()
      } else if (e.key === 'Escape') {
        setEditingNodeId(null)
        setEditingText('')
      }
    }

    const handleAddNode = useCallback(
      (
        type: string = 'topic',
        name: string = 'New Topic',
        x?: number,
        y?: number,
      ) => {
        if (isReadOnly) return
        const newNode: Node = {
          id: `node-${Date.now()}`,
          type,
          name,
          properties: {},
          x: x || 0,
          y: y || 0,
        }
        dispatch({ type: 'ADD_NODE', payload: { node: newNode } })
      },
      [isReadOnly, dispatch],
    )

    const startConnectionDrag = useCallback(
      (nodeId: string, e: React.MouseEvent) => {
        if (isReadOnly) return
        e.stopPropagation()
        if (e.button === 0) {
          const node = mindMap.nodes.find((n) => n.id === nodeId)
          if (node) {
            setIsDrawingConnection(true)
            setConnectionStart({
              nodeId,
              x: node.x + 100,
              y: node.y + 30,
            })
            const rect = canvasRef.current?.getBoundingClientRect()
            if (rect) {
              const x =
                (e.clientX - rect.left - viewTransform.x) / viewTransform.scale
              const y =
                (e.clientY - rect.top - viewTransform.y) / viewTransform.scale
              setConnectionEnd({ x, y })
            }
          }
        }
      },
      [mindMap.nodes, isReadOnly, viewTransform],
    )

    const updateConnectionDrag = useCallback(
      (e: React.MouseEvent) => {
        if (isDrawingConnection) {
          const rect = canvasRef.current?.getBoundingClientRect()
          if (rect) {
            const x =
              (e.clientX - rect.left - viewTransform.x) / viewTransform.scale
            const y =
              (e.clientY - rect.top - viewTransform.y) / viewTransform.scale
            setConnectionEnd({ x, y })
          }
        }
      },
      [isDrawingConnection, viewTransform],
    )

    const endConnectionDrag = useCallback(
      (e: React.MouseEvent, targetNodeId?: string) => {
        if (
          isReadOnly ||
          !isDrawingConnection ||
          !connectionStart ||
          !targetNodeId
        ) {
          setIsDrawingConnection(false)
          return
        }

        dispatch({
          type: 'ADD_CONNECTION',
          payload: {
            sourceId: connectionStart.nodeId,
            targetId: targetNodeId,
          },
        })

        setIsDrawingConnection(false)
        setConnectionStart(null)
        setConnectionEnd(null)
      },
      [isDrawingConnection, connectionStart, isReadOnly, dispatch],
    )

    const removeConnection = useCallback(
      (connectionId: string) => {
        if (isReadOnly) return
        dispatch({
          type: 'REMOVE_CONNECTION',
          payload: { connectionId },
        })
      },
      [isReadOnly, dispatch],
    )

    const handleSave = useCallback(async () => {
      try {
        await saveMap(mapId, mindMap)
        alert('Map saved successfully!')
      } catch (error) {
        console.error('Error saving mind map:', error)
        alert('Failed to save the map.')
      }
    }, [mapId, mindMap])

    const handleImport = useCallback(() => {
      fileInputRef.current?.click()
    }, [])

    const handleFileChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string
            const importedMap = JSON.parse(content)
            dispatch({ type: 'SET_MIND_MAP', payload: importedMap })
          } catch (error) {
            console.error('Error importing map:', error)
            alert('Invalid map file')
          }
        }
        reader.readAsText(file)
        event.target.value = ''
      },
      [dispatch],
    )

    const handleExport = useCallback(() => {
      const dataStr = JSON.stringify(mindMap, null, 2)
      const dataUri =
        'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
      const exportFileDefaultName = `mind-map-${Date.now()}.json`
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    }, [mindMap])

    const startDrag = useCallback(
      (nodeId: string, e: React.MouseEvent) => {
        if (isReadOnly || e.button !== 0 || editingNodeId) return
        e.stopPropagation()
        setIsDragging(true)
        const node = mindMap.nodes.find((n) => n.id === nodeId)
        if (node) {
          onNodeSelected(node)
          setDragOffset({
            x: e.clientX - node.x * viewTransform.scale - viewTransform.x,
            y: e.clientY - node.y * viewTransform.scale - viewTransform.y,
          })
        }
      },
      [mindMap.nodes, isReadOnly, viewTransform, editingNodeId, onNodeSelected],
    )

    const onDrag = useCallback(
      (e: React.MouseEvent) => {
        if (isDragging && selectedNode?.id && !isReadOnly) {
          const newX =
            (e.clientX - viewTransform.x - dragOffset.x) / viewTransform.scale
          const newY =
            (e.clientY - viewTransform.y - dragOffset.y) / viewTransform.scale
          dispatch({
            type: 'MOVE_NODE',
            payload: { nodeId: selectedNode.id, x: newX, y: newY },
          })
        }
        updateConnectionDrag(e)
      },
      [
        isDragging,
        selectedNode,
        dragOffset,
        updateConnectionDrag,
        isReadOnly,
        viewTransform,
        dispatch,
      ],
    )

    const endDrag = useCallback(() => {
      setIsDragging(false)
    }, [])

    const handleContextMenu = useCallback(
      (e: React.MouseEvent, nodeId?: string) => {
        if (isReadOnly) return
        e.preventDefault()
        e.stopPropagation()
        setContextMenu({
          show: true,
          x: e.clientX,
          y: e.clientY,
          type: nodeId ? 'node' : 'canvas',
          nodeId,
        })
      },
      [isReadOnly],
    )

    const closeContextMenu = useCallback(() => {
      setContextMenu((prev) => ({ ...prev, show: false }))
    }, [])

    const handleDeleteNode = useCallback(
      (nodeId: string) => {
        if (isReadOnly) return
        dispatch({ type: 'DELETE_NODE', payload: { nodeId } })
        if (selectedNode?.id === nodeId) {
          onNodeSelected(null)
        }
      },
      [selectedNode, onNodeSelected, isReadOnly, dispatch],
    )

    const handleCopyNode = useCallback(
      (nodeId: string) => {
        const nodeToCopy = mindMap.nodes.find((n) => n.id === nodeId)
        if (nodeToCopy) {
          setCopiedNode(nodeToCopy)
        }
      },
      [mindMap.nodes],
    )

    const handlePasteNode = useCallback(() => {
      if (!copiedNode || isReadOnly) return
      const newNode: Node = {
        ...copiedNode,
        id: `node-${Date.now()}`,
        x: copiedNode.x + 50,
        y: copiedNode.y + 50,
      }
      dispatch({ type: 'ADD_NODE', payload: { node: newNode } })
      onNodeSelected(newNode)
    }, [copiedNode, onNodeSelected, isReadOnly, dispatch])

    const handleResetView = useCallback(() => {
      setViewTransform({ x: 0, y: 0, scale: 1 })
    }, [])

    const handleDragOver = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
      },
      [],
    )

    const handleDrop = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        if (isReadOnly) return
        e.preventDefault()
        const data = e.dataTransfer.getData('node-type')
        if (data) {
          try {
            const nodeType = JSON.parse(data)
            const rect = canvasRef.current?.getBoundingClientRect()
            if (rect) {
              const x =
                (e.clientX - rect.left - viewTransform.x) / viewTransform.scale
              const y =
                (e.clientY - rect.top - viewTransform.y) / viewTransform.scale
              handleAddNode(nodeType.type, nodeType.name, x, y)
            }
          } catch (error) {
            console.error('Error dropping node:', error)
          }
        }
      },
      [handleAddNode, isReadOnly, viewTransform],
    )

    const toggleReadOnly = useCallback(() => {
      setIsReadOnly((prev) => !prev)
    }, [])

    const renderNodes = useMemo(() => {
      const getNotePreview = (nodeId: string): string | null => {
        const htmlContent = allNotes[nodeId]
        if (!htmlContent) return null
        const textContent = htmlContent.replace(/<[^>]*>?/gm, ' ')
        const cleanedText = textContent.replace(/\s+/g, ' ').trim()
        if (cleanedText.length === 0) return null
        return cleanedText.length > 40
          ? `${cleanedText.substring(0, 40)}...`
          : cleanedText
      }

      return mindMap.nodes.map((node) => {
        if (node.type === 'imageNode') {
          return (
            <div
              key={node.id}
              className={`absolute p-2 rounded-lg shadow-lg transition-all duration-200 flex flex-col items-center
                ${selectedNode?.id === node.id ? 'bg-blue-50 dark:bg-blue-900 border-2 border-blue-500' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}
                ${isReadOnly ? 'cursor-default' : 'cursor-move'}`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                zIndex: selectedNode?.id === node.id ? 10 : 1,
                width: '200px',
              }}
              onClick={(e) => handleNodeClick(node, e)}
              onDoubleClick={() => handleNodeDoubleClick(node.id, node.name)}
              onMouseDown={(e) => startDrag(node.id, e)}
              onMouseUp={(e) => endConnectionDrag(e, node.id)}
              onContextMenu={(e) => handleContextMenu(e, node.id)}
            >
              <img
                src={node.properties.imageData}
                alt={node.name}
                className="max-w-full max-h-[150px] object-contain rounded-md"
              />
              <span className="font-medium text-sm mt-2 text-gray-800 dark:text-gray-200">
                {node.name}
              </span>
              {!isReadOnly && (
                <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                  <div
                    className="w-6 h-6 bg-blue-500 dark:bg-blue-600 rounded-full cursor-pointer flex items-center justify-center"
                    onMouseDown={(e) => startConnectionDrag(node.id, e)}
                  >
                    <span className="text-white text-xs">..</span>
                  </div>
                </div>
              )}
            </div>
          )
        }

        const notePreview = getNotePreview(node.id)

        return (
          <div
            key={node.id}
            className={`absolute p-4 rounded-lg shadow-lg transition-all duration-200 
              ${node.type === 'decision' ? 'rounded-none transform rotate-45 aspect-square flex items-center justify-center' : ''} 
              ${selectedNode?.id === node.id ? 'bg-blue-50 dark:bg-blue-900 border-2 border-blue-500' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500'} 
              ${isReadOnly ? 'cursor-default' : 'cursor-move'}`}
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
              zIndex: selectedNode?.id === node.id ? 10 : 1,
              minWidth: node.type === 'decision' ? '120px' : '180px',
              minHeight: node.type === 'decision' ? '120px' : 'auto',
            }}
            onClick={(e) => handleNodeClick(node, e)}
            onDoubleClick={() => handleNodeDoubleClick(node.id, node.name)}
            onMouseDown={(e) => {
              if (e.button === 0) {
                if (e.shiftKey) {
                  startConnectionDrag(node.id, e)
                } else {
                  startDrag(node.id, e)
                }
              }
            }}
            onMouseUp={(e) => {
              if (isDrawingConnection) {
                endConnectionDrag(e, node.id)
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, node.id)}
          >
            <div
              className={`flex items-center gap-2 ${node.type === 'decision' ? 'transform -rotate-45' : ''}`}
            >
              <span className="text-xl">
                {nodeTypes[node.type as keyof typeof nodeTypes]?.icon || '📄'}
              </span>

              {editingNodeId === node.id ? (
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={handleNameChange}
                  onKeyDown={handleEditKeyDown}
                  className="font-medium bg-transparent border border-blue-500 rounded px-1 py-0 w-full focus:outline-none text-gray-800 dark:text-gray-200"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {node.name}
                </span>
              )}
            </div>
            {notePreview && (
              <div
                className={`text-xs text-gray-500 dark:text-gray-400 mt-2 p-1 rounded italic ${node.type === 'decision' ? 'transform -rotate-45' : ''}`}
              >
                {notePreview}
              </div>
            )}
            {!isReadOnly && (
              <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                <div
                  className="w-6 h-6 bg-blue-500 dark:bg-blue-600 rounded-full cursor-pointer flex items-center justify-center"
                  onMouseDown={(e) => startConnectionDrag(node.id, e)}
                >
                  <span className="text-white text-xs">..</span>
                </div>
              </div>
            )}
          </div>
        )
      })
    }, [
      mindMap.nodes,
      selectedNode,
      isReadOnly,
      allNotes,
      editingNodeId,
      editingText,
      handleNodeClick,
      handleNodeDoubleClick,
      startConnectionDrag,
      startDrag,
      endConnectionDrag,
      handleContextMenu,
      isDrawingConnection,
      handleNameChange,
    ])

    const renderConnections = useMemo(() => {
      const nodesById = new Map(mindMap.nodes.map((node) => [node.id, node]))
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {mindMap.connections.map((conn) => {
            const fromNode = nodesById.get(conn.from)
            const toNode = nodesById.get(conn.to)

            if (!fromNode || !toNode) return null

            const startX = fromNode.x + 100
            const startY = fromNode.y + 30
            
            const endXOriginal = toNode.x + 100
            const endYOriginal = toNode.y + 30
            
            const dx = endXOriginal - startX;
            const dy = endYOriginal - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if(distance === 0) return null; // Avoid division by zero
            
            const padding = 20;

            const endX = endXOriginal - (dx / distance) * padding;
            const endY = endYOriginal - (dy / distance) * padding;

            const midX = startX + (endX - startX) * 0.5
            const midY = startY + (endY - startY) * 0.5

            return (
              <g key={conn.id}>
                <path
                  d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                  stroke={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                  strokeWidth="2"
                  fill="none"
                  markerEnd={`url(#arrowhead-${theme})`}
                />
                {!isReadOnly && (
                  <g
                    className="cursor-pointer"
                    onClick={() => removeConnection(conn.id)}
                    style={{ pointerEvents: 'all' }}
                  >
                    <circle cx={midX} cy={midY} r="16" fill="transparent" />
                    <foreignObject x={midX - 10} y={midY - 10} width="20" height="20">
                         <XCircle
                           size={20}
                           className="text-red-500 bg-white dark:bg-gray-800 rounded-full hover:text-red-700"
                         />
                    </foreignObject>
                  </g>
                )}
              </g>
            )
          })}
          {isDrawingConnection && connectionStart && connectionEnd && (
            <path
              d={`M ${connectionStart.x} ${connectionStart.y} C ${(connectionStart.x + connectionEnd.x) / 2} ${connectionStart.y}, ${(connectionStart.x + connectionEnd.x) / 2} ${connectionEnd.y}, ${connectionEnd.x} ${connectionEnd.y}`}
              stroke="#3B82F6"
              strokeWidth="2"
              strokeDasharray="4"
              fill="none"
              markerEnd={`url(#arrowhead-${theme})`}
            />
          )}
          <defs>
            <marker
              id="arrowhead-light"
              markerWidth="12"
              markerHeight="9"
              refX="10"
              refY="4.5"
              orient="auto"
            >
              <polygon points="0 0, 12 4.5, 0 9" fill="#3B82F6" />
            </marker>
            <marker
              id="arrowhead-dark"
              markerWidth="12"
              markerHeight="9"
              refX="10"
              refY="4.5"
              orient="auto"
            >
              <polygon points="0 0, 12 4.5, 0 9" fill="#60A5FA" />
            </marker>
          </defs>
        </svg>
      )
    }, [
      mindMap.connections,
      mindMap.nodes,
      isReadOnly,
      removeConnection,
      theme,
      isDrawingConnection,
      connectionStart,
      connectionEnd,
    ])

    return (
      <div className="flex flex-col h-full">
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Mind Map Editor
            </h1>
            <div className="flex space-x-3">
              <button
                onClick={toggleReadOnly}
                className="px-4 py-2 flex items-center gap-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg shadow-sm hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                {isReadOnly ? <UnlockIcon size={16} /> : <LockIcon size={16} />}
                {isReadOnly ? 'Edit Mode' : 'Read Only'}
              </button>
              <button
                onClick={toggleFullscreen}
                className="px-4 py-2 flex items-center gap-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg shadow-sm hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                {isFullscreen ? (<MinimizeIcon size={16} />) : (<MaximizeIcon size={16} />)}
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg shadow-sm hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                Import JSON
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg shadow-sm hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                Export JSON
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Save Map
              </button>
            </div>
          </div>
          {selectedNode && !isReadOnly && (
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => handleAddNode('subtopic', 'New Subtopic')}
                className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg shadow-sm hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                Add Subtopic
              </button>
            </div>
          )}
        </div>

        <div
          ref={canvasRef}
          className="flex-1 relative bg-gray-50 dark:bg-gray-900 overflow-hidden"
          onMouseMove={onDrag}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onContextMenu={(e) => handleContextMenu(e)}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleCanvasClick}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
              transformOrigin: '0 0',
            }}
          >
            {renderNodes}
            {renderConnections}
          </div>

          {contextMenu.show && contextMenu.type === 'canvas' && (
            <CustomContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              options={[
                { label: 'Reset View', icon: '🔄', onClick: handleResetView },
                {
                  label: 'Add Topic',
                  icon: '📝',
                  onClick: () => {
                    if (isReadOnly) return
                    const rect = canvasRef.current?.getBoundingClientRect()
                    if (rect) {
                      const x = (contextMenu.x - rect.left - viewTransform.x) / viewTransform.scale
                      const y = (contextMenu.y - rect.top - viewTransform.y) / viewTransform.scale
                      handleAddNode('topic', 'Main Topic', x, y)
                    }
                  },
                  disabled: isReadOnly,
                },
              ]}
              onClose={closeContextMenu}
            />
          )}
          {contextMenu.show &&
            contextMenu.type === 'node' &&
            contextMenu.nodeId && (
              <CustomContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                options={[
                  {
                    label: 'Delete',
                    icon: '🗑️',
                    onClick: () => handleDeleteNode(contextMenu.nodeId!),
                    disabled: isReadOnly,
                  },
                  {
                    label: 'Copy',
                    icon: '📋',
                    onClick: () => handleCopyNode(contextMenu.nodeId!),
                  },
                  {
                    label: 'Paste',
                    icon: '📌',
                    onClick: handlePasteNode,
                    disabled: !copiedNode || isReadOnly,
                  },
                ]}
                onClose={closeContextMenu}
              />
            )}
        </div>

        <div className="p-3 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Tip:</strong> Double-click node titles to edit them. Drag
            from the '+' icon to create connections.
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleFileChange}
        />
      </div>
    )
  },
)

export default WorkflowEditor