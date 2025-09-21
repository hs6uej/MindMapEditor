import { Node, MindMap } from '../types/mindMap';
/**
 * Recursively generates markdown content from mind map nodes
 */
export const generateMarkdown = (mindMap: MindMap): string => {
  // Find root nodes (nodes that aren't children of any other node)
  const allNodeIds = new Set(mindMap.nodes.map(node => node.id));
  const childNodeIds = new Set<string>();
  mindMap.nodes.forEach(node => {
    node.children.forEach(childId => {
      childNodeIds.add(childId);
    });
  });
  // Root nodes are those that aren't children of any other node
  const rootNodes = mindMap.nodes.filter(node => !childNodeIds.has(node.id) || node.id === 'root');
  let markdown = '# Mind Map\n\n';
  // Process each root node
  rootNodes.forEach(node => {
    markdown += processNode(node, mindMap.nodes, 1);
  });
  return markdown;
};
/**
 * Process a single node and its children recursively
 */
const processNode = (node: Node, allNodes: Node[], depth: number): string => {
  // Create heading based on depth
  const heading = '#'.repeat(Math.min(depth, 6));
  let content = `${heading} ${node.name}\n\n`;
  // Add description if exists
  if (node.properties.description && node.properties.description !== 'Click to edit') {
    content += `${node.properties.description}\n\n`;
  }
  // Process children recursively
  node.children.forEach(childId => {
    const childNode = allNodes.find(n => n.id === childId);
    if (childNode) {
      content += processNode(childNode, allNodes, depth + 1);
    }
  });
  return content;
};
/**
 * Exports the mind map as a downloadable markdown file
 */
export const exportMarkdown = (mindMap: MindMap) => {
  const markdown = generateMarkdown(mindMap);
  const blob = new Blob([markdown], {
    type: 'text/markdown'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mind-map-${Date.now()}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};