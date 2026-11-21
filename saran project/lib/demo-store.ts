import { patients, reports, tests, activities, type TestParameter } from '@/lib/demo-data'
import { appPreferences, labProfile } from '@/lib/app-settings'

let version = 0
const listeners = new Set<() => void>()
export type DemoNotification = { id: string; text: string; detail: string; time: string; href: string; read: boolean }
export const demoNotifications: DemoNotification[] = activities.map((activity, index) => ({ id: `seed-${index}`, text: activity.text, detail: activity.detail, time: activity.time, href: ['/patients/BHT-02486', '/reports/RPT-261121-032', '/billing/RPT-261121-031', '/tests/LEG-066'][index] ?? '/dashboard', read: false }))
let notificationSequence = 0
function addNotification(text: string, detail: string, href: string) {
  demoNotifications.unshift({ id: `event-${++notificationSequence}`, text, detail, time: 'Just now', href, read: false })
}
export function markNotificationRead(id: string) {
  const notification = demoNotifications.find((entry) => entry.id === id)
  if (notification) notification.read = true
  publishChange()
}
export function markAllNotificationsRead() {
  demoNotifications.forEach((notification) => { notification.read = true })
  publishChange()
}

export function subscribeDemoData(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getDemoDataVersion() {
  return version
}

function publishChange() {
  version += 1
  listeners.forEach((listener) => listener())
}

function assertValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 15) throw new Error('Enter a phone number with 7 to 15 digits.')
}

function nextId(prefix: string, records: Array<{ id: string }>) {
  const sequence = Math.max(0, ...records.map(({ id }) => Number(id.split('-').at(-1)) || 0)) + 1
  return `${prefix}-${String(sequence).padStart(5, '0')}`
}

export function createPatient(input: {
  name: string
  phone: string
  age?: number
  gender?: string
  doctor?: string
  address?: string
  dateOfBirth?: string
  notes?: string
}) {
  assertValidPhone(input.phone)
  const duplicate = patients.find((patient) => patient.phone.replace(/\D/g, '') === input.phone.replace(/\D/g, ''))
  if (duplicate) throw new Error(`A patient with this phone number already exists (${duplicate.id}).`)
  const record = {
    id: nextId('BHT', patients),
    name: input.name.trim(),
    age: input.age || 0,
    gender: input.gender || 'Not specified',
    phone: input.phone.trim(),
    doctor: input.doctor?.trim() || 'Not specified',
    dateOfBirth: input.dateOfBirth || '',
    address: input.address?.trim() || '',
    notes: input.notes?.trim() || '',
    date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    reports: 0,
  }
  patients.unshift(record)
  addNotification('New patient registered', `${record.name} · ${record.id}`, `/patients/${record.id}`)
  publishChange()
  return record
}

export function updateLabProfile(input: Partial<typeof labProfile>) {
  Object.assign(labProfile, input)
  publishChange()
}

export function updateAppPreferences(input: Record<string, string | boolean>) {
  Object.assign(appPreferences, input)
  publishChange()
}

export function updatePatient(id: string, input: Partial<{ name: string; phone: string; age: number; gender: string; doctor: string; dateOfBirth: string; address: string; notes: string }>) {
  const patient = patients.find((entry) => entry.id === id)
  if (!patient) throw new Error('Patient record was not found.')
  if (input.phone) assertValidPhone(input.phone)
  if (input.phone && patients.some((entry) => entry.id !== id && entry.phone.replace(/\D/g, '') === input.phone?.replace(/\D/g, ''))) throw new Error('Another patient already uses this phone number.')
  Object.assign(patient, input)
  addNotification('Patient details updated', `${patient.name} · ${patient.id}`, `/patients/${patient.id}`)
  publishChange()
  return patient
}

