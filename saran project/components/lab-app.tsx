'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { paymentLedger, subscribeDemoData, getDemoDataVersion, demoNotifications, markNotificationRead, markAllNotificationsRead, reportRevisions, reportAmendments } from '@/lib/demo-store'
import { subscribeNetworkStatus, getNetworkState, syncLoadCloudData, syncCreatePatient, syncUpdatePatient, syncArchivePatient, syncRestorePatient, syncDeletePatient, syncCreateReport, syncUpdateDraftReport, syncIssueReport, syncDeleteDraftReport, syncCreateReportAmendment, syncRecordPayment, syncAddTest, syncUpdateTest, syncUpdateTestPrice } from '@/lib/data-service'
import { RecordPayment } from '@/components/record-payment'
import { TestDetails } from '@/components/test-details'
import { SettingsPage } from '@/components/settings-page'
import { InvoiceDetails } from '@/components/invoice-details'
import { PatientHistoryTabs } from '@/components/patient-history-tabs'
import { ReportPrintSheet } from '@/components/report-print-sheet'
import { evaluateResult } from '@/lib/clinical-engine'
import { labProfile } from '@/lib/app-settings'
import { AnalyticsPage } from '@/components/analytics-page'
import { Activity, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Bell, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardList, CreditCard, FlaskConical, LayoutDashboard, Menu, MoreHorizontal, Plus, Search, Settings, SlidersHorizontal, Users, X, ChartNoAxesCombined, FilePlus2, FileText, LogOut, UserRound, Check, Printer, Download, PanelLeftClose, PanelLeftOpen, Eye, EyeOff, LockKeyhole, Mail, KeyRound, ShieldCheck } from 'lucide-react'
import { getAuthState, subscribeAuth, initializeAuth, signInOwner, signOutOwner, sendPasswordReset, updateUserPassword, type AuthState } from '@/lib/auth-service'
import { patients, reports, tests, activities, type TestParameter } from '@/lib/demo-data'

const navigation = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Patients', href: '/patients', icon: Users },
  { label: 'New report', href: '/reports/new', icon: FilePlus2 },
  { label: 'Saved reports', href: '/reports', icon: FileText },
  { label: 'Test catalogue', href: '/tests', icon: FlaskConical },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'Analytics', href: '/analytics', icon: ChartNoAxesCombined },
  { label: 'Settings', href: '/settings', icon: Settings },
]
const titles: Record<string, string> = { '/': 'Dashboard', '/dashboard': 'Dashboard', '/patients': 'Patients', '/patients/new': 'Register patient', '/reports/new': 'Create new report', '/reports': 'Saved reports', '/tests': 'Test catalogue', '/tests/new': 'Add new test', '/billing': 'Billing', '/analytics': 'Analytics', '/settings': 'Settings', '/settings/security': 'Security settings', '/notifications': 'Notifications' }
const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export function LabApp() {
  const rawPath = usePathname() || ''
  const pathname = rawPath.replace(/\/+$/, '') || '/'
  const dataVersion = useSyncExternalStore(subscribeDemoData, getDemoDataVersion, () => 0)
  useEffect(() => {
    syncLoadCloudData()
  }, [])
  const [authState, setAuthState] = useState<AuthState>(getAuthState())
  useEffect(() => {
    initializeAuth().then(setAuthState)
    return subscribeAuth(setAuthState)
  }, [])
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState('All patients')
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const activeOwnerName = authState.user?.fullName || labProfile.ownerName
  const activeOwnerDesignation = authState.user?.designation || labProfile.ownerDesignation
  const ownerInitials = activeOwnerName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'BH'
  const unreadNotifications = demoNotifications.filter(notification => !notification.read).length
  const title = titles[pathname] || (pathname.startsWith('/patients/') ? pathname.endsWith('/edit') ? 'Edit patient' : 'Patient profile' : pathname.startsWith('/reports/') ? pathname.endsWith('/preview') ? 'Report preview' : pathname.endsWith('/edit') ? 'Edit report' : 'Report details' : pathname.startsWith('/tests/') ? pathname.endsWith('/edit') ? 'Edit test' : 'Test details' : pathname === '/billing/new' ? 'Record payment' : pathname.startsWith('/billing/') ? 'Invoice details' : pathname.startsWith('/settings/') ? 'Settings' : 'Page not found')
  const filteredPatients = patients.filter(p => `${p.name} ${p.id} ${p.phone}`.toLowerCase().includes(search.toLowerCase()))
  const filteredReports = useMemo(() => reports.filter(r => `${r.id} ${r.patient} ${r.patientId}`.toLowerCase().includes(search.toLowerCase())), [search, dataVersion])
  const addNotice = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(''), 3200) }
  const searchPatients = search ? patients.filter(p => `${p.name} ${p.id} ${p.phone}`.toLowerCase().includes(search.toLowerCase())).slice(0, 3) : []
  const searchReports = search ? reports.filter(r => `${r.id} ${r.patient} ${r.patientId}`.toLowerCase().includes(search.toLowerCase())).slice(0, 3) : []
  const searchBills = search ? reports.filter(r => `${r.id} ${r.patient} ${r.patientId}`.toLowerCase().includes(search.toLowerCase())).slice(0, 3) : []
  const searchTests = search ? tests.filter(t => `${t.name} ${t.code}`.toLowerCase().includes(search.toLowerCase())).slice(0, 3) : []
  const isNewReport = pathname === '/reports/new'
  const isForm = pathname === '/patients/new' || (pathname.startsWith('/patients/') && pathname.endsWith('/edit')) || isNewReport || (pathname.startsWith('/reports/') && pathname.endsWith('/edit')) || pathname === '/tests/new' || (pathname.startsWith('/tests/') && pathname.endsWith('/edit'))

  if (authState.isLoading) {
    return <div className="auth-splash-screen"><div className="auth-splash-card"><img src="/branding/bio-icon-192.png" alt="BIO HI TECH" className="auth-splash-icon" /><div className="auth-spinner" /><p>BIO HI TECH · Loading Workspace...</p></div></div>
  }

  if (!authState.isAuthenticated || pathname === '/login' || pathname === '/forgot-password') {
    return <AuthPage forgot={pathname === '/forgot-password'} onAuthenticated={() => {}} />
  }

  return <div className="lab-shell">
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Link href="/dashboard" className="brand" aria-label="BIO HI TECH Dashboard">
        <div className="brand-banner-wrap">
          <img
            src="/branding/bio-hitech-banner.png"
            alt="BIO HI TECH"
            className="brand-banner-img"
          />
          <img
            src="/branding/bio-icon-192.png"
            alt="BIO HI TECH"
            className="brand-icon-collapsed"
          />
        </div>
      </Link>
      <div className="nav-caption">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">{navigation.map(item => { const Icon = item.icon; const active = pathname === item.href || (item.href === '/patients' && pathname.startsWith('/patients')) || (item.href === '/reports' && pathname === '/reports') || (item.href === '/tests' && pathname.startsWith('/tests')) || (item.href === '/settings' && pathname.startsWith('/settings')); return <Link key={item.href} href={item.href} className={`nav-link ${active ? 'active' : ''}`} title={collapsed ? item.label : undefined}><Icon size={18}/>{!collapsed && <span>{item.label}</span>}{!collapsed && item.label === 'Saved reports' && <span className="nav-count">{reports.length}</span>}</Link> })}</nav>
      <div className="sidebar-bottom"><button className="nav-link" onClick={() => addNotice('Help centre is available in the full product.')}><CircleHelp size={18}/>{!collapsed && <span>Help centre</span>}</button><div className="profile-row"><div className="avatar">{ownerInitials}</div>{!collapsed && <div className="profile-copy"><strong>{activeOwnerName}</strong><small>{activeOwnerDesignation}</small></div>}{!collapsed && <button className="icon-button" aria-label="Profile menu" onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={18}/></button>}</div>{menuOpen && <div className="profile-menu"><Link href="/settings/lab-profile" onClick={() => setMenuOpen(false)}>My profile</Link><Link href="/settings/security" onClick={() => setMenuOpen(false)}>Security settings</Link><button onClick={async () => { setMenuOpen(false); await signOutOwner(); }}>Sign out</button></div>}</div>
      <button className="collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <PanelLeftOpen size={17}/> : <PanelLeftClose size={17}/>}</button>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="mobile-brand"><img src="/branding/bio-hitech-banner.png" alt="BIO HI TECH" className="mobile-brand-banner" /><button className="mobile-menu-toggle" aria-label={mobileMenuOpen?'Close navigation':'Open navigation'} aria-expanded={mobileMenuOpen} onClick={()=>setMobileMenuOpen(!mobileMenuOpen)}><Menu size={19}/></button></div><div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{title}</strong></div><div className="global-search-wrap"><label className="global-search"><Search size={16}/><input aria-label="Search patients, reports and tests" placeholder="Search patients, reports…" value={search} onChange={e => setSearch(e.target.value)}/><kbd>⌘ K</kbd></label>{search&&<div className="global-results" role="region" aria-label="Search results">{searchPatients.length>0&&<div><strong>Patients</strong>{searchPatients.map(patient=><Link key={patient.id} href={`/patients/${patient.id}`} onClick={()=>setSearch('')}><span>{patient.name}</span><small>{patient.id} · {patient.phone}</small></Link>)}</div>}{searchReports.length>0&&<div><strong>Reports</strong>{searchReports.map(report=><Link key={report.id} href={`/reports/${report.id}`} onClick={()=>setSearch('')}><span>{report.id}</span><small>{report.patient}</small></Link>)}</div>}{searchBills.length>0&&<div><strong>Bills</strong>{searchBills.map(bill=><Link key={bill.id} href={`/billing/${bill.id}`} onClick={()=>setSearch('')}><span>{bill.id} · {money(bill.amount)}</span><small>{bill.patient} · {bill.payment}</small></Link>)}</div>}{searchTests.length>0&&<div><strong>Tests</strong>{searchTests.map(test=><Link key={test.code} href={`/tests/${test.code}`} onClick={()=>setSearch('')}><span>{test.name}</span><small>{test.code}</small></Link>)}</div>}{!searchPatients.length&&!searchReports.length&&!searchTests.length&&!searchBills.length&&<p>No matching patients, reports, tests or bills.</p>}</div>}</div><div className="top-actions"><span className="top-date">{new Intl.DateTimeFormat('en-IN',{weekday:'short',day:'numeric',month:'short'}).format(new Date())}</span><Link href="/notifications" className="icon-button notification-button" aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ''}`}><Bell size={18}/>{unreadNotifications>0&&<i/>}</Link><div className="avatar top-avatar" aria-label={activeOwnerName}>{ownerInitials}</div></div></header>
      {mobileMenuOpen&&<nav className="mobile-menu" aria-label="Mobile app navigation">{navigation.map(item=>{const Icon=item.icon;return <Link key={item.href} href={item.href} className={pathname===item.href||(item.href==='/patients'&&pathname.startsWith('/patients'))?'mobile-menu-active':''} onClick={()=>setMobileMenuOpen(false)}><Icon size={17}/><span>{item.label}</span><ArrowRight size={14}/></Link>})}<button className="mobile-signout-btn" onClick={async ()=>{setMobileMenuOpen(false);await signOutOwner()}}><LogOut size={16}/><span>Sign out</span></button></nav>}
      <main className="main-content"><div className="demo-banner"><span className="demo-dot"/> DEMO ENVIRONMENT <span className="demo-divider">·</span> Demo session only — records reset when this workspace reloads</div>
        {pathname === '/' || pathname === '/dashboard' ? <Dashboard onAction={addNotice}/> : pathname === '/patients' ? <Patients search={search} setSearch={setSearch} rows={filteredPatients} onAction={addNotice}/> : isForm ? <FormPage path={pathname} tests={tests} selectedTests={selectedTests} setSelectedTests={setSelectedTests} onAction={addNotice}/> : pathname === '/reports' ? <Reports rows={filteredReports} search={search} setSearch={setSearch} onAction={addNotice}/> : pathname.startsWith('/reports/') && pathname.endsWith('/preview') ? <ReportPreviewPage path={pathname} onAction={addNotice}/> : pathname === '/tests' ? <Catalogue search={search} setSearch={setSearch} onAction={addNotice}/> : pathname.startsWith('/tests/') ? <TestDetails path={pathname}/> : pathname === '/billing/new' ? <RecordPayment onAction={addNotice}/> : pathname === '/billing' ? <Billing/> : pathname === '/analytics' ? <AnalyticsPage/> : pathname === '/settings' || pathname.startsWith('/settings/') ? <SettingsPage path={pathname} onAction={addNotice}/> : pathname === '/notifications' ? <Notifications onAction={addNotice}/> : pathname.startsWith('/billing/') ? <InvoiceDetails path={pathname}/> : <Details path={pathname} onAction={addNotice}/>}
      </main>
    </div>
    <nav className="mobile-bottom" aria-label="Mobile navigation">{navigation.filter(x => ['/dashboard','/patients','/reports','/billing'].includes(x.href)).map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={pathname === item.href || (item.href === '/dashboard' && pathname === '/') ? 'mobile-active' : ''}><Icon size={19}/><span>{item.label === 'Dashboard' ? 'Home' : item.label === 'Saved reports' ? 'Reports' : item.label}</span></Link> })}<Link href="/reports/new" className="mobile-add"><Plus size={21}/><span>New</span></Link></nav>
    {notice && <div className="toast" role="status"><Check size={17}/>{notice}<button aria-label="Dismiss" onClick={() => setNotice('')}><X size={15}/></button></div>}
  </div>
}

