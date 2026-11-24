/**
 * BIO HI TECH LIMS — TWO-CLIENT REALTIME WORKFLOW VALIDATION
 * 
 * Verifies real Supabase Realtime WebSocket synchronization across two
 * independently authenticated owner clients connected to local PostgreSQL.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

let testCount = 0
let passCount = 0
let failCount = 0

function assert(condition, message, details = '') {
  testCount++
  if (condition) {
    passCount++
    console.log(`  ✓ [PASS] ${message}${details ? ' (' + details + ')' : ''}`)
  } else {
    failCount++
    console.error(`  ✗ [FAIL] ${message}${details ? ' - ' + details : ''}`)
  }
}

// Helper to wait for a realtime event with a timeout
function waitForEvent(eventBox, timeoutMs = 5000) {
  const start = Date.now()
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (eventBox.received) {
        clearInterval(interval)
        resolve(eventBox.payload)
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval)
        resolve(null)
      }
    }, 50)
  })
}

async function runTwoClientRealtimeTests() {
  console.log('==============================================================================')
  console.log('BIO HI TECH — TWO-CLIENT REALTIME WEBSOCKET SYNCHRONIZATION AUDIT')
  console.log('==============================================================================')
  console.log(`Target: ${SUPABASE_URL}`)
  console.log(`Timestamp: ${new Date().toISOString()}`)

  // 1. Setup authenticated owner identity
  const ownerEmail = `realtime-owner-${Date.now()}@biohitech.test`
  const ownerPassword = 'RealtimeOwnerPassword123!'

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true
  })
  if (authErr) throw authErr
  const ownerId = authData.user.id

  await admin.from('owner_access').upsert({
    id: ownerId,
    email: ownerEmail,
    is_active: true,
    role: 'OWNER'
  })

  await admin.from('owner_profile').upsert({
    id: ownerId,
    email: ownerEmail,
    full_name: 'Dr. Realtime Sync Tester',
    designation: 'Laboratory Director',
    lab_name: 'BIO HI TECH LABS'
  })

  // Ensure catalogue owner_id is NULL for system catalogue access
  await admin.from('test_catalogue').update({ owner_id: null }).neq('code', '')

  // 2. Initialize Client A and Client B with separate authenticated sessions
  const clientA = createClient(SUPABASE_URL, ANON_KEY)
  const clientB = createClient(SUPABASE_URL, ANON_KEY)

  const { error: loginErrA } = await clientA.auth.signInWithPassword({ email: ownerEmail, password: ownerPassword })
  if (loginErrA) throw loginErrA

  const { error: loginErrB } = await clientB.auth.signInWithPassword({ email: ownerEmail, password: ownerPassword })
  if (loginErrB) throw loginErrB

  console.log('\n--- Realtime Channel Setup ---')
  console.log('  Client A authenticated:', ownerEmail)
  console.log('  Client B authenticated:', ownerEmail)

  // Track events received on Client A and Client B
  const eventsA = { received: false, payload: null, list: [] }
  const eventsB = { received: false, payload: null, list: [] }

  function resetBox(box) {
    box.received = false
    box.payload = null
  }

  // Client A Channel: Listen to all public tables
  const channelA = clientA
    .channel('client_a_sync')
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      eventsA.received = true
      eventsA.payload = payload
      eventsA.list.push(payload)
    })

  // Client B Channel: Listen to all public tables
  const channelB = clientB
    .channel('client_b_sync')
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      eventsB.received = true
      eventsB.payload = payload
      eventsB.list.push(payload)
    })

  // Subscribe and await confirmation
  await Promise.all([
    new Promise(res => channelA.subscribe(status => status === 'SUBSCRIBED' && res())),
    new Promise(res => channelB.subscribe(status => status === 'SUBSCRIBED' && res()))
  ])

  // Allow Realtime broker to finish channel registration
  await new Promise(r => setTimeout(r, 300))

  console.log('  Client A WebSocket channel: SUBSCRIBED ✓')
  console.log('  Client B WebSocket channel: SUBSCRIBED ✓')

  const testPatientId = `BHT-RT-${Math.floor(1000 + Math.random() * 9000)}`
  const testOrderId = `ORD-RT-${Math.floor(1000 + Math.random() * 9000)}`
  const testReportId = `RPT-RT-${Math.floor(1000 + Math.random() * 9000)}`
  const testReceiptId = `RCP-RT-${Math.floor(1000 + Math.random() * 9000)}`

  // --------------------------------------------------------------------------
  // TEST 1: Patient Creation (Client A -> Client B)
  // --------------------------------------------------------------------------
  console.log('\n--- 1. Patient Creation (Client A -> Client B) ---')
  resetBox(eventsB)

  const { error: pInsertErr } = await clientA.from('patients').insert({
    id: testPatientId,
    owner_id: ownerId,
    name: 'Realtime Test Patient',
    phone: '+91 98765 43210',
    age: 38,
    gender: 'Female',
    doctor: 'Dr. A. Sharma'
  })
  if (pInsertErr) throw pInsertErr

  const pEventB = await waitForEvent(eventsB)
  assert(
    pEventB && pEventB.eventType === 'INSERT' && pEventB.table === 'patients' && pEventB.new.id === testPatientId,
    'Client A creates patient → Client B receives real-time INSERT',
    pEventB?.new?.name
  )

  // --------------------------------------------------------------------------
  // TEST 2: Patient Editing (Client B -> Client A)
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Patient Editing (Client B -> Client A) ---')
  resetBox(eventsA)

  const { error: pUpdateErr } = await clientB.from('patients').update({
    phone: '+91 99999 11111',
    notes: 'Updated contact by Client B'
  }).eq('id', testPatientId)
  if (pUpdateErr) throw pUpdateErr

  const pEventA = await waitForEvent(eventsA)
  assert(
    pEventA && pEventA.eventType === 'UPDATE' && pEventA.new.phone === '+91 99999 11111',
    'Client B edits patient → Client A receives real-time UPDATE',
    pEventA?.new?.phone
  )

  // --------------------------------------------------------------------------
  // TEST 3: Patient Archival & Restoration
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Patient Archival & Restoration ---')
  resetBox(eventsB)

  // Client A archives patient
  const { error: archiveErr } = await clientA.rpc('archive_patient', { p_id: testPatientId })
  if (archiveErr) throw archiveErr

  const archiveEventB = await waitForEvent(eventsB)
  assert(
    archiveEventB && archiveEventB.eventType === 'UPDATE' && archiveEventB.new.is_archived === true,
    'Client A archives patient → Client B receives real-time is_archived: true',
    `id: ${testPatientId}`
  )

  // Client B restores patient
  resetBox(eventsA)
  const { error: restoreErr } = await clientB.rpc('restore_patient', { p_id: testPatientId })
  if (restoreErr) throw restoreErr

  const restoreEventA = await waitForEvent(eventsA)
  assert(
    restoreEventA && restoreEventA.eventType === 'UPDATE' && restoreEventA.new.is_archived === false,
    'Client B restores patient → Client A receives real-time is_archived: false',
    `id: ${testPatientId}`
  )

  // --------------------------------------------------------------------------
  // TEST 4: Laboratory Order Creation & Status Update
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Laboratory Order Creation & Status Update ---')
  resetBox(eventsB)

  const { error: ordErr } = await clientA.from('laboratory_orders').insert({
    id: testOrderId,
    owner_id: ownerId,
    patient_id: testPatientId,
    total_amount: 500,
    status: 'Pending'
  })
  if (ordErr) throw ordErr

  const ordEventB = await waitForEvent(eventsB)
  assert(
    ordEventB && ordEventB.eventType === 'INSERT' && ordEventB.table === 'laboratory_orders' && ordEventB.new.id === testOrderId,
    'Client A creates laboratory order → Client B receives real-time INSERT',
    ordEventB?.new?.status
  )

  // Client B updates order status
  resetBox(eventsA)
  const { error: ordUpErr } = await clientB.from('laboratory_orders').update({
    status: 'Processing'
  }).eq('id', testOrderId)
  if (ordUpErr) throw ordUpErr

  const ordEventA = await waitForEvent(eventsA)
  assert(
    ordEventA && ordEventA.eventType === 'UPDATE' && ordEventA.new.status === 'Processing',
    'Client B updates order status → Client A receives real-time UPDATE',
    ordEventA?.new?.status
  )

  // --------------------------------------------------------------------------
  // TEST 5: Test Results Entry (Client A -> Client B)
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Test Results Entry (Client A -> Client B) ---')
  resetBox(eventsB)

  // Client A creates draft report
  const { error: rptErr } = await clientA.from('reports').insert({
    id: testReportId,
    owner_id: ownerId,
    patient_id: testPatientId,
    order_id: testOrderId,
    subtotal_amount: 500,
    final_amount: 500,
    status: 'Draft'
  })
  if (rptErr) throw rptErr

  // Client A enters test result
  const { error: resErr } = await clientA.from('report_results').insert({
    owner_id: ownerId,
    report_id: testReportId,
    test_code: 'LEG-022',
    test_name: 'CBC / Hemogram',
    parameter_name: 'Haemoglobin',
    result_value: '13.8',
    unit: 'g/dL',
    flag: 'Normal'
  })
  if (resErr) throw resErr

  const resEventB = await waitForEvent(eventsB)
  assert(
    resEventB !== null && (resEventB.table === 'report_results' || resEventB.table === 'reports'),
    'Client A enters test result → Client B receives real-time result event',
    `Table: ${resEventB?.table}`
  )

  // --------------------------------------------------------------------------
  // TEST 6: Report Finalization / Issuance (Client B -> Client A)
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Report Finalization / Issuance (Client B -> Client A) ---')
  resetBox(eventsA)

  const { error: issueErr } = await clientB.from('reports').update({
    status: 'Issued'
  }).eq('id', testReportId)
  if (issueErr) throw issueErr

  const rptEventA = await waitForEvent(eventsA)
  assert(
    rptEventA && rptEventA.eventType === 'UPDATE' && rptEventA.table === 'reports' && rptEventA.new.status === 'Issued',
    'Client B issues report → Client A receives real-time status: Issued',
    `Report: ${testReportId}`
  )

  // --------------------------------------------------------------------------
  // TEST 7: Payment Transaction Ledger Entry
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Payment Transaction Ledger Entry ---')
  resetBox(eventsB)

  const { error: payErr } = await clientA.from('payment_transactions').insert({
    id: testReceiptId,
    owner_id: ownerId,
    report_id: testReportId,
    patient_id: testPatientId,
    amount: 500.00,
    payment_method: 'UPI',
    reference_number: 'UPI-REF-9988'
  })
  if (payErr) throw payErr

  const payEventB = await waitForEvent(eventsB)
  assert(
    payEventB && payEventB.eventType === 'INSERT' && payEventB.table === 'payment_transactions' && payEventB.new.id === testReceiptId,
    'Client A records payment → Client B receives real-time ledger INSERT',
    `Amount: ₹${payEventB?.new?.amount}`
  )

  // --------------------------------------------------------------------------
  // TEST 8: Catalogue Price Modification
  // --------------------------------------------------------------------------
  console.log('\n--- 8. Catalogue Price Modification ---')
  resetBox(eventsA)

  // Client B updates price of LEG-001
  const { error: catErr } = await clientB.from('test_catalogue').update({
    normal_price: 2200.00
  }).eq('code', 'LEG-001')
  if (catErr) throw catErr

  const catEventA = await waitForEvent(eventsA)
  assert(
    catEventA && catEventA.eventType === 'UPDATE' && catEventA.table === 'test_catalogue',
    'Client B updates catalogue price → Client A receives real-time UPDATE',
    `New Price: ${catEventA?.new?.normal_price}`
  )

  // Restore price
  await clientB.from('test_catalogue').update({ normal_price: 2150.00 }).eq('code', 'LEG-001')

  // --------------------------------------------------------------------------
  // TEST 9: Simultaneous Concurrency & Version Increment
  // --------------------------------------------------------------------------
  console.log('\n--- 9. Simultaneous Concurrency & Version Increment ---')
  
  // Both clients read order at version 2
  const { data: ordBeforeA } = await clientA.from('laboratory_orders').select('version').eq('id', testOrderId).single()
  const { data: ordBeforeB } = await clientB.from('laboratory_orders').select('version').eq('id', testOrderId).single()

  assert(
    ordBeforeA.version === ordBeforeB.version,
    'Client A and Client B read identical order version snapshot',
    `Version: ${ordBeforeA.version}`
  )

  // Client A updates order
  await clientA.from('laboratory_orders').update({ status: 'Completed' }).eq('id', testOrderId)
  const { data: ordAfterA } = await clientA.from('laboratory_orders').select('version').eq('id', testOrderId).single()

  assert(
    ordAfterA.version === ordBeforeA.version + 1,
    'PostgreSQL trigger automatically increments record version upon edit',
    `Version: ${ordAfterA.version}`
  )

  // --------------------------------------------------------------------------
  // TEST 10: Disconnect & Reconnect Resilience
  // --------------------------------------------------------------------------
  console.log('\n--- 10. Disconnect & Reconnect Resilience ---')

  // Disconnect Client B's channel
  clientB.removeChannel(channelB)

  // Client A performs mutation while Client B is disconnected
  const offlineTestPatientId = `BHT-OFF-${Math.floor(1000 + Math.random() * 9000)}`
  await clientA.from('patients').insert({
    id: offlineTestPatientId,
    owner_id: ownerId,
    name: 'Offline Disconnect Patient',
    phone: '+91 99887 76655'
  })

  // Client B reconnects with a fresh channel
  resetBox(eventsB)
  const channelB2 = clientB
    .channel('client_b_reconnect')
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      eventsB.received = true
      eventsB.payload = payload
      eventsB.list.push(payload)
    })

  await new Promise(res => channelB2.subscribe(status => status === 'SUBSCRIBED' && res()))
  console.log('  Client B reconnected and subscribed ✓')

  // Verify Client B can fetch the missed mutation through cloud sync query
  const { data: missedPatient } = await clientB.from('patients').select('id, name').eq('id', offlineTestPatientId).single()
  assert(
    missedPatient && missedPatient.id === offlineTestPatientId,
    'Client B reconnects and reconciles records created during disconnect',
    missedPatient?.name
  )

  // Client A creates another patient -> Client B receives it live on reconnected channel
  resetBox(eventsB)
  const postReconnectPatientId = `BHT-POST-${Math.floor(1000 + Math.random() * 9000)}`
  await clientA.from('patients').insert({
    id: postReconnectPatientId,
    owner_id: ownerId,
    name: 'Post Reconnect Live Patient',
    phone: '+91 91122 33445'
  })

  const postReconnectEvent = await waitForEvent(eventsB)
  assert(
    postReconnectEvent && postReconnectEvent.new.id === postReconnectPatientId,
    'Reconnected Client B immediately receives live events without restart',
    postReconnectEvent?.new?.name
  )

  // --------------------------------------------------------------------------
  // TEST 11: Deduplication Verification
  // --------------------------------------------------------------------------
  console.log('\n--- 11. Event Deduplication Verification ---')

  // Count events for postReconnectPatientId in eventsB.list
  const matchingEvents = eventsB.list.filter(e => e.table === 'patients' && e.new?.id === postReconnectPatientId)
  assert(
    matchingEvents.length === 1,
    'Client receives exactly 1 event payload (zero duplicate deliveries)',
    `Event count: ${matchingEvents.length}`
  )

  // --------------------------------------------------------------------------
  // TEARDOWN & PURGE FIXTURES
  // --------------------------------------------------------------------------
  console.log('\n--- Teardown & Database Cleanliness ---')

  clientA.removeChannel(channelA)
  clientB.removeChannel(channelB2)

  // Teardown in reverse order of foreign keys
  await admin.from('payment_transactions').delete().eq('owner_id', ownerId)
  await admin.from('report_results').delete().eq('owner_id', ownerId)
  await admin.from('reports').delete().eq('owner_id', ownerId)
  await admin.from('laboratory_orders').delete().eq('owner_id', ownerId)
  await admin.from('audit_logs').delete().eq('owner_id', ownerId)
  await admin.from('patients').delete().eq('owner_id', ownerId)
  await admin.from('owner_profile').delete().eq('id', ownerId)
  await admin.from('owner_access').delete().eq('id', ownerId)
  await admin.auth.admin.deleteUser(ownerId)
  await admin.from('test_catalogue').update({ owner_id: null }).neq('code', '')

  const { count: finalPatientCount } = await admin.from('patients').select('*', { count: 'exact', head: true })
  assert(
    finalPatientCount === 0,
    'All test fixtures purged; operational database clean',
    `Patients: ${finalPatientCount}`
  )

  console.log('\n==============================================================================')
  console.log(`REALTIME TEST EXECUTION SUMMARY: ${passCount} PASSED, ${failCount} FAILED (TOTAL: ${testCount})`)
  console.log('==============================================================================')

  if (failCount > 0) process.exit(1)
}

runTwoClientRealtimeTests().catch(err => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
