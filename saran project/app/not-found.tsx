import { Suspense } from 'react'
import { LabApp } from '@/components/lab-app'

export default function NotFound() {
  return (
    <Suspense fallback={null}>
      <LabApp />
    </Suspense>
  )
}
