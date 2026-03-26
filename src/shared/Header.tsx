import { useLocation, useNavigate } from 'react-router-dom'

const APP_VERSION = '1.6.0'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  return (
    <header className="no-print sticky top-0 z-50 border-b border-white/60 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {!isHome && (
            <button
              onClick={() => navigate('/')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-brand-600 transition-all"
              title="Zurück zur Übersicht"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-md shadow-brand-200">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 leading-tight">pH-Optima</h1>
            <p className="text-[11px] text-slate-400 leading-tight">Konfiguration V1</p>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-400">v{APP_VERSION}</span>
      </div>
    </header>
  )
}
