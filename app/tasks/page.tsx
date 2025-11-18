import Link from 'next/link'

export default function TasksPage(){
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium">Tasks</h2>
        <Link href="/tasks/new" className="text-blue-600">New Task</Link>
      </div>

      <p className="text-sm text-gray-500">Task list placeholder — implement CRUD with Prisma.</p>
    </div>
  )
}
