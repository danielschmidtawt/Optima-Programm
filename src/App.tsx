import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './apps/home/HomePage'
import RechnerApp from './apps/rechner/RechnerApp'
import ReinstwasserApp from './apps/reinstwasser/ReinstwasserApp'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50/30 to-slate-100">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rechner" element={<RechnerApp />} />
          <Route path="/reinstwasser" element={<ReinstwasserApp />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
