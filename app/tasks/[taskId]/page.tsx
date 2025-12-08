export default async function TaskDetail({ params }: { params: Promise<Record<string, string>> }) {
  const resolved = await params
  const taskId = resolved.taskId
  return (
    <div>
      <h2 className="text-xl font-medium mb-4">Task {taskId}</h2>
      <p className="text-sm text-gray-500">Task detail placeholder.</p>
    </div>
  )
}
