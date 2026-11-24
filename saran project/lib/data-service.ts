import { supabase, isSupabaseConfigured, setupRealtimeSync } from './supabase-client';
import {
  patients as localPatients,
  reports as localReports,
  tests as localTests,
  activities as localActivities,
  type Patient,
  type Report,
  type ActivityItem,
  type BilledTestItem,
  type BillingSummaryData,
} from './demo-data';
import {
  paymentLedger as localLedger,
  reportRevisions,
  reportAmendments,
  notifyDataChanged,
  updateLabProfile,
  updateAppPreferences,
  addNotification,
} from './demo-store';
import { registerPurgeCallback } from './auth-service';
import { evaluateResult } from './clinical-engine';

export interface NetworkState {
  isOnline: boolean;
  isCloudConnected: boolean;
  lastSyncTime: Date | null;
}

let currentNetworkState: NetworkState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isCloudConnected: isSupabaseConfigured,
  lastSyncTime: null,
};

const networkListeners = new Set<(state: NetworkState) => void>();

function notifyNetworkChange() {
  networkListeners.forEach((fn) => fn(currentNetworkState));
}

// Global browser / native network event monitoring
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    currentNetworkState.isOnline = true;
    notifyNetworkChange();
    syncLoadCloudData();
  });
  window.addEventListener('offline', () => {
    currentNetworkState.isOnline = false;
    notifyNetworkChange();
  });

  // Dynamic Capacitor Network integration if running natively
  import('@capacitor/network')
    .then(({ Network }) => {
      Network.addListener('networkStatusChange', (status) => {
        currentNetworkState.isOnline = status.connected;
        notifyNetworkChange();
        if (status.connected) syncLoadCloudData();
      });
      Network.getStatus().then((status) => {
        currentNetworkState.isOnline = status.connected;
        notifyNetworkChange();
      });
    })
    .catch(() => {
      // Standard browser runtime
    });
}

export function subscribeNetworkStatus(callback: (state: NetworkState) => void): () => void {
  networkListeners.add(callback);
  callback(currentNetworkState);
  return () => {
    networkListeners.delete(callback);
  };
}

export function getNetworkState(): NetworkState {
  return currentNetworkState;
}

// Register purge callback on owner signout to clear in-memory stores
registerPurgeCallback(() => {
  localPatients.length = 0;
  localReports.length = 0;
  localLedger.length = 0;
  localActivities.length = 0;
  notifyDataChanged();
});

// ==============================================================================
// CLOUD DATA PERSISTENCE & SYNCHRONIZATION
// ==============================================================================

/**
 * Loads real owner data from PostgreSQL into the application store.
 * Completely replaces in-memory collections with server truth (zero mock/ghost records).
 */
