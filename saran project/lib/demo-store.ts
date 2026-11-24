import { patients, reports, tests, activities, type TestParameter, type Patient, type Report } from '@/lib/demo-data'
import { appPreferences, labProfile } from '@/lib/app-settings'

let version = 0
const listeners = new Set<() => void>()

export type DemoNotification = {
  id: string
  text: string
  detail: string
  time: string
  href: string
  read: boolean
}

// Live notifications initialized empty — populated from real laboratory operational events
export const demoNotifications: DemoNotification[] = []
let notificationSequence = 0

export function addNotification(text: string, detail: string, href: string) {
  demoNotifications.unshift({
    id: `event-${++notificationSequence}`,
    text,
    detail,
    time: 'Just now',
    href,
    read: false,
  })
  if (demoNotifications.length > 50) {
    demoNotifications.pop()
  }
  publishChange()
}

export function markNotificationRead(id: string) {
  const notification = demoNotifications.find((entry) => entry.id === id)
  if (notification) notification.read = true
  publishChange()
}

export function markAllNotificationsRead() {
  demoNotifications.forEach((notification) => {
    notification.read = true
  })
  publishChange()
}

export function subscribeDemoData(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getDemoDataVersion() {
  return version
}

export function publishChange() {
  version += 1
  listeners.forEach((listener) => listener())
}

export const notifyDataChanged = publishChange

export function updateLabProfile(input: Partial<typeof labProfile>) {
  Object.assign(labProfile, input)
  publishChange()
}

export function updateAppPreferences(input: Record<string, string | boolean>) {
  Object.assign(appPreferences, input)
  publishChange()
}

export const reportRevisions: Record<string, Array<{ version: number; status: string; date: string }>> = {}
export const reportAmendments: Record<string, string> = {}
export const paymentLedger: Array<{ id: string; reportId: string; patientId: string; amount: number; method: string; date: string; notes: string }> = []
