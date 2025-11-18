type Props = { params: { goalId: string } }

export default function GoalDetail({ params }: Props){
  return (
    <div>
      <h2 className="text-xl font-medium mb-4">Goal {params.goalId}</h2>
      <p className="text-sm text-gray-500">Goal detail placeholder.</p>
    </div>
  )
}
