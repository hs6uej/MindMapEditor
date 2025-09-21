import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
interface NodeType {
  type: string;
  name: string;
  icon: string;
  description?: string;
}
interface ToolboxProps {
  onDragStart: (event: React.DragEvent<HTMLDivElement>, nodeType: NodeType) => void;
}
const Toolbox: React.FC<ToolboxProps> = ({
  onDragStart
}) => {
  const {
    theme,
    toggleTheme
  } = useTheme();
  const topicTypes: NodeType[] = [{
    type: 'topic',
    name: 'Main Topic',
    icon: '📝',
    description: 'A primary topic for your mind map'
  }];
  const subtopicTypes: NodeType[] = [{
    type: 'subtopic',
    name: 'Subtopic',
    icon: '📌',
    description: 'A secondary topic connected to a main topic'
  }, {
    type: 'question',
    name: 'Key Question',
    icon: '❓',
    description: 'A question to explore in your mind map'
  }, {
    type: 'idea',
    name: 'Idea',
    icon: '💡',
    description: 'A creative idea or concept'
  }, {
    type: 'note',
    name: 'Note',
    icon: '📄',
    description: 'Additional information or context'
  }, {
    type: 'decision',
    name: 'Decision',
    icon: '🔄',
    description: 'A decision point with multiple possible paths'
  }];
  const renderNodeTypeItem = (nodeType: NodeType) => <div key={nodeType.type} className="flex items-center p-3 mb-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm cursor-move hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all" draggable onDragStart={e => onDragStart(e, nodeType)}>
      <span className="text-xl mr-3">{nodeType.icon}</span>
      <div>
        <div className="font-medium text-gray-800 dark:text-gray-200">
          {nodeType.name}
        </div>
        {nodeType.description && <div className="text-xs text-gray-500 dark:text-gray-400">
            {nodeType.description}
          </div>}
      </div>
    </div>;
  return <div className="h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            Toolbox
          </h2>
          <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
            Topics
          </h3>
          {topicTypes.map(renderNodeTypeItem)}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
            Subtopics
          </h3>
          {subtopicTypes.map(renderNodeTypeItem)}
        </div>
      </div>
    </div>;
};
export default Toolbox;