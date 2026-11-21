'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Building2, CreditCard, FileText, FlaskConical, Image, LockKeyhole, SlidersHorizontal, UserRound, Users } from 'lucide-react'
import { appPreferences, labProfile } from '@/lib/app-settings'
import { updateAppPreferences, updateLabProfile } from '@/lib/demo-store'

type Props = { path: string; onAction: (message: string) => void }
const sections = [
  { slug: 'lab-profile', title: 'Laboratory profile', detail: 'Contact, registration and owner information', icon: Building2 },
  { slug: 'branding', title: 'Branding & logo', detail: 'Logo, letterhead and brand colour', icon: Image },
  { slug: 'reports', title: 'Report settings', detail: 'Format, report numbering and footer', icon: FileText },
  { slug: 'signatures', title: 'Signature management', detail: 'Signatory name and designation', icon: UserRound },
  { slug: 'billing', title: 'Billing preferences', detail: 'Currency, discounts and invoice footer', icon: CreditCard },
  { slug: 'test-configuration', title: 'Test configuration', detail: 'Catalogue defaults and clinical review', icon: FlaskConical },
  { slug: 'security', title: 'Security', detail: 'Authentication and session controls', icon: LockKeyhole },
  { slug: 'preferences', title: 'Application preferences', detail: 'Date, timezone and notifications', icon: SlidersHorizontal },
]

