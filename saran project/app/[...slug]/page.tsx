import { Suspense } from 'react'
import { LabApp } from '@/components/lab-app'
import { reports, patients, tests } from '@/lib/demo-data'

export function generateStaticParams() {
  const staticRoutes: { slug: string[] }[] = [
    { slug: ['dashboard'] },
    { slug: ['patients'] },
    { slug: ['patients', 'new'] },
    { slug: ['reports'] },
    { slug: ['reports', 'new'] },
    { slug: ['tests'] },
    { slug: ['tests', 'new'] },
    { slug: ['catalogue'] },
    { slug: ['billing'] },
    { slug: ['billing', 'new'] },
    { slug: ['analytics'] },
    { slug: ['settings'] },
    { slug: ['settings', 'lab-profile'] },
    { slug: ['settings', 'branding'] },
    { slug: ['settings', 'reports'] },
    { slug: ['settings', 'signatures'] },
    { slug: ['settings', 'billing'] },
    { slug: ['settings', 'test-configuration'] },
    { slug: ['settings', 'security'] },
    { slug: ['settings', 'preferences'] },
    { slug: ['notifications'] },
    { slug: ['login'] },
    { slug: ['forgot-password'] },
  ]

  const knownReportIds = [
    'RPT-PDF-001', 'RPT-PDF-002', 'RPT-PDF-003', 'RPT-PDF-004', 'RPT-PDF-005', 'RPT-PDF-006', 'RPT-PDF-007', 'RPT-PDF-008', 'RPT-PDF-009', 'RPT-PDF-010',
    'RPT-261118-025', 'RPT-261121-031', 'RPT-261120-029', 'RPT-261120-030', 'RPT-261118-026', 'RPT-261121-032',
    ...reports.map((r) => r.id),
  ]
  const knownPatientIds = [
    'BHT-PDF-001', 'BHT-261118-001', 'BHT-261118-002',
    ...patients.map((p) => p.id),
  ]

  Array.from(new Set(knownPatientIds)).forEach((pid) => {
    staticRoutes.push({ slug: ['patients', pid] })
    staticRoutes.push({ slug: ['patients', pid, 'edit'] })
  })

  Array.from(new Set(knownReportIds)).forEach((rid) => {
    staticRoutes.push({ slug: ['reports', rid] })
    staticRoutes.push({ slug: ['reports', rid, 'edit'] })
    staticRoutes.push({ slug: ['reports', rid, 'preview'] })
    staticRoutes.push({ slug: ['billing', rid] })
  })

  // Add demo tests
  tests.slice(0, 15).forEach((t) => {
    staticRoutes.push({ slug: ['tests', t.code] })
    staticRoutes.push({ slug: ['tests', t.code, 'edit'] })
  })

  return staticRoutes
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LabApp />
    </Suspense>
  )
}

