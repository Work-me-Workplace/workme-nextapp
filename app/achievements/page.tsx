import Link from 'next/link'

export default function AchievementsPage(){
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium">Achievements</h2>
        <Link href="/achievements/new" className="text-blue-600">New Achievement</Link>
      </div>

      <p className="text-sm text-gray-500">Achievements placeholder — list of milestones or self-appraisals.</p>
    </div>
  )
}
