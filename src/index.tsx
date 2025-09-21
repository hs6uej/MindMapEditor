import React from 'react'
import './index.css'
import { createRoot } from 'react-dom/client' // แก้ไข import
import { App } from './App'

// อัปเดตวิธีการ render ใหม่สำหรับ React 18
const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}