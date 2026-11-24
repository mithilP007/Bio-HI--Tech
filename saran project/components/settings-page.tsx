'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Building2, CreditCard, FileText, FlaskConical, Image, LockKeyhole, SlidersHorizontal, UserRound, Users } from 'lucide-react'
import { appPreferences, labProfile } from '@/lib/app-settings'
import { updateAppPreferences, updateLabProfile } from '@/lib/demo-store'
import { getAuthState, setStrictMode, lockSession, signOutOwner, sendPasswordReset, changePasswordAuthenticated } from '@/lib/auth-service'
import { syncSaveLabSettings } from '@/lib/data-service'
import { ReferenceApprovalConsole } from './reference-approval-console'

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
  const fileField = (key: string, label: string) => <label className="field" key={key}><span>{label}</span><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const preview = URL.createObjectURL(file); update(key, preview); onAction(`${file.name} selected for preview.`) }}/>{typeof values[key] === 'string' && String(values[key]).startsWith('blob:') && <img className="settings-image-preview" src={String(values[key])} alt={`${label} preview`} />}</label>
  const save = async () => {
    setValidationError('')
    const email = String(values.email ?? '')
    const discount = Number(values.defaultDiscount ?? 0)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setValidationError('Enter a valid contact email address.'); return }
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) { setValidationError('Default discount must be between 0% and 100%.'); return }
    const profileData = Object.fromEntries(Object.keys(labProfile).map((key) => [key, values[key] as string])) as Partial<typeof labProfile>;
    const prefsData = Object.fromEntries(Object.keys(appPreferences).map((key) => [key, values[key] as string | boolean]));
    try {
      await syncSaveLabSettings('lab_profile', profileData);
      await syncSaveLabSettings('app_preferences', prefsData);
      onAction('Settings saved successfully.');
    } catch (err: any) {
      setValidationError(err?.message || 'Error saving settings.');
    }
  }

  if (!section) return <>
    <header className="page-head"><div><div className="eyebrow">CONFIGURATION</div><h1>Settings</h1><p>Manage laboratory details and application behavior.</p></div></header>
    <div className="settings-cards">{sections.map(({ slug: itemSlug, title, detail, icon: Icon }) => <Link key={itemSlug} className="panel settings-card" href={`/settings/${itemSlug}`}><span className="settings-card-icon"><Icon size={19}/></span><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={17}/></Link>)}</div>
  </>

  if (section.slug === 'security') {
    const auth = getAuthState()
    const [sendingReset, setSendingReset] = useState(false)
    const [isChangingPwd, setIsChangingPwd] = useState(false)
    const [currentPwd, setCurrentPwd] = useState('')
    const [newPwd, setNewPwd] = useState('')
    const [confirmNewPwd, setConfirmNewPwd] = useState('')
    const [pwdError, setPwdError] = useState('')
    const [savingPwd, setSavingPwd] = useState(false)

    const handleSendResetEmail = async () => {
      const email = auth.user?.email || 'owner@biohitech.com'
      setSendingReset(true)
      const res = await sendPasswordReset(email)
      setSendingReset(false)
      onAction(res.message)
    }

    const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault()
      setPwdError('')
      if (!currentPwd) { setPwdError('Please enter your current password.'); return }
      if (newPwd.length < 8) { setPwdError('New password must be at least 8 characters.'); return }
      if (newPwd !== confirmNewPwd) { setPwdError('New passwords do not match.'); return }
      setSavingPwd(true)
      const res = await changePasswordAuthenticated(currentPwd, newPwd)
      setSavingPwd(false)
      if (res.success) {
        setIsChangingPwd(false)
        setCurrentPwd('')
        setNewPwd('')
        setConfirmNewPwd('')
        onAction('Master password updated successfully.')
      } else {
        setPwdError(res.error || 'Failed to change password.')
      }
    }

    return <>
      <header className="page-head"><div><div className="eyebrow">CONFIGURATION</div><h1>Security & Session Controls</h1><p>Owner authentication, native credential protection and verified recovery.</p></div><Link href="/settings" className="button button-secondary">Back to settings</Link></header>
      <section className="panel settings-content">
        <div className="settings-title"><h2>Owner Authentication</h2><p>Access is strictly restricted to the pre-provisioned laboratory owner. Zero open registration or unverified access.</p></div>
        <div className="settings-row">
          <div>
            <strong>Authorized Owner Account</strong>
            <p>{auth.user?.email || 'owner@biohitech.com'} ({auth.user?.fullName || labProfile.ownerName})</p>
          </div>
          <span className="status-pill status-issued"><i/>Authenticated</span>
        </div>

        <div className="settings-row" style={{ alignItems: 'flex-start' }}>
          <div>
            <strong>Verified Email Recovery</strong>
            <p>Dispatches a secure recovery link to your registered email to reset master credentials.</p>
          </div>
          <button className="button button-secondary" onClick={handleSendResetEmail} disabled={sendingReset}>
            {sendingReset ? 'Sending Recovery Link…' : 'Send Recovery Email'}
          </button>
        </div>

        <div className="settings-row" style={{ alignItems: 'flex-start' }}>
          <div>
            <strong>Master Password Management</strong>
            <p>Update your laboratory master access password (minimum 8 characters).</p>
            {isChangingPwd ? (
              <form onSubmit={handleChangePassword} style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
                {pwdError && <div style={{ color: '#9d2b24', fontSize: 11, background: '#fdf2f2', padding: '6px 10px', borderRadius: 4 }}>{pwdError}</div>}
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  style={{ height: 36, padding: '0 8px', fontSize: 11, borderRadius: 4, border: '1px solid #dce8e6' }}
                />
                <input
                  type="password"
                  placeholder="New password (min 8 characters)"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  style={{ height: 36, padding: '0 8px', fontSize: 11, borderRadius: 4, border: '1px solid #dce8e6' }}
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPwd}
                  onChange={(e) => setConfirmNewPwd(e.target.value)}
                  style={{ height: 36, padding: '0 8px', fontSize: 11, borderRadius: 4, border: '1px solid #dce8e6' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="button button-primary" type="submit" disabled={savingPwd}>
                    {savingPwd ? 'Updating…' : 'Save New Password'}
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => { setIsChangingPwd(false); setPwdError(''); }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}
          </div>
          {!isChangingPwd && (
            <button className="button button-secondary" onClick={() => setIsChangingPwd(true)}>
              Change Password
            </button>
          )}
        </div>

        <div className="settings-row">
          <div>
            <strong>Strict Startup Login</strong>
            <p>Require owner password entry every time the application is opened (disables persistent disk tokens).</p>
          </div>
          <label className="settings-toggle">
            <input type="checkbox" checked={auth.strictMode} onChange={(e) => { setStrictMode(e.target.checked); onAction(`Strict startup login ${e.target.checked ? 'enabled' : 'disabled'}.`); }} />
          </label>
        </div>
        <div className="settings-row">
          <div>
            <strong>Lock Application Now</strong>
            <p>Instantly lock the workspace until your owner password is re-entered.</p>
          </div>
          <button className="button button-secondary" onClick={() => { lockSession(); onAction('Workspace locked.'); }}>Lock Workspace</button>
        </div>
        <div className="settings-row">
          <div>
            <strong>Revoke Session & Sign Out</strong>
            <p>Terminates the active session and purges sensitive in-memory clinical data.</p>
          </div>
          <button className="button button-secondary" style={{color: '#9d2b24'}} onClick={async () => { await signOutOwner(); window.location.href = '/login'; }}>Sign Out</button>
        </div>
      </section>
    </>
  }

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
    : section.slug === 'test-configuration' ? (
      <div className="test-config-console-wrapper">
        <ReferenceApprovalConsole onAction={onAction} />
        <div className="fields-grid" style={{ marginTop: '2rem' }}>
          <label className="field">
            <span>Default catalogue status</span>
            <select value={String(values.catalogueStatus ?? 'Active')} onChange={(event) => update('catalogueStatus', event.target.value)}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </label>
        </div>
      </div>
    )
    : <div className="fields-grid"><label className="field"><span>Date format</span><select value={String(values.dateFormat)} onChange={(event) => update('dateFormat', event.target.value)}><option>DD MMM YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></select></label><label className="field"><span>Timezone</span><select value={String(values.timezone)} onChange={(event) => update('timezone', event.target.value)}><option>Asia/Kolkata</option><option>UTC</option></select></label><label className="field"><span>Notifications</span><select value={String(values.notifications)} onChange={(event) => update('notifications', event.target.value === 'true')}><option value="true">Enabled</option><option value="false">Disabled</option></select></label></div>

  return <>
    <header className="page-head"><div><div className="eyebrow">CONFIGURATION</div><h1>{section.title}</h1><p>{section.detail}</p></div><Link href="/settings" className="button button-secondary">Back to settings</Link></header>
    <section className="panel settings-content"><div className="settings-title"><h2>{section.title}</h2><p>Changes are saved securely to your laboratory configuration in PostgreSQL.</p></div>{validationError&&<div className="form-error" role="alert">{validationError}</div>}{fields}<div className="settings-save"><span>Changes synchronize immediately across all connected owner devices.</span><div><Link href="/settings" className="button button-secondary">Cancel</Link><button className="button button-primary" onClick={save}>Save changes</button></div></div></section>
  </>
}
