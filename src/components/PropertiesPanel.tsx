import React, { useState, useEffect } from 'react'
import { Node, MindMap } from '../types/mindMap'
import NoteEditor from './NoteEditor'
import { MindMapAction } from './WorkflowEditor'
import { ArrowUpRight, ArrowDownLeft, X } from 'lucide-react'

interface PropertiesPanelProps {
  mindMap: MindMap
  selectedNode: Node
  dispatch: React.Dispatch<MindMapAction>
  nodeTypes: { [key: string]: { name: string; icon: string } }
  onNoteSaved: () => void
  onClose: () => void
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  mindMap,
  selectedNode,
  dispatch,
  nodeTypes,
  onNoteSaved,
  onClose,
}) => {
  const [nodeName, setNodeName] = useState(selectedNode.name)

  useEffect(() => {
    setNodeName(selectedNode.name)
  }, [selectedNode.name, selectedNode.id])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNodeName(e.target.value)
  }

  const handleNameBlur = () => {
    if (selectedNode.name !== nodeName.trim() && nodeName.trim() !== '') {
      dispatch({
        type: 'UPDATE_NODE',
        payload: { nodeId: selectedNode.id, updates: { name: nodeName.trim() } },
      })
    } else {
      setNodeName(selectedNode.name)
    }
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameBlur()
      e.currentTarget.blur()
    }
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: 'UPDATE_NODE',
      payload: { nodeId: selectedNode.id, updates: { type: e.target.value } },
    })
  }

  const removeConnection = (connectionId: string) => {
    dispatch({ type: 'REMOVE_CONNECTION', payload: { connectionId } })
  }

  const outgoingConnections = mindMap.connections.filter(c => c.from === selectedNode.id);
  const incomingConnections = mindMap.connections.filter(c => c.to === selectedNode.id);
  const nodesById = new Map(mindMap.nodes.map(node => [node.id, node]));

  return (
    <div className="w-96 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* --- ส่วนบนทั้งหมด (Properties & Connections) --- */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          Properties
        </h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Name
          </label>
          <input
            type="text"
            value={nodeName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-200"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Type
          </label>
          <select
            value={selectedNode.type}
            onChange={handleTypeChange}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-200"
          >
            {Object.entries(nodeTypes).map(([typeKey, typeValue]) => (
              <option key={typeKey} value={typeKey}>
                {typeValue.icon} {typeValue.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center mb-2">
              <ArrowUpRight size={16} className="mr-2 text-green-500" /> Outgoing ({outgoingConnections.length})
            </h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400 max-h-24 overflow-y-auto">
              {outgoingConnections.length > 0 ? outgoingConnections.map(c => (
                <li key={c.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <span>To: {nodesById.get(c.to)?.name || '...'}</span>
                  <button onClick={() => removeConnection(c.id)} className="text-red-500 hover:text-red-700"><X size={14} /></button>
                </li>
              )) : <li className="text-xs italic text-gray-400 dark:text-gray-500 px-2">No outgoing connections.</li>}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center mb-2">
              <ArrowDownLeft size={16} className="mr-2 text-blue-500" /> Incoming ({incomingConnections.length})
            </h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400 max-h-24 overflow-y-auto">
              {incomingConnections.length > 0 ? incomingConnections.map(c => (
                 <li key={c.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded">
                   <span>From: {nodesById.get(c.from)?.name || '...'}</span>
                   <button onClick={() => removeConnection(c.id)} className="text-red-500 hover:text-red-700"><X size={14} /></button>
                 </li>
              )) : <li className="text-xs italic text-gray-400 dark:text-gray-500 px-2">No incoming connections.</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* --- ส่วนล่าง (Notes) ที่จะยืดหดตามพื้นที่ที่เหลือ --- */}
      <div className="flex-1 min-h-0">
        <NoteEditor
          selectedNodeId={selectedNode.id}
          onClose={onClose}
          onNoteSaved={onNoteSaved}
        />
      </div>
    </div>
  )
}

export default PropertiesPanel