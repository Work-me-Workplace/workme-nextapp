export default async function GoalDetail({ params }: { params: Promise<Record<string, string>> }) {
  const resolved = await params
  const goalId = resolved.goalId
  return (
    <div>
      <h2 className="text-xl font-medium mb-4">Goal {goalId}</h2>
      <p className="text-sm text-gray-500">Goal detail placeholder.</p>
    </div>
  )
}
