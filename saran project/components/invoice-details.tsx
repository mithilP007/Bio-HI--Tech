'use client'

import Link from 'next/link'
import { Printer } from 'lucide-react'
import { reports } from '@/lib/demo-data'
import { paymentLedger } from '@/lib/demo-store'

type Props = { path: string }
const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

export function InvoiceDetails({ path }: Props) {
  const id = path.split('/').pop() ?? ''
  const report = reports.find((entry) => entry.id === id)
  if (!report) return <section className="panel empty-state"><h1>Invoice not found</h1><p>This bill is not in the current demo session.</p><Link className="button button-secondary" href="/billing">Back to billing</Link></section>
  const transactions = paymentLedger.filter((payment) => payment.reportId === report.id)
  const paid = transactions.length ? transactions.reduce((total, payment) => total + payment.amount, 0) : report.payment === 'Paid' ? report.amount : 0
  const outstanding = Math.max(0, report.amount - paid)

  return <>
    <header className="page-head"><div><div className="eyebrow">FINANCE · INVOICE</div><h1>Invoice {report.id}</h1><p>{report.patient} · {report.date} · {report.patientId}</p></div><div className="page-actions"><button className="button button-secondary" onClick={() => window.print()}><Printer size={16}/> Print / save PDF</button>{outstanding > 0 && <Link className="button button-primary" href={`/billing/new?report=${report.id}`}>Record payment</Link>}</div></header>
    <div className="details-grid"><section className="panel form-panel"><div className="panel-head"><div><h2>Invoice summary</h2><p>Frontend demo transaction record</p></div><span className={`status-pill ${outstanding === 0 ? 'status-issued' : 'status-draft'}`}><i/>{outstanding === 0 ? 'Paid' : paid > 0 ? 'Partially paid' : 'Outstanding'}</span></div><div className="profile-details"><div><small>Patient</small><strong>{report.patient}</strong></div><div><small>Patient ID</small><strong>{report.patientId}</strong></div><div><small>Report number</small><strong>{report.id}</strong></div><div><small>Invoice date</small><strong>{report.date}</strong></div><div><small>Total amount</small><strong>{money(report.amount)}</strong></div><div><small>Amount paid</small><strong>{money(paid)}</strong></div><div><small>Balance due</small><strong>{money(outstanding)}</strong></div></div><div className="unverified-note"><span className="footnote-mark">i</span> This invoice is demonstration data, not a tax document or proof of payment.</div></section><section className="panel timeline-panel"><h2>Payment history</h2><p className="panel-subtitle">Recorded transactions for this invoice</p>{transactions.length ? transactions.map((payment) => <div className="timeline-item" key={payment.id}><span className="timeline-dot"/><div><strong>{money(payment.amount)} · {payment.method}</strong><small>{payment.date} · {payment.id}{payment.notes ? ` · ${payment.notes}` : ''}</small></div></div>) : <div className="demo-side-note">{report.payment === 'Paid' ? 'This seeded demo invoice is marked as paid; transaction-level history was not supplied.' : 'No payments have been recorded in this demo session.'}</div>}</section></div>
  </>
}
