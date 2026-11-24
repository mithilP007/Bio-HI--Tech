'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Download, Printer, AlertCircle } from 'lucide-react'
import { labProfile, appPreferences, defaultSignatures } from '@/lib/app-settings'
import { patients, reports, tests, type Patient, type BilledTestItem, type BillingSummaryData } from '@/lib/demo-data'
import { subscribeDemoData, getDemoDataVersion } from '@/lib/demo-store'
import { generateCode128Svg } from '@/lib/barcode-128'
import { generateQrCodeSvg } from '@/lib/qr-generator'
import { evaluateResult } from '@/lib/clinical-engine'
import { downloadReportPdf } from '@/lib/pdf-export'

type Report = typeof reports[number]

export type LetterheadMode = 'with-letterhead' | 'without-letterhead'

interface ReportPrintSheetProps {
  report: Report
  patient?: Patient
  preview?: boolean
  initialMode?: LetterheadMode
  showControls?: boolean
}

interface TestRow {
  testName: string
  department: string
  parameter: string
  value: string
  unit: string
  range: string
  isFirstInTest: boolean
  isFirstInDept: boolean
  note?: string
  status: string
  badgeStyle: 'low' | 'high' | 'normal' | 'borderline' | 'critical' | 'unverified' | 'neutral'
  arrowSymbol: '↑' | '↓' | ''
}