export function createReport(input: { patientId: string; testNames: string[]; amount: number; results: Record<string, string> }) {
  const patient = patients.find((entry) => entry.id === input.patientId)
  if (!patient) throw new Error('Select a valid patient before saving this report.')
  if (input.testNames.length === 0) throw new Error('Select at least one test before saving this report.')
  const dateStamp = new Date().toISOString().slice(2, 10).replaceAll('-', '')
  const sequence = Math.max(0, ...reports.filter((entry) => entry.id.startsWith(`RPT-${dateStamp}-`)).map((entry) => Number(entry.id.split('-').at(-1)) || 0)) + 1
  const report = {
    id: `RPT-${dateStamp}-${String(sequence).padStart(3, '0')}`,
    patient: patient.name,
    patientId: patient.id,
    date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    tests: input.testNames.length,
    testNames: [...input.testNames],
    results: { ...input.results },
    amount: input.amount,
    status: 'Draft',
    payment: 'Pending',
  }
  reports.unshift(report)
  reportRevisions[report.id] = [{ version: 1, status: 'Draft', date: report.date }]
  patient.reports += 1
  addNotification('Report saved as draft', `${report.id} · ${patient.name}`, `/reports/${report.id}`)
  publishChange()
  return report
}

export function createReportAmendment(id: string) {
  const source = reports.find((entry) => entry.id === id)
  if (!source || source.status !== 'Issued') throw new Error('Only issued reports can be amended.')
  const patient = patients.find((entry) => entry.id === source.patientId)
  if (!patient) throw new Error('The original report patient was not found.')
  const amendment = createReport({ patientId: source.patientId, testNames: source.testNames, amount: source.amount, results: { ...source.results } })
  reportAmendments[amendment.id] = source.id
  addNotification('Amendment draft created', `${amendment.id} · amends ${source.id}`, `/reports/${amendment.id}`)
  publishChange()
  return amendment
}

export function updateDraftReport(id: string, input: { patientId: string; testNames: string[]; amount: number; results: Record<string, string> }) {
  const report = reports.find((entry) => entry.id === id)
  if (!report) throw new Error('Report was not found.')
  if (report.status !== 'Draft') throw new Error('Only draft reports can be edited. Issued reports require an amendment workflow.')
  const patient = patients.find((entry) => entry.id === input.patientId)
  if (!patient) throw new Error('Select a valid patient before saving this draft.')
  if (input.testNames.length === 0) throw new Error('Select at least one test before saving this draft.')
  const previousPatient = patients.find((entry) => entry.id === report.patientId)
  if (previousPatient?.id !== patient.id) {
    if (previousPatient) previousPatient.reports = Math.max(0, previousPatient.reports - 1)
    patient.reports += 1
  }
  Object.assign(report, { patient: patient.name, patientId: patient.id, tests: input.testNames.length, testNames: [...input.testNames], results: { ...input.results }, amount: input.amount })
  const revisions = reportRevisions[report.id] ??= []
  revisions.push({ version: revisions.length + 1, status: 'Draft', date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()) })
  addNotification('Draft report updated', `${report.id} · ${patient.name}`, `/reports/${report.id}`)
  publishChange()
  return report
}

export function issueReport(id: string) {
  const report = reports.find((entry) => entry.id === id)
  if (!report) throw new Error('Report was not found.')
  if (report.status === 'Issued') throw new Error('Issued reports cannot be overwritten. Use an amendment workflow.')
  const incomplete = report.testNames.some((name) => {
    const test = tests.find((entry) => entry.name === name)
    return !test || test.parameterNames.some((parameter) => !report.results[`${name}:${parameter}`]?.trim())
  })
  if (incomplete) throw new Error('Complete every configured test result before issuing this report.')
  report.status = 'Issued'
  const revisions = reportRevisions[report.id] ??= []
  revisions.push({ version: revisions.length + 1, status: 'Issued', date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()) })
  addNotification('Report issued in demo', report.id, `/reports/${report.id}`)
  publishChange()
  return report
}

