'use client'

import { useState } from 'react'
import Link from 'next/link'
import { reports } from '@/lib/demo-data'

type Patient = { id: string; name: string; date: string; phone: string; doctor: string; age: number; gender: string; dateOfBirth?: string; address?: string; notes?: string }
type Tab = 'Overview' | 'Reports' | 'Test History' | 'Billing History'
const tabs: Tab[] = ['Overview', 'Reports', 'Test History', 'Billing History']

export function PatientHistoryTabs({ patient }: { patient: Patient }) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const patientReports = reports.filter((report) => report.patientId === patient.id)
  return <section className="panel patient-history"><div className="panel-head"><div><h2>Patient record</h2><p>Overview, reports, test history and billing</p></div><Link className="button button-secondary" href={`/reports/new?patient=${patient.id}`}>Create report</Link></div><div className="patient-tabs" role="tablist" aria-label="Patient record sections">{tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} aria-controls="patient-tab-content" className={activeTab === tab ? 'patient-tab-active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div><div id="patient-tab-content" className="patient-tab-content" role="tabpanel" aria-label={activeTab}>
    {activeTab === 'Overview' && <div className="profile-details"><div><small>Date of birth</small><strong>{patient.dateOfBirth || 'Not provided'}</strong></div><div><small>Address</small><strong>{patient.address || 'Not provided'}</strong></div><div className="patient-notes"><small>Internal notes</small><strong>{patient.notes || 'No notes recorded.'}</strong></div></div>}
    {activeTab === 'Reports' && (patientReports.length ? patientReports.map((report) => <div className="patient-history-row" key={report.id}><span><strong>{report.id}</strong><small>{report.date} · {report.testNames.join(', ')}</small></span><span className={`status-pill ${report.status === 'Issued' ? 'status-issued' : 'status-draft'}`}><i/>{report.status}</span><Link className="text-link" href={`/reports/${report.id}`}>Open report</Link></div>) : <p className="panel-subtitle patient-history-empty">No reports have been created for this patient.</p>)}
    {activeTab === 'Test History' && (patientReports.length ? patientReports.map((report) => <div className="patient-history-row" key={report.id}><span><strong>{report.testNames.join(', ')}</strong><small>{report.date} · {report.id}</small></span><span className={`status-pill ${report.status === 'Issued' ? 'status-issued' : 'status-draft'}`}><i/>{report.status}</span><Link className="text-link" href={`/reports/${report.id}`}>View results</Link></div>) : <p className="panel-subtitle patient-history-empty">No test history is available for this patient.</p>)}
    {activeTab === 'Billing History' && (patientReports.length ? patientReports.map((report) => <div className="patient-history-row" key={report.id}><span><strong>{report.id}</strong><small>{report.date} · ₹{report.amount.toLocaleString('en-IN')}</small></span><span className={`status-pill ${report.payment === 'Paid' ? 'status-issued' : 'status-draft'}`}><i/>{report.payment}</span><Link className="text-link" href={`/billing/${report.id}`}>View invoice</Link></div>) : <p className="panel-subtitle patient-history-empty">No billing history is available for this patient.</p>)}
  </div></section>
}