export async function syncLoadCloudData(): Promise<boolean> {
  console.log('[syncLoadCloudData] called. isSupabaseConfigured:', isSupabaseConfigured, 'hasSupabase:', !!supabase, 'isOnline:', currentNetworkState.isOnline);
  if (!isSupabaseConfigured || !supabase || !currentNetworkState.isOnline) {
    return false;
  }

  try {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    console.log('[syncLoadCloudData] getUser:', user ? user.id : 'NO USER', userErr ? userErr.message : 'no error');
    if (!user) return false;

    // 1. Fetch Reports, Results & Laboratory Orders (with order tests)
    const { data: dbReports, error: rptErr } = await supabase
      .from('reports')
      .select('*, report_results(*), laboratory_orders(*, order_tests(*))')
      .order('created_at', { ascending: false });
    console.log('[syncLoadCloudData] dbReports:', dbReports ? dbReports.length : 'null', rptErr ? rptErr.message : 'no error');

    const reportCountByPatient = new Map<string, number>();

    // Clear and rebuild local reports
    localReports.length = 0;
    if (dbReports && dbReports.length > 0) {
      dbReports.forEach((dbR) => {
        reportCountByPatient.set(dbR.patient_id, (reportCountByPatient.get(dbR.patient_id) || 0) + 1);

        const resultsMap: Record<string, string> = {};
        const resultFlagsMap: Record<string, string> = {};
        const resultIntervalsMap: Record<string, string> = {};
        const testNamesSet = new Set<string>();
        const billedItems: BilledTestItem[] = [];

        // 1. Populate from laboratory_orders.order_tests (authoritative for selected tests & prices)
        if (dbR.laboratory_orders && Array.isArray(dbR.laboratory_orders.order_tests)) {
          dbR.laboratory_orders.order_tests.forEach((ot: any) => {
            if (ot.test_name) {
              testNamesSet.add(ot.test_name);
              billedItems.push({
                testCode: ot.test_code || 'LEG-001',
                testName: ot.test_name,
                quantity: 1,
                unitPrice: Number(ot.price) || 0,
                discount: 0,
                amount: Number(ot.price) || 0,
              });
            }
          });
        }

        // 2. Populate from report_results (ensures entered parameters and amendments are captured)
        if (Array.isArray(dbR.report_results)) {
          dbR.report_results.forEach((res: any) => {
            if (res.test_name) testNamesSet.add(res.test_name);
            const k = `${res.test_name}:${res.parameter_name}`;
            resultsMap[k] = res.result_value || '';
            if (res.flag) resultFlagsMap[k] = res.flag;
            if (res.reference_interval) resultIntervalsMap[k] = res.reference_interval;
          });
        }

        // 3. Fallback for billedItems if order_tests was empty but tests were assigned
        if (billedItems.length === 0 && testNamesSet.size > 0) {
          testNamesSet.forEach((tName) => {
            const cat = localTests.find((x) => x.name === tName);
            const price = cat?.offer ?? cat?.price ?? 0;
            billedItems.push({
              testCode: cat?.code || 'LEG-001',
              testName: tName,
              quantity: 1,
              unitPrice: price,
              discount: 0,
              amount: price,
            });
          });
        }

        const subtotal = Number(dbR.subtotal_amount) || billedItems.reduce((acc, it) => acc + it.amount, 0);
        const discount = Number(dbR.discount_amount) || 0;
        const total = Number(dbR.final_amount) || Math.max(0, subtotal - discount);
        const paid = Number(dbR.paid_amount) || 0;
        const balance = Math.max(0, total - paid);
        const paymentStatus = dbR.payment_status === 'Paid' ? 'Paid' : paid >= total && total > 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Pending';

        const billingSummary: BillingSummaryData = {
          subtotal,
          discount,
          taxes: 0,
          additionalCharges: 0,
          total,
          paid,
          balance,
          paymentStatus,
        };

        if (dbR.amends_report_id) {
          reportAmendments[dbR.id] = dbR.amends_report_id;
        }

        reportRevisions[dbR.id] = [
          {
            version: dbR.current_version || 1,
            status: dbR.status || 'Draft',
            date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dbR.created_at || dbR.report_date)),
          },
        ];

        const mappedReport: Report = {
          id: dbR.id,
          orderId: dbR.order_id || dbR.laboratory_orders?.id,
          patient: '', // Linked after patients load
          patientId: dbR.patient_id,
          date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dbR.created_at || dbR.report_date)),
          tests: testNamesSet.size,
          testNames: Array.from(testNamesSet),
          results: resultsMap,
          resultFlags: resultFlagsMap,
          resultIntervals: resultIntervalsMap,
          amount: total,
          status: dbR.status || 'Draft',
          payment: paymentStatus === 'Paid' ? 'Paid' : paid > 0 ? `Partial · ${paid}` : 'Pending',
          subtotalAmount: subtotal,
          discountAmount: discount,
          paidAmount: paid,
          billedItems,
          billingSummary,
        };
        localReports.push(mappedReport);
      });
    }

    // 2. Fetch Patients
    const { data: dbPatients } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    localPatients.length = 0;
    const patientNameMap = new Map<string, string>();

    if (dbPatients && dbPatients.length > 0) {
      dbPatients.forEach((dbP) => {
        patientNameMap.set(dbP.id, dbP.name);
        const mappedPatient: Patient = {
          id: dbP.id,
          name: dbP.name,
          age: dbP.age || 0,
          gender: dbP.gender || 'Not specified',
          phone: dbP.phone,
          doctor: dbP.doctor || 'Self / Direct',
          dateOfBirth: dbP.date_of_birth || '',
          address: dbP.address || '',
          notes: dbP.notes || '',
          date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dbP.created_at)),
          reports: reportCountByPatient.get(dbP.id) || 0,
          is_archived: Boolean(dbP.is_archived),
        };
        localPatients.push(mappedPatient);
      });
    }

    // Backfill patient names into reports
    localReports.forEach((r) => {
      r.patient = patientNameMap.get(r.patientId) || 'Patient';
    });

    // 3. Fetch Payments Ledger
    const { data: dbPayments } = await supabase
      .from('payment_transactions')
      .select('*')
      .order('payment_date', { ascending: false });

    localLedger.length = 0;
    if (dbPayments && dbPayments.length > 0) {
      dbPayments.forEach((txn) => {
        localLedger.push({
          id: txn.id,
          reportId: txn.report_id,
          patientId: txn.patient_id,
          amount: Number(txn.amount),
          method: txn.payment_method,
          date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(txn.payment_date)),
          notes: txn.notes || txn.reference_number || '',
        });
      });
    }

    // 4. Load Test Catalogue & Lab Settings
    await syncLoadCatalogue();
    await syncLoadLabSettings();

    currentNetworkState.lastSyncTime = new Date();
    currentNetworkState.isCloudConnected = true;
    notifyNetworkChange();
    notifyDataChanged();
    return true;
  } catch (err) {
    console.warn('[DataService] Error synchronizing cloud data:', err);
    return false;
  }
}

/**
 * Creates a patient record with PostgreSQL persistence.
 */
export async function syncCreatePatient(patientData: {
  name: string;
  phone: string;
  age?: number;
  gender?: string;
  doctor?: string;
  dateOfBirth?: string;
  address?: string;
  notes?: string;
}): Promise<Patient> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database service is not configured.');
  }
  if (!currentNetworkState.isOnline) {
    throw new Error('Internet connection required to create records in cloud database.');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be signed in to perform this operation.');
  }

  // Generate next sequential patient identifier safely
  const { data: latestPatient } = await supabase
    .from('patients')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextSeq = 1;
  if (latestPatient?.id && latestPatient.id.startsWith('BHT-')) {
    const parsed = parseInt(latestPatient.id.replace('BHT-', ''), 10);
    if (!isNaN(parsed)) nextSeq = parsed + 1;
  } else {
    // If no records yet, start from standard operational sequence
    nextSeq = 2480;
  }
  const id = `BHT-${String(nextSeq).padStart(5, '0')}`;

  const { data, error } = await supabase
    .from('patients')
    .insert({
      id,
      owner_id: user.id,
      name: patientData.name.trim(),
      phone: patientData.phone.trim(),
      age: patientData.age || 0,
      gender: patientData.gender || 'Not specified',
      doctor: patientData.doctor?.trim() || 'Self / Direct',
      date_of_birth: patientData.dateOfBirth || null,
      address: patientData.address?.trim() || null,
      notes: patientData.notes?.trim() || null,
      is_archived: false,
    })
    .select()
    .single();

  if (error) throw error;

  const record: Patient = {
    id: data.id,
    name: data.name,
    age: data.age || 0,
    gender: data.gender || 'Not specified',
    phone: data.phone,
    doctor: data.doctor || 'Self / Direct',
    dateOfBirth: data.date_of_birth || '',
    address: data.address || '',
    notes: data.notes || '',
    date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    reports: 0,
    is_archived: false,
  };

  localPatients.unshift(record);
  addNotification('New patient registered', `${record.name} · ${record.id}`, `/patients/${record.id}`);
  currentNetworkState.lastSyncTime = new Date();
  notifyNetworkChange();
  notifyDataChanged();
  return record;
}