export function updateTest(code: string, input: { code: string; name: string; category: string; price: number; offer: number; parameters: TestParameter[]; active?: boolean }) {
  const existing = tests.find((entry) => entry.code === code)
  if (!existing) throw new Error('Test was not found.')
  if (!input.name.trim() || !input.code.trim() || !input.category) throw new Error('Test name, code and category are required.')
  if (!Number.isFinite(input.price) || input.price <= 0 || !Number.isFinite(input.offer) || input.offer < 0 || input.offer > input.price) throw new Error('Enter a valid offer price no greater than the normal price.')
  if (tests.some((entry) => entry.code !== code && entry.code.toLowerCase() === input.code.toLowerCase())) throw new Error('A test with this code already exists.')
  if (input.parameters.some((parameter) => !parameter.name.trim() || (parameter.precision !== undefined && (!Number.isInteger(parameter.precision) || parameter.precision < 0 || parameter.precision > 6)))) throw new Error('Complete each parameter name and use a precision between 0 and 6, or remove the empty row.')
  Object.assign(existing, { code: input.code.trim(), name: input.name.trim(), category: input.category, price: input.price, offer: input.offer, parameters: input.parameters.length, parameterNames: input.parameters.map((parameter) => parameter.name.trim()), units: input.parameters.map((parameter) => parameter.unit.trim()), parameterDetails: input.parameters.map((parameter) => ({ ...parameter, name: parameter.name.trim(), unit: parameter.unit.trim() })), active: input.active ?? existing.active ?? true })
  addNotification('Test catalogue updated', `${existing.name} · ${existing.code}`, `/tests/${existing.code}`)
  publishChange()
  return existing
}

export function addTest(input: { code: string; name: string; category: string; price: number; offer: number; parameters: TestParameter[]; active?: boolean }) {
  if (!input.name.trim() || !input.code.trim() || !input.category) throw new Error('Test name, code and category are required.')
  if (!Number.isFinite(input.price) || input.price <= 0 || !Number.isFinite(input.offer) || input.offer < 0 || input.offer > input.price) throw new Error('Enter a valid offer price no greater than the normal price.')
  if (tests.some((entry) => entry.code.toLowerCase() === input.code.toLowerCase())) throw new Error('A test with this code already exists.')
  if (input.parameters.some((parameter) => !parameter.name.trim() || (parameter.precision !== undefined && (!Number.isInteger(parameter.precision) || parameter.precision < 0 || parameter.precision > 6)))) throw new Error('Complete each parameter name and use a precision between 0 and 6, or remove the empty row.')
  const test = { code: input.code.trim(), name: input.name.trim(), category: input.category, price: input.price, offer: input.offer, parameters: input.parameters.length, parameterNames: input.parameters.map((parameter) => parameter.name.trim()), units: input.parameters.map((parameter) => parameter.unit.trim()), parameterDetails: input.parameters.map((parameter) => ({ ...parameter, name: parameter.name.trim(), unit: parameter.unit.trim() })), active: input.active ?? true }
  tests.unshift(test)
  addNotification('Test added to catalogue', `${test.name} · ${test.code}`, `/tests/${test.code}`)
  publishChange()
  return test
}

export const reportRevisions: Record<string, Array<{ version: number; status: string; date: string }>> = {}
export const reportAmendments: Record<string, string> = {}
export const paymentLedger: Array<{ id: string; reportId: string; patientId: string; amount: number; method: string; date: string; notes: string }> = []

export function recordPayment(reportId: string, amount: number, details: { method: string; date: string; notes: string }) {
  const report = reports.find((entry) => entry.id === reportId)
  if (!report) throw new Error('Bill was not found.')
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a positive payment amount.')
  if (!details.method || !details.date) throw new Error('Select a payment method and date.')
  const paidSoFar = report.payment.startsWith('Partial · ')
    ? Number(report.payment.split('·')[1]?.trim()) || 0
    : report.payment === 'Paid' ? report.amount : 0
  const outstanding = Math.max(0, report.amount - paidSoFar)
  if (amount > outstanding) throw new Error('Payment cannot exceed the outstanding balance.')
  const totalPaid = paidSoFar + amount
  report.payment = totalPaid === report.amount ? 'Paid' : `Partial · ${totalPaid}`
  paymentLedger.unshift({ id: nextId('TXN', paymentLedger), reportId: report.id, patientId: report.patientId, amount, method: details.method, date: details.date, notes: details.notes.trim() })
  addNotification('Payment recorded', `${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)} · ${report.id}`, `/billing/${report.id}`)
  publishChange()
  return report
}
