'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SplashPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center">
      <div className="text-center px-4">
        <div className="mx-auto mb-8 flex justify-center">
          <svg
            className="h-32 w-32 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">
          Work.me
        </h1>
        <p className="text-2xl text-white/90 mb-2">
          Your Network, Your Career
        </p>
        <p className="text-lg text-white/70 mb-8">
          Build connections. Grow your career. Achieve your goals.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth"
            className="rounded-lg bg-white text-blue-700 px-8 py-3 font-semibold hover:bg-blue-50 transition shadow-lg"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-white/10 text-white px-8 py-3 font-semibold hover:bg-white/20 transition border-2 border-white/30"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
