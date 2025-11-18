type Props = { params: { achievementId: string } }

export default function AchievementDetail({ params }: Props){
  return (
    <div>
      <h2 className="text-xl font-medium mb-4">Achievement {params.achievementId}</h2>
      <p className="text-sm text-gray-500">Achievement detail placeholder.</p>
    </div>
  )
}
