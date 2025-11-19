'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createAchievementsBatch } from '@/lib/actions/csv-import'
import { getObjectives } from '@/lib/actions/objectives'
import { getOrganizationalActivities } from '@/lib/actions/activities'
import { getCommsOutputs } from '@/lib/actions/comms-outputs'
import { getHappenings } from '@/lib/actions/happenings'

interface CSVRow {
  [key: string]: string
}

export default function UploadAchievementsPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [fieldMapping, setFieldMapping] = useState<{ [key: string]: string }>({})
  const [objectives, setObjectives] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [commsOutputs, setCommsOutputs] = useState<any[]>([])
  const [happenings, setHappenings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [previewRows, setPreviewRows] = useState(5)

  useEffect(() => {
    loadDropdowns()
  }, [])

  async function loadDropdowns() {
    const [objResult, actResult, commsResult, hapResult] = await Promise.all([
      getObjectives(),
      getOrganizationalActivities(),
      getCommsOutputs(),
      getHappenings(),
    ])
    if (objResult.success) setObjectives(objResult.objectives || [])
    if (actResult.success) setActivities(actResult.activities || [])
    if (commsResult.success) setCommsOutputs(commsResult.commsOutputs || [])
    if (hapResult.success) setHappenings(hapResult.happenings || [])
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(selectedFile)
  }

  function parseCSV(text: string) {
    const lines = text.split('\n').filter((line) => line.trim())
    if (lines.length === 0) return

    const headerLine = lines[0]
    const csvHeaders = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
    setHeaders(csvHeaders)

    const rows: CSVRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
      const row: CSVRow = {}
      csvHeaders.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      rows.push(row)
    }
    setCsvData(rows)

    // Auto-map common field names
    const autoMapping: { [key: string]: string } = {}
    csvHeaders.forEach((header) => {
      const lower = header.toLowerCase()
      if (lower.includes('title')) autoMapping.title = header
      if (lower.includes('category')) autoMapping.category = header
      if (lower.includes('audience') && lower.includes('name')) autoMapping.audienceName = header
      if (lower.includes('audience') && lower.includes('size')) autoMapping.audienceSize = header
      if (lower.includes('objective')) autoMapping.objective = header
      if (lower.includes('what') || lower.includes('did')) autoMapping.whatYouDid = header
      if (lower.includes('frequency')) autoMapping.frequency = header
      if (lower.includes('volume')) autoMapping.volume = header
      if (lower.includes('organizational') || lower.includes('activity')) autoMapping.organizationalActivity = header
      if (lower.includes('comms') || lower.includes('output')) autoMapping.commsOutput = header
      if (lower.includes('happening') || lower.includes('event')) autoMapping.companyHappening = header
      if (lower.includes('process') || lower.includes('step')) autoMapping.processSteps = header
      if (lower.includes('impact')) autoMapping.impact = header
    })
    setFieldMapping(autoMapping)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!csvData.length) {
      alert('Please upload a CSV file first')
      return
    }

    setLoading(true)
    const result = await createAchievementsBatch(
      csvData,
      fieldMapping,
      objectives,
      activities,
      commsOutputs,
      happenings
    )
    setLoading(false)

    if (result.success) {
      alert(`Successfully created ${result.created} achievements!`)
      router.push('/achievements')
    } else {
      alert(`Created ${result.created} achievements. Errors: ${JSON.stringify(result.errors)}`)
      if (result.created > 0) {
        router.push('/achievements')
      }
    }
  }

  const fieldOptions = [
    { value: 'title', label: 'Title *' },
    { value: 'category', label: 'Category *' },
    { value: 'audienceName', label: 'Audience Name' },
    { value: 'audienceSize', label: 'Audience Size' },
    { value: 'objective', label: 'Objective' },
    { value: 'whatYouDid', label: 'What You Did *' },
    { value: 'frequency', label: 'Frequency' },
    { value: 'volume', label: 'Volume' },
    { value: 'organizationalActivity', label: 'Organizational Activity' },
    { value: 'commsOutput', label: 'Comms Output' },
    { value: 'companyHappening', label: 'Company Happening' },
    { value: 'processSteps', label: 'Process Steps' },
    { value: 'impact', label: 'Impact' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/achievements" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Achievements
        </Link>
        <h2 className="text-3xl font-bold text-gray-900">Upload Achievements (CSV)</h2>
        <p className="text-gray-600 mt-2">Import multiple achievements from a CSV file</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
            CSV File *
          </label>
          <input
            type="file"
            id="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
          <p className="mt-2 text-sm text-gray-500">
            Upload a CSV file with achievement data. The first row should contain column headers.
          </p>
        </div>

        {headers.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Mapping</h3>
              <p className="text-sm text-gray-600 mb-4">
                Map your CSV columns to achievement fields. Required fields: Title, Category, What You Did
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldOptions.map((field) => (
                  <div key={field.value}>
                    <label htmlFor={field.value} className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                    </label>
                    <select
                      id={field.value}
                      value={fieldMapping[field.value] || ''}
                      onChange={(e) =>
                        setFieldMapping({ ...fieldMapping, [field.value]: e.target.value })
                      }
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select column...</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Rows to show:</label>
                  <input
                    type="number"
                    min="1"
                    max={csvData.length}
                    value={previewRows}
                    onChange={(e) => setPreviewRows(Math.min(parseInt(e.target.value) || 1, csvData.length))}
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {headers.map((header) => (
                        <th
                          key={header}
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {csvData.slice(0, previewRows).map((row, idx) => (
                      <tr key={idx}>
                        {headers.map((header) => (
                          <td key={header} className="px-4 py-2 text-sm text-gray-500">
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.length > previewRows && (
                <p className="mt-2 text-sm text-gray-500">
                  Showing {previewRows} of {csvData.length} rows
                </p>
              )}
            </div>
          </>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !csvData.length}
            className="flex-1 rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Importing...' : `Import ${csvData.length} Achievements`}
          </button>
          <Link
            href="/achievements"
            className="flex-1 rounded-lg bg-gray-200 text-gray-700 px-6 py-3 font-semibold hover:bg-gray-300 transition text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
