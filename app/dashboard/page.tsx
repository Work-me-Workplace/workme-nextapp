import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="py-8">
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      <p className="mb-6 text-gray-600">Overview of your tasks, goals, and achievements.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/tasks" className="p-4 border rounded">Tasks</Link>
        <Link href="/goals" className="p-4 border rounded">Goals</Link>
        <Link href="/achievements" className="p-4 border rounded">Achievements</Link>
      </div>
    </div>
  )
}
