import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './apps/home/HomePage'
import RechnerApp from './apps/rechner/RechnerApp'
import ReinstwasserApp from './apps/reinstwasser/ReinstwasserApp'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rechner" element={<RechnerApp />} />
          <Route path="/reinstwasser" element={<ReinstwasserApp />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
