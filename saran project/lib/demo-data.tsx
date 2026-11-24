import { UserPlus, FileCheck2, CreditCard, Settings2 } from 'lucide-react'
import { legacyTests, type CatalogueTest, type TestParameter, legacyInterpretationNotes } from '@/lib/catalogue-data'

export type { CatalogueTest, TestParameter }
export { legacyInterpretationNotes }

export interface Patient {
  id: string
  name: string
  age: number
  gender: string
  phone: string
  doctor: string
  date: string
  reports: number
  is_archived?: boolean
  dateOfBirth?: string
  address?: string
  notes?: string
}

export interface Report {
  id: string
  patient: string
  patientId: string
  date: string
  tests: number
  testNames: string[]
  results: Record<string, string>
  resultFlags?: Record<string, string>
  resultIntervals?: Record<string, string>
  amount: number
  status: string
  payment: string
}

export interface ActivityItem {
  text: string
  detail: string
  time: string
  icon: any
}

// Operational collections initialized completely empty — all live business records derive from Supabase PostgreSQL
export const patients: Patient[] = []
export const reports: Report[] = []
export const activities: ActivityItem[] = []

// Genuine source-derived laboratory catalogue (120 tests, 211 parameters across 22 grouped panels)
export const tests: CatalogueTest[] = legacyTests
