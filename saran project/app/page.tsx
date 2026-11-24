import { Suspense } from 'react'
import { LabApp } from '@/components/lab-app'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LabApp />
    </Suspense>
  )
}
