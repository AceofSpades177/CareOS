import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AddPersonForm from './add-person-form'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: people, error } = await supabase
    .from('people')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return <p className="p-8 text-destructive">Error loading people: {error.message}</p>

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col items-center space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage the people you care for and their medications.
        </p>
      </div>

      <Link href="/super-schedule" className="careos-button">
        View Super Schedule — Everyone, Today →
      </Link>

      <div className="careos-card p-6 w-full">
        <h2 className="text-lg font-semibold mb-4 text-center">Your People</h2>
        {people && people.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {people.map((p) => (
              <div
                key={p.id}
                className="flex flex-col items-center gap-3 px-4 py-5 rounded-2xl bg-secondary text-center"
              >
                <Link
                  href={`/people/${p.id}`}
                  className="font-medium text-foreground hover:text-primary transition-colors"
                >
                  {p.name}
                </Link>
                <Link
                  href={`/today/${p.id}`}
                  className="careos-button-secondary text-sm"
                >
                  Today's Schedule
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center">No one added yet — add someone below.</p>
        )}
      </div>

      <AddPersonForm />
    </div>
  )
}