'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import { ArrowUpRight, ChartNoAxesCombined, CreditCard, FileText, Users } from 'lucide-react'
import { patients, reports, tests } from '@/lib/demo-data'
import { getDemoDataVersion, subscribeDemoData } from '@/lib/demo-store'

const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
const asDate = (value: string) => new Date(value)
const paidAmount = (payment: string, total: number) => payment === 'Paid' ? total : payment.startsWith('Partial · ') ? Number(payment.split('·')[1]?.trim()) || 0 : 0

export function AnalyticsPage() {
  const dataVersion = useSyncExternalStore(subscribeDemoData, getDemoDataVersion, () => 0)
  const [range, setRange] = useState('Last 30 days')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const now = new Date()
  const start = new Date(now)
  if (range === 'Today') start.setHours(0, 0, 0, 0)
  else if (range === 'Last 7 days') start.setDate(now.getDate() - 6)
  else if (range === 'Last 30 days') start.setDate(now.getDate() - 29)
  else if (range === 'This month') start.setDate(1)
  const filteredPatients = useMemo(() => patients.filter((patient) => {
    const date = asDate(patient.date)
    return range === 'Custom' ? (!customStart || date >= new Date(customStart)) && (!customEnd || date <= new Date(`${customEnd}T23:59:59`)) : date >= start && date <= now
  }), [range, customStart, customEnd, start.toDateString(), now.toDateString(), dataVersion])
  const filteredReports = useMemo(() => reports.filter((report) => {
    const date = asDate(report.date)
    return range === 'Custom' ? (!customStart || date >= new Date(customStart)) && (!customEnd || date <= new Date(`${customEnd}T23:59:59`)) : date >= start && date <= now
  }), [range, customStart, customEnd, start.toDateString(), now.toDateString(), dataVersion])
  const collected = filteredReports.reduce((total, report) => total + paidAmount(report.payment, report.amount), 0)
  const outstanding = filteredReports.reduce((total, report) => total + report.amount - paidAmount(report.payment, report.amount), 0)
  const issued = filteredReports.filter((report) => report.status === 'Issued').length
  const chartEnd = range === 'Custom' && customEnd ? new Date(`${customEnd}T23:59:59`) : now
  const chartDayCount = range === 'Today' ? 1 : 7
  const dayPoints = Array.from({ length: chartDayCount }, (_, index) => {
    const day = new Date(chartEnd)
    day.setHours(0, 0, 0, 0)
    day.setDate(chartEnd.getDate() - chartDayCount + 1 + index)
    const key = day.toDateString()
    const patientCount = filteredPatients.filter((patient) => asDate(patient.date).toDateString() === key).length
    const reportCount = filteredReports.filter((report) => asDate(report.date).toDateString() === key).length
    const revenue = filteredReports.filter((report) => asDate(report.date).toDateString() === key).reduce((sum, report) => sum + paidAmount(report.payment, report.amount), 0)
    return { day, patientCount, reportCount, revenue }
  })
  const popular = tests.map((test) => ({ ...test, count: filteredReports.reduce((count, report) => count + report.testNames.filter((name) => name === test.name).length, 0) })).sort((a, b) => b.count - a.count).slice(0, 5)
  const metrics = [
    { label: 'Patient registrations', value: String(filteredPatients.length), detail: range, icon: Users },
    { label: 'Reports generated', value: String(filteredReports.length), detail: `${issued} issued`, icon: FileText },
    { label: 'Collections', value: money(collected), detail: range, icon: CreditCard },
    { label: 'Outstanding', value: money(outstanding), detail: `${filteredReports.filter((report) => report.payment !== 'Paid').length} open bills`, icon: ChartNoAxesCombined },
  ]
  const maxActivity = Math.max(1, ...dayPoints.flatMap((point) => [point.patientCount, point.reportCount]))
  const maxRevenue = Math.max(1, ...dayPoints.map((point) => point.revenue))

  return <>
    <header className="page-head"><div><div className="eyebrow">BUSINESS OVERVIEW</div><h1>Analytics</h1><p>Real-time operational activity and financial metrics derived from laboratory records.</p></div><label className="field analytics-range"><span>Date range</span><select value={range} onChange={(event) => setRange(event.target.value)}><option>Today</option><option>Last 7 days</option><option>Last 30 days</option><option>This month</option><option>Custom</option></select></label></header>
    {range === 'Custom' && <div className="analytics-custom-range"><label className="field"><span>From</span><input aria-label="Custom range start" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)}/></label><label className="field"><span>To</span><input aria-label="Custom range end" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)}/></label></div>}
    <div className="stats-grid">{metrics.map(({ label, value, detail, icon: Icon }) => <article className="stat-card" key={label}><div className="stat-top"><span>{label}</span><Icon size={17}/></div><strong className="stat-value">{value}</strong><div className="stat-change"><ArrowUpRight size={14}/>{detail}</div></article>)}</div>
    <div className="analytics-grid"><section className="panel chart-panel"><div className="panel-head"><div><h2>Daily activity</h2><p>{range === 'Today' ? 'Today' : `Latest 7 days in ${range.toLowerCase()}`} · patients and reports</p></div><div className="analytics-legends"><span className="chart-legend"><i/> Patients</span><span className="chart-legend report-legend"><i/> Reports</span></div></div><div className="bar-chart" aria-label="Patient registrations and reports for the last seven days"><div className="chart-y"><span>{maxActivity}</span><span>{Math.ceil(maxActivity * .66)}</span><span>{Math.ceil(maxActivity * .33)}</span><span>0</span></div><div className="chart-bars">{dayPoints.map((point) => <div className="bar-group" key={point.day.toISOString()} title={`${point.day.toLocaleDateString()}: ${point.patientCount} patients, ${point.reportCount} reports`}><div className="bar-pair"><span className="bar" style={{ height: `${Math.max(4, point.patientCount / maxActivity * 100)}%` }}/><span className="bar report-bar" style={{ height: `${Math.max(4, point.reportCount / maxActivity * 100)}%` }}/></div><small>{point.day.toLocaleDateString('en-IN', { weekday: 'short' })}</small></div>)}</div></div></section><section className="panel chart-panel"><div className="panel-head"><div><h2>Collections</h2><p>Recorded INR payments · last 7 days</p></div><span className="chart-legend"><i/> Revenue</span></div><div className="analytics-revenue-bars">{dayPoints.map((point) => <div key={point.day.toISOString()} title={`${point.day.toLocaleDateString()}: ${money(point.revenue)}`}><span style={{ height: `${Math.max(4, point.revenue / maxRevenue * 100)}%` }}/><small>{point.day.toLocaleDateString('en-IN', { weekday: 'short' })}</small></div>)}</div><div className="revenue-total">{money(collected)}<small>Collected in selected period</small></div></section></div>
    <section className="panel"><div className="panel-head"><div><h2>Frequently requested tests</h2><p>Based on saved reports in the selected period</p></div></div>{filteredReports.length > 0 && popular.some(t => t.count > 0) ? <div className="popular-list">{popular.filter(t => t.count > 0).map((test, index) => <div className="popular-row" key={test.code}><span className="popular-rank">0{index + 1}</span><strong>{test.name}</strong><span>{test.category}</span><div className="popular-track"><i style={{ width: `${popular[0].count ? test.count / popular[0].count * 100 : 0}%` }}/></div><b>{test.count} orders</b></div>)}</div> : <p className="panel-subtitle" style={{ padding: '16px 20px', color: '#839491' }}>No test orders recorded in this date range. Frequently requested tests will appear here once reports are generated.</p>}</section>
    <section className="panel"><div className="panel-head"><div><h2>Payment distribution</h2><p>Outstanding amounts are not counted as collections.</p></div></div><div className="profile-details"><div><small>Paid reports</small><strong>{filteredReports.filter((report) => report.payment === 'Paid').length}</strong></div><div><small>Partially paid</small><strong>{filteredReports.filter((report) => report.payment.startsWith('Partial · ')).length}</strong></div><div><small>Unpaid</small><strong>{filteredReports.filter((report) => report.payment === 'Pending').length}</strong></div></div></section>
  </>
}
