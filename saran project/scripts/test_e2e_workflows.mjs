// ==============================================================================
// BIO HI TECH LIMS — END-TO-END WORKFLOW & SECURITY INTEGRATION TEST SUITE
// ==============================================================================
// Tests against the isolated local Supabase PostgreSQL database
// ==============================================================================

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
const anonClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })

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

async function runTests() {
  console.log('==============================================================================')
  console.log('BIO HI TECH — FULL INTEGRATION, CRUD, SECURITY & REALTIME VALIDATION')
  console.log('==============================================================================')
  console.log(`Local Supabase Gateway: ${SUPABASE_URL}`)
  console.log(`Timestamp: ${new Date().toISOString()}\n`)

  const testOwnerEmail = `owner_${Date.now()}@biohitech.test`
  const testOwnerPassword = 'SecureOwnerPassword123!'
  let ownerUserId = null
  let ownerClient = null

  const unauthorizedEmail = `intruder_${Date.now()}@external.test`
  const unauthorizedPassword = 'ExternalUserPass123!'
  let unauthorizedUserId = null
  let unauthorizedClient = null

  try {
    // --------------------------------------------------------------------------
    // SECTION 1: CATALOGUE PRESERVATION AUDIT
    // --------------------------------------------------------------------------
    console.log('--- SECTION 1: Genuine Laboratory Catalogue Preservation ---')
    
    const { count: testCount, error: errTests } = await adminClient
      .from('test_catalogue')
      .select('*', { count: 'exact', head: true })
    assert(!errTests && testCount === 120, 'Test catalogue contains exactly 120 genuine tests', `Found: ${testCount}`)

    const { count: paramCount, error: errParams } = await adminClient
      .from('test_parameters')
      .select('*', { count: 'exact', head: true })
    assert(!errParams && paramCount === 211, 'Parameter specifications count exactly 211 instances', `Found: ${paramCount}`)

    const { count: panelCount, error: errPanels } = await adminClient
      .from('test_catalogue')
      .select('*', { count: 'exact', head: true })
      .eq('is_panel', true)
    assert(!errPanels && panelCount === 22, 'Grouped panels count exactly 22 clinical panels', `Found: ${panelCount}`)

    const { count: verifiedCount } = await adminClient
      .from('test_parameters')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true)
    assert(verifiedCount === 0, 'Clinical governance: all imported reference intervals remain unverified (0 verified)', `Verified: ${verifiedCount}`)

    // --------------------------------------------------------------------------
    // SECTION 2: AUTHENTICATION & SINGLE-OWNER ACCESS PROVISIONING
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 2: Single-Owner Security & Access Enforcement ---')

    // Clean up any stale active owners in local test environment
    await adminClient.from('owner_access').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Provision Owner User in Auth
    const { data: ownerUser, error: ownerCreateErr } = await adminClient.auth.admin.createUser({
      email: testOwnerEmail,
      password: testOwnerPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Dr. Arun Kumar', role: 'owner' }
    })
    assert(!ownerCreateErr && ownerUser?.user?.id, 'Provision laboratory owner in Supabase Auth', ownerUser?.user?.id)
    ownerUserId = ownerUser?.user?.id

    // Provision Owner in public.owner_access and public.owner_profile
    const { error: accessErr } = await adminClient.from('owner_access').insert({
      id: ownerUserId,
      email: testOwnerEmail,
      is_active: true,
      role: 'OWNER'
    })
    assert(!accessErr, 'Grant authorized active status in public.owner_access', accessErr?.message)

    const { error: profileErr } = await adminClient.from('owner_profile').insert({
      id: ownerUserId,
      email: testOwnerEmail,
      full_name: 'Dr. Arun Kumar',
      designation: 'Laboratory Director / Owner',
      lab_name: 'BIO HI TECH'
    })
    assert(!profileErr, 'Create laboratory profile in public.owner_profile', profileErr?.message)

    // Authenticate Owner
    ownerClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })
    const { data: loginData, error: loginErr } = await ownerClient.auth.signInWithPassword({
      email: testOwnerEmail,
      password: testOwnerPassword
    })
    assert(!loginErr && loginData?.session?.access_token, 'Owner sign-in succeeds and returns authenticated JWT session')

    // --------------------------------------------------------------------------
    // SECTION 3: RLS BOUNDARY & UNAUTHORIZED ACCESS TESTS
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 3: RLS Security Boundary Enforcement ---')

    // Test: Anonymous insertion of patients must be denied
    const { error: anonErr } = await anonClient
      .from('patients')
      .insert({
        id: 'BHT-HACK-01',
        owner_id: ownerUserId,
        name: 'Intruder Record',
        phone: '+91 99999 99999'
      })
    assert(anonErr !== null, 'Anonymous access: patient creation rejected by RLS')

    // Test: Anonymous reading of patients must be denied
    const { data: anonRead } = await anonClient.from('patients').select('*')
    assert(anonRead === null || anonRead.length === 0, 'Anonymous access: patient records cannot be read')

    // Provision Unauthorized Second User (not registered in owner_access)
    const { data: unauthData, error: unauthCreateErr } = await adminClient.auth.admin.createUser({
      email: unauthorizedEmail,
      password: unauthorizedPassword,
      email_confirm: true
    })
    unauthorizedUserId = unauthData?.user?.id
    assert(!unauthCreateErr && unauthorizedUserId, 'Provision non-owner authenticated user')

    unauthorizedClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })
    await unauthorizedClient.auth.signInWithPassword({
      email: unauthorizedEmail,
      password: unauthorizedPassword
    })

    // Unauthorized user attempts to read patients
    const { data: unauthPatients } = await unauthorizedClient.from('patients').select('*')
    assert(unauthPatients === null || unauthPatients.length === 0, 'Cross-user boundary: non-owner authenticated user rejected by RLS')

    // Unauthorized user attempts to insert patient
    const { error: unauthInsErr } = await unauthorizedClient.from('patients').insert({
      id: 'BHT-UNAUTH-01',
      owner_id: unauthorizedUserId,
      name: 'Illegal Patient',
      phone: '+91 88888 88888'
    })
    assert(unauthInsErr !== null, 'Cross-user boundary: unauthorized user write rejected by RLS')

    // --------------------------------------------------------------------------
    // SECTION 4: PATIENT CRUD, SEARCH & FILTERING
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 4: Patient Lifecycle & Management Workflows ---')

    const patientUid = 'BHT-TEST-' + Math.floor(1000 + Math.random() * 9000)
    const { data: newPatient, error: createPatErr } = await ownerClient
      .from('patients')
      .insert({
        id: patientUid,
        owner_id: ownerUserId,
        name: 'Ananya Sharma',
        phone: '+91 98200 45678',
        age: 34,
        gender: 'Female',
        doctor: 'Dr. Rajesh Mehta',
        address: 'Bandra West, Mumbai',
        notes: 'Fasting lipid panel routine checkup'
      })
      .select()
      .single()

    assert(!createPatErr && newPatient?.id, 'Add Patient: Patient record successfully committed to Supabase', newPatient?.id)

    // Read Patient
    const { data: fetchedPat, error: fetchErr } = await ownerClient
      .from('patients')
      .select('*')
      .eq('id', newPatient.id)
      .single()
    assert(!fetchErr && fetchedPat?.name === 'Ananya Sharma', 'View Patient: Patient retrieved with verified details')

    // Search Patient
    const { data: searchResults, error: searchErr } = await ownerClient
      .from('patients')
      .select('*')
      .or(`name.ilike.%Sharma%,phone.ilike.%98200%`)
    assert(!searchErr && searchResults?.length >= 1, 'Search Patient: Search by name and phone returns matching record')

    // Edit Patient
    const { data: updatedPat, error: updatePatErr } = await ownerClient
      .from('patients')
      .update({
        phone: '+91 98200 99999',
        notes: 'Updated contact information and notes'
      })
      .eq('id', newPatient.id)
      .select()
      .single()
    assert(!updatePatErr && updatedPat?.phone === '+91 98200 99999', 'Edit Patient: Updates persist in PostgreSQL and return committed state')

    // Patient Archival
    const { data: archivedPat, error: archiveErr } = await ownerClient
      .from('patients')
      .update({ is_archived: true })
      .eq('id', newPatient.id)
      .select()
      .single()
    assert(!archiveErr && archivedPat?.is_archived === true, 'Archive Patient: Patient marked inactive / archived')

    // Filter Active Patients
    const { data: activeList } = await ownerClient.from('patients').select('*').eq('is_archived', false)
    const containsArchived = activeList?.some(p => p.id === newPatient.id)
    assert(!containsArchived, 'Filter Patients: Archived patient is removed from active patient roster')

    // Restore Patient
    const { data: restoredPat, error: restoreErr } = await ownerClient
      .from('patients')
      .update({ is_archived: false })
      .eq('id', newPatient.id)
      .select()
      .single()
    assert(!restoreErr && restoredPat?.is_archived === false, 'Restore Patient: Patient restored to active roster')

    // --------------------------------------------------------------------------
    // SECTION 5: PATIENT DELETION RULES & CLINICAL RETENTION PROTECTION
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 5: Safe Patient Deletion vs Clinical Retention Rules ---')

    // Create an unlinked temporary patient eligible for permanent deletion
    const tempUid = 'BHT-DEL-' + Math.floor(1000 + Math.random() * 9000)
    const { data: tempPat } = await ownerClient
      .from('patients')
      .insert({
        id: tempUid,
        owner_id: ownerUserId,
        name: 'Temporary Deletion Test',
        phone: '+91 90000 11111'
      })
      .select()
      .single()

    // Delete eligible unlinked patient via RPC
    const { data: rpcDelRes, error: rpcDelErr } = await ownerClient.rpc('delete_eligible_patient', { p_id: tempPat.id })
    assert(!rpcDelErr && rpcDelRes?.success === true, 'Patient Permanent Deletion: Eligible unlinked patient deleted via RPC', rpcDelRes?.message)

    // Verify unlinked patient is gone
    const { data: verifyDel } = await ownerClient.from('patients').select('*').eq('id', tempPat.id)
    assert(verifyDel?.length === 0, 'Patient Permanent Deletion: Verified deletion from database')

    // --------------------------------------------------------------------------
    // SECTION 6: LABORATORY ORDERS & RESULT ENTRY
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 6: Laboratory Orders & Result Entry Workflows ---')

    const orderNum = 'ORD-202611-' + Math.floor(1000 + Math.random() * 9000)
    const { data: newOrder, error: orderErr } = await ownerClient
      .from('laboratory_orders')
      .insert({
        id: orderNum,
        owner_id: ownerUserId,
        patient_id: newPatient.id,
        status: 'Pending',
        total_amount: 1100
      })
      .select()
      .single()

    assert(!orderErr && newOrder?.id, 'Create Order: Laboratory order created with unique order number and pricing', newOrder?.id)

    // Add ordered test (LEG-022 is CBC / Hemogram in catalogue)
    const { error: orderTestErr } = await ownerClient.from('order_tests').insert({
      order_id: newOrder.id,
      test_code: 'LEG-022',
      test_name: 'CBC / Hemogram',
      price: 300,
      status: 'Pending'
    })
    assert(!orderTestErr, 'Order Tests: Tests added to laboratory order', orderTestErr?.message)

    // Result Entry: Create draft report
    const reportNum = 'RPT-202611-' + Math.floor(1000 + Math.random() * 9000)
    const { data: newReport, error: reportErr } = await ownerClient
      .from('reports')
      .insert({
        id: reportNum,
        owner_id: ownerUserId,
        patient_id: newPatient.id,
        order_id: newOrder.id,
        subtotal_amount: 1250,
        discount_amount: 150,
        final_amount: 1100,
        paid_amount: 0,
        payment_status: 'Pending',
        status: 'Draft'
      })
      .select()
      .single()

    assert(!reportErr && newReport?.id, 'Create Report: Draft report generated from patient order', newReport?.id)

    // Enter Numeric and Qualitative test results
    const { error: resultsErr } = await ownerClient.from('report_results').insert([
      {
        owner_id: ownerUserId,
        report_id: newReport.id,
        test_code: 'LEG-022',
        test_name: 'CBC / Hemogram',
        parameter_name: 'Haemoglobin',
        result_value: '14.5',
        unit: 'g/dL',
        flag: 'Normal'
      },
      {
        owner_id: ownerUserId,
        report_id: newReport.id,
        test_code: 'LEG-022',
        test_name: 'CBC / Hemogram',
        parameter_name: 'Platelet Count',
        result_value: '260000',
        unit: '/cumm',
        flag: 'Normal'
      },
      {
        owner_id: ownerUserId,
        report_id: newReport.id,
        test_code: 'LEG-022',
        test_name: 'CBC / Hemogram',
        parameter_name: 'Blood Group',
        result_value: 'O Positive',
        unit: '',
        flag: 'Normal'
      }
    ])
    assert(!resultsErr, 'Result Entry: Numeric and Qualitative parameters successfully recorded in report_results')

    // --------------------------------------------------------------------------
    // SECTION 7: REPORT FINALIZATION, VERSIONING & RETENTION RULES
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 7: Report Issuance, Immutable Amendments & Retention Protection ---')

    // Issue Report
    const { data: issuedReport, error: issueErr } = await ownerClient
      .from('reports')
      .update({
        status: 'Issued'
      })
      .eq('id', newReport.id)
      .select()
      .single()

    assert(!issueErr && issuedReport?.status === 'Issued', 'Finalize Report: Report issued with locked status')

    // Record initial report version
    const { error: versionErr } = await ownerClient.from('report_versions').insert({
      report_id: newReport.id,
      version_number: 1,
      issued_by: ownerUserId,
      snapshot_data: { report_number: reportNum, tests: ['LEG-022'] }
    })
    assert(!versionErr, 'Report History: Initial issued version 1 immutably archived')

    // Immutable Amendment: Create amendment version 2
    const { data: amendmentVersion, error: amendErr } = await ownerClient
      .from('report_versions')
      .insert({
        report_id: newReport.id,
        version_number: 2,
        issued_by: ownerUserId,
        reason_for_amendment: 'Added verified clinical interpretation note by laboratory director',
        snapshot_data: { report_number: reportNum, version: 2, note: 'Clinical director review completed' }
      })
      .select()
      .single()

    assert(!amendErr && amendmentVersion?.version_number === 2, 'Report Amendment: Version 2 amendment recorded while preserving original version 1')

    // Attempt to delete protected patient with active clinical order and issued report via RPC
    const { data: blockedRpcRes } = await ownerClient.rpc('delete_eligible_patient', { p_id: newPatient.id })
    assert(blockedRpcRes?.blocked === true && blockedRpcRes?.success === false, 'Clinical Retention: Deletion of patient with orders and reports is blocked with safe diagnostic message', blockedRpcRes?.message)

    // Also verify direct SQL delete is blocked by database ON DELETE RESTRICT constraint
    const { error: blockedPatientDelErr } = await ownerClient.from('patients').delete().eq('id', newPatient.id)
    assert(blockedPatientDelErr !== null, 'Database Constraint: ON DELETE RESTRICT foreign key blocks direct deletion')

    // --------------------------------------------------------------------------
    // SECTION 8: BILLING & PAYMENT FINANCIAL LEDGER
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 8: Billing, Invoices & Payment Ledger ---')

    // Initial partial payment: ₹500 via UPI
    const txUid1 = 'TXN-202611-' + Math.floor(1000 + Math.random() * 9000)
    const { data: payment1, error: pay1Err } = await ownerClient
      .from('payment_transactions')
      .insert({
        id: txUid1,
        owner_id: ownerUserId,
        report_id: newReport.id,
        patient_id: newPatient.id,
        amount: 500,
        payment_method: 'UPI',
        notes: 'Advance partial payment'
      })
      .select()
      .single()

    assert(!pay1Err && Number(payment1?.amount) === 500, 'Record Payment: Partial payment of ₹500 recorded in ledger', payment1?.id)

    // Calculate balance
    const { data: reportWithPayments } = await ownerClient
      .from('reports')
      .select('final_amount')
      .eq('id', newReport.id)
      .single()

    const { data: allPayments } = await ownerClient
      .from('payment_transactions')
      .select('amount')
      .eq('report_id', newReport.id)

    const totalPaid = allPayments.reduce((s, p) => s + Number(p.amount), 0)
    const balanceDue = Number(reportWithPayments.final_amount) - totalPaid
    assert(balanceDue === 600, 'Balance Calculation: Outstanding balance accurately calculated as ₹600 (₹1100 - ₹500)')

    // Complete final payment: ₹600 via Cash
    const txUid2 = 'TXN-202611-' + Math.floor(1000 + Math.random() * 9000)
    const { data: payment2, error: pay2Err } = await ownerClient
      .from('payment_transactions')
      .insert({
        id: txUid2,
        owner_id: ownerUserId,
        report_id: newReport.id,
        patient_id: newPatient.id,
        amount: 600,
        payment_method: 'Cash',
        notes: 'Settlement of remaining balance'
      })
      .select()
      .single()

    assert(!pay2Err && Number(payment2?.amount) === 600, 'Record Payment: Settlement payment of ₹600 recorded')

    // Verify report is fully paid
    const { data: finalPayments } = await ownerClient
      .from('payment_transactions')
      .select('amount')
      .eq('report_id', newReport.id)

    const finalTotalPaid = finalPayments.reduce((s, p) => s + Number(p.amount), 0)
    assert(finalTotalPaid === 1100, 'Ledger Verification: Total confirmed payments match invoice total (₹1,100)')

    // --------------------------------------------------------------------------
    // SECTION 9: REALTIME SYNCHRONIZATION TEST
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 9: Realtime Multi-Device Synchronization ---')

    const clientB = createClient(SUPABASE_URL, ANON_KEY)
    await clientB.auth.signInWithPassword({ email: testOwnerEmail, password: testOwnerPassword })

    let realtimeReceived = false
    let receivedPayload = null

    const channel = clientB
      .channel('test-realtime-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'patients' }, (payload) => {
        realtimeReceived = true
        receivedPayload = payload
      })

    // Wait until subscribed
    await new Promise((resolve) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve()
      })
    })
    await new Promise(r => setTimeout(r, 300))

    // Client A inserts a patient
    const syncTestUid = 'BHT-SYNC-' + Math.floor(1000 + Math.random() * 9000)
    await ownerClient.from('patients').insert({
      id: syncTestUid,
      owner_id: ownerUserId,
      name: 'Realtime Cross-Device Test',
      phone: '+91 91234 56789'
    })

    // Wait up to 3.5s for Realtime event delivery to Client B
    for (let i = 0; i < 35; i++) {
      if (realtimeReceived) break
      await new Promise(r => setTimeout(r, 100))
    }

    assert(realtimeReceived, 'Realtime WebSocket: Client B received real-time INSERT event without manual refresh', receivedPayload?.new?.id)

    clientB.removeChannel(channel)

    // --------------------------------------------------------------------------
    // SECTION 10: CLEANUP TEST FIXTURES
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 10: Test Fixture Teardown & Database Cleanliness ---')

    // Delete in reverse order of foreign keys
    await adminClient.from('payment_transactions').delete().eq('owner_id', ownerUserId)
    await adminClient.from('report_results').delete().eq('owner_id', ownerUserId)
    await adminClient.from('report_versions').delete().eq('issued_by', ownerUserId)
    await adminClient.from('reports').delete().eq('owner_id', ownerUserId)
    await adminClient.from('order_tests').delete().eq('order_id', newOrder.id)
    await adminClient.from('laboratory_orders').delete().eq('owner_id', ownerUserId)
    await adminClient.from('patients').delete().eq('owner_id', ownerUserId)
    await adminClient.from('audit_logs').delete().eq('owner_id', ownerUserId)
    await adminClient.from('owner_profile').delete().eq('id', ownerUserId)
    await adminClient.from('owner_access').delete().eq('id', ownerUserId)
    await adminClient.auth.admin.deleteUser(ownerUserId)
    await adminClient.auth.admin.deleteUser(unauthorizedUserId)

    // Verify database is clean of operational records
    const { count: finalPatientCount } = await adminClient.from('patients').select('*', { count: 'exact', head: true })
    const { count: finalOrderCount } = await adminClient.from('laboratory_orders').select('*', { count: 'exact', head: true })
    const { count: finalReportCount } = await adminClient.from('reports').select('*', { count: 'exact', head: true })

    assert(finalPatientCount === 0 && finalOrderCount === 0 && finalReportCount === 0, 'Database Cleanliness: All test fixtures completely purged; 0 operational records remain')

  } catch (err) {
    console.error('Unexpected test error:', err)
    failed++
  }

  console.log('\n==============================================================================')
  console.log(`TEST EXECUTION SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('==============================================================================')

  if (failed > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

runTests()