/**
 * Updates a patient record with PostgreSQL confirmation.
 */
export async function syncUpdatePatient(id: string, updates: Partial<{
  name: string;
  phone: string;
  age: number;
  gender: string;
  doctor: string;
  dateOfBirth: string;
  address: string;
  notes: string;
}>): Promise<Patient> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database service is not configured.');
  }
  if (!currentNetworkState.isOnline) {
    throw new Error('Internet connection required to update records.');
  }

  const { data, error } = await supabase
    .from('patients')
    .update({
      ...(updates.name ? { name: updates.name.trim() } : {}),
      ...(updates.phone ? { phone: updates.phone.trim() } : {}),
      ...(updates.age !== undefined ? { age: updates.age } : {}),
      ...(updates.gender ? { gender: updates.gender } : {}),
      ...(updates.doctor ? { doctor: updates.doctor.trim() } : {}),
      ...(updates.dateOfBirth !== undefined ? { date_of_birth: updates.dateOfBirth || null } : {}),
      ...(updates.address !== undefined ? { address: updates.address.trim() || null } : {}),
      ...(updates.notes !== undefined ? { notes: updates.notes.trim() || null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  const patient = localPatients.find((p) => p.id === id);
  if (patient) {
    Object.assign(patient, updates);
  }
  addNotification('Patient details updated', `${data.name} · ${data.id}`, `/patients/${data.id}`);
  currentNetworkState.lastSyncTime = new Date();
  notifyNetworkChange();
  notifyDataChanged();
  return patient || {
    id: data.id,
    name: data.name,
    age: data.age || 0,
    gender: data.gender || 'Not specified',
    phone: data.phone,
    doctor: data.doctor || 'Self / Direct',
    date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(data.created_at)),
    reports: 0,
  };
}

/**
 * Archives a patient record in PostgreSQL via secure RPC function.
 */
export async function syncArchivePatient(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database service is not configured.');
  }
  if (!currentNetworkState.isOnline) {
    throw new Error('Internet connection required to archive patients.');
  }

  const { error } = await supabase.rpc('archive_patient', { p_id: id });
  if (error) throw error;

  const patient = localPatients.find((p) => p.id === id);
  if (patient) {
    patient.is_archived = true;
    addNotification('Patient archived', `${patient.name} · ${patient.id}`, `/patients`);
  }

  currentNetworkState.lastSyncTime = new Date();
  notifyNetworkChange();
  notifyDataChanged();
  return true;
}

/**
 * Restores an archived patient record in PostgreSQL via secure RPC function.
 */
export async function syncRestorePatient(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database service is not configured.');
  }
  if (!currentNetworkState.isOnline) {
    throw new Error('Internet connection required to restore patients.');
  }

  const { error } = await supabase.rpc('restore_patient', { p_id: id });
  if (error) throw error;

  const patient = localPatients.find((p) => p.id === id);
  if (patient) {
    patient.is_archived = false;
    addNotification('Patient restored', `${patient.name} · ${patient.id}`, `/patients/${patient.id}`);
  }

  currentNetworkState.lastSyncTime = new Date();
  notifyNetworkChange();
  notifyDataChanged();
  return true;
}

/**
 * Controlled permanent deletion of an eligible patient (only permitted if zero linked clinical or financial history).
 */
export async function syncDeletePatient(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database service is not configured.');
  }
  if (!currentNetworkState.isOnline) {
    throw new Error('Internet connection required to delete patients.');
  }

  const { data, error } = await supabase.rpc('delete_eligible_patient', { p_id: id });
  if (error) throw error;

  const res = data as { success?: boolean; message?: string; blocked?: boolean } | null;
  if (res && res.success === false) {
    throw new Error(res.message || 'Permanent deletion blocked: Patient has historical clinical or financial records that must be retained.');
  }

  const index = localPatients.findIndex((p) => p.id === id);
  if (index >= 0) {
    localPatients.splice(index, 1);
  }

  currentNetworkState.lastSyncTime = new Date();
  notifyNetworkChange();
  notifyDataChanged();
  return true;
}

/**
 * Creates a laboratory order and report with results committed to PostgreSQL.
 */
