'use client'

import Link from 'next/link'
import { ArrowLeft, FlaskConical } from 'lucide-react'
import { tests } from '@/lib/demo-data'

type Props = { path: string }

export function TestDetails({ path }: Props) {
  const code = path.split('/').pop() ?? ''
  const test = tests.find((entry) => entry.code === code)

  if (!test) return <section className="panel empty-state"><h1>Test not found</h1><p>This test was not found in the laboratory catalogue.</p><Link className="button button-secondary" href="/tests"><ArrowLeft size={16}/> Back to catalogue</Link></section>

  return <>
    <header className="page-head"><div><div className="eyebrow">TEST CATALOGUE · {test.code}</div><h1>{test.name}</h1><p>{test.category} · {test.parameters} configured parameters</p></div><div className="page-actions"><Link className="button button-secondary" href="/tests"><ArrowLeft size={16}/> Back to catalogue</Link><Link className="button button-primary" href={`/tests/${test.code}/edit`}>Edit test</Link></div></header>
    <div className="details-grid"><section className="panel form-panel"><div className="panel-head"><div><h2>Test definition</h2><p>Pricing and catalogue details</p></div><span className={`status-pill ${test.active===false?'status-draft':'status-issued'}`}><i/>{test.active===false?'Inactive':'Active'}</span></div><div className="profile-details"><div><small>Test code</small><strong>{test.code}</strong></div><div><small>Category</small><strong>{test.category}</strong></div><div><small>Normal price</small><strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(test.price)}</strong></div><div><small>Offer price</small><strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(test.offer)}</strong></div></div></section><section className="panel timeline-panel"><h2>Parameters</h2><p className="panel-subtitle">Reference values require qualified laboratory review.</p>{test.parameterNames.length ? test.parameterNames.map((parameter, index) => <div className="timeline-item" key={parameter}><span className="activity-icon"><FlaskConical size={15}/></span><div><strong>{parameter}</strong><small>{test.parameterDetails?.[index]?.type ?? 'Type not configured'} · {test.units[index] || 'Unit not configured'} · {test.parameterDetails?.[index]?.precision ?? '—'} decimal places · Reference range not verified</small></div></div>) : <div className="demo-side-note">No parameters have been configured for this test yet.</div>}<div className="unverified-note"><span className="footnote-mark">i</span> Reference intervals and interpretation notes remain unverified until validated by the laboratory owner.</div></section></div>
  </>
}
