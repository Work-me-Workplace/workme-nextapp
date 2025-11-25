'use client'

export interface Holiday {
  id: string
  name: string
  slug: string
}

export interface HolidaySelectorProps {
  holidays: Holiday[]
  selectedHolidaySlug: string | null
  onHolidayChange: (holidaySlug: string | null) => void
  showCreateButton?: boolean
  onCreateClick?: () => void
}

export default function HolidaySelector({
  holidays,
  selectedHolidaySlug,
  onHolidayChange,
  showCreateButton = false,
  onCreateClick,
}: HolidaySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        type="button"
        onClick={() => onHolidayChange(null)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          selectedHolidaySlug === null
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        All Holidays
      </button>
      {holidays.map((holiday) => (
        <button
          key={holiday.id}
          type="button"
          onClick={() => onHolidayChange(holiday.slug)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedHolidaySlug === holiday.slug
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {holiday.name}
        </button>
      ))}
      {showCreateButton && (
        <button
          type="button"
          onClick={onCreateClick}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          + Add Holiday
        </button>
      )}
    </div>
  )
}

