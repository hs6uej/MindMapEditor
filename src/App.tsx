import React, { useState, useReducer } from 'react'
import WorkflowEditor, {
  mindMapReducer,
  defaultMindMap,
  nodeTypes,
} from './components/WorkflowEditor'
import Toolbox from './components/Toolbox'
import { ThemeProvider } from './contexts/ThemeContext'
import { Node } from './types/mindMap'
import PropertiesPanel from './components/PropertiesPanel'

export function App() {
  const [mindMap, dispatch] = useReducer(mindMapReducer, defaultMindMap)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [noteUpdateKey, setNoteUpdateKey] = useState(0)

  const handleNodeSelected = (node: Node | null) => {
    setSelectedNode(node)
  }

  const handleClosePropertiesPanel = () => {
    setSelectedNode(null)
  }

  const handleNoteSaved = () => {
    setNoteUpdateKey((prev) => prev + 1)
  }

  const handleToolboxDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    nodeType: any,
  ) => {
    e.dataTransfer.setData('node-type', JSON.stringify(nodeType))
  }

  return (
    <ThemeProvider>
      <div className="flex w-full h-screen bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className="w-64 h-full shadow-md">
          <Toolbox onDragStart={handleToolboxDragStart} />
        </div>

        <div className="flex-1 h-full overflow-hidden">
          <WorkflowEditor
            mindMap={mindMap}
            dispatch={dispatch}
            selectedNode={selectedNode}
            onNodeSelected={handleNodeSelected}
            noteUpdateKey={noteUpdateKey}
          />
        </div>

        {selectedNode && (
          <PropertiesPanel
            mindMap={mindMap} // <--- ส่ง mindMap ทั้งหมดเข้าไป
            selectedNode={selectedNode}
            dispatch={dispatch}
            nodeTypes={nodeTypes}
            onNoteSaved={handleNoteSaved}
            onClose={handleClosePropertiesPanel}
          />
        )}
      </div>
    </ThemeProvider>
  )
}