function PageHead({eyebrow, title, subtitle, action}: {eyebrow?: string; title: string; subtitle?: string; action?: React.ReactNode}) { return <div className="page-head"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="page-actions">{action}</div>}</div> }
function Button({children, href, onClick, secondary=false}: {children: React.ReactNode; href?: string; onClick?: () => void; secondary?: boolean}) { return href ? <Link href={href} className={`button ${secondary ? 'button-secondary' : 'button-primary'}`}>{children}</Link> : <button className={`button ${secondary ? 'button-secondary' : 'button-primary'}`} onClick={onClick}>{children}</button> }
function Dashboard({onAction}: {onAction:(s:string)=>void}) {
 const todayKey=new Date().toDateString();const todayPatients=patients.filter(patient=>new Date(patient.date).toDateString()===todayKey).length;const todayReports=reports.filter(report=>new Date(report.date).toDateString()===todayKey).length;const outstanding=reports.reduce((sum,report)=>sum+report.amount-(report.payment==='Paid'?report.amount:report.payment.startsWith('Partial · ')?Number(report.payment.split('·')[1]?.trim())||0:0),0);const todayCollected=paymentLedger.filter(payment=>new Date(payment.date).toDateString()===todayKey).reduce((sum,payment)=>sum+payment.amount,0);const stats=[{label:'Total patients',value:String(patients.length),change:'Current demo records',positive:true,icon:Users,href:'/patients'},{label:'Today’s registrations',value:String(todayPatients),change:'Registered today',positive:true,icon:Activity,href:'/patients?date=today'},{label:'Reports generated today',value:String(todayReports),change:'Current demo records',positive:true,icon:ClipboardList,href:'/reports?date=today'},{label:'Reports in progress',value:String(reports.filter(report=>report.status==='Draft').length),change:'Continue a draft',positive:false,icon:FileText,href:'/reports?status=draft'},{label:'Today’s collections',value:money(todayCollected),change:'Recorded today',positive:true,icon:CreditCard,href:'/billing?date=today'},{label:'Outstanding payments',value:money(outstanding),change:'Open balances',positive:false,icon:CreditCard,href:'/billing?status=outstanding'}]
 return <><PageHead eyebrow={new Intl.DateTimeFormat('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date()).toUpperCase()} title={`Good morning, ${labProfile.ownerName}`} subtitle="Here’s what’s happening at your laboratory today." action={<Button href="/reports/new"><Plus size={17}/> Create report</Button>}/><div className="stats-grid">{stats.map(({label,value,change,positive,icon:Icon,href})=><Link href={href} className="stat-card stat-card-link" key={label}><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={17}/></span></div><strong className="stat-value">{value}</strong><div className={`stat-change ${positive?'is-positive':''}`}>{positive?<ArrowUpRight size={14}/>:<span className="mini-dot"/>}{change}</div></Link>)}</div><section className="panel dashboard-quick-actions" aria-label="Quick actions"><Link href="/patients/new"><Plus size={15}/> Register patient</Link><Link href="/reports/new"><FilePlus2 size={15}/> Create report</Link><Link href="/billing/new"><CreditCard size={15}/> Record payment</Link><Link href="/tests/new"><FlaskConical size={15}/> Add new test</Link></section><div className="dashboard-grid"><section className="panel recent-panel"><div className="panel-head"><div><h2>Recent patients</h2><p>Latest registrations at your lab</p></div><Link className="text-link" href="/patients">View all <ArrowRight size={15}/></Link></div><div className="table-wrap"><table><thead><tr><th>Patient</th><th>Patient ID</th><th>Registered</th><th>Reports</th><th/></tr></thead><tbody>{patients.slice(0,5).map(p=><tr key={p.id}><td><div className="person"><span className="person-avatar">{p.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</span><span><strong>{p.name}</strong><small>{p.phone}</small></span></div></td><td className="mono">{p.id}</td><td>{p.date}</td><td>{p.reports}</td><td><Link className="row-link" href={`/patients/${p.id}`} aria-label={`View ${p.name}`}><ArrowRight size={16}/></Link></td></tr>)}</tbody></table></div></section><section className="panel activity-panel"><div className="panel-head"><div><h2>Recent activity</h2><p>Updates from your laboratory</p></div><button className="icon-button" aria-label="More activity options" onClick={()=>onAction('Showing the latest activity.') }><MoreHorizontal size={19}/></button></div><div className="activity-list">{activities.map((a,i)=><div className="activity-item" key={a.text}><span className={`activity-icon activity-${i}`}><a.icon size={15}/></span><div><p>{a.text}</p><small>{a.detail} <span>·</span> {a.time}</small></div></div>)}</div><Link href="/notifications" className="activity-footer">View all activity <ArrowRight size={14}/></Link></section></div><section className="panel reports-panel"><div className="panel-head"><div><h2>Reports in progress</h2><p>Recent reports that need your attention</p></div><Link className="text-link" href="/reports">All reports <ArrowRight size={15}/></Link></div><div className="table-wrap"><table><thead><tr><th>Report no.</th><th>Patient</th><th>Tests</th><th>Report date</th><th>Amount</th><th>Status</th><th/></tr></thead><tbody>{reports.filter(report=>report.status==='Draft').slice(0,4).map(r=><tr key={r.id}><td className="mono">{r.id}</td><td>{r.patient}</td><td>{r.tests} tests</td><td>{r.date}</td><td>{money(r.amount)}</td><td><span className={`status-pill ${r.status==='Issued'?'status-issued':'status-draft'}`}><i/>{r.status}</span></td><td><Link className="row-link" href={`/reports/${r.id}`} aria-label={`Open report ${r.id}`}><ArrowRight size={16}/></Link></td></tr>)}</tbody></table></div></section><div className="footnote"><span className="footnote-mark">i</span> All figures shown are demonstration data and do not represent live laboratory records.</div></>
}
function Patients({search,setSearch,rows,onAction}:{search:string;setSearch:(s:string)=>void;rows:typeof patients;onAction:(s:string)=>void}) { const searchParams=useSearchParams();const [page,setPage]=useState(1);const [filter,setFilter]=useState(searchParams.get('date')==='today'?'Registered today':'All patients');const filteredRows=rows.filter(patient=>{if(filter==='All patients')return true;const date=new Date(patient.date);const now=new Date();if(filter==='Registered today')return date.toDateString()===now.toDateString();if(filter==='Registered this month')return date.getFullYear()===now.getFullYear()&&date.getMonth()===now.getMonth();return date>=new Date(now.getTime()-7*24*60*60*1000)}) ;return <><PageHead eyebrow="PATIENT MANAGEMENT" title="Patients" subtitle={`${filteredRows.length} patient records in this demo workspace.`} action={<Button href="/patients/new"><Plus size={17}/> Register patient</Button>}/><section className="panel listing-panel"><div className="list-toolbar"><label className="inline-search"><Search size={16}/><input aria-label="Search patients" placeholder="Search name, ID or phone…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/><button aria-label="Clear search" onClick={()=>{setSearch('');setPage(1)}}><X size={14}/></button></label><select aria-label="Filter patients" value={filter} onChange={e=>{setFilter(e.target.value);setPage(1)}}><option>All patients</option><option>Registered today</option><option>Registered this month</option><option>Registered this week</option></select></div>{filteredRows.length ? <><div className="table-wrap"><table><thead><tr><th>Patient</th><th>Patient ID</th><th>Age / gender</th><th>Phone</th><th>Referring doctor</th><th>Registered</th><th/></tr></thead><tbody>{filteredRows.slice((page-1)*7,page*7).map(p=><tr key={p.id}><td><div className="person"><span className="person-avatar">{p.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</span><strong>{p.name}</strong></div></td><td className="mono">{p.id}</td><td>{p.age} yrs · {p.gender}</td><td>{p.phone}</td><td>{p.doctor}</td><td>{p.date}</td><td><div className="row-actions"><Link href={`/patients/${p.id}`}>View</Link><Link href={`/patients/${p.id}/edit`}>Edit</Link></div></td></tr>)}</tbody></table></div><div className="pagination"><span>Showing {(page-1)*7+1}–{Math.min(page*7,filteredRows.length)} of {filteredRows.length} patients</span><div><button aria-label="Previous page" disabled={page===1} onClick={()=>setPage(page-1)}><ChevronLeft size={16}/></button><span className="page-number">{page}</span><button aria-label="Next page" disabled={page*7>=filteredRows.length} onClick={()=>setPage(page+1)}><ChevronRight size={16}/></button></div></div></> : <EmptyState title={search?'No patients found':'No patients yet'} detail={search?'Try a different name, patient ID or phone number.':'Add your first patient to get started.'} action={!search&&<Button href="/patients/new"><Plus size={16}/> Register patient</Button>}/>}</section></> }
function Reports({rows,search,setSearch,onAction}:{rows:typeof reports;search:string;setSearch:(s:string)=>void;onAction:(s:string)=>void}) {const searchParams=useSearchParams();const [statusFilter,setStatusFilter]=useState(searchParams.get('status')==='draft'?'Draft':'All statuses');const [dateRange,setDateRange]=useState(searchParams.get('date')==='today'?'Today':'All dates');const filteredRows=rows.filter(report=>{if(statusFilter!=='All statuses'&&report.status!==statusFilter)return false;if(dateRange==='All dates')return true;const date=new Date(report.date);const now=new Date();if(dateRange==='Today')return date.toDateString()===now.toDateString();if(dateRange==='This month')return date.getFullYear()===now.getFullYear()&&date.getMonth()===now.getMonth();return date>=new Date(now.getTime()-7*24*60*60*1000)});return <><PageHead eyebrow="REPORT MANAGEMENT" title="Saved reports" subtitle={`${rows.length} reports in this demo workspace.`} action={<Button href="/reports/new"><Plus size={17}/> New report</Button>}/><section className="panel listing-panel"><div className="list-toolbar"><label className="inline-search"><Search size={16}/><input aria-label="Search reports" placeholder="Search report, patient or ID…" value={search} onChange={e=>setSearch(e.target.value)}/></label><select aria-label="Filter report status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>All statuses</option><option>Issued</option><option>Draft</option></select><select aria-label="Date range" value={dateRange} onChange={e=>setDateRange(e.target.value)}><option>All dates</option><option>Today</option><option>Last 7 days</option><option>This month</option></select></div><div className="table-wrap"><table><thead><tr><th>Report no.</th><th>Patient</th><th>Patient ID</th><th>Report date</th><th>Tests</th><th>Amount</th><th>Payment</th><th>Status</th><th/></tr></thead><tbody>{filteredRows.map(r=><tr key={r.id}><td className="mono">{r.id}</td><td>{r.patient}</td><td className="mono">{r.patientId}</td><td>{r.date}</td><td>{r.tests}</td><td>{money(r.amount)}</td><td><span className={`status-pill ${r.payment==='Paid'?'status-issued':'status-draft'}`}><i/>{r.payment}</span></td><td><span className={`status-pill ${r.status==='Issued'?'status-issued':'status-draft'}`}><i/>{r.status}</span></td><td><Link className="row-link" href={`/reports/${r.id}`} aria-label={`View report ${r.id}`}><ArrowRight size={16}/></Link></td></tr>)}</tbody></table></div><div className="pagination"><span>Showing {rows.length} reports</span><div><button aria-label="Previous page" disabled><ChevronLeft size={16}/></button><span className="page-number">1</span><button aria-label="Next page" disabled><ChevronRight size={16}/></button></div></div></section></>}
function Catalogue({search,setSearch,onAction}:{search:string;setSearch:(s:string)=>void;onAction:(s:string)=>void}) {const [category,setCategory]=useState('All tests');const [statusFilter,setStatusFilter]=useState('Any status');const [priceFilter,setPriceFilter]=useState('Any price');const cats=['All tests','Biochemistry','Clinical Pathology','Haematology','Microbiology','Serology / Immunology'];const filtered=tests.filter(t=>(`${t.name} ${t.category}`.toLowerCase().includes(search.toLowerCase()))&&(category==='All tests'||t.category===category)&&(statusFilter==='Any status'||(statusFilter==='Active'?t.active!==false:t.active===false))&&(priceFilter==='Any price'||priceFilter==='Under ₹500'&&t.offer<500||priceFilter==='₹500–₹1,000'&&t.offer>=500&&t.offer<=1000||priceFilter==='Over ₹1,000'&&t.offer>1000));return <><PageHead eyebrow="LABORATORY SETUP" title="Test catalogue" subtitle="Manage the tests and pricing available at your laboratory." action={<Button href="/tests/new"><Plus size={17}/> Add new test</Button>}/><div className="catalogue-layout"><aside className="category-panel panel"><h3>Categories</h3>{cats.map(c=><button key={c} className={category===c?'category-active':''} onClick={()=>setCategory(c)}>{c}<span>{c==='All tests'?tests.length:tests.filter(t=>t.category===c).length}</span></button>)}</aside><section className="panel listing-panel catalogue-table"><div className="list-toolbar"><label className="inline-search"><Search size={16}/><input aria-label="Search test catalogue" placeholder="Search tests…" value={search} onChange={e=>setSearch(e.target.value)}/></label><select aria-label="Filter catalogue status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>Any status</option><option>Active</option><option>Inactive</option></select><select aria-label="Filter catalogue price" value={priceFilter} onChange={e=>setPriceFilter(e.target.value)}><option>Any price</option><option>Under ₹500</option><option>₹500–₹1,000</option><option>Over ₹1,000</option></select><span className="result-count">{filtered.length} tests</span></div><div className="table-wrap"><table><thead><tr><th>Test</th><th>Category</th><th>Parameters</th><th>Normal price</th><th>Offer price</th><th>Status</th><th/></tr></thead><tbody>{filtered.map(t=><tr key={t.code}><td><div><strong>{t.name}</strong><small className="cell-sub">{t.code}</small></div></td><td>{t.category}</td><td>{t.parameters}</td><td>{money(t.price)}</td><td><strong>{money(t.offer)}</strong></td><td><span className={`status-pill ${t.active===false?'status-draft':'status-issued'}`}><i/>{t.active===false?'Inactive':'Active'}</span></td><td><Link className="row-link" href={`/tests/${t.code}`} aria-label={`View ${t.name}`}><ArrowRight size={16}/></Link></td></tr>)}</tbody></table></div></section></div></>}
function FormPage({path,tests,selectedTests,setSelectedTests,onAction}:{path:string;tests:typeof import('@/lib/demo-data').tests;selectedTests:string[];setSelectedTests:(s:string[])=>void;onAction:(s:string)=>void}) {const cleanPath=path.replace(/\/+$/,'');const router=useRouter();const searchParams=useSearchParams();const reportToEdit=cleanPath.startsWith('/reports/')&&cleanPath.endsWith('/edit')?reports.find(entry=>entry.id===cleanPath.split('/')[2]):undefined;const [draftTestNames,setDraftTestNames]=useState<string[]>(reportToEdit?.testNames??[]);const selectedTestNames=reportToEdit?draftTestNames:selectedTests;const patientEdit=cleanPath.startsWith('/patients/')&&cleanPath.endsWith('/edit');const patientRecord=(patientEdit?patients.find(entry=>entry.id===cleanPath.split('/')[2]):undefined) as (typeof patients[number]&{dateOfBirth?:string;address?:string;notes?:string})|undefined;const testEdit=cleanPath.startsWith('/tests/')&&cleanPath.endsWith('/edit');const testRecord=testEdit?tests.find(entry=>entry.code===cleanPath.split('/')[2]):undefined;const patient=cleanPath==='/patients/new'||patientEdit, test=cleanPath==='/tests/new'||testEdit;const [name,setName]=useState(patientRecord?.name??reportToEdit?.patient??patients.find(entry=>entry.id===searchParams.get('patient'))?.name??'');const [phone,setPhone]=useState(patientRecord?.phone??'');const [patientAge,setPatientAge]=useState(patientRecord?String(patientRecord.age):'');const [patientDob,setPatientDob]=useState(patientRecord?.dateOfBirth??'');const [patientAddress,setPatientAddress]=useState(patientRecord?.address??'');const [patientNotes,setPatientNotes]=useState(patientRecord?.notes??'');const [patientGender,setPatientGender]=useState(patientRecord?.gender??'');const [patientDoctor,setPatientDoctor]=useState(patientRecord?.doctor??'');const [errors,setErrors]=useState('');const [reportSearch,setReportSearch]=useState('');const [selectedPatientId,setSelectedPatientId]=useState(reportToEdit?.patientId??searchParams.get('patient')??'');const [testSearch,setTestSearch]=useState('');const [testName,setTestName]=useState(testRecord?.name??'');const [testCode,setTestCode]=useState(testRecord?.code??'');const [testCategory,setTestCategory]=useState(testRecord?.category??'');const [testPrice,setTestPrice]=useState(testRecord?String(testRecord.price):'');const [testOffer,setTestOffer]=useState(testRecord?String(testRecord.offer):'');const [testActive,setTestActive]=useState(testRecord?.active!==false);const [parameters,setParameters]=useState<Array<TestParameter&{id:number}>>(testRecord?(testRecord.parameterDetails?.map((parameter,index)=>({id:index+1,...parameter}))??testRecord.parameterNames.map((name,index)=>({id:index+1,name,unit:testRecord.units[index]||'',type:'Unconfigured' as const,isVerified:false}))):[]);const [resultValues,setResultValues]=useState<Record<string,string>>(reportToEdit?.results??{});const [previewOpen,setPreviewOpen]=useState(false);const subtotal=tests.filter(t=>selectedTestNames.includes(t.name)).reduce((s,t)=>s+t.offer,0);const [discount,setDiscount]=useState(reportToEdit?String(Math.max(0,subtotal-reportToEdit.amount)):'0');const [initialPayment,setInitialPayment]=useState('0');const [paymentMethod,setPaymentMethod]=useState('Cash');const total=Math.max(0,subtotal-Math.max(0,Number(discount)||0));const paidAmount=reportToEdit?(reportToEdit.payment==='Paid'?reportToEdit.amount:reportToEdit.payment.startsWith('Partial · ')?Number(reportToEdit.payment.split('·')[1]?.trim())||0:0):Number(initialPayment)||0;return <><PageHead eyebrow={patient?'PATIENT MANAGEMENT':test?'LABORATORY SETUP':'REPORT WORKSPACE'} title={reportToEdit?'Edit draft report':patientEdit?'Edit patient':patient?'Register patient':testEdit?'Edit test':test?'Add new test':'Create new report'} subtitle={reportToEdit?'Update this draft while preserving its entered results.':patientEdit?'Update contact and referral details for this patient.':patient?'Add a patient record to the laboratory registry.':testEdit?'Edit catalogue details and parameters.':test?'Configure a new test for the laboratory catalogue.':'Start a report by selecting a patient and adding tests.'} action={<Button href={patient?'/patients':test?'/tests':'/dashboard'} secondary>Cancel</Button>}/>{errors&&<div className="form-error" role="alert">{errors}</div>}<div className="form-layout"><div className="form-main">{patient?<><section className="panel form-panel"><div className="form-section-head"><span className="section-index">01</span><div><h2>Patient information</h2><p>Fields marked with an asterisk are required.</p></div></div><div className="fields-grid"><Field label="Full name *"><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Ananya Sharma"/></Field><Field label="Date of birth"><input type="date" value={patientDob} onChange={e=>{const value=e.target.value;setPatientDob(value);if(value){const birth=new Date(`${value}T00:00:00`);const today=new Date();let age=today.getFullYear()-birth.getFullYear();if(today.getMonth()<birth.getMonth()||(today.getMonth()===birth.getMonth()&&today.getDate()<birth.getDate()))age-=1;setPatientAge(String(age))}}}/></Field><Field label="Age"><input type="number" min="0" max="130" value={patientAge} onChange={e=>setPatientAge(e.target.value)} placeholder="Age in years"/></Field><Field label="Gender"><select value={patientGender} onChange={e=>setPatientGender(e.target.value)}><option value="">Select gender</option><option>Female</option><option>Male</option><option>Other</option><option>Prefer not to say</option></select></Field><Field label="Phone number *"><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210"/></Field><Field label="Address"><input value={patientAddress} onChange={e=>setPatientAddress(e.target.value)} placeholder="Street, city"/></Field></div></section><section className="panel form-panel"><div className="form-section-head"><span className="section-index">02</span><div><h2>Additional information</h2><p>Optional details for this patient record.</p></div></div><div className="fields-grid"><Field label="Referring doctor"><input value={patientDoctor} onChange={e=>setPatientDoctor(e.target.value)} placeholder="Doctor name"/></Field><Field label="Registration date"><input type="date" defaultValue={new Date().toISOString().slice(0,10)}/></Field><Field label="Notes" wide><textarea rows={3} value={patientNotes} onChange={e=>setPatientNotes(e.target.value)} placeholder="Add an internal note…"/></Field></div></section></>:test?<><section className="panel form-panel"><div className="form-section-head"><span className="section-index">01</span><div><h2>Test details</h2><p>Set the catalogue name, category and pricing.</p></div></div><div className="fields-grid"><Field label="Test name *"><input value={testName} onChange={e=>setTestName(e.target.value)} placeholder="e.g. Complete Blood Count"/></Field><Field label="Test code"><input value={testCode} onChange={e=>setTestCode(e.target.value)} placeholder="e.g. CBC-01"/></Field><Field label="Category"><select value={testCategory} onChange={e=>setTestCategory(e.target.value)}><option value="">Select category</option>{['Biochemistry','Clinical Pathology','Haematology','Microbiology','Serology / Immunology','Other'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Normal price (₹)"><input type="number" min="0" value={testPrice} onChange={e=>setTestPrice(e.target.value)} placeholder="0"/></Field><Field label="Offer price (₹)"><input type="number" min="0" value={testOffer} onChange={e=>setTestOffer(e.target.value)} placeholder="0"/></Field><Field label="Catalogue status"><select value={testActive?'Active':'Inactive'} onChange={e=>setTestActive(e.target.value==='Active')}><option>Active</option><option>Inactive</option></select></Field></div></section><section className="panel form-panel"><div className="form-section-head"><span className="section-index">02</span><div><h2>Parameters</h2><p>Reference ranges must be reviewed and approved before clinical use.</p></div></div><div className="unverified-note"><span className="footnote-mark">i</span> Reference ranges are not configured here and must be professionally reviewed before clinical use.</div><div className="parameter-builder">{parameters.map((parameter,index)=><div className="parameter-builder-row" key={parameter.id}><label className="field"><span>Parameter name</span><input aria-label={`Parameter ${index+1} name`} value={parameter.name} onChange={event=>setParameters(current=>current.map(item=>item.id===parameter.id?{...item,name:event.target.value}:item))} placeholder="e.g. Haemoglobin"/></label><label className="field"><span>Data type</span><select aria-label={`Parameter ${index+1} data type`} value={parameter.type} onChange={event=>setParameters(current=>current.map(item=>item.id===parameter.id?{...item,type:event.target.value as TestParameter['type']}:item))}><option>Unconfigured</option><option>Numeric</option><option>Qualitative</option><option>Text</option></select></label><label className="field"><span>Unit</span><input aria-label={`Parameter ${index+1} unit`} value={parameter.unit} onChange={event=>setParameters(current=>current.map(item=>item.id===parameter.id?{...item,unit:event.target.value}:item))} placeholder="e.g. g/dL"/></label><label className="field"><span>Decimal precision</span><input aria-label={`Parameter ${index+1} decimal precision`} type="number" min="0" max="6" value={parameter.precision??''} onChange={event=>setParameters(current=>current.map(item=>item.id===parameter.id?{...item,precision:event.target.value===''?undefined:Math.min(6,Math.max(0,Number(event.target.value)||0))}:item))}/></label><div className="parameter-order"><button type="button" className="button button-secondary" aria-label={`Move parameter ${index+1} up`} disabled={index===0} onClick={()=>setParameters(current=>{const next=[...current];[next[index-1],next[index]]=[next[index],next[index-1]];return next})}>↑</button><button type="button" className="button button-secondary" aria-label={`Move parameter ${index+1} down`} disabled={index===parameters.length-1} onClick={()=>setParameters(current=>{const next=[...current];[next[index+1],next[index]]=[next[index],next[index+1]];return next})}>↓</button><button type="button" className="button button-secondary" aria-label={`Remove parameter ${index+1}`} onClick={()=>setParameters(current=>current.filter(item=>item.id!==parameter.id))}><X size={15}/></button></div></div>)}</div><button type="button" className="button button-secondary" onClick={()=>setParameters(current=>[...current,{id:Date.now()+Math.random(),name:'',unit:'',type:'Numeric',precision:2,isVerified:false}])}><Plus size={16}/> Add parameter</button></section></>:<><section className="panel form-panel"><div className="form-section-head"><span className="section-index">01</span><div><h2>Patient details</h2><p>Search for an existing patient or add a new one without losing this draft.</p></div><Button href="/patients/new" secondary><Plus size={15}/> Add patient</Button></div><div className="fields-grid"><Field label="Search patient *" wide><input placeholder="Search by name, patient ID or phone number" onChange={e=>setReportSearch(e.target.value)} /></Field>{reportSearch && <div className="search-results">{patients.filter(p=>`${p.name} ${p.id} ${p.phone}`.toLowerCase().includes(reportSearch.toLowerCase())).slice(0,3).map(p=><button key={p.id} onClick={()=>{setName(p.name);setSelectedPatientId(p.id);setReportSearch('')}}><span className="person-avatar">{p.name.slice(0,1)}</span><span><strong>{p.name}</strong><small>{p.id} · {p.phone}</small></span><Check size={16}/></button>)}</div>}{name&&<div className="selected-patient"><Check size={15}/><strong>{name}</strong><span>Patient selected</span><button onClick={()=>{setName('');setSelectedPatientId('')}} aria-label="Remove selected patient"><X size={15}/></button></div>}</div></section><section className="panel form-panel"><div className="form-section-head"><span className="section-index">02</span><div><h2>Select tests</h2><p>Choose one or more tests from the catalogue.</p></div></div><div className="test-picker"><label className="inline-search"><Search size={15}/><input placeholder="Find a test…" value={testSearch} onChange={e=>setTestSearch(e.target.value)}/></label><div className="test-picker-list">{tests.filter(t=>t.active!==false&&t.name.toLowerCase().includes(testSearch.toLowerCase())).slice(0,12).map(t=><div className="test-option" key={t.code}><div><strong>{t.name}</strong><small>{t.category} · {t.parameters} parameters</small></div><div><strong>{money(t.offer)}</strong><button className={`add-test ${selectedTestNames.includes(t.name)?'added':''}`} aria-label={`${selectedTestNames.includes(t.name)?'Remove':'Add'} ${t.name} ${selectedTestNames.includes(t.name)?'from':'to'} report`} onClick={()=>{const current=reportToEdit?draftTestNames:selectedTests;const setCurrent=reportToEdit?setDraftTestNames:setSelectedTests;setCurrent(current.includes(t.name)?current.filter(x=>x!==t.name):[...current,t.name])}}>{selectedTestNames.includes(t.name)?<Check size={15}/>:<Plus size={15}/>}</button></div></div>)}</div></div></section>{selectedTestNames.length>0&&<section className="panel form-panel"><div className="form-section-head"><span className="section-index">03</span><div><h2>Results</h2><p>Enter observed values. Reference intervals are automatically matched against approved patient criteria.</p></div></div>{selectedTestNames.map(t=>{const selectedPat=patients.find(p=>p.id===selectedPatientId);const effectiveAge=patientAge||selectedPat?.age;const effectiveGender=patientGender||selectedPat?.gender;return <div className="result-test" key={t}><h3><FlaskConical size={16}/>{t}</h3>{tests.find(x=>x.name===t)?.parameterNames.map((p,i)=>{const definition=tests.find(x=>x.name===t);const parameter=definition?.parameterDetails?.find(item=>item.name===p);const value=resultValues[`${t}:${p}`]||'';const evalRes=evaluateResult(t,p,value,{age:effectiveAge,gender:effectiveGender},definition?.units[i],false);return <div className="result-row" key={p}><span>{p}</span>{parameter?.type==='Qualitative'?<select aria-label={`${t} ${p} result`} value={value} onChange={e=>setResultValues(current=>({...current,[`${t}:${p}`]:e.target.value}))}><option value="">Select result</option><option>Negative</option><option>Positive</option><option>Detected</option><option>Not detected</option><option>Reactive</option><option>Non-reactive</option><option>Trace</option></select>:<input aria-label={`${t} ${p} result`} type={parameter?.type==='Numeric'?'number':'text'} step={parameter?.type==='Numeric'?1/10**(parameter.precision??0):undefined} value={value} onChange={e=>setResultValues(current=>({...current,[`${t}:${p}`]:e.target.value}))} placeholder="Enter result"/>}<span>{definition?.units[i]||'—'}</span><span className="range-unverified">{evalRes.referenceDisplay}</span>{value?<span className={`result-eval-badge badge-${evalRes.badgeStyle}`}>{evalRes.arrowSymbol} {evalRes.statusLabel}</span>:<span className="result-eval-badge badge-neutral">Pending</span>}</div>})}</div>})}</section>}</>}</div><aside className="form-aside"><section className="panel summary-card"><h3>{patient?'Registration summary':test?'Test setup':'Billing summary'}</h3>{patient?<><div className="summary-row"><span>Patient ID</span><strong>Assigned on save</strong></div><div className="summary-row"><span>Registration date</span><strong>Today</strong></div><div className="demo-side-note">Record is saved directly to the database and synchronized in real time.</div></>:test?<><div className="summary-row"><span>Clinical review</span><strong>Required</strong></div><div className="demo-side-note">Test parameters and reference intervals must be clinically validated before issuing reports.</div></>:<><div className="summary-row"><span>Selected tests</span><strong>{selectedTestNames.length}</strong></div>{selectedTestNames.map(t=><div className="summary-row" key={t}><span>{t}</span><strong>{money(tests.find(x=>x.name===t)?.offer||0)}</strong></div>)}<div className="summary-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><Field label="Discount (₹)"><input type="number" min="0" max={subtotal} value={discount} onChange={e=>setDiscount(e.target.value)}/></Field><div className="summary-total"><span>Final amount</span><strong>{money(total)}</strong></div>{!reportToEdit&&<><Field label="Initial payment (₹)"><input type="number" min="0" max={total} value={initialPayment} onChange={e=>setInitialPayment(e.target.value)}/></Field><Field label="Payment method"><select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}><option>Cash</option><option>UPI</option><option>Card</option><option>Bank transfer</option></select></Field></>}<div className="summary-row"><span>Balance due</span><strong>{money(Math.max(0,total-paidAmount))}</strong></div><div className="demo-side-note">Amounts and ledger balances are derived from configured catalogue prices.</div></>}</section><div className="aside-actions"><Button onClick={async ()=>{setErrors('');if(patient&&(!name.trim()||!phone.trim())){setErrors('Enter a patient name and phone number.');return}if(patientDob&&new Date(`${patientDob}T00:00:00`)>new Date()){setErrors('Date of birth cannot be in the future.');return}if(patientAge&&(Number(patientAge)<0||Number(patientAge)>130)){setErrors('Enter a valid age between 0 and 130.');return}try{if(patient){if(patientEdit&&patientRecord){await syncUpdatePatient(patientRecord.id,{name:name.trim(),phone:phone.trim(),age:Number(patientAge)||0,gender:patientGender||'Not specified',doctor:patientDoctor.trim()||'Not specified',dateOfBirth:patientDob,address:patientAddress.trim(),notes:patientNotes.trim()});onAction('Patient updated successfully.');router.push(`/patients/${patientRecord.id}`);return}const record=await syncCreatePatient({name,phone,age:Number(patientAge)||undefined,gender:patientGender,doctor:patientDoctor,dateOfBirth:patientDob,address:patientAddress,notes:patientNotes});onAction('Patient registered successfully.');router.push(`/patients/${record.id}`);return}if(test){if(!testName.trim()||!testCode.trim()||!testCategory||!testPrice){setErrors('Enter a test name, code, category and price.');return}const input={name:testName.trim(),code:testCode.trim(),category:testCategory,price:Number(testPrice),offer:Number(testOffer||testPrice),parameters:parameters.map(({id,...parameter})=>parameter),active:testActive};if(testEdit&&testRecord){const record=await syncUpdateTest(testRecord.code,input);onAction('Test updated successfully.');router.push(`/tests/${record?.code || testRecord.code}`);return}const record=await syncAddTest(input);onAction('Test added to catalogue successfully.');router.push(`/tests/${record.code}`);return}if(reportToEdit){if(!selectedPatientId||!selectedTestNames.length){setErrors('Select a patient and at least one test before saving the draft.');return}if(!Number.isFinite(Number(discount))||Number(discount)<0||Number(discount)>subtotal){setErrors('Enter a discount between zero and the test subtotal.');return}await syncUpdateDraftReport(reportToEdit.id,{patientId:selectedPatientId,testNames:selectedTestNames,amount:total,results:resultValues});onAction('Draft report updated successfully.');router.push(`/reports/${reportToEdit.id}`);return}if(path==='/reports/new'){if(!selectedPatientId||!selectedTestNames.length){setErrors('Select a patient and at least one test before saving the draft.');return}const initialAmount=Number(initialPayment)||0;if(!Number.isFinite(Number(discount))||Number(discount)<0||Number(discount)>subtotal){setErrors('Enter a discount between zero and the test subtotal.');return}if(initialAmount<0||initialAmount>total){setErrors('Initial payment cannot exceed the final amount.');return}const report=await syncCreateReport({patientId:selectedPatientId,testNames:selectedTestNames,amount:total,results:resultValues});if(initialAmount>0)await syncRecordPayment({reportId:report.id,patientId:selectedPatientId,amount:initialAmount,paymentMethod,notes:'Initial payment at report creation'});onAction('Report draft saved successfully.');setSelectedTests([]);router.push(`/reports/${report.id}`);return}onAction('No changes were made.')}catch(error){setErrors(error instanceof Error?error.message:'Unable to save this record.')}}}><Check size={16}/>{reportToEdit?'Update draft':patientEdit?'Save changes':patient?'Save patient':testEdit?'Save changes':test?'Save test':'Save draft'}</Button>{path==='/reports/new'&&<Button secondary onClick={()=>setPreviewOpen(true)}>Preview report</Button>}</div></aside></div>{previewOpen&&<div className="preview-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)setPreviewOpen(false)}}><section className="panel report-preview-modal" role="dialog" aria-modal="true" aria-labelledby="report-preview-title"><div className="panel-head"><div><div className="eyebrow">DRAFT PREVIEW</div><h2 id="report-preview-title">Laboratory report</h2></div><button className="icon-button" aria-label="Close report preview" onClick={()=>setPreviewOpen(false)}><X size={17}/></button></div><div className="report-patient-box"><div><small>Patient name</small><strong>{name||'Select a patient'}</strong></div><div><small>Tests</small><strong>{selectedTestNames.length}</strong></div><div><small>Estimated amount</small><strong>{money(total)}</strong></div></div><div className="preview-test-list">{selectedTestNames.map(testName=><div key={testName}><strong>{testName}</strong>{tests.find(test=>test.name===testName)?.parameterNames.map(parameter=><span key={parameter}>{parameter}: {resultValues[`${testName}:${parameter}`]||'Not entered'}</span>)}</div>)}</div><div className="unverified-note"><span className="footnote-mark">i</span> Draft preview only. Values and ranges have not been clinically verified.</div><div className="settings-save"><span>Not an issued medical report.</span><button className="button button-primary" onClick={()=>setPreviewOpen(false)}>Continue editing</button></div></section></div>}</>}
function Field({label,children,wide}:{label:string;children:React.ReactNode;wide?:boolean}){return <label className={`field ${wide?'field-wide':''}`}><span>{label}</span>{children}</label>}
function EmptyState({title,detail,action}:{title:string;detail:string;action?:React.ReactNode}){return <div className="empty-state"><div className="empty-icon"><FileText size={21}/></div><h3>{title}</h3><p>{detail}</p>{action}</div>}
function Billing() {const searchParams=useSearchParams();const [query,setQuery]=useState('');const [statusFilter,setStatusFilter]=useState(searchParams.get('status')==='outstanding'?'Outstanding':'All payments');const [dateFilter,setDateFilter]=useState(searchParams.get('date')==='today'?'Today':'All dates');const [startDate,setStartDate]=useState('');const [endDate,setEndDate]=useState('');const today=new Date();const paidSoFar=(report:typeof reports[number])=>report.payment==='Paid'?report.amount:report.payment.startsWith('Partial · ')?Number(report.payment.split('·')[1]?.trim())||0:0;const collectedToday=paymentLedger.filter(payment=>new Date(payment.date).toDateString()===today.toDateString()).reduce((sum,payment)=>sum+payment.amount,0);const collectedMonth=paymentLedger.filter(payment=>{const date=new Date(payment.date);return date.getMonth()===today.getMonth()&&date.getFullYear()===today.getFullYear()}).reduce((sum,payment)=>sum+payment.amount,0);const totalOutstanding=reports.reduce((sum,report)=>sum+report.amount-paidSoFar(report),0);const visibleReports=reports.filter(report=>{if(query&&!`${report.id} ${report.patient} ${report.patientId}`.toLowerCase().includes(query.toLowerCase()))return false;if(statusFilter==='Outstanding'&&paidSoFar(report)>=report.amount)return false;if(statusFilter==='Paid'&&report.payment!=='Paid')return false;if(statusFilter==='Unpaid'&&report.payment!=='Pending')return false;if(statusFilter==='Partial'&&!report.payment.startsWith('Partial · '))return false;const date=new Date(report.date);if(dateFilter==='Today'&&date.toDateString()!==today.toDateString())return false;if(dateFilter==='This month'&&(date.getMonth()!==today.getMonth()||date.getFullYear()!==today.getFullYear()))return false;if(dateFilter==='Custom'&&((startDate&&date<new Date(startDate))||(endDate&&date>new Date(`${endDate}T23:59:59`))))return false;return true});return <><PageHead eyebrow="FINANCE" title="Billing" subtitle="Track collections, outstanding balances and payment activity." action={<Button href="/billing/new"><Plus size={16}/> Record payment</Button>}/><div className="stats-grid billing-stats">{[['Today’s collections',money(collectedToday),`${paymentLedger.filter(payment=>new Date(payment.date).toDateString()===today.toDateString()).length} transactions`],['This month',money(collectedMonth),`${paymentLedger.length} recorded payments`],['Outstanding',money(totalOutstanding),`${reports.filter(report=>paidSoFar(report)<report.amount).length} open reports`],['Transactions',String(paymentLedger.length),'This demo session']].map(([a,b,c])=><article className="stat-card" key={a}><div className="stat-top"><span>{a}</span><CreditCard size={17}/></div><strong className="stat-value">{b}</strong><div className="stat-change">{c}</div></article>)}</div><section className="panel listing-panel"><div className="panel-head"><div><h2>Recent transactions</h2><p>Payments recorded in this demo workspace</p></div><div className="billing-controls"><label className="inline-search"><Search size={14}/><input aria-label="Search bills" placeholder="Search patient or bill…" value={query} onChange={event=>setQuery(event.target.value)}/></label><select aria-label="Filter payment status" value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}><option>All payments</option><option>Outstanding</option><option>Paid</option><option>Unpaid</option><option>Partial</option></select><select aria-label="Filter billing date" value={dateFilter} onChange={event=>setDateFilter(event.target.value)}><option>All dates</option><option>Today</option><option>This month</option><option>Custom</option></select></div></div>{dateFilter==='Custom'&&<div className="billing-custom-range"><label className="field"><span>From</span><input aria-label="Billing date from" type="date" value={startDate} onChange={event=>setStartDate(event.target.value)}/></label><label className="field"><span>To</span><input aria-label="Billing date to" type="date" value={endDate} onChange={event=>setEndDate(event.target.value)}/></label></div>}<div className="table-wrap"><table><thead><tr><th>Transaction</th><th>Patient</th><th>Report</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Method</th><th>Payment date</th><th>Status</th></tr></thead><tbody>{visibleReports.map((r,i)=><tr key={r.id}><td className="mono">{paymentLedger.find(payment=>payment.reportId===r.id)?.id||'—'}</td><td>{r.patient}</td><td className="mono"><Link href={`/billing/${r.id}`}>{r.id}</Link></td><td>{money(r.amount)}</td><td>{money(r.payment==='Paid'?r.amount:r.payment.startsWith('Partial · ')?Number(r.payment.split('·')[1]?.trim())||0:0)}</td><td>{money(r.payment==='Paid'?0:r.payment.startsWith('Partial · ')?Math.max(0,r.amount-(Number(r.payment.split('·')[1]?.trim())||0)):r.amount)}</td><td>{paymentLedger.find(payment=>payment.reportId===r.id)?.method||'—'}</td><td>{paymentLedger.find(payment=>payment.reportId===r.id)?.date||'—'}</td><td><span className={`status-pill ${r.payment==='Paid'?'status-issued':'status-draft'}`}><i/>{r.payment}</span></td></tr>)}</tbody></table></div></section></>}
function LegacyAnalyticsPage(){return <><PageHead eyebrow="BUSINESS OVERVIEW" title="Analytics" subtitle="A clear view of laboratory activity. Figures are demonstration data." action={<select className="date-select" aria-label="Select date range"><option>Last 30 days</option><option>Last 7 days</option><option>This year</option></select>}/><div className="stats-grid">{[['Patients registered','384','+12.8%'],['Reports issued','726','+8.3%'],['Collections','₹4.82L','+10.1%'],['Average bill','₹1,245','+3.2%']].map(([a,b,c])=><article className="stat-card" key={a}><div className="stat-top"><span>{a}</span><ChartNoAxesCombined size={17}/></div><strong className="stat-value">{b}</strong><div className="stat-change is-positive"><ArrowUpRight size={14}/>{c} from previous period</div></article>)}</div><div className="analytics-grid"><section className="panel chart-panel"><div className="panel-head"><div><h2>Patient registrations</h2><p>Daily registrations · last 7 days</p></div><span className="chart-legend"><i/> Patients</span></div><div className="bar-chart" aria-label="Bar chart of patient registrations"><div className="chart-y"><span>30</span><span>20</span><span>10</span><span>0</span></div><div className="chart-bars">{[['M',38],['T',58],['W',47],['T',72],['F',53],['S',88],['S',64]].map(([d,h],i)=><div className="bar-group" key={i}><span className="bar" style={{height:`${h}%`}}/><small>{d}</small></div>)}</div></div></section><section className="panel chart-panel"><div className="panel-head"><div><h2>Collections</h2><p>Weekly collections · INR</p></div><span className="chart-legend"><i/> Revenue</span></div><div className="revenue-visual"><div className="revenue-total">₹1,18,450<small>This week</small></div><div className="sparkline">{[25,42,35,68,48,82,72,94,66,78,57,90].map((h,i)=><span key={i} style={{height:`${h}%`}}/>)}</div><div className="chart-dates"><span>Nov 15</span><span>Nov 21</span></div></div></section></div><section className="panel"><div className="panel-head"><div><h2>Frequently ordered tests</h2><p>By number of reports · this month</p></div></div><div className="popular-list">{tests.slice(0,5).map((t,i)=><div className="popular-row" key={t.code}><span className="popular-rank">0{i+1}</span><strong>{t.name}</strong><span>{t.category}</span><div className="popular-track"><i style={{width:`${90-i*13}%`}}/></div><b>{[184,146,112,88,64][i]} orders</b></div>)}</div></section></>}
function LegacySettingsPage({path,onAction}:{path:string;onAction:(s:string)=>void}) {const [active,setActive]=useState(path.endsWith('security')?'Security':'Laboratory profile');const sections=['Laboratory profile','Branding & logo','Report configuration','Signatures','Billing settings','Test settings','Security','Preferences'];return <><PageHead eyebrow="CONFIGURATION" title={path.endsWith('security')?'Security settings':'Settings'} subtitle="Manage laboratory preferences and report presentation."/><div className="settings-layout"><aside className="panel settings-nav">{sections.map(s=><button key={s} className={(active===s||(path.endsWith('security')&&s==='Security'))?'settings-active':''} onClick={()=>{setActive(s);if(s==='Security')history.pushState({},'', '/settings/security');else if(path.endsWith('security'))history.pushState({},'', '/settings')}}>{s}</button>)}</aside><section className="panel settings-content"><div className="settings-title"><h2>{active}</h2><p>{active==='Security'?'Security controls are a UI preview only. Authentication is not connected.':'This information appears on your laboratory documents.'}</p></div>{active==='Security'?<><div className="settings-row"><div><strong>Owner account</strong><p>dr.arun@biohitech.example</p></div><span className="status-pill status-draft"><i/>Prototype</span></div><div className="settings-row"><div><strong>Multi-factor authentication</strong><p>Configure a second verification step for sign-in.</p></div><button className="button button-secondary" onClick={()=>onAction('MFA settings require an authentication backend.')}>Configure</button></div><div className="settings-row"><div><strong>Active sessions</strong><p>Session management will be available after authentication setup.</p></div><button className="button button-secondary" onClick={()=>onAction('No real sessions are tracked in the prototype.')}>View sessions</button></div></>:<><div className="fields-grid"><Field label="Laboratory name"><input defaultValue="BIO HI TECH"/></Field><Field label="Contact phone"><input defaultValue="+91 22 4567 8900"/></Field><Field label="Email address"><input defaultValue="care@biohitech.example"/></Field><Field label="Registration number"><input placeholder="Enter registration number"/></Field><Field label="Laboratory address" wide><textarea rows={3} defaultValue="Ground Floor, Health Plaza, Mumbai, Maharashtra"/></Field><Field label="Report footer text" wide><input placeholder="Thank you for choosing BIO HI TECH"/></Field><Field label="Default report format"><select><option>A4 portrait</option><option>Letter portrait</option></select></Field><Field label="Currency"><select><option>INR — Indian Rupee</option></select></Field></div><div className="settings-save"><span>Settings are not saved to a backend in this demo.</span><Button onClick={()=>onAction('Settings saved for this demo session only.')}>Save changes</Button></div></>}</section></div></>}
function Notifications({onAction}:{onAction:(s:string)=>void}){useSyncExternalStore(subscribeDemoData,getDemoDataVersion,()=>0);const unread=demoNotifications.filter(notification=>!notification.read).length;return <><PageHead eyebrow="ACTIVITY" title="Notifications" subtitle={`${demoNotifications.length} demo workspace events · ${unread} unread.`} action={<button className="button button-secondary" disabled={!unread} onClick={()=>{markAllNotificationsRead();onAction('All notifications marked as read.')}}>Mark all read</button>}/><section className="panel notification-list">{demoNotifications.length?demoNotifications.map((notification,index)=><div className={`notification-row ${notification.read?'notification-read':'notification-unread'}`} key={notification.id}><span className={`activity-icon activity-${index%4}`}><Bell size={16}/></span><div><strong>{notification.text}</strong><p>{notification.detail} · {notification.time}</p></div><Link className="text-link" href={notification.href} onClick={()=>markNotificationRead(notification.id)}>View</Link><button className="text-link" disabled={notification.read} onClick={()=>{markNotificationRead(notification.id);onAction('Notification marked as read.')}}>{notification.read?'Read':'Mark read'}</button></div>):<EmptyState title="No notifications yet" detail="New patient, report, catalogue and payment activity will appear here."/>}</section></>}
function AuthPage({forgot, onAuthenticated}:{forgot?:boolean; onAuthenticated?:()=>void}) {
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>(forgot ? 'forgot' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(true)
  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('bio_hitech_owner_email') || ''
      if (savedEmail) setEmail(savedEmail)
      if (window.location.hash.includes('type=recovery')) {
        setMode('reset')
      }
    }
    const authState = getAuthState()
    if (authState.isRecoveryMode) {
      setMode('reset')
    }
  }, [forgot])

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both owner username/email and password.')
      return
    }
    setBusy(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await signInOwner(email, password, rememberDevice)
      setBusy(false)
      if (res.success) {
        onAuthenticated?.()
      } else {
        setErrorMsg(res.error || 'Invalid credentials or unauthorized account.')
      }
    } catch (err: any) {
      setBusy(false)
      setErrorMsg(err?.message || 'Unable to connect to authentication service.')
    }
  }

  const handleSendRecoveryEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid owner email address.')
      return
    }
    setBusy(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await sendPasswordReset(email.trim())
      setBusy(false)
      if (res.success) {
        setSuccessMsg(res.message)
      } else {
        setErrorMsg(res.message)
      }
    } catch (err: any) {
      setBusy(false)
      setErrorMsg(err?.message || 'Failed to dispatch recovery email.')
    }
  }

  const handleUpdatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password.length < 8) {
      setErrorMsg('New password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }
    setBusy(true)
    setErrorMsg('')
    try {
      const res = await updateUserPassword(password)
      setBusy(false)
      if (res.success) {
        setSuccessMsg(res.message || 'Password successfully updated. You may now sign in.')
        setPassword('')
        setConfirmPassword('')
        setMode('login')
      } else {
        setErrorMsg(res.error || 'Failed to update password.')
      }
    } catch (err: any) {
      setBusy(false)
      setErrorMsg(err?.message || 'Error updating password.')
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand" aria-label="BIO HI TECH">
          <img src="/branding/bio-hitech-banner.png" alt="BIO HI TECH" className="auth-brand-banner" />
        </div>

        <div className="auth-heading">
          <span className="auth-eyebrow">
            {mode === 'forgot' ? 'ACCOUNT RECOVERY' : mode === 'reset' ? 'VERIFIED RECOVERY' : 'DAILY OWNER LOGIN'}
          </span>
          <h1>
            {mode === 'forgot' ? 'Reset Master Password' : mode === 'reset' ? 'Set New Password' : 'Sign In to Workspace'}
          </h1>
          <p>
            {mode === 'forgot'
              ? 'Enter your registered owner email to receive a verified recovery link.'
              : mode === 'reset'
              ? 'Enter your new laboratory master password to complete recovery.'
              : 'Enter your owner credentials to unlock the laboratory system.'}
          </p>
        </div>

        {errorMsg && (
          <div className="auth-error-box" role="alert">
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-success-box" role="status">
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="auth-form">
            <Field label="Owner username or email">
              <span className="auth-input-icon">
                <Mail size={17} />
                <input
                  required
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. owner@biohitech.com"
                />
              </span>
            </Field>

            <Field label="Password">
              <span className="auth-input-icon">
                <LockKeyhole size={17} />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your master password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </Field>

            <label className="remember-device">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={e => setRememberDevice(e.target.checked)}
              />
              Remember this device
            </label>

            <button className="button auth-submit" type="submit" disabled={busy}>
              {busy ? 'Verifying credentials…' : 'Sign In to Workspace'}
            </button>

            <div className="auth-links" style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="auth-nav-btn"
                onClick={() => {
                  setMode('forgot')
                  setErrorMsg('')
                  setSuccessMsg('')
                }}
              >
                Forgot password?
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleSendRecoveryEmail} className="auth-form">
            <Field label="Your registered owner email">
              <span className="auth-input-icon">
                <Mail size={17} />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. owner@biohitech.com"
                />
              </span>
            </Field>

            <button className="button auth-submit" type="submit" disabled={busy}>
              {busy ? 'Sending recovery link…' : 'Send Recovery Email'}
            </button>

            <div className="auth-links" style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="auth-nav-btn"
                onClick={() => {
                  setMode('login')
                  setErrorMsg('')
                  setSuccessMsg('')
                }}
              >
                Back to sign in
              </button>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleUpdatePassword} className="auth-form">
            <Field label="New master password (min 8 characters)">
              <span className="auth-input-icon">
                <LockKeyhole size={17} />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="New password (min 8 chars)"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </Field>

            <Field label="Confirm new password">
              <span className="auth-input-icon">
                <LockKeyhole size={17} />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={8}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </span>
            </Field>

            <button className="button auth-submit" type="submit" disabled={busy}>
              {busy ? 'Updating password…' : 'Update Master Password'}
            </button>

            <div className="auth-links" style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="auth-nav-btn"
                onClick={() => {
                  setMode('login')
                  setErrorMsg('')
                  setSuccessMsg('')
                }}
              >
                Back to sign in
              </button>
            </div>
          </form>
        )}
      </section>
      <footer className="auth-footer">BIO HI TECH · PRIVATE LABORATORY MANAGEMENT</footer>
    </main>
  )
}

