'use client'

import { useEffect, useMemo, useState } from 'react'
import { labProfile, appPreferences, defaultSignatures } from '@/lib/app-settings'
import { patients, reports, tests } from '@/lib/demo-data'
import { generateCode128Svg } from '@/lib/barcode-128'
import { generateQrCodeSvg } from '@/lib/qr-generator'

type Report = typeof reports[number]

export type LetterheadMode = 'with-letterhead' | 'without-letterhead'

interface ReportPrintSheetProps {
  report: Report
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
}

export function ReportPrintSheet({
  report,
  preview = false,
  initialMode = 'with-letterhead',
  showControls = true,
}: ReportPrintSheetProps) {
  const [mode, setMode] = useState<LetterheadMode>(initialMode)
  const [qrSvg, setQrSvg] = useState<string>('')

  const patient = useMemo(() => patients.find((entry) => entry.id === report.patientId), [report.patientId])

  // Opaque verification token without patient PII
  const verificationUrl = useMemo(
    () => `https://biohitech.example/verify/DEMO-${report.id}`,
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

    report.testNames.forEach((name) => {
      const catalogueEntry = tests.find((t) => t.name === name)
      const dept = catalogueEntry?.category?.toUpperCase() || 'BIOCHEMISTRY'
      const isFirstInDept = dept !== lastDept
      lastDept = dept

      const params = catalogueEntry?.parameterDetails || [
        { name: 'Result', unit: '', type: 'Text' as const, isVerified: false },
      ]

      params.forEach((param, pIdx) => {
        const val = report.results[`${name}:${param.name}`] || '—'
        let rangeStr = 'Range not verified'
        if (param.type === 'Qualitative') {
          rangeStr = 'Negative (Unverified)'
        } else if (param.type === 'Numeric') {
          if (param.maleLow != null && param.maleHigh != null) {
            rangeStr = `${param.maleLow} - ${param.maleHigh} (Unverified)`
          } else if (param.maleLow != null) {
            rangeStr = `> ${param.maleLow} (Unverified)`
          } else if (param.maleHigh != null) {
            rangeStr = `< ${param.maleHigh} (Unverified)`
          }
        }

        const note = pIdx === params.length - 1 && catalogueEntry?.notes?.[0] ? catalogueEntry.notes[0] : undefined

        rows.push({
          testName: name,
          department: dept,
          parameter: param.name,
          value: val,
          unit: param.unit || '—',
          range: rangeStr,
          isFirstInTest: pIdx === 0,
          isFirstInDept: isFirstInDept && pIdx === 0,
          note,
        })
      })
    })

    return rows
  }, [report])

  // Content-aware pagination algorithm:
  // Dynamically calculates heights based on parameter rows, section banners,
  // multi-line interpretation notes, and keeps grouped tests intact without awkward splitting.
  const pages = useMemo(() => {
    // Printable height limits in mm (excluding margins, patient table / continuation header, and footer)
    const PAGE_1_MAX_HEIGHT_MM = 158
    const PAGE_N_MAX_HEIGHT_MM = 215

    const calcRowHeightMm = (row: TestRow): number => {
      let h = 6.4 // base table row height
      if (row.isFirstInDept) h += 7.5 // department banner
      else if (row.isFirstInTest) h += 5.5 // test title
      if (row.note) {
        // Multi-line interpretation advisory note
        const noteLen = row.note.length
        if (noteLen > 240) h += 24
        else if (noteLen > 120) h += 16
        else h += 10
      }
      return h
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

        // If the entire test fits on a fresh page and does not fit in remaining space,
        // break to next page so the test panel is preserved together
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

  const patientTitle = patient?.gender === 'Female' ? 'Ms. ' : 'Mr. '
  const patientDisplayName = `${patientTitle}${report.patient.toUpperCase()}`
  const ageGenderStr = `${patient?.age ? `${patient.age} Y / ` : ''}${patient?.gender || 'Not specified'}`
  const billNumber = report.id.replace(/\D/g, '').slice(-5) || '31045'

  return (
    <div className={`report-sheet-container ${preview ? 'is-preview' : ''}`}>
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
                          aria-label="Demonstration Verification QR Code"
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
                      <td className="lbl">Reported Date</td>
                      <td className="val">: <strong>{report.date}</strong></td>
                    </tr>
                    <tr>
                      <td className="lbl">Age / Gender</td>
                      <td className="val">: <strong>{ageGenderStr}</strong></td>
                      <td className="lbl">Printed Date</td>
                      <td className="val">: <strong>{new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())}</strong></td>
                    </tr>
                    <tr>
                      <td className="lbl">Bill No</td>
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
                      <td className="val">: <strong>{(patient?.doctor || 'SELF').toUpperCase()}</strong></td>
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

              {/* Investigation Results Table */}
              <table className="sheet-results-table">
                <colgroup>
                  <col style={{ width: '40%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '25%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Test Description</th>
                    <th className="align-right">RESULT</th>
                    <th>UNITS</th>
                    <th>Reference Range</th>
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
                        <strong className="result-value">{row.value}</strong>
                      </td>
                      <td className="unit-text">{row.unit}</td>
                      <td>
                        <span className="unverified-interval">{row.range}</span>
                      </td>
                    </tr>
                  ))}

                  {isLastPage && (
                    <tr className="end-of-report-row">
                      <td colSpan={4} className="end-of-report-text">
                        **** END OF REPORT ****
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                  Demonstration report only. Results and reference intervals require qualified medical review. Facsimile signatures are non-cryptographic demo assets. Not a verified clinical document.
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
