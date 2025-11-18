import Link from 'next/link'

export default function AuthPage() {
  return (
    <div className="max-w-xl mx-auto py-12">
      <h2 className="text-2xl font-semibold mb-4">Sign in</h2>
      <p className="mb-6 text-sm text-gray-600">Sign in via Firebase or Cognito (placeholder).</p>

      <div className="space-y-3">
        <button className="w-full rounded-md border px-4 py-2">Sign in with Firebase</button>
        <button className="w-full rounded-md border px-4 py-2">Sign in with Cognito</button>
      </div>

      <p className="mt-6 text-sm text-gray-500">After sign in you will be redirected to your Dashboard or Welcome setup.</p>

      <div className="mt-6">
        <Link href="/dashboard" className="text-blue-600">(Skip auth - open Dashboard)</Link>
      </div>
    </div>
  )
}