export async function syncCreateReport(input: {
  patientId: string;
  testNames: string[];
  amount: number;
  results: Record<string, string>;
}): Promise<Report> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database service is not configured.');
  }
  if (!currentNetworkState.isOnline) {
    throw new Error('Internet connection required to create reports.');
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const dateStamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');

  // Sequential report ID
  const { data: latestReport } = await supabase
    .from('reports')
    .select('id')
    .like('id', `RPT-${dateStamp}-%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let seq = 1;
  if (latestReport?.id) {
    const parts = latestReport.id.split('-');
    const num = parseInt(parts[parts.length - 1] || '0', 10);
    if (!isNaN(num)) seq = num + 1;
  }
  const reportId = `RPT-${dateStamp}-${String(seq).padStart(3, '0')}`;
  const orderId = `ORD-${dateStamp}-${String(seq).padStart(3, '0')}`;

  // 1. Insert laboratory order
  await supabase.from('laboratory_orders').insert({
    id: orderId,
    owner_id: user.id,
    patient_id: input.patientId,
    order_date: new Date().toISOString().slice(0, 10),
    status: 'Completed',
    total_amount: input.amount,
  });

  // 2. Insert order tests with historical price snapshots
  const billedItems: BilledTestItem[] = [];
  const orderTestRows = input.testNames.map((name) => {
    const t = localTests.find((x) => x.name === name);
    const unitPrice = t?.offer || 0;
    billedItems.push({
      testCode: t?.code || 'LEG-001',
      testName: name,
      quantity: 1,
      unitPrice,
      discount: 0,
      amount: unitPrice,
    });
    return {
      order_id: orderId,
      test_code: t?.code || 'LEG-001',
      test_name: name,
      price: unitPrice,
      status: 'Completed' as const,
    };
  });
  if (orderTestRows.length > 0) {
    await supabase.from('order_tests').insert(orderTestRows);
  }

  const subtotal = billedItems.reduce((acc, it) => acc + it.amount, 0);
  const discount = Math.max(0, subtotal - input.amount);

  // 3. Insert report
  const { data: reportRecord, error: rptError } = await supabase
    .from('reports')
    .insert({
      id: reportId,
      owner_id: user.id,
      patient_id: input.patientId,
      order_id: orderId,
      report_date: new Date().toISOString().slice(0, 10),
      subtotal_amount: subtotal,
      discount_amount: discount,
      final_amount: input.amount,
      status: 'Draft',
      payment_status: 'Pending',
      paid_amount: 0,
    })
    .select()
    .single();

  if (rptError) throw rptError;

  // 4. Insert test results with clinical evaluation snapshot for all test parameters
  const patient = localPatients.find((p) => p.id === input.patientId);
  const resultRows: any[] = [];
  const resultsMap: Record<string, string> = { ...input.results };

  input.testNames.forEach((testName) => {
    const tDef = localTests.find((x) => x.name === testName);
    const params = tDef?.parameterDetails || [
      { name: testName, unit: '', type: 'Text' as const, isVerified: false },
    ];

    params.forEach((param) => {
      const paramName = param.name;
      const paramKey = `${testName}:${paramName}`;
      const val = input.results[paramKey] !== undefined ? input.results[paramKey] : '';
      resultsMap[paramKey] = val;
      const evalRes = evaluateResult(testName, paramName, val, { age: patient?.age, gender: patient?.gender }, param.unit, false);
      resultRows.push({
        owner_id: user.id,
        report_id: reportId,
        test_name: testName,
        parameter_name: paramName,
        result_value: val,
        unit: evalRes.unit || param.unit || '',
        reference_interval: evalRes.referenceDisplay,
        applied_reference_interval: evalRes.referenceDisplay,
        reference_interval_version: evalRes.matchedInterval?.referenceVersion || 1,
        flag: evalRes.dbFlag,
        is_abnormal: evalRes.isAbnormal,
      });
    });
  });

  if (resultRows.length > 0) {
    await supabase.from('report_results').insert(resultRows);
  }

  if (patient) {
    patient.reports = (patient.reports || 0) + 1;
  }

  const billingSummary: BillingSummaryData = {
    subtotal,
    discount,
    taxes: 0,
    additionalCharges: 0,
    total: input.amount,
    paid: 0,
    balance: input.amount,
    paymentStatus: 'Pending',
  };

  const mapped: Report = {
    id: reportId,
    orderId,
    patient: patient?.name || 'Patient',
    patientId: input.patientId,
    date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    tests: input.testNames.length,
    testNames: [...input.testNames],
    results: resultsMap,
    amount: input.amount,
    status: 'Draft',
    payment: 'Pending',
    subtotalAmount: subtotal,
    discountAmount: discount,
    paidAmount: 0,
    billedItems,
    billingSummary,
  };

  localReports.unshift(mapped);
  reportRevisions[reportId] = [{ version: 1, status: 'Draft', date: mapped.date }];
  addNotification('Report saved as draft', `${reportId} · ${patient?.name || 'Patient'}`, `/reports/${reportId}`);

  currentNetworkState.lastSyncTime = new Date();
  notifyNetworkChange();
  notifyDataChanged();
  return mapped;
}

/**
 * Updates a draft report in PostgreSQL.
 */
export async function syncUpdateDraftReport(
  id: string,
  input: {
    patientId: string;
    testNames: string[];
    amount: number;
    results: Record<string, string>;
    discount?: number;
    notes?: string;
    sampleDate?: string;
    sampleTime?: string;
    sampleType?: string;
  }
): Promise<Report> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database service is not configured.');
  }
  if (!currentNetworkState.isOnline) {
    throw new Error('Internet connection required to update reports.');
  }

  const report = localReports.find((r) => r.id === id);
  if (!report) throw new Error('Report was not found.');
  if (report.status !== 'Draft') throw new Error('Only draft reports can be edited. Issued reports require an amendment workflow.');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  // Build billed items and calculate subtotal/discount
  const billedItems: BilledTestItem[] = [];
  input.testNames.forEach((name) => {
    const t = localTests.find((x) => x.name === name);
    const unitPrice = t?.offer || 0;
    billedItems.push({
      testCode: t?.code || 'LEG-001',
      testName: name,
      quantity: 1,
      unitPrice,
      discount: 0,
      amount: unitPrice,
    });
  });
  const subtotal = billedItems.reduce((acc, it) => acc + it.amount, 0);
  const discount = input.discount !== undefined ? input.discount : Math.max(0, subtotal - input.amount);

  // Update report metadata
  const { error: rptError } = await supabase
    .from('reports')
    .update({
      patient_id: input.patientId,
      subtotal_amount: subtotal,
      discount_amount: discount,
      final_amount: input.amount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'Draft');

  if (rptError) throw rptError;

  // Update laboratory order & order tests if order exists
  if (report.orderId) {
    await supabase
      .from('laboratory_orders')
      .update({
        patient_id: input.patientId,
        total_amount: input.amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', report.orderId);

    await supabase.from('order_tests').delete().eq('order_id', report.orderId);
    const newOrderTests = input.testNames.map((name) => {
      const t = localTests.find((x) => x.name === name);
      return {
        order_id: report.orderId!,
        test_code: t?.code || 'LEG-001',
        test_name: name,
        price: t?.offer || 0,
        status: 'Completed' as const,
      };
    });
    if (newOrderTests.length > 0) {
      await supabase.from('order_tests').insert(newOrderTests);
    }
  }

  // Replace results with clinical evaluation snapshot for all test parameters
  await supabase.from('report_results').delete().eq('report_id', id);

  const patient = localPatients.find((p) => p.id === input.patientId);
  const resultRows: any[] = [];
  const resultsMap: Record<string, string> = { ...input.results };

  input.testNames.forEach((testName) => {
    const tDef = localTests.find((x) => x.name === testName);
    const params = tDef?.parameterDetails || [
      { name: testName, unit: '', type: 'Text' as const, isVerified: false },
    ];

    params.forEach((param) => {
      const paramName = param.name;
      const paramKey = `${testName}:${paramName}`;
      const val = input.results[paramKey] !== undefined ? input.results[paramKey] : '';
      resultsMap[paramKey] = val;
      const evalRes = evaluateResult(testName, paramName, val, { age: patient?.age, gender: patient?.gender }, param.unit, false);
      resultRows.push({
        owner_id: user.id,
        report_id: id,
        test_name: testName,
        parameter_name: paramName,
        result_value: val,
        unit: evalRes.unit || param.unit || '',
        reference_interval: evalRes.referenceDisplay,
        applied_reference_interval: evalRes.referenceDisplay,
        reference_interval_version: evalRes.matchedInterval?.referenceVersion || 1,
        flag: evalRes.dbFlag,
        is_abnormal: evalRes.isAbnormal,
      });
    });
  });

  if (resultRows.length > 0) {
    await supabase.from('report_results').insert(resultRows);
  }

  const paid = report.paidAmount || (report.payment === 'Paid' ? input.amount : report.payment.startsWith('Partial') ? Number(report.payment.split('·')[1]?.trim()) || 0 : 0);
  const balance = Math.max(0, input.amount - paid);
  const paymentStatus = report.payment === 'Paid' ? 'Paid' : paid >= input.amount && input.amount > 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Pending';

  const billingSummary: BillingSummaryData = {
    subtotal,
    discount,
    taxes: 0,
    additionalCharges: 0,
    total: input.amount,
    paid,
    balance,
    paymentStatus,
  };

  Object.assign(report, {
    patient: patient?.name || report.patient || 'Patient',
    patientId: input.patientId,
    tests: input.testNames.length,
    testNames: [...input.testNames],
    results: resultsMap,
    amount: input.amount,
    subtotalAmount: subtotal,
    discountAmount: discount,
    paidAmount: paid,
    notes: input.notes !== undefined ? input.notes : report.notes,
    sampleDate: input.sampleDate || report.sampleDate,
    sampleTime: input.sampleTime || report.sampleTime,
    sampleType: input.sampleType || report.sampleType,
    billedItems,
    billingSummary,
  });

  const revisions = (reportRevisions[report.id] ??= []);
  revisions.push({
    version: revisions.length + 1,
    status: 'Draft (Updated)',
    date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
  });

  addNotification('Draft report updated', `${report.id} · ${patient?.name || 'Patient'}`, `/reports/${report.id}`);
  currentNetworkState.lastSyncTime = new Date();
  notifyNetworkChange();
  notifyDataChanged();
  return report;
}

/**
 * Issues a laboratory report in PostgreSQL.
 */
export async function syncIssueReport(reportId: string): Promise<Report> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database service is not configured.');
  }
  if (!currentNetworkState.isOnline) {
    throw new Error('Internet connection required to issue reports.');
  }

  const report = localReports.find((r) => r.id === reportId);
  if (!report) throw new Error('Report was not found.');
  if (report.tests === 0 || report.testNames.length === 0) {
    throw new Error('Cannot issue report: No tests have been assigned to this laboratory report.');
  }

  const { data, error } = await supabase
    .from('reports')
    .update({
      status: 'Issued',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;

  report.status = 'Issued';
  const revisions = (reportRevisions[report.id] ??= []);
  revisions.push({
    version: revisions.length + 1,
    status: 'Issued',
    date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
  });

  addNotification('Report finalized & issued', reportId, `/reports/${reportId}`);
  currentNetworkState.lastSyncTime = new Date();
  notifyNetworkChange();
  notifyDataChanged();
  return report || ({} as any);
}

/**
 * Deletes a draft report in PostgreSQL. Finalized/issued reports are protected by RLS and cannot be deleted.
 */
export async function syncDeleteDraftReport(reportId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database service is not configured.');
  }
  if (!currentNetworkState.isOnline) {
    throw new Error('Internet connection required to delete reports.');
  }

  // Delete result items first
  await supabase.from('report_results').delete().eq('report_id', reportId);

  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId)
    .eq('status', 'Draft');

  if (error) throw error;

  const index = localReports.findIndex((r) => r.id === reportId);
  if (index >= 0) {
    localReports.splice(index, 1);
  }

  currentNetworkState.lastSyncTime = new Date();
  notifyNetworkChange();
  notifyDataChanged();
  return true;
}

/**
 * Creates an immutable versioned amendment for an already issued report.
 */
export async function syncCreateReportAmendment(sourceReportId: string): Promise<Report> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database service is not configured.');
  }
  if (!currentNetworkState.isOnline) {
    throw new Error('Internet connection required to amend reports.');
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const source = localReports.find((r) => r.id === sourceReportId);
  if (!source || source.status !== 'Issued') {
    throw new Error('Only issued reports can be amended.');
  }

  const dateStamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const seq = Math.floor(100 + Math.random() * 900);
  const amendmentId = `RPT-${dateStamp}-${seq}`;

  const { data: newReport, error } = await supabase
    .from('reports')
    .insert({
      id: amendmentId,
      owner_id: user.id,
      patient_id: source.patientId,
      order_id: source.orderId,
      report_date: new Date().toISOString().slice(0, 10),
      subtotal_amount: source.subtotalAmount ?? source.amount,
      discount_amount: source.discountAmount ?? 0,
      final_amount: source.amount,
      status: 'Draft',
      payment_status: source.payment === 'Paid' ? 'Paid' : 'Pending',
      paid_amount: source.payment === 'Paid' ? source.amount : 0,
      amends_report_id: sourceReportId,
      current_version: 2,
    })
    .select()
    .single();

  if (error) throw error;

  // Clone existing results into amendment draft with clinical evaluation snapshot
  const patient = localPatients.find((p) => p.id === source.patientId);
  const resultRows = Object.entries(source.results).map(([key, val]) => {
    const parts = key.split(':');
    const testName = parts[0] || '';
    const paramName = parts.slice(1).join(':') || testName;
    const evalRes = evaluateResult(testName, paramName, val, { age: patient?.age, gender: patient?.gender }, undefined, false);
    return {
      owner_id: user.id,
      report_id: amendmentId,
      test_name: testName,
      parameter_name: paramName,
      result_value: val || '',
      unit: evalRes.unit || '',
      reference_interval: evalRes.referenceDisplay,
      applied_reference_interval: evalRes.referenceDisplay,
      reference_interval_version: evalRes.matchedInterval?.referenceVersion || 1,
      flag: evalRes.dbFlag,
      is_abnormal: evalRes.isAbnormal,
    };
  });

  if (resultRows.length > 0) {
    await supabase.from('report_results').insert(resultRows);
  }

  reportAmendments[amendmentId] = sourceReportId;

  const mapped: Report = {
    id: amendmentId,
    orderId: source.orderId,
    patient: source.patient,
    patientId: source.patientId,
    date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    tests: source.tests,
    testNames: [...source.testNames],
    results: { ...source.results },
    amount: source.amount,
    status: 'Draft',
    payment: source.payment,
    subtotalAmount: source.subtotalAmount,
    discountAmount: source.discountAmount,
    paidAmount: source.paidAmount,
    billedItems: source.billedItems ? [...source.billedItems] : undefined,
    billingSummary: source.billingSummary ? { ...source.billingSummary } : undefined,
  };

  localReports.unshift(mapped);
  reportRevisions[amendmentId] = [{ version: 2, status: 'Draft', date: mapped.date }];
  addNotification('Amendment draft created', `${amendmentId} · amends ${source.id}`, `/reports/${amendmentId}`);

  currentNetworkState.lastSyncTime = new Date();
  notifyNetworkChange();
  notifyDataChanged();
  return mapped;
}

/**
 * Records a financial transaction in PostgreSQL and updates the report ledger.
 */
export async function syncRecordPayment(payment: {
  reportId: string;
  patientId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database service is not configured.');
  }
  if (!currentNetworkState.isOnline) {
    throw new Error('Internet connection required to record payments.');
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const dateStamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const { data: latestPayment } = await supabase
    .from('payment_transactions')
    .select('id')
    .like('id', `RCP-${dateStamp}-%`)
    .order('payment_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  let seq = 1;
  if (latestPayment?.id) {
    const parts = latestPayment.id.split('-');
    const num = parseInt(parts[parts.length - 1] || '0', 10);
    if (!isNaN(num)) seq = num + 1;
  }
  const receiptId = `RCP-${dateStamp}-${String(seq).padStart(3, '0')}`;

  const { data, error } = await supabase
    .from('payment_transactions')
    .insert({
      id: receiptId,
      owner_id: user.id,
      report_id: payment.reportId,
      patient_id: payment.patientId,
      amount: payment.amount,
      payment_method: payment.paymentMethod,
      reference_number: payment.referenceNumber || null,
      notes: payment.notes || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Update report paid_amount
  const { data: report } = await supabase
    .from('reports')
    .select('final_amount, paid_amount')
    .eq('id', payment.reportId)
    .single();

  if (report) {
    const newPaid = Number(report.paid_amount || 0) + Number(payment.amount);
    const newStatus = newPaid >= Number(report.final_amount) ? 'Paid' : 'Partial';
    await supabase
      .from('reports')
      .update({
        paid_amount: newPaid,
        payment_status: newStatus,
      })
      .eq('id', payment.reportId);
  }

  localLedger.unshift({
    id: receiptId,
    reportId: payment.reportId,
    patientId: payment.patientId,
    amount: payment.amount,
    method: payment.paymentMethod,
    date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    notes: payment.notes || payment.referenceNumber || '',
  });

  const localRpt = localReports.find((r) => r.id === payment.reportId);
  if (localRpt) {
    const paidSoFar = localRpt.payment.startsWith('Partial · ')
      ? Number(localRpt.payment.split('·')[1]?.trim()) || 0
      : localRpt.payment === 'Paid' ? localRpt.amount : 0;
    const totalPaid = paidSoFar + payment.amount;
    localRpt.payment = totalPaid >= localRpt.amount ? 'Paid' : `Partial · ${totalPaid}`;
  }

  addNotification(
    'Payment recorded',
    `${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(payment.amount)} · ${payment.reportId}`,
    `/billing/${payment.reportId}`
  );

  currentNetworkState.lastSyncTime = new Date();
  notifyNetworkChange();
  notifyDataChanged();
  return data;
}

/**
 * Loads test catalogue definitions and active prices from PostgreSQL into application store.
 */
export async function syncLoadCatalogue(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !currentNetworkState.isOnline) {
    return false;
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        await supabase.rpc('claim_system_catalogue_for_owner');
      } catch {
        // Safe if already claimed or restricted
      }
    }

    const { data: dbTests, error } = await supabase
      .from('test_catalogue')
      .select('code, name, category, normal_price, discount_price, parameters_count, active, is_panel, notes')
      .order('code', { ascending: true });

    if (error || !dbTests || dbTests.length === 0) return false;

    dbTests.forEach((dbT) => {
      const existing = localTests.find((t) => t.code === dbT.code);
      if (existing) {
        existing.price = Number(dbT.normal_price);
        existing.offer = Number(dbT.discount_price);
        existing.active = Boolean(dbT.active);
      } else {
        localTests.push({
          code: dbT.code,
          name: dbT.name,
          category: dbT.category as any,
          price: Number(dbT.normal_price),
          offer: Number(dbT.discount_price),
          parameters: dbT.parameters_count || 1,
          parameterNames: [dbT.name],
          units: [''],
          active: Boolean(dbT.active),
        });
      }
    });

    notifyDataChanged();
    return true;
  } catch (err) {
    console.warn('[DataService] Error loading catalogue from database:', err);
    return false;
  }
}

/**
 * Updates a test price in PostgreSQL test_catalogue.
 */
export async function syncUpdateTestPrice(code: string, normalPrice: number, offerPrice: number) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database service is not configured.');
  }
  if (!currentNetworkState.isOnline) {
    throw new Error('Internet connection required to update test prices.');
  }
  const { error } = await supabase
    .from('test_catalogue')
    .update({
      normal_price: normalPrice,
      discount_price: offerPrice,
      updated_at: new Date().toISOString(),
    })
    .eq('code', code);

  if (error) throw error;

  const test = localTests.find((t) => t.code === code);
  if (test) {
    test.price = normalPrice;
    test.offer = offerPrice;
    notifyDataChanged();
  }
}

/**
 * Adds a new test to the catalogue in PostgreSQL.
 */
export async function syncAddTest(testInput: {
  code: string;
  name: string;
  category: string;
  price: number;
  offer: number;
  parameters: Array<{ name: string; unit?: string; type?: string; precision?: number; isVerified?: boolean }>;
  active?: boolean;
}) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database service is not configured.');
  }
  if (!currentNetworkState.isOnline) {
    throw new Error('Internet connection required to add tests.');
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { error } = await supabase
    .from('test_catalogue')
    .insert({
      code: testInput.code.trim(),
      owner_id: user.id,
      name: testInput.name.trim(),
      category: testInput.category,
      normal_price: testInput.price,
      discount_price: testInput.offer,
      parameters_count: testInput.parameters.length || 1,
      active: testInput.active !== false,
    });

  if (error) throw error;

  if (testInput.parameters.length > 0) {
    const paramRows = testInput.parameters.map((p, idx) => ({
      test_code: testInput.code.trim(),
      name: p.name.trim(),
      data_type: p.type || 'Unconfigured',
      unit: p.unit || '',
      precision: p.precision ?? 2,
      sort_order: idx,
      is_verified: false,
    }));
    await supabase.from('test_parameters').insert(paramRows);
  }

  const newTest = {
    code: testInput.code.trim(),
    name: testInput.name.trim(),
    category: testInput.category as any,
    price: testInput.price,
    offer: testInput.offer,
    parameters: testInput.parameters.length,
    parameterNames: testInput.parameters.map((p) => p.name.trim()),
    units: testInput.parameters.map((p) => p.unit || ''),
    parameterDetails: testInput.parameters.map((p) => ({
      name: p.name.trim(),
      unit: p.unit || '',
      type: (p.type as any) || 'Unconfigured',
      precision: p.precision,
      isVerified: false,
    })),
    active: testInput.active !== false,
  };

  localTests.unshift(newTest);
  addNotification('Test added to catalogue', `${newTest.name} · ${newTest.code}`, `/tests/${newTest.code}`);
  notifyDataChanged();
  return newTest;
}

/**
 * Updates a test in the catalogue in PostgreSQL.
 */
export async function syncUpdateTest(code: string, testInput: {
  code?: string;
  name?: string;
  category?: string;
  price?: number;
  offer?: number;
  active?: boolean;
  parameters?: Array<{ name: string; unit?: string; type?: string; precision?: number; isVerified?: boolean }>;
}) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database service is not configured.');
  }
  if (!currentNetworkState.isOnline) {
    throw new Error('Internet connection required to update tests.');
  }
  const { error } = await supabase
    .from('test_catalogue')
    .update({
      ...(testInput.name ? { name: testInput.name.trim() } : {}),
      ...(testInput.category ? { category: testInput.category } : {}),
      ...(testInput.price !== undefined ? { normal_price: testInput.price } : {}),
      ...(testInput.offer !== undefined ? { discount_price: testInput.offer } : {}),
      ...(testInput.active !== undefined ? { active: testInput.active } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('code', code);

  if (error) throw error;

  const existing = localTests.find((t) => t.code === code);
  if (existing) {
    if (testInput.name) existing.name = testInput.name.trim();
    if (testInput.category) existing.category = testInput.category as any;
    if (testInput.price !== undefined) existing.price = testInput.price;
    if (testInput.offer !== undefined) existing.offer = testInput.offer;
    if (testInput.active !== undefined) existing.active = testInput.active;
  }

  addNotification('Test catalogue updated', `${existing?.name || code} · ${code}`, `/tests/${code}`);
  notifyDataChanged();
  return existing;
}

/**
 * Loads owner lab settings from PostgreSQL.
 */
export async function syncLoadLabSettings(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !currentNetworkState.isOnline) {
    return false;
  }
  try {
    const { data: rows, error } = await supabase
      .from('lab_settings')
      .select('key, value');

    if (error || !rows || rows.length === 0) return false;

    rows.forEach((row) => {
      if (row.key === 'lab_profile' && row.value && typeof row.value === 'object') {
        updateLabProfile(row.value as any);
      } else if (row.key === 'app_preferences' && row.value && typeof row.value === 'object') {
        updateAppPreferences(row.value as any);
      }
    });
    return true;
  } catch (err) {
    console.warn('[DataService] Error loading lab settings:', err);
    return false;
  }
}

/**
 * Saves owner lab settings to PostgreSQL.
 */
export async function syncSaveLabSettings(key: 'lab_profile' | 'app_preferences', value: Record<string, any>) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database service is not configured.');
  }
  if (!currentNetworkState.isOnline) {
    throw new Error('Internet connection required to save settings.');
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { error } = await supabase
    .from('lab_settings')
    .upsert({
      key,
      owner_id: user.id,
      value,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

  if (error) throw error;

  if (key === 'lab_profile') {
    updateLabProfile(value as any);
  } else {
    updateAppPreferences(value as any);
  }
  notifyDataChanged();
}

// ==============================================================================
// OWNER REFERENCE INTERVAL APPROVAL & AUDIT SERVICE
// ==============================================================================

export interface DbReferenceInterval {
  id: string;
  test_code: string;
  test_name: string;
  parameter_name: string;
  gender: string;
  age_min_years: number;
  age_max_years: number;
  low_value: number | null;
  high_value: number | null;
  qualitative_normal: string | null;
  unit: string;
  source_file: string;
  source_location: string;
  original_source_wording: string;
  reference_version: number;
  is_verified: boolean;
  is_approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  governance_state: string;
}

export interface DbReferenceAudit {
  id: string;
  reference_interval_id: string;
  changed_by: string;
  action: 'APPROVED' | 'REJECTED' | 'CORRECTED' | 'SUPERSEDED' | 'VERSION_CREATED';
  previous_data: any;
  new_data: any;
  reason: string | null;
  created_at: string;
}

export async function syncLoadReferenceIntervals(): Promise<DbReferenceInterval[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('reference_intervals')
    .select('*')
    .order('test_name', { ascending: true })
    .order('parameter_name', { ascending: true });
  if (error) {
    console.error('Error loading reference intervals:', error);
    return [];
  }
  return data as DbReferenceInterval[];
}

export async function syncApproveReferenceInterval(intervalId: string, notes?: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database service is not configured.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data: prev, error: fetchErr } = await supabase
    .from('reference_intervals')
    .select('*')
    .eq('id', intervalId)
    .single();
  if (fetchErr || !prev) throw new Error('Reference interval not found.');

  const timestamp = new Date().toISOString();
  const nextVersion = (prev.reference_version || 1) + 1;

  const { error: updateErr } = await supabase
    .from('reference_intervals')
    .update({
      is_approved: true,
      is_verified: true,
      governance_state: prev.low_value != null || prev.high_value != null ? 'APPROVED_NUMERIC_RANGE' : (prev.qualitative_normal ? 'APPROVED_QUALITATIVE_REFERENCE' : 'OWNER_REVIEW_REQUIRED'),
      approved_by: user.id,
      approved_at: timestamp,
      reference_version: nextVersion,
    })
    .eq('id', intervalId);
  if (updateErr) throw updateErr;

  await supabase.from('reference_interval_audit').insert({
    reference_interval_id: intervalId,
    changed_by: user.id,
    action: 'APPROVED',
    previous_data: prev,
    new_data: { ...prev, is_approved: true, is_verified: true, reference_version: nextVersion, approved_at: timestamp },
    reason: notes || 'Owner verified and approved clinical reference interval.',
  });
}

export async function syncRejectReferenceInterval(intervalId: string, reason?: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database service is not configured.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data: prev, error: fetchErr } = await supabase
    .from('reference_intervals')
    .select('*')
    .eq('id', intervalId)
    .single();
  if (fetchErr || !prev) throw new Error('Reference interval not found.');

  const { error: updateErr } = await supabase
    .from('reference_intervals')
    .update({
      is_approved: false,
      is_verified: false,
      governance_state: 'OWNER_REVIEW_REQUIRED',
      approved_by: null,
      approved_at: null,
    })
    .eq('id', intervalId);
  if (updateErr) throw updateErr;

  await supabase.from('reference_interval_audit').insert({
    reference_interval_id: intervalId,
    changed_by: user.id,
    action: 'REJECTED',
    previous_data: prev,
    new_data: { ...prev, is_approved: false, is_verified: false },
    reason: reason || 'Owner rejected or revoked reference approval.',
  });
}

export async function syncCorrectReferenceInterval(
  intervalId: string,
  corrections: {
    low_value?: number | null;
    high_value?: number | null;
    unit?: string;
    gender?: string;
    age_min_years?: number;
    age_max_years?: number;
    qualitative_normal?: string | null;
  },
  reason: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database service is not configured.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data: prev, error: fetchErr } = await supabase
    .from('reference_intervals')
    .select('*')
    .eq('id', intervalId)
    .single();
  if (fetchErr || !prev) throw new Error('Reference interval not found.');

  const nextVersion = (prev.reference_version || 1) + 1;
  const updatePayload = {
    ...corrections,
    reference_version: nextVersion,
    is_verified: true,
    is_approved: true,
    approved_by: user.id,
    approved_at: new Date().toISOString(),
  };

  const { error: updateErr } = await supabase
    .from('reference_intervals')
    .update(updatePayload)
    .eq('id', intervalId);
  if (updateErr) throw updateErr;

  await supabase.from('reference_interval_audit').insert({
    reference_interval_id: intervalId,
    changed_by: user.id,
    action: 'CORRECTED',
    previous_data: prev,
    new_data: { ...prev, ...updatePayload },
    reason: reason || 'Owner corrected transcription error and approved new version.',
  });
}

export async function syncLoadReferenceAudits(intervalId: string): Promise<DbReferenceAudit[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('reference_interval_audit')
    .select('*')
    .eq('reference_interval_id', intervalId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error loading reference audits:', error);
    return [];
  }
  return data as DbReferenceAudit[];
}

// Initialize Realtime Sync channel
if (typeof window !== 'undefined' && isSupabaseConfigured) {
  setupRealtimeSync((payload) => {
    console.log('[Realtime] Change received from PostgreSQL:', payload.table, payload.eventType);
    // Reload cloud data on external mutation from another device
    syncLoadCloudData();
  });
}

