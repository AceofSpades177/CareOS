'use client'

// The Super Schedule — every patient's today doses in one combined view,
// each row labeled with the patient's name. Taken/Missed/Recalculate call
// the exact same backend endpoints as the per-person Today page; this
// page just aggregates across everyone the caregiver manages.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Dose = {
  id: string
  medication_id: string
  scheduled_time_min: number
  actual_time_min: number | null
  status: 'scheduled' | 'taken' | 'missed'
  medications: {
    name: string
    person_id: string
    people: { name: string } | null
  } | null
}

const API = process.env.NEXT_PUBLIC_API_URL

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const suffix = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`
}

function nowMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function SuperSchedulePage() {
  const [doses, setDoses] = useState<Dose[]>([])
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)

  async function loadAll() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('doses')
      .select(`
        id, medication_id, scheduled_time_min, actual_time_min, status,
        medications ( name, person_id, people ( name ) )
      `)
      .eq('dose_date', todayISO())

    if (!error && data) {
      const sorted = [...data].sort(
        (a: any, b: any) =>
          (a.actual_time_min ?? a.scheduled_time_min) - (b.actual_time_min ?? b.scheduled_time_min)
      )
      setDoses(sorted as unknown as Dose[])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function markTaken(doseId: string) {
    await fetch(`${API}/doses/${doseId}/taken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dose_id: doseId, actual_time_min: nowMinutes() }),
    })
    loadAll()
  }

  async function markMissed(doseId: string) {
    await fetch(`${API}/doses/${doseId}/missed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dose_id: doseId }),
    })
    loadAll()
  }

  async function recalculateAll() {
    setRecalculating(true)
    const personIds = Array.from(
      new Set(doses.map((d) => d.medications?.person_id).filter(Boolean))
    ) as string[]

    for (const personId of personIds) {
      await fetch(`${API}/schedule/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_id: personId, now_min: nowMinutes() }),
      })
    }

    await loadAll()
    setRecalculating(false)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 text-center">
        <p className="text-muted-foreground">Loading everyone's schedule…</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-primary">Super Schedule</h1>
          <p className="text-muted-foreground mt-1">Everyone's doses, today.</p>
        </div>
        <button
          onClick={recalculateAll}
          disabled={recalculating}
          className="careos-button-secondary"
        >
          {recalculating ? 'Recalculating…' : 'Recalculate All'}
        </button>
      </div>

      <Link href="/people" className="text-sm text-muted-foreground hover:text-primary mb-6 self-start">
        ← Back to Dashboard
      </Link>

      {doses.length === 0 && (
        <div className="careos-card p-10 text-center w-full">
          <p className="text-muted-foreground">
            No schedules generated yet today. Visit each person's Today page to generate theirs first.
          </p>
        </div>
      )}

      <div className="space-y-4 w-full">
        {doses.map((d) => (
          <div key={d.id} className="careos-card p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-lg font-semibold text-primary min-w-[5.5rem]">
                {formatTime(d.actual_time_min ?? d.scheduled_time_min)}
              </div>
              <div>
                <div className="font-medium">
                  {d.medications?.name}
                  <span className="text-muted-foreground font-normal">
                    {' '}— {d.medications?.people?.name}
                  </span>
                </div>
                {d.status === 'taken' && (
                  <span className="inline-block mt-1 text-xs font-medium text-green-700 bg-green-100 rounded-full px-3 py-1">
                    ✅ Taken
                  </span>
                )}
                {d.status === 'missed' && (
                  <span className="inline-block mt-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full px-3 py-1">
                    ⚠ Missed
                  </span>
                )}
              </div>
            </div>

            {d.status === 'scheduled' && (
              <div className="flex gap-2">
                <button onClick={() => markTaken(d.id)} className="careos-button">
                  Taken
                </button>
                <button onClick={() => markMissed(d.id)} className="careos-button-secondary">
                  Missed
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}