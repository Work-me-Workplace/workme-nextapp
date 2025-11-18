import Link from 'next/link'

export default function SplashPage() {
  return (
    <section className="flex flex-col items-center justify-center text-center py-24">
      <h2 className="text-4xl font-extrabold mb-6">Welcome to Work.me</h2>
      <p className="mb-6 text-gray-600">Track tasks, goals, and career milestones.</p>
      <Link href="/auth" className="rounded-md bg-blue-600 text-white px-6 py-3">Enter App</Link>
    </section>
  )
}
