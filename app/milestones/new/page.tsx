'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewMilestonePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    milestoneType: 'PROMOTION',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call to create milestone
    console.log('Creating milestone:', formData);
    router.push('/milestones');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/milestones" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Milestones
        </Link>
        <h2 className="text-3xl font-bold text-gray-900">Add Career Milestone</h2>
        <p className="text-gray-600 mt-2">Celebrate your professional achievements</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Milestone Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Promoted to Senior Engineer"
          />
        </div>

        <div>
          <label htmlFor="milestoneType" className="block text-sm font-medium text-gray-700 mb-2">
            Milestone Type *
          </label>
          <select
            id="milestoneType"
            required
            value={formData.milestoneType}
            onChange={(e) => setFormData({ ...formData, milestoneType: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="PROMOTION">Promotion</option>
            <option value="NEW_ROLE">New Role</option>
            <option value="CERTIFICATION">Certification</option>
            <option value="SKILL_ACQUIRED">Skill Acquired</option>
            <option value="PROJECT_COMPLETED">Project Completed</option>
            <option value="AWARD">Award</option>
            <option value="PUBLICATION">Publication</option>
            <option value="SPEAKING_ENGAGEMENT">Speaking Engagement</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            id="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Details about this achievement, impact, learnings..."
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold hover:bg-blue-700 transition"
          >
            Add Milestone
          </button>
          <Link
            href="/milestones"
            className="flex-1 rounded-lg bg-gray-200 text-gray-700 px-6 py-3 font-semibold hover:bg-gray-300 transition text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

