export interface Node {
  id: string
  type: string
  name: string
  properties: {
    description?: string
    imageData?: string // NEW: For image nodes
    [key: string]: any
  }
  x: number
  y: number
  children: string[]
}

export interface MindMap {
  properties: any
  nodes: Node[]
}