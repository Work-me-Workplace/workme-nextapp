'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'

interface EventData {
  events: any[]
  eventRouters: any[]
  stats: {
    eventCount: number
    upcomingCount: number
    pastCount: number
  }
}

/**
 * useEventHydration Hook
 * 
 * Comprehensive hydration hook for event data.
 * Fetches and stores all event-related data in localStorage.
 * 
 * @param {string} companyId - Company ID to hydrate events for
 * @returns {Object} { data, loading, hydrated, error, refresh, getEventByRouterId }
 */
export function useEventHydration(companyId: string | null) {
  const [data, setData] = useState<EventData>({
    events: [],
    eventRouters: [],
    stats: {
      eventCount: 0,
      upcomingCount: 0,
      pastCount: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [hydrated, setHydrated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load from localStorage on mount - instant render
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!companyId) {
      setLoading(false)
      return
    }

    try {
      const stored = localStorage.getItem(`eventHydration_${companyId}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.data) {
          setData(parsed.data)
          setHydrated(true)
        }
      }
    } catch (err) {
      console.warn('Failed to load event hydration from localStorage:', err)
    }

    setLoading(false)

    // Listen for refresh events
    const handleRefresh = () => {
      if (companyId) {
        refresh()
      }
    }
    window.addEventListener('refreshEvents', handleRefresh)
    return () => window.removeEventListener('refreshEvents', handleRefresh)
  }, [companyId, refresh])

  // Refresh from API
  const refresh = useCallback(async () => {
    if (!companyId) {
      setError('companyId is required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await api.get(`/api/events/hydrate?companyId=${companyId}`)

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to hydrate event data')
      }

      const hydratedData: EventData = {
        events: response.data.events || [],
        eventRouters: response.data.eventRouters || [],
        stats: response.data.stats || {
          eventCount: 0,
          upcomingCount: 0,
          pastCount: 0,
        },
      }

      // Update state
      setData(hydratedData)
      setHydrated(true)

      // Update localStorage
      const storageData = {
        data: hydratedData,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem(
        `eventHydration_${companyId}`,
        JSON.stringify(storageData),
      )

      // Also update individual keys for easy access
      localStorage.setItem('events', JSON.stringify(hydratedData.events))
      localStorage.setItem('eventRouters', JSON.stringify(hydratedData.eventRouters))

      // Store individual events by router ID for quick lookup
      hydratedData.eventRouters.forEach((router) => {
        const event = hydratedData.events.find((e) => e.id === router.eventRefId)
        if (event) {
          localStorage.setItem(`event_${router.id}`, JSON.stringify({ router, event }))
        }
      })

      setLoading(false)
    } catch (err: any) {
      console.error('Error hydrating event data:', err)
      setError(err.message || 'Failed to hydrate event data')
      setLoading(false)
    }
  }, [companyId])

  // Helper to get a specific event by router ID (checks localStorage first)
  const getEventByRouterId = useCallback((routerId: string) => {
    if (typeof window === 'undefined') return null

    // Try localStorage first
    try {
      const stored = localStorage.getItem(`event_${routerId}`)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (err) {
      console.warn('Failed to get event from localStorage:', err)
    }

    // Fallback to in-memory data
    const router = data.eventRouters.find((r) => r.id === routerId)
    if (!router) return null

    const event = data.events.find((e) => e.id === router.eventRefId)
    if (!event) return null

    return { router, event }
  }, [data])

  return {
    data,
    loading,
    hydrated,
    error,
    refresh,
    getEventByRouterId,
    // Convenience getters
    events: data.events,
    eventRouters: data.eventRouters,
    stats: data.stats,
  }
}