export function ReportPrintSheet({
  report,
  patient: propPatient,
  preview = false,
  initialMode = 'with-letterhead',
  showControls = true,
}: ReportPrintSheetProps) {
  const [mode, setMode] = useState<LetterheadMode>(initialMode)
  const [qrSvg, setQrSvg] = useState<string>('')
  const dataVersion = useSyncExternalStore(subscribeDemoData, getDemoDataVersion, () => 0)

  // Robust reactive patient lookup
  const patient = useMemo(() => {
    if (propPatient) return propPatient
    const found = patients.find((entry) => entry.id === report.patientId)
    if (found) return found
    return {
      id: report.patientId,
      name: report.patient || 'Patient',
      age: 0,
      gender: 'Not specified',
      phone: '',
      doctor: 'SELF',
      date: report.date,
      reports: 1,
    }
  }, [propPatient, report.patientId, report.patient, report.date, dataVersion])

  // Opaque verification token without patient PII
  const verificationUrl = useMemo(
    () => `https://biohitech.example/verify/${report.id}`,
    [report.id]
  )

  useEffect(() => {
    let active = true
    generateQrCodeSvg(verificationUrl).then((svg) => {
      if (active) setQrSvg(svg)
    })
    return () => {
      active = false
    }
  }, [verificationUrl])

  // Barcode encoding report/patient number
  const barcodeSvg = useMemo(
    () => generateCode128Svg(report.patientId || report.id, 32),
    [report.patientId, report.id]
  )

  // Flatten all parameters grouped by department and test
  const allRows = useMemo(() => {
    const rows: TestRow[] = []
    let lastDept = ''

    if (!Array.isArray(report.testNames) || report.testNames.length === 0) {
      return rows
    }

    report.testNames.forEach((name) => {
      const catalogueEntry = tests.find(
        (t) => t.name.toLowerCase() === name.toLowerCase() || t.code.toLowerCase() === name.toLowerCase()
      )
      const dept = catalogueEntry?.category?.toUpperCase() || 'BIOCHEMISTRY'
      const isFirstInDept = dept !== lastDept
      lastDept = dept

      const params = catalogueEntry?.parameterDetails || [
        { name: catalogueEntry?.name || name, unit: '', type: 'Text' as const, isVerified: false },
      ]

      params.forEach((param, pIdx) => {
        const paramKey = `${name}:${param.name}`
        const rawVal =
          report.results[paramKey] !== undefined
            ? report.results[paramKey]
            : catalogueEntry
            ? report.results[`${catalogueEntry.name}:${param.name}`]
            : undefined

        const val = rawVal !== undefined && rawVal !== '' ? rawVal : '—'
        const evalRes = evaluateResult(
          name,
          param.name,
          rawVal,
          { age: patient?.age, gender: patient?.gender },
          param.unit,
          false
        )

        // Historical report snapshot preservation
        const savedRange = report.resultIntervals?.[paramKey]
        const savedFlag = report.resultFlags?.[paramKey]
        const note = pIdx === params.length - 1 && catalogueEntry?.notes?.[0] ? catalogueEntry.notes[0] : undefined

        rows.push({
          testName: name,
          department: dept,
          parameter: param.name,
          value: val,
          unit: param.unit || evalRes.unit || '—',
          range: savedRange || evalRes.referenceDisplay,
          status: savedFlag || evalRes.statusLabel,
          badgeStyle: evalRes.badgeStyle,
          arrowSymbol: evalRes.arrowSymbol,
          isFirstInTest: pIdx === 0,
          isFirstInDept: isFirstInDept && pIdx === 0,
          note,
        })
      })
    })

    return rows
  }, [report.testNames, report.results, report.resultIntervals, report.resultFlags, patient])

  // Test-wise billing items resolution
  const billedItems: BilledTestItem[] = useMemo(() => {
    if (report.billedItems && report.billedItems.length > 0) {
      return report.billedItems
    }
    if (!Array.isArray(report.testNames) || report.testNames.length === 0) {
      return []
    }
    return report.testNames.map((tName, i) => {
      const cat = tests.find(
        (t) => t.name.toLowerCase() === tName.toLowerCase() || t.code.toLowerCase() === tName.toLowerCase()
      )
      const price = cat?.offer ?? cat?.price ?? 0
      return {
        testCode: cat?.code || `TEST-${i + 1}`,
        testName: tName,
        quantity: 1,
        unitPrice: price,
        discount: 0,
        amount: price,
      }
    })
  }, [report.billedItems, report.testNames])

  // Billing summary reconciliation
  const billingSummary: BillingSummaryData = useMemo(() => {
    if (report.billingSummary) {
      return report.billingSummary
    }
    const subtotal = report.subtotalAmount ?? billedItems.reduce((acc, it) => acc + it.amount, 0)
    const discount = report.discountAmount ?? 0
    const total = report.amount ?? Math.max(0, subtotal - discount)
    const paid =
      report.paidAmount ??
      (report.payment === 'Paid'
        ? total
        : report.payment?.startsWith('Partial')
        ? Number(report.payment.split('·')[1]?.trim()) || 0
        : 0)
    const balance = Math.max(0, total - paid)
    const paymentStatus =
      report.payment === 'Paid' ? 'Paid' : paid >= total && total > 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Pending'

    return {
      subtotal,
      discount,
      taxes: 0,
      additionalCharges: 0,
      total,
      paid,
      balance,
      paymentStatus,
    }
  }, [report.billingSummary, report.subtotalAmount, report.discountAmount, report.amount, report.paidAmount, report.payment, billedItems])

  // Content-aware pagination algorithm
  const pages = useMemo(() => {
    // Printable height limits in mm (excluding margins, patient table / continuation header, and footer)
    const PAGE_1_MAX_HEIGHT_MM = 158
    const PAGE_N_MAX_HEIGHT_MM = 215

    const calcRowHeightMm = (row: TestRow): number => {
      let h = 6.4 // base table row height
      if (row.isFirstInDept) h += 7.5 // department banner
      else if (row.isFirstInTest) h += 5.5 // test title
      if (row.note) {
        const noteLen = row.note.length
        if (noteLen > 240) h += 24
        else if (noteLen > 120) h += 16
        else h += 10
      }
      return h
    }

    if (allRows.length === 0) {
      return [[]]
    }

    const pageList: TestRow[][] = []
    let currentPageRows: TestRow[] = []
    let currentHeight = 0
    let currentPageLimit = PAGE_1_MAX_HEIGHT_MM

    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i]
      const rowH = calcRowHeightMm(row)

      // When starting a new test: inspect total test height to prevent awkward splits
      if (row.isFirstInTest) {
        let testTotalH = 0
        for (let j = i; j < allRows.length; j++) {
          if (j > i && allRows[j].isFirstInTest) break
          testTotalH += calcRowHeightMm(allRows[j])
        }

        const remainingSpace = currentPageLimit - currentHeight
        if (currentPageRows.length > 0 && testTotalH > remainingSpace && testTotalH <= PAGE_N_MAX_HEIGHT_MM) {
          pageList.push(currentPageRows)
          currentPageRows = []
          currentHeight = 0
          currentPageLimit = PAGE_N_MAX_HEIGHT_MM
        }
      }

      // Check if individual row fits
      if (currentHeight + rowH > currentPageLimit && currentPageRows.length > 0) {
        pageList.push(currentPageRows)
        currentPageRows = []
        currentHeight = 0
        currentPageLimit = PAGE_N_MAX_HEIGHT_MM
      }

      currentPageRows.push(row)
      currentHeight += rowH
    }

    if (currentPageRows.length > 0) {
      pageList.push(currentPageRows)
    }

    return pageList.length > 0 ? pageList : [[]]
  }, [allRows])

  const totalPages = pages.length

  const resolvedPatientName = (patient?.name || report.patient || 'Patient').trim()
  const patientTitle = patient?.gender === 'Female' ? 'Ms. ' : patient?.gender === 'Male' ? 'Mr. ' : ''
  const patientDisplayName = `${patientTitle}${resolvedPatientName.toUpperCase()}`
  const ageGenderStr = `${patient?.age ? `${patient.age} Y / ` : ''}${patient?.gender || 'Not specified'}`
  const billNumber = report.orderId || report.id.replace(/\D/g, '').slice(-5) || '31045'
  const sampleDateTimeStr = report.sampleDate
    ? `${report.sampleDate}${report.sampleTime ? ` ${report.sampleTime}` : ''}`
    : `${report.date} 09:30 AM`

  const money = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`

  return (
    <div id="printable-report" className={`report-sheet-container ${preview ? 'is-preview' : ''}`}>
      {showControls && (
        <aside className="sheet-controls no-print" aria-label="Report printing configuration">
          <div className="sheet-mode-selector">
            <span className="mode-label">Print Stationery:</span>
            <div className="mode-buttons" role="radiogroup" aria-label="Letterhead option">
              <button
                type="button"
                role="radio"
                aria-checked={mode === 'with-letterhead'}
                className={`mode-btn ${mode === 'with-letterhead' ? 'is-active' : ''}`}
                onClick={() => setMode('with-letterhead')}
              >
                With Letterhead (Plain Paper)
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={mode === 'without-letterhead'}
                className={`mode-btn ${mode === 'without-letterhead' ? 'is-active' : ''}`}
                onClick={() => setMode('without-letterhead')}
              >
                Without Letterhead (Preprinted Pad)
              </button>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="mode-btn"
                style={{ background: '#08796e', color: '#fff', borderColor: '#065f57', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={async () => {
                  const filename = report.id.startsWith('RPT-') ? `BIO-HI-TECH-${report.id}.pdf` : `BIO-HI-TECH-RPT-${report.id}.pdf`
                  await downloadReportPdf(report.id, { filename })
                }}
              >
                <Download size={14} /> Download PDF
              </button>
              <button
                type="button"
                className="mode-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => window.print()}
              >
                <Printer size={14} /> Print Report
              </button>
            </div>
          </div>
          <p className="mode-explainer">
            {mode === 'with-letterhead'
              ? 'Printing on plain A4 paper: The high-resolution BIO HI TECH banner and clinic letterhead are included.'
              : 'Printing on preprinted stationery: Top 45mm margin is reserved blank so text prints cleanly below preprinted letterheads.'}
          </p>
        </aside>
      )}

      {pages.map((pageRows, pageIdx) => {
        const isFirstPage = pageIdx === 0
        const isLastPage = pageIdx === totalPages - 1
        const pageNum = pageIdx + 1

        return (
          <article
            key={`page-${pageNum}`}
            className={`report-sheet ${mode === 'with-letterhead' ? 'sheet-with-letterhead' : 'sheet-without-letterhead'}`}
            aria-label={`Laboratory report page ${pageNum} of ${totalPages}`}
          >
            {/* Top Header: Genuine Letterhead or Blank Margin */}
            {mode === 'with-letterhead' ? (
              <header className="sheet-letterhead-banner">
                <img
                  src="/branding/letterhead-original.jpeg"
                  alt="BIO HI TECH Diagnostic Laboratory Letterhead"
                  className="letterhead-image"
                />
              </header>
            ) : (
              <div className="sheet-blank-letterhead-margin" style={{ height: '45mm' }} />
            )}

            {/* Sheet Body Content */}
            <div className="sheet-body">
              {isFirstPage ? (
                /* Patient Information Block */
                <table className="sheet-patient-table">
                  <colgroup>
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '27%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '26%' }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td className="lbl">Name</td>
                      <td className="val">: <strong>{patientDisplayName}</strong></td>
                      <td rowSpan={5} className="qr-cell">
                        <div
                          className="qr-container"
                          aria-label="Report Verification QR Code"
                          dangerouslySetInnerHTML={{ __html: qrSvg }}
                        />
                        <span className="qr-caption">Scan to verify</span>
                      </td>
                      <td className="lbl">Registered Date</td>
                      <td className="val">: <strong>{report.date}</strong></td>
                    </tr>
                    <tr>
                      <td className="lbl">Patient ID</td>
                      <td className="val">: <strong>{report.patientId}</strong></td>
                      <td className="lbl">Sample Collected</td>
                      <td className="val">: <strong>{sampleDateTimeStr}</strong></td>
                    </tr>
                    <tr>
                      <td className="lbl">Age / Gender</td>
                      <td className="val">: <strong>{ageGenderStr}</strong></td>
                      <td className="lbl">Reported Date</td>
                      <td className="val">: <strong>{report.date}</strong></td>
                    </tr>
                    <tr>
                      <td className="lbl">Bill / Order No</td>
                      <td className="val">: <strong>{billNumber}</strong></td>
                      <td colSpan={2} rowSpan={2} className="barcode-cell">
                        <div
                          className="barcode-container"
                          aria-label={`Code 128 Barcode for ${report.patientId}`}
                          dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                        />
                        <span className="barcode-text">{report.patientId}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="lbl">Referred By</td>
                      <td className="val">: <strong>{(patient?.doctor || 'SELF / DIRECT').toUpperCase()}</strong></td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                /* Continuation Page Header */
                <div className="sheet-continuation-bar">
                  <span><strong>Name:</strong> {patientDisplayName}</span>
                  <span><strong>Patient ID:</strong> {report.patientId}</span>
                  <span><strong>Age/Gender:</strong> {ageGenderStr}</span>
                  <span><strong>Page {pageNum} of {totalPages}</strong></span>
                </div>
              )}

              {/* Zero-test empty state handling */}
              {allRows.length === 0 ? (
                <div className="sheet-empty-draft-notice">
                  <AlertCircle size={26} style={{ color: '#d97706', marginBottom: '8px' }} />
                  <h3>Incomplete Draft — No Tests Assigned</h3>
                  <p>This laboratory order currently has 0 tests selected. Please add tests and enter results to generate a complete clinical report.</p>
                  <div className="no-print" style={{ marginTop: '12px' }}>
                    <a href={`/reports/edit?id=${report.id}`} className="mode-btn" style={{ background: '#08796e', color: '#fff', textDecoration: 'none', display: 'inline-block' }}>
                      Edit Draft & Add Tests
                    </a>
                  </div>
                </div>
              ) : (
                /* Investigation Results Table */
                <table className="sheet-results-table">
                  <colgroup>
                    <col style={{ width: '34%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '16%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Test / Parameter</th>
                      <th className="align-right">RESULT</th>
                      <th>UNITS</th>
                      <th>Reference Interval</th>
                      <th>Interpretation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row, idx) => (
                      <tr key={`${row.testName}-${row.parameter}-${idx}`}>
                        <td>
                          {row.isFirstInDept && (
                            <div className="table-dept-header">{row.department}</div>
                          )}
                          {row.isFirstInTest && (
                            <div className="table-test-header">{row.testName.toUpperCase()}</div>
                          )}
                          <span className="param-name">{row.parameter}</span>
                          {row.note && (
                            <div className="table-note-box">
                              <span className="note-badge">Legacy Advisory:</span> {row.note}
                            </div>
                          )}
                        </td>
                        <td className="align-right">
                          <strong className="result-value">
                            {row.value} {row.arrowSymbol && <span className={`arrow-${row.badgeStyle}`}>{row.arrowSymbol}</span>}
                          </strong>
                        </td>
                        <td className="unit-text">{row.unit}</td>
                        <td>
                          <span className="unverified-interval">{row.range}</span>
                        </td>
                        <td>
                          <span className={`interp-badge interp-badge-${row.badgeStyle}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {isLastPage && (
                      <tr className="end-of-report-row">
                        <td colSpan={5} className="end-of-report-text">
                          **** END OF CLINICAL TEST RESULTS ****
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* On Last Page: Render Test-Wise Pricing & Billing Summary */}
              {isLastPage && (
                <div className="sheet-financial-container">
                  {/* Phase 4.A: TEST-WISE BILLING DETAILS */}
                  <div className="sheet-billing-section">
                    <div className="sheet-section-title">TEST-WISE BILLING DETAILS</div>
                    <table className="sheet-billing-table">
                      <thead>
                        <tr>
                          <th style={{ width: '8%', textAlign: 'center' }}>S. No.</th>
                          <th style={{ width: '46%' }}>Test Name</th>
                          <th style={{ width: '11%', textAlign: 'center' }}>Quantity</th>
                          <th style={{ width: '12%', textAlign: 'right' }}>Unit Price</th>
                          <th style={{ width: '11%', textAlign: 'right' }}>Discount</th>
                          <th style={{ width: '12%', textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billedItems.length > 0 ? (
                          billedItems.map((item, idx) => (
                            <tr key={`${item.testCode}-${idx}`}>
                              <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                              <td>
                                <strong>{item.testName}</strong>
                                {item.testCode && <span className="cell-sub"> ({item.testCode})</span>}
                              </td>
                              <td style={{ textAlign: 'center' }}>{item.quantity || 1}</td>
                              <td style={{ textAlign: 'right' }}>{money(item.unitPrice)}</td>
                              <td style={{ textAlign: 'right' }}>{item.discount > 0 ? money(item.discount) : '—'}</td>
                              <td style={{ textAlign: 'right' }}><strong>{money(item.amount)}</strong></td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: '6px' }}>
                              Billing not generated for this order.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Phase 4.B: BILLING SUMMARY */}
                  <div className="sheet-billing-summary-wrap">
                    <div className="sheet-section-title">BILLING SUMMARY</div>
                    <div className="sheet-billing-summary-layout">
                      <div className="billing-status-block">
                        <div className="billing-status-line">
                          <span className="lbl-status">Payment Status:</span>
                          <span className={`status-pill ${billingSummary.paymentStatus === 'Paid' ? 'status-issued' : 'status-draft'}`}>
                            <i></i>{billingSummary.paymentStatus}
                          </span>
                        </div>
                        <p className="billing-receipt-note">
                          Official computer-generated diagnostic invoice receipt. Reconciled with laboratory order and payment ledger.
                        </p>
                      </div>
                      <table className="sheet-billing-summary-table">
                        <tbody>
                          <tr>
                            <td className="sum-desc">Test Subtotal</td>
                            <td className="sum-val">{money(billingSummary.subtotal)}</td>
                          </tr>
                          {billingSummary.discount > 0 && (
                            <tr>
                              <td className="sum-desc">Discount</td>
                              <td className="sum-val" style={{ color: '#0b7a2b' }}>- {money(billingSummary.discount)}</td>
                            </tr>
                          )}
                          {billingSummary.taxes ? (
                            <tr>
                              <td className="sum-desc">Taxes</td>
                              <td className="sum-val">{money(billingSummary.taxes)}</td>
                            </tr>
                          ) : null}
                          {billingSummary.additionalCharges ? (
                            <tr>
                              <td className="sum-desc">Additional Charges</td>
                              <td className="sum-val">{money(billingSummary.additionalCharges)}</td>
                            </tr>
                          ) : null}
                          <tr className="sum-total-row">
                            <td className="sum-desc"><strong>Total Bill</strong></td>
                            <td className="sum-val"><strong>{money(billingSummary.total)}</strong></td>
                          </tr>
                          <tr>
                            <td className="sum-desc">Amount Paid</td>
                            <td className="sum-val">{money(billingSummary.paid)}</td>
                          </tr>
                          <tr className="sum-balance-row">
                            <td className="sum-desc"><strong>Balance Due</strong></td>
                            <td className="sum-val"><strong>{money(billingSummary.balance)}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sheet Footer with Signatures */}
            <footer className="sheet-footer">
              <div className="footer-signatures">
                <div className="sig-block sig-left">
                  <div className="sig-image-wrap">
                    {appPreferences.technologistSignatureEnabled !== false ? (
                      <img
                        src={defaultSignatures.technologist.imagePath}
                        alt={`Signature of ${(appPreferences.technologistName as string) || defaultSignatures.technologist.name}`}
                        className="sig-img-a"
                      />
                    ) : (
                      <div className="sig-placeholder-line" />
                    )}
                  </div>
                  {String(appPreferences.technologistSignatureStatus ?? defaultSignatures.technologist.authorizationStatus) === 'Pending Owner Approval' && (
                    <span className="sig-status-badge">Historical Facsimile · Unconfirmed</span>
                  )}
                  <strong className="sig-name">{(appPreferences.technologistName as string) || defaultSignatures.technologist.name}</strong>
                  <span className="sig-role">{(appPreferences.technologistDesignation as string) || defaultSignatures.technologist.designation}</span>
                </div>

                <div className="sig-block sig-right">
                  <div className="sig-image-wrap">
                    {appPreferences.directorSignatureEnabled !== false ? (
                      <img
                        src={defaultSignatures.director.imagePath}
                        alt={`Signature of ${(appPreferences.directorName as string) || defaultSignatures.director.name}`}
                        className="sig-img-b"
                      />
                    ) : (
                      <div className="sig-placeholder-line" />
                    )}
                  </div>
                  {String(appPreferences.directorSignatureStatus ?? defaultSignatures.director.authorizationStatus) === 'Pending Owner Approval' && (
                    <span className="sig-status-badge">Historical Facsimile · Unconfirmed</span>
                  )}
                  <strong className="sig-name">{(appPreferences.directorName as string) || defaultSignatures.director.name}</strong>
                  <span className="sig-role">{(appPreferences.directorDesignation as string) || defaultSignatures.director.designation}</span>
                </div>
              </div>

              <div className="footer-meta">
                <p className="footer-disclaimer">
                  Results and unverified reference intervals require qualified medical review. Facsimile signatures are digitized visual assets, not cryptographic digital signatures.
                </p>
                <div className="footer-pagination">
                  Page {pageNum} of {totalPages}
                </div>
              </div>
            </footer>
          </article>
        )
      })}
    </div>
  )
}
