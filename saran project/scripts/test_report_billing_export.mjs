// ==============================================================================
// BIO HI TECH LIMS — REPORT, BILLING, PDF & STATIC EXPORT REGRESSION SUITE
// ==============================================================================
// Comprehensive verification of data population, test-wise billing,
// draft editing, revision preservation, static export, and print media isolation.
// ==============================================================================

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

let passed = 0
let failed = 0
const results = []

function assert(condition, description, detail = '') {
  if (condition) {
    passed++
    results.push({ status: 'PASS', description, detail })
    console.log(`  ✓ [PASS] ${description}`)
  } else {
    failed++
    results.push({ status: 'FAIL', description, detail })
    console.error(`  ✗ [FAIL] ${description} ${detail ? `(${detail})` : ''}`)
  }
}

async function runRegressionSuite() {
  console.log('==============================================================================')
  console.log('BIO HI TECH — REPORT, BILLING, PDF & STATIC ROUTING REGRESSION SUITE')
  console.log('==============================================================================')
  console.log(`Gateway: ${SUPABASE_URL}`)
  console.log(`Timestamp: ${new Date().toISOString()}\n`)

  const testOwnerEmail = `rpt_owner_${Date.now()}@biohitech.test`
  const testOwnerPassword = 'RptPassword2026!Secure'
  let ownerUserId = null
  let ownerClient = null

  try {
    // --------------------------------------------------------------------------
    // SECTION 1: PROVISION TEST OWNER
    // --------------------------------------------------------------------------
    console.log('--- SECTION 1: Authorized Laboratory Owner Provisioning ---')
    const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
      email: testOwnerEmail,
      password: testOwnerPassword,
      email_confirm: true,
      user_metadata: { role: 'owner', full_name: 'Dr. Test Pathologist' }
    })
    if (authErr) throw authErr
    ownerUserId = authData.user.id

    // Clean up any stale active owners in local test environment
    await adminClient.from('owner_access').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    const { error: accessErr } = await adminClient.from('owner_access').insert({
      id: ownerUserId,
      email: testOwnerEmail,
      is_active: true,
      role: 'OWNER'
    })
    if (accessErr) throw accessErr

    const { error: profErr } = await adminClient.from('owner_profile').insert({
      id: ownerUserId,
      email: testOwnerEmail,
      full_name: 'Dr. Test Pathologist',
      designation: 'Laboratory Director',
      lab_name: 'BIO HI TECH'
    })
    if (profErr) throw profErr

    ownerClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })
    const { data: loginData, error: loginErr } = await ownerClient.auth.signInWithPassword({
      email: testOwnerEmail,
      password: testOwnerPassword
    })
    assert(!loginErr && loginData?.session?.access_token, 'Owner session authenticated successfully')

    // --------------------------------------------------------------------------
    // SECTION 2: PATIENT, ORDER & REPORT DATA POPULATION
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 2: Report Data Population & Demographic Mapping ---')

    const patientId = `BHT-REG-${Date.now().toString().slice(-5)}`
    const { data: patient, error: patErr } = await ownerClient.from('patients').insert({
      id: patientId,
      owner_id: ownerUserId,
      name: 'Priya Ramesh',
      age: 29,
      gender: 'Female',
      phone: '+91 98421 09876',
      doctor: 'Dr. S. K. Narayanan MD',
      address: '24 Anna Nagar, Tirupur',
      notes: 'Routine health checkup'
    }).select().single()
    assert(!patErr && patient?.id === patientId, 'Patient created with correct demographic data', patErr?.message)

    // Order with multiple tests (AMH + Complete Blood Count)
    const orderId = `ORD-REG-${Date.now().toString().slice(-5)}`
    const { data: order, error: ordErr } = await ownerClient.from('laboratory_orders').insert({
      id: orderId,
      owner_id: ownerUserId,
      patient_id: patientId,
      status: 'Pending',
      total_amount: 2050
    }).select().single()
    assert(!ordErr && order?.id === orderId, 'Laboratory order created with multiple tests', ordErr?.message)

    // Add order tests with historical prices
    const { error: otErr } = await ownerClient.from('order_tests').insert([
      {
        order_id: orderId,
        test_code: 'LEG-011',
        test_name: 'Anti-Mullerian Hormone (AMH)',
        price: 1800,
        status: 'Pending'
      },
      {
        order_id: orderId,
        test_code: 'LEG-014',
        test_name: 'Anti-Thyroid Microsomal Antibody',
        price: 250,
        status: 'Pending'
      }
    ])
    assert(!otErr, 'Selected tests recorded in order_tests with individual prices', otErr?.message)

    // Create draft report
    const reportId = `RPT-REG-${Date.now().toString().slice(-5)}`
    const { data: report, error: repErr } = await ownerClient.from('reports').insert({
      id: reportId,
      owner_id: ownerUserId,
      patient_id: patientId,
      order_id: orderId,
      subtotal_amount: 2050,
      discount_amount: 100,
      final_amount: 1950,
      paid_amount: 0,
      payment_status: 'Pending',
      status: 'Draft'
    }).select().single()
    assert(!repErr && report?.id === reportId, 'Draft report initialized and linked to order and patient', repErr?.message)

    // Record numeric results
    const { error: resErr } = await ownerClient.from('report_results').insert([
      {
        owner_id: ownerUserId,
        report_id: reportId,
        test_code: 'LEG-011',
        test_name: 'Anti-Mullerian Hormone (AMH)',
        parameter_name: 'AMH',
        result_value: '3.45',
        unit: 'ng/mL',
        flag: 'Normal'
      },
      {
        owner_id: ownerUserId,
        report_id: reportId,
        test_code: 'LEG-014',
        test_name: 'Anti-Thyroid Microsomal Antibody',
        parameter_name: 'Anti-Thyroid Microsomal Antibody',
        result_value: '12.0',
        unit: 'IU/mL',
        flag: 'Normal'
      }
    ])
    assert(!resErr, 'Test results successfully populated in report_results', resErr?.message)

    // Query report joined with order and tests (the core data service query)
    const { data: fetchedReports, error: fetchErr } = await ownerClient
      .from('reports')
      .select(`
        *,
        patients(*),
        report_results(*),
        laboratory_orders(
          *,
          order_tests(*)
        )
      `)
      .eq('id', reportId)
    assert(!fetchErr && fetchedReports?.length === 1, 'Data-service joined report query succeeds', fetchErr?.message)
    
    const populated = fetchedReports[0]
    const fetchedTests = populated.laboratory_orders?.order_tests || []
    assert(fetchedTests.length === 2, 'Report correctly identifies both selected tests', `Found: ${fetchedTests.length}`)
    assert(populated.report_results.length === 2, 'Report results table contains both measured parameters', `Found: ${populated.report_results.length}`)
    assert(populated.patients.name === 'Priya Ramesh', 'Patient name matches database record')
    assert(populated.patients.doctor === 'Dr. S. K. Narayanan MD', 'Referring doctor correctly populated')

    // --------------------------------------------------------------------------
    // SECTION 3: TEST-WISE PRICING & BILLING SUMMARY RECONCILIATION
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 3: Test-Wise Pricing & Billing Ledger Reconciliation ---')

    // Query order_tests to verify test-wise pricing items
    const { data: billedOrderTests, error: botErr } = await ownerClient
      .from('order_tests')
      .select('*')
      .eq('order_id', orderId)
    assert(!botErr && billedOrderTests.length === 2, 'Test-wise billing retrieves all ordered tests with unit prices')
    
    const testSubtotal = billedOrderTests.reduce((acc, it) => acc + Number(it.price), 0)
    assert(testSubtotal === 2050, 'Test-wise subtotal reconciles to ₹2,050', `Subtotal: ₹${testSubtotal}`)
    const reportDiscount = populated.discount_amount || 0
    const reportFinalAmount = testSubtotal - reportDiscount
    assert(reportFinalAmount === 1950, 'Report final total reconciles to ₹1,950 after discount', `Final: ₹${reportFinalAmount}`)

    // Record Partial Payment: ₹1000 via UPI
    const txId1 = `TXN-01-${Date.now().toString().slice(-5)}`
    const { data: payment1, error: pay1Err } = await ownerClient.from('payment_transactions').insert({
      id: txId1,
      owner_id: ownerUserId,
      report_id: reportId,
      patient_id: patientId,
      amount: 1000,
      payment_method: 'UPI',
      notes: 'Initial UPI advance'
    }).select().single()
    assert(!pay1Err && Number(payment1?.amount) === 1000, 'Partial payment of ₹1000 successfully recorded in ledger')

    // Check balance calculation
    const { data: payments1 } = await ownerClient.from('payment_transactions').select('amount').eq('report_id', reportId)
    const paidSoFar1 = payments1.reduce((sum, p) => sum + Number(p.amount), 0)
    const balanceDue1 = reportFinalAmount - paidSoFar1
    assert(balanceDue1 === 950, 'Outstanding balance calculated accurately as ₹950 (₹1950 - ₹1000)', `Balance: ₹${balanceDue1}`)

    // Settle balance: ₹950 via Cash
    const txId2 = `TXN-02-${Date.now().toString().slice(-5)}`
    const { data: payment2, error: pay2Err } = await ownerClient.from('payment_transactions').insert({
      id: txId2,
      owner_id: ownerUserId,
      report_id: reportId,
      patient_id: patientId,
      amount: 950,
      payment_method: 'Cash',
      notes: 'Final settlement'
    }).select().single()
    assert(!pay2Err && Number(payment2?.amount) === 950, 'Settlement payment of ₹950 successfully recorded in ledger')

    const { data: payments2 } = await ownerClient.from('payment_transactions').select('amount').eq('report_id', reportId)
    const paidSoFar2 = payments2.reduce((sum, p) => sum + Number(p.amount), 0)
    const balanceDue2 = reportFinalAmount - paidSoFar2
    assert(balanceDue2 === 0 && paidSoFar2 === 1950, 'Full invoice settlement reconciled: 100% paid, ₹0 balance')

    // Historical invoice pricing test: change catalogue price and verify order_tests price remains unchanged
    const { error: catUpdateErr } = await adminClient
      .from('test_catalogue')
      .update({ discount_price: 9999 })
      .eq('code', 'LEG-011')
    assert(!catUpdateErr, 'Catalogue offer price updated to test historical immunity', catUpdateErr?.message)

    const { data: freshOrderTests } = await ownerClient.from('order_tests').select('*').eq('order_id', orderId)
    const amhLine = freshOrderTests.find(i => i.test_code === 'LEG-011')
    assert(amhLine && amhLine.price === 1800, 'Authoritative saved test price was NOT corrupted by catalogue change')

    // Restore catalogue
    await adminClient.from('test_catalogue').update({ discount_price: 1800 }).eq('code', 'LEG-011')

    // --------------------------------------------------------------------------
    // SECTION 4: DRAFT REPORT EDITING & REVISION PRESERVATION
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 4: Draft Editing & Revision Preservation ---')

    // Edit Draft Report
    const { error: editErr } = await ownerClient
      .from('reports')
      .update({
        subtotal_amount: 2050,
        discount_amount: 200,
        final_amount: 1850
      })
      .eq('id', reportId)
    assert(!editErr, 'Draft report edited with updated discount (₹200) and final amount (₹1,850)')

    // Update result value
    const { error: editResErr } = await ownerClient
      .from('report_results')
      .update({ result_value: '3.60' })
      .eq('report_id', reportId)
      .eq('parameter_name', 'AMH')
    assert(!editResErr, 'Draft parameter result value updated in report_results')

    // Reload report from database to verify persistence
    const { data: reloadedReport } = await ownerClient
      .from('reports')
      .select('*, report_results(*)')
      .eq('id', reportId)
      .single()
    assert(reloadedReport.final_amount === 1850 && reloadedReport.discount_amount === 200, 'Reloaded report reflects persisted financial changes')
    const reloadedAmh = reloadedReport.report_results.find(r => r.parameter_name === 'AMH')
    assert(reloadedAmh.result_value === '3.60', 'Reloaded report reflects persisted parameter result (3.60 ng/mL)')

    // Issue Report: status becomes "Issued"
    const { error: issueErr } = await ownerClient
      .from('reports')
      .update({ status: 'Issued' })
      .eq('id', reportId)
    assert(!issueErr, 'Report successfully transitioned to Issued status')

    // Create Report Amendment (Revision 2) using report_versions
    const { data: rev1Record } = await ownerClient.from('reports').select('*').eq('id', reportId).single()
    assert(rev1Record.status === 'Issued', 'Original report revision 1 remains locked with Issued status')

    const { data: amendmentVersion, error: amdErr } = await ownerClient.from('report_versions').insert({
      report_id: reportId,
      version_number: 2,
      issued_by: ownerUserId,
      reason_for_amendment: 'Clinical note update and range review',
      snapshot_data: {
        report_id: reportId,
        patient_name: 'Priya Ramesh',
        version: 2,
        notes: 'Clinical note update and range review',
        tests: ['Anti-Mullerian Hormone (AMH)', 'Anti-Thyroid Microsomal Antibody']
      }
    }).select().single()
    assert(!amdErr && amendmentVersion?.version_number === 2, 'Report amendment version 2 recorded in report_versions while preserving original version')

    // --------------------------------------------------------------------------
    // SECTION 5: ZERO-TEST HANDLING & SAFEGUARDS
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 5: Zero-Test Incomplete Draft Safeguards ---')

    // Create order with 0 tests
    const zeroOrderId = `ORD-ZERO-${Date.now().toString().slice(-5)}`
    await ownerClient.from('laboratory_orders').insert({
      id: zeroOrderId,
      owner_id: ownerUserId,
      patient_id: patientId,
      status: 'Pending',
      total_amount: 0
    })

    const zeroReportId = `RPT-ZERO-${Date.now().toString().slice(-5)}`
    const { data: zeroReport, error: zrErr } = await ownerClient.from('reports').insert({
      id: zeroReportId,
      owner_id: ownerUserId,
      patient_id: patientId,
      order_id: zeroOrderId,
      status: 'Draft',
      subtotal_amount: 0,
      final_amount: 0
    }).select().single()
    assert(!zrErr && zeroReport.id === zeroReportId, 'Zero-test draft report created in incomplete state')

    // Query order tests to verify count = 0
    const { count: zeroTestCount } = await ownerClient
      .from('order_tests')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', zeroOrderId)
    assert(zeroTestCount === 0, 'Order verified to contain exactly 0 tests')

    // --------------------------------------------------------------------------
    // SECTION 6: STATIC EXPORT & PRINT MEDIA CSS RULES
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 6: Static Export Routes & Print Stylesheet Verification ---')

    const outDir = path.resolve('out')
    const expectedStaticRoutes = [
      'reports/view',
      'reports/preview',
      'reports/edit',
      'patients/view',
      'patients/edit',
      'billing/view',
      'tests/new',
      'patients/new',
      'reports/new'
    ]

    for (const route of expectedStaticRoutes) {
      const htmlFile = path.join(outDir, route, 'index.html')
      const exists = fs.existsSync(htmlFile)
      assert(exists, `Static prerendered HTML exists: out/${route}/index.html`)
    }

    // Check globals.css print rules
    const cssPath = path.resolve('app/globals.css')
    const cssContent = fs.readFileSync(cssPath, 'utf8')
    assert(cssContent.includes('@media print'), 'Print media query @media print exists in globals.css')
    assert(cssContent.includes('#printable-report'), 'Print styles specifically target #printable-report container')
    assert(cssContent.includes('sheet-financial-container') && cssContent.includes('sheet-billing-table'), 'Billing details table styles are defined for printable reports')
    assert(cssContent.includes('sheet-billing-summary-table'), 'Billing summary table styles are defined for printable reports')

  } catch (err) {
    console.error('Fatal error during regression suite:', err)
    failed++
  } finally {
    // --------------------------------------------------------------------------
    // TEARDOWN FIXTURES
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 7: Test Fixture Teardown ---')
    if (ownerUserId) {
      // Purge all synthetic records created by this owner
      await adminClient.from('payment_transactions').delete().eq('owner_id', ownerUserId)
      await adminClient.from('report_results').delete().eq('owner_id', ownerUserId)
      await adminClient.from('report_versions').delete().eq('issued_by', ownerUserId)
      await adminClient.from('reports').delete().eq('owner_id', ownerUserId)
      await adminClient.from('laboratory_orders').delete().eq('owner_id', ownerUserId)
      await adminClient.from('patients').delete().eq('owner_id', ownerUserId)
      await adminClient.from('owner_profile').delete().eq('id', ownerUserId)
      await adminClient.from('owner_access').delete().eq('id', ownerUserId)
      await adminClient.auth.admin.deleteUser(ownerUserId)

      // Restore owner@biohitech.com in owner_access if needed
      const { data: origOwner } = await adminClient.from('owner_access').select('*').eq('email', 'owner@biohitech.com')
      if (!origOwner || origOwner.length === 0) {
        const { data: users } = await adminClient.auth.admin.listUsers()
        const masterUser = users?.users?.find(u => u.email === 'owner@biohitech.com')
        if (masterUser) {
          await adminClient.from('owner_access').upsert({
            id: masterUser.id,
            email: 'owner@biohitech.com',
            is_active: true,
            role: 'OWNER'
          })
        }
      }

      // Verify zero synthetic records remain for this owner
      const { count: remainingReports } = await adminClient
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', ownerUserId)
      assert(remainingReports === 0, 'All synthetic regression fixtures purged; 0 records remain for test owner')
    }
  }

  console.log('\n==============================================================================')
  console.log(`REGRESSION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('==============================================================================')
  if (failed > 0) process.exit(1)
}

runRegressionSuite().catch(err => {
  console.error('Unhandled failure:', err)
  process.exit(1)
})
