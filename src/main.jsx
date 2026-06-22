import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import EditorPage from './pages/EditorPage.jsx'
import Editor2Page from './pages/Editor2Page.jsx'

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/editor" element={<EditorPage />} />
      <Route path="/editor2" element={<Editor2Page />} />
    </Routes>
  </HashRouter>
)
