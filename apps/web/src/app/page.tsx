"use client"

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-4 py-3 lg:px-8">
        <h1 className="text-lg font-semibold text-white">Dashboard</h1>
      </header>
      <main className="p-4 lg:p-8">
        <p className="text-slate-400">Dashboard content</p>
      </main>
    </div>
  )
}

export default Dashboard