function ReportPreviewPage({path,onAction}:{path:string;onAction:(s:string)=>void}){const dataVersion=useSyncExternalStore(subscribeDemoData,getDemoDataVersion,()=>0);const cleanPath=path.replace(/\/+$/,'');const parts=cleanPath.split('/');const id=parts[2]||'';const foundReport=reports.find(r=>r.id===id);useEffect(()=>{if(!foundReport){syncLoadCloudData()}},[foundReport]);if(!foundReport)return <EmptyState title="Report not found" detail="This report record does not exist in the database." action={<Button href="/reports" secondary>Back to reports</Button>}/>;const report=foundReport;return <><PageHead eyebrow="REPORT PRINT & DOCUMENT PREVIEW" title={`Print Preview — ${report.id}`} subtitle={`${report.patient} · ${report.date} · ${report.status}`} action={<><Button href={`/reports/${report.id}`} secondary><ArrowLeft size={16}/> Back to report details</Button><Button secondary onClick={()=>window.print()}><Printer size={16}/> Print / Save as PDF</Button></>}/><div className="report-preview-page-wrap"><ReportPrintSheet report={report} preview={true} showControls={true}/></div></>}

function Details({path,onAction}:{path:string;onAction:(s:string)=>void}){const dataVersion=useSyncExternalStore(subscribeDemoData,getDemoDataVersion,()=>0);const router=useRouter();const [printPreviewOpen,setPrintPreviewOpen]=useState(false);const cleanPath=path.replace(/\/+$/,'');const isPatient=cleanPath.startsWith('/patients/');const id=cleanPath.split('/').pop()||'';const foundPatient=patients.find(p=>p.id===id);const foundReport=reports.find(r=>r.id===id);if(isPatient&&!foundPatient)return <EmptyState title="Patient not found" detail="This patient record does not exist in the database." action={<Button href="/patients" secondary>Back to patients</Button>}/>;if(!isPatient&&!foundReport)return <EmptyState title="Report not found" detail="This report record does not exist in the database." action={<Button href="/reports" secondary>Back to reports</Button>}/>;const patient=foundPatient!;const report=foundReport!;return <><PageHead eyebrow={isPatient?'PATIENT PROFILE':'REPORT MANAGEMENT'} title={isPatient?patient.name:`Report ${report.id}`} subtitle={isPatient?`Patient ID ${patient.id} · Registered ${patient.date}`:`${report.patient} · ${report.date} · ${report.status}`} action={isPatient?<><Button href={`/patients/${patient.id}/edit`} secondary>Edit profile</Button><Button href={`/reports/new?patient=${patient.id}`}><Plus size={16}/> Create report</Button>{(patient as any).is_archived?<Button secondary onClick={async ()=>{try{await syncRestorePatient(patient.id);onAction('Patient restored to active roster.')}catch(e){onAction(e instanceof Error?e.message:'Error restoring patient.')}}}>Restore patient</Button>:<Button secondary onClick={async ()=>{if(!window.confirm('Archive this patient? They will be hidden from active lists.'))return;try{await syncArchivePatient(patient.id);onAction('Patient archived successfully.');router.push('/patients')}catch(e){onAction(e instanceof Error?e.message:'Error archiving patient.')}}}>Archive patient</Button>}<Button secondary onClick={async ()=>{if(!window.confirm('Permanently delete this patient? Note: Patients with orders, reports or invoices cannot be deleted.'))return;try{await syncDeletePatient(patient.id);onAction('Patient deleted successfully.');router.push('/patients')}catch(e){alert(e instanceof Error?e.message:'Patient deletion rejected.');onAction(e instanceof Error?e.message:'Patient deletion rejected.')}}}>Delete patient</Button></>:<><Button secondary href={`/reports/${report.id}/preview`}><Eye size={16}/> Preview A4</Button><Button secondary onClick={()=>window.print()}><Printer size={16}/> Print / save PDF</Button>{report.status==='Draft'&&<Button secondary href={`/reports/${report.id}/edit`}>Edit draft</Button>}{report.status==='Draft'&&<Button onClick={async ()=>{try{await syncIssueReport(report.id);onAction('Report issued successfully.')}catch(error){onAction(error instanceof Error?error.message:'Report could not be issued.')}}}><Check size={16}/> Issue report</Button>}{report.status==='Draft'&&<Button secondary onClick={async ()=>{if(!window.confirm('Are you sure you want to delete this draft report?'))return;try{await syncDeleteDraftReport(report.id);onAction('Draft report deleted.');router.push('/reports')}catch(error){onAction(error instanceof Error?error.message:'Could not delete draft report.')}}}>Delete draft</Button>}{report.status==='Issued'&&<Button onClick={async ()=>{try{const amendment=await syncCreateReportAmendment(report.id);onAction(`Amendment draft ${amendment.id} created; original report remains unchanged.`);router.push(`/reports/${amendment.id}/edit`)}catch(error){onAction(error instanceof Error?error.message:'Amendment draft could not be created.')}}}><FilePlus2 size={16}/> Create amendment</Button>}</>}/>{!isPatient&&<ReportPrintSheet report={report} preview={printPreviewOpen}/>}<div className="details-grid"><section className="panel form-panel"><div className="panel-head"><div><h2>{isPatient?'Patient overview':'Laboratory report'}</h2><p>{isPatient?'Personal and registration details':'Report contents and result summary'}</p></div>{!isPatient&&<span className={`status-pill ${report.status==='Issued'?'status-issued':'status-draft'}`}><i/>{report.status}</span>}</div>{isPatient?<div className="profile-details">{[['Patient ID',patient.id],['Age / gender',`${patient.age} years · ${patient.gender}`],['Phone',patient.phone],['Referring doctor',patient.doctor],['Registration date',patient.date],['Reports on file',String(patient.reports)]].map(([a,b])=><div key={a}><small>{a}</small><strong>{b}</strong></div>)}</div>:<> <div className="report-detail-head"><img src="/branding/bio-icon-192.png" alt="BIO HI TECH" className="report-detail-icon" /><div><strong>BIO HI TECH</strong><small>Diagnostic Laboratory · Mumbai, India</small></div><span className="report-id">{report.id}</span></div><div className="report-patient-box"><div><small>Patient name</small><strong>{report.patient}</strong></div><div><small>Patient ID</small><strong>{report.patientId}</strong></div><div><small>Report date</small><strong>{report.date}</strong></div>{reportAmendments[report.id]&&<div><small>Amends report</small><strong>{reportAmendments[report.id]}</strong></div>}<div><small>Bill amount</small><strong>{money(report.amount)}</strong></div><div><small>Payment status</small><strong>{report.payment}</strong></div><div><small>Balance due</small><strong>{money(Math.max(0,report.amount-(report.payment==='Paid'?report.amount:report.payment.startsWith('Partial · ')?Number(report.payment.split('·')[1]?.trim())||0:0)))}</strong></div></div><div className="report-results-head"><h3>Test results</h3><span>{report.tests} tests</span></div>{report.testNames.map(name=>{const test=tests.find(entry=>entry.name===name);return test?.parameterNames.map((parameter,index)=>{const value=report.results[`${name}:${parameter}`];const evalRes=evaluateResult(name,parameter,value,{age:patient?.age,gender:patient?.gender},test?.units[index],false);return <div className="report-result-row" key={`${name}:${parameter}`}><span><strong>{name}</strong><small>{parameter} · {value||'Result not entered'}</small></span><span className="range-unverified">{evalRes.referenceDisplay}</span><span>{value ? `${value} ${evalRes.arrowSymbol}` : '—'}</span><span className={`result-eval-badge badge-${evalRes.badgeStyle}`}>{evalRes.statusLabel}</span></div>})})}<div className="unverified-note"><span className="footnote-mark">i</span> Clinical reference intervals and result interpretations require owner verification.</div></>}</section><section className="panel timeline-panel"><h2>{isPatient?'Patient history':'Report activity'}</h2><p className="panel-subtitle">Chronological activity</p>{(isPatient?[{t:'Patient registered',d:patient.date},...reports.filter(entry=>entry.patientId===patient.id).map(entry=>({t:`${entry.status} report`,d:`${entry.id} · ${entry.date}`}))]:(reportRevisions[report.id]??[{version:1,status:report.status,date:report.date}]).map(revision=>({t:`Revision ${revision.version} · ${revision.status}`,d:revision.date}))).map((a,i)=><div className="timeline-item" key={i}><span className="timeline-dot"/><div><strong>{a.t}</strong><small>{a.d}</small></div></div>)}<div className="demo-side-note">Audited clinical records. All revisions and amendments are immutably logged in the database.</div>{!isPatient&&<Button href="/billing/new" secondary>Record payment</Button>}</section></div>{isPatient&&<PatientHistoryTabs patient={patient as typeof patient & {dateOfBirth?:string;address?:string;notes?:string}}/>}</>}
