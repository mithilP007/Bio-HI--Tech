'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'
import { reports } from '@/lib/demo-data'
import { recordPayment } from '@/lib/demo-store'

type Props = { onAction: (message: string) => void }

export function RecordPayment({ onAction }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [reportId, setReportId] = useState(searchParams.get('report') ?? reports.find((report) => report.payment !== 'Paid')?.id ?? '')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('UPI')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const selectedReport = useMemo(() => reports.find((report) => report.id === reportId), [reportId])
  const paidSoFar = selectedReport?.payment.startsWith('Partial · ')
    ? Number(selectedReport.payment.split('·')[1]?.trim()) || 0
    : selectedReport?.payment === 'Paid' ? selectedReport.amount : 0
  const balance = Math.max(0, (selectedReport?.amount ?? 0) - paidSoFar)

  return <>
    <div className="page-head">
      <div><div className="eyebrow">FINANCE</div><h1>Record payment</h1><p>Record full or partial payment for an outstanding report.</p></div>
      <a className="button button-secondary" href="/billing">Cancel</a>
    </div>
    <div className="form-layout">
      <section className="panel form-panel">
        <div className="form-section-head"><span className="section-index">01</span><div><h2>Payment details</h2><p>Changes are held in this frontend demo session only.</p></div></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="fields-grid">
          <label className="field field-wide"><span>Report / bill *</span><select value={reportId} onChange={(event) => setReportId(event.target.value)}><option value="">Select an outstanding report</option>{reports.filter((report) => report.payment !== 'Paid').map((report) => <option key={report.id} value={report.id}>{report.id} · {report.patient} · Balance ₹{report.amount - (report.payment.startsWith('Partial · ') ? Number(report.payment.split('·')[1]?.trim()) || 0 : 0)}</option>)}</select></label>
          {selectedReport && <div className="selected-patient"><Check size={15}/><strong>{selectedReport.patient}</strong><span>Balance due {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(balance)}</span></div>}
          <label className="field"><span>Amount (₹) *</span><input type="number" min="1" max={balance} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount"/></label>
          <label className="field"><span>Payment method *</span><select value={method} onChange={(event) => setMethod(event.target.value)}><option>UPI</option><option>Cash</option><option>Card</option><option>Bank transfer</option></select></label>
          <label className="field"><span>Payment date *</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)}/></label>
          <label className="field field-wide"><span>Notes</span><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional payment note"/></label>
        </div>
        <div className="settings-save"><span>Payment method: {method} · {date}</span><button className="button button-primary" disabled={!selectedReport || !amount} onClick={() => { setError(''); try { recordPayment(reportId, Number(amount), { method, date, notes }); onAction('Payment recorded in this demo session; no database is connected.'); router.push('/billing') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Payment could not be recorded.') } }}>Save payment</button></div>
      </section>
      <aside className="panel summary-card"><h3>Balance summary</h3><div className="summary-row"><span>Bill total</span><strong>₹{selectedReport?.amount ?? 0}</strong></div><div className="summary-row"><span>Previously paid</span><strong>₹{paidSoFar}</strong></div><div className="summary-total"><span>Outstanding</span><strong>₹{balance}</strong></div><div className="demo-side-note">Payment is capped at the current outstanding balance.</div></aside>
    </div>
  </>
}
