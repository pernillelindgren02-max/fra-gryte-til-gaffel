import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ExplorePage } from './pages/ExplorePage'
import { RecipePage } from './pages/RecipePage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<ExplorePage />} />
          <Route path="/oppskrift/:id" element={<RecipePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
