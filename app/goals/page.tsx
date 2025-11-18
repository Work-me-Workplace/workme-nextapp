import Link from 'next/link'

export default function GoalsPage(){
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium">Goals</h2>
        <Link href="/goals/new" className="text-blue-600">New Goal</Link>
      </div>

      <p className="text-sm text-gray-500">Goals list placeholder — implement CRUD with Prisma.</p>
    </div>
  )
}