export function SettingsPage({ path, onAction }: Props) {
  const [values, setValues] = useState<Record<string, string | boolean>>({ ...labProfile, ...appPreferences })
  const [validationError, setValidationError] = useState('')
  const slug = path.split('/').at(-1) ?? ''
  const section = sections.find((item) => item.slug === slug)
  const update = (key: string, value: string | boolean) => setValues((current) => ({ ...current, [key]: value }))
  const fileField = (key: string, label: string) => <label className="field" key={key}><span>{label}</span><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const preview = URL.createObjectURL(file); update(key, preview); onAction(`${file.name} selected for this session preview; file storage is not connected.`) }}/>{typeof values[key] === 'string' && String(values[key]).startsWith('blob:') && <img className="settings-image-preview" src={String(values[key])} alt={`${label} preview`} />}</label>
  const save = () => {
    setValidationError('')
    const email = String(values.email ?? '')
    const discount = Number(values.defaultDiscount ?? 0)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setValidationError('Enter a valid contact email address.'); return }
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) { setValidationError('Default discount must be between 0% and 100%.'); return }
    updateLabProfile(Object.fromEntries(Object.keys(labProfile).map((key) => [key, values[key] as string])) as Partial<typeof labProfile>)
    updateAppPreferences(Object.fromEntries(Object.keys(appPreferences).map((key) => [key, values[key] as string | boolean])))
    onAction('Settings saved in this demo session only; no backend is connected.')
  }

  if (!section) return <>
    <header className="page-head"><div><div className="eyebrow">CONFIGURATION</div><h1>Settings</h1><p>Manage laboratory details and application behavior.</p></div></header>
    <div className="settings-cards">{sections.map(({ slug: itemSlug, title, detail, icon: Icon }) => <Link key={itemSlug} className="panel settings-card" href={`/settings/${itemSlug}`}><span className="settings-card-icon"><Icon size={19}/></span><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={17}/></Link>)}</div>
  </>

  if (section.slug === 'security') return <>
    <header className="page-head"><div><div className="eyebrow">CONFIGURATION</div><h1>Security</h1><p>Authentication and session management controls.</p></div><Link href="/settings" className="button button-secondary">Back to settings</Link></header>
    <section className="panel settings-content"><div className="settings-title"><h2>Authentication not connected</h2><p>This frontend-only prototype does not authenticate users or manage secure sessions. Password reset, multi-factor authentication, and session revocation must be connected to a verified authentication service before use.</p></div><div className="settings-row"><div><strong>Signed-in profile</strong><p>{labProfile.ownerName} · {labProfile.ownerDesignation}</p></div><span className="status-pill status-draft"><i/>Demo only</span></div></section>
  </>

  const textField = (key: string, label: string, type = 'text', placeholder = '') => <label className="field" key={key}><span>{label}</span><input type={type} value={String(values[key] ?? '')} placeholder={placeholder} onChange={(event) => update(key, event.target.value)}/></label>
  const fields = section.slug === 'lab-profile' ? <div className="fields-grid">{textField('laboratoryName', 'Laboratory name')}{textField('ownerName', 'Owner name')}{textField('ownerDesignation', 'Owner designation')}{textField('phone', 'Contact phone', 'tel')}{textField('email', 'Email address', 'email')}{textField('registrationNumber', 'Registration number')}{textField('address', 'Laboratory address')}</div>
    : section.slug === 'branding' ? <div className="fields-grid">{fileField('logoPreview', 'Logo image')}{fileField('letterheadPreview', 'Letterhead image')}{textField('brandColor', 'Primary brand colour', 'color')}{textField('letterheadName', 'Letterhead label', 'text', 'BIO HI TECH')}</div>
    : section.slug === 'reports' ? <div className="fields-grid"><label className="field"><span>Default report format</span><select value={String(values.reportFormat)} onChange={(event) => update('reportFormat', event.target.value)}><option>A4 portrait</option><option>A4 landscape</option><option>Letter portrait</option></select></label>{textField('reportFooter', 'Report footer')}{textField('reportPrefix', 'Report number prefix', 'text', 'RPT')}</div>
    : section.slug === 'signatures' ? <div className="fields-grid">
        <div className="unverified-note field-wide">
          <span className="footnote-mark">i</span> Recovered legacy signature images are historical image facsimiles only. They do not constitute cryptographic digital signatures or clinical verification. Report signing requires explicit owner confirmation and authorization.
        </div>
        <div className="field-group-title field-wide"><strong>Technologist Signature (Slot A)</strong></div>
        {textField('technologistName', 'Technologist name')}
        {textField('technologistDesignation', 'Technologist designation')}
        <label className="field">
          <span>Authorization status</span>
          <select value={String(values.technologistSignatureStatus ?? 'Pending Owner Approval')} onChange={(event) => update('technologistSignatureStatus', event.target.value)}>
            <option>Pending Owner Approval</option>
            <option>Authorized</option>
            <option>Disabled</option>
          </select>
        </label>
        <label className="field">
          <span>Print on report</span>
          <select value={String(values.technologistSignatureEnabled ?? 'true')} onChange={(event) => update('technologistSignatureEnabled', event.target.value === 'true')}>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </label>

        <div className="field-group-title field-wide"><strong>Pathologist / Director Signature (Slot B)</strong></div>
        {textField('directorName', 'Director / Pathologist name')}
        {textField('directorDesignation', 'Director designation')}
        <label className="field">
          <span>Authorization status</span>
          <select value={String(values.directorSignatureStatus ?? 'Pending Owner Approval')} onChange={(event) => update('directorSignatureStatus', event.target.value)}>
            <option>Pending Owner Approval</option>
            <option>Authorized</option>
            <option>Disabled</option>
          </select>
        </label>
        <label className="field">
          <span>Print on report</span>
          <select value={String(values.directorSignatureEnabled ?? 'true')} onChange={(event) => update('directorSignatureEnabled', event.target.value === 'true')}>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </label>
      </div>
    : section.slug === 'billing' ? <div className="fields-grid"><label className="field"><span>Currency</span><select value={String(values.currency)} onChange={(event) => update('currency', event.target.value)}><option value="INR">INR — Indian Rupee</option></select></label>{textField('defaultDiscount', 'Default discount (%)', 'number')}{textField('invoiceFooter', 'Invoice footer')}</div>
    : section.slug === 'test-configuration' ? <div className="fields-grid"><div className="unverified-note field-wide"><span className="footnote-mark">i</span> Clinical intervals and interpretations must be entered and approved by qualified laboratory staff. No reference range is approved by this demo.</div><label className="field"><span>Default catalogue status</span><select value={String(values.catalogueStatus ?? 'Active')} onChange={(event) => update('catalogueStatus', event.target.value)}><option>Active</option><option>Inactive</option></select></label></div>
    : <div className="fields-grid"><label className="field"><span>Date format</span><select value={String(values.dateFormat)} onChange={(event) => update('dateFormat', event.target.value)}><option>DD MMM YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></select></label><label className="field"><span>Timezone</span><select value={String(values.timezone)} onChange={(event) => update('timezone', event.target.value)}><option>Asia/Kolkata</option><option>UTC</option></select></label><label className="field"><span>Notifications</span><select value={String(values.notifications)} onChange={(event) => update('notifications', event.target.value === 'true')}><option value="true">Enabled</option><option value="false">Disabled</option></select></label></div>

  return <>
    <header className="page-head"><div><div className="eyebrow">CONFIGURATION</div><h1>{section.title}</h1><p>{section.detail}</p></div><Link href="/settings" className="button button-secondary">Back to settings</Link></header>
    <section className="panel settings-content"><div className="settings-title"><h2>{section.title}</h2><p>Changes are held in this demo session and are not written to a secure backend.</p></div>{validationError&&<div className="form-error" role="alert">{validationError}</div>}{fields}<div className="settings-save"><span>Demo settings are not production configuration.</span><div><Link href="/settings" className="button button-secondary">Cancel</Link><button className="button button-primary" onClick={save}>Save changes</button></div></div></section>
  </>
}
