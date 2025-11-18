import { use } from 'react'

type Props = { params: { taskId: string } }

export default function TaskDetail({ params }: Props){
  const { taskId } = params
  return (
    <div>
      <h2 className="text-xl font-medium mb-4">Task {taskId}</h2>
      <p className="text-sm text-gray-500">Task detail placeholder.</p>
    </div>
  )
}
