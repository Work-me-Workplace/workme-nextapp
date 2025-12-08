export default function GoalDetail({ params }: { params: Record<string, string> }) {
  const resolved = params
  const goalId = resolved.goalId
  return (
    <div>
      <h2 className="text-xl font-medium mb-4">Goal {goalId}</h2>
      <p className="text-sm text-gray-500">Goal detail placeholder.</p>
    </div>
  )
}
