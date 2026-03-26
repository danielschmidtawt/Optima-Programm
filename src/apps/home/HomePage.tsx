import { Link } from 'react-router-dom'

const apps = [
  {
    title: 'Enthärtungsrechner',
    desc: 'Dimensionierung von Ionenaustauscher-Enthärtungsanlagen für Wohn- und Gewerbebauten.',
    path: '/rechner',
    icon: (
      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" />
      </svg>
    ),
    active: true,
  },
  {
    title: 'Reinstwasser & Onlinebehandlung',
    desc: 'Harz-Kapazität berechnen und Nachspeisungsgerät bestimmen.',
    path: '/reinstwasser',
    icon: (
      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    active: true,
  },
  {
    title: 'Offertentool',
    desc: 'Erstellung professioneller Offerten für Enthärtungsanlagen.',
    path: '#',
    icon: (
      <svg className="h-8 w-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    active: false,
  },
  {
    title: 'Wasseranalyse',
    desc: 'Auswertung und Vergleich von Wasseranalysen.',
    path: '#',
    icon: (
      <svg className="h-8 w-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    active: false,
  },
]

export default function HomePage() {
  return (
    <>
      {/* Header */}
      <header className="border-b border-white/60 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-md shadow-brand-200">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 leading-tight">pH-Optima</h1>
              <p className="text-[11px] text-slate-400 leading-tight">Werkzeuge für Wassertechnik</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Willkommen</h2>
          <p className="mt-2 text-sm text-slate-500">Wähle ein Werkzeug um loszulegen</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {apps.map(app => (
            app.active ? (
              <Link
                key={app.title}
                to={app.path}
                className="group card-glass rounded-2xl p-6 shadow-sm border-2 border-transparent hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100/50 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-md shadow-brand-200 group-hover:shadow-lg group-hover:shadow-brand-200 transition-shadow">
                    {app.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">{app.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{app.desc}</p>
                  </div>
                </div>
              </Link>
            ) : (
              <div
                key={app.title}
                className="card-glass rounded-2xl p-6 shadow-sm opacity-50 cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-300/50 shadow-sm">
                    {app.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-400">{app.title}</h3>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-400">Demnächst</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{app.desc}</p>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      </main>
    </>
  )
}
