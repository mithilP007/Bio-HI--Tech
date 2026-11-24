'use client';

import React, { useState, useEffect } from 'react';
import {
  syncLoadReferenceIntervals,
  syncApproveReferenceInterval,
  syncRejectReferenceInterval,
  syncCorrectReferenceInterval,
  syncLoadReferenceAudits,
  type DbReferenceInterval,
  type DbReferenceAudit,
} from '@/lib/data-service';
import referenceDataset from '@/data/clinical/reference-intervals.json';
import { Search, Check, X, Edit2, History, AlertTriangle, ShieldCheck } from 'lucide-react';

export function ReferenceApprovalConsole({ onAction }: { onAction: (msg: string) => void }) {
  const [intervals, setIntervals] = useState<DbReferenceInterval[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNVERIFIED' | 'APPROVED'>('ALL');
  const [selectedInterval, setSelectedInterval] = useState<DbReferenceInterval | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [audits, setAudits] = useState<DbReferenceAudit[]>([]);

  // Edit form state
  const [editLow, setEditLow] = useState<string>('');
  const [editHigh, setEditHigh] = useState<string>('');
  const [editUnit, setEditUnit] = useState<string>('');
  const [editQual, setEditQual] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const dbData = await syncLoadReferenceIntervals();
      if (dbData.length > 0) {
        setIntervals(dbData);
      } else {
        // Fallback to local reference dataset if cloud is empty or connecting
        const fallback = (referenceDataset as any).intervals || [];
        const mapped: DbReferenceInterval[] = fallback.map((inv: any, idx: number) => ({
          id: `ref-local-${idx}`,
          test_code: inv.testId || '',
          test_name: inv.testName || '',
          parameter_name: inv.parameterName || '',
          gender: inv.applicableSex || 'Both',
          age_min_years: inv.ageMin || 0,
          age_max_years: inv.ageMax || 130,
          low_value: inv.lowerLimit,
          high_value: inv.upperLimit,
          qualitative_normal: inv.qualitativeExpected,
          unit: inv.units || '',
          source_file: inv.sourceFile || 'legacy_reference/BIO_HI_TECH_Lab_App/index.html',
          source_location: inv.sourceLocation || 'index.html:S',
          original_source_wording: inv.originalSourceWording || '',
          reference_version: inv.referenceVersion || 1,
          is_verified: inv.verificationStatus === 'VERIFIED',
          is_approved: inv.ownerApprovalStatus === 'APPROVED',
          approved_by: inv.approvingPerson,
          approved_at: inv.approvalDate,
          governance_state: inv.clinicalGovernanceState || 'OWNER_REVIEW_REQUIRED',
        }));
        setIntervals(mapped);
      }
    } catch (e) {
      console.error('Error loading intervals:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = intervals.filter((inv) => {
    const q = search.toLowerCase();
    const matchQ =
      inv.test_name.toLowerCase().includes(q) ||
      inv.parameter_name.toLowerCase().includes(q) ||
      inv.test_code.toLowerCase().includes(q);
    if (!matchQ) return false;
    if (statusFilter === 'UNVERIFIED') return !inv.is_approved;
    if (statusFilter === 'APPROVED') return inv.is_approved;
    return true;
  });

  async function handleApprove(inv: DbReferenceInterval) {
    if (!window.confirm(`Approve clinical reference interval for ${inv.test_name} - ${inv.parameter_name}?`)) return;
    try {
      await syncApproveReferenceInterval(inv.id, 'Owner approved extracted baseline interval.');
      onAction(`Reference interval for ${inv.parameter_name} approved successfully.`);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Error approving interval.');
    }
  }

  async function handleReject(inv: DbReferenceInterval) {
    if (!window.confirm(`Revoke approval for ${inv.test_name} - ${inv.parameter_name}?`)) return;
    try {
      await syncRejectReferenceInterval(inv.id, 'Owner revoked approval.');
      onAction(`Approval for ${inv.parameter_name} revoked.`);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Error revoking approval.');
    }
  }

  function openEdit(inv: DbReferenceInterval) {
    setSelectedInterval(inv);
    setEditLow(inv.low_value != null ? String(inv.low_value) : '');
    setEditHigh(inv.high_value != null ? String(inv.high_value) : '');
    setEditUnit(inv.unit || '');
    setEditQual(inv.qualitative_normal || '');
    setEditReason('');
    setEditModalOpen(true);
  }

  async function handleSaveCorrection(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInterval) return;
    if (!editReason.trim()) {
      alert('A clinical reason is mandatory to correct or supersede a reference interval.');
      return;
    }
    setSaving(true);
    try {
      await syncCorrectReferenceInterval(
        selectedInterval.id,
        {
          low_value: editLow !== '' ? Number(editLow) : null,
          high_value: editHigh !== '' ? Number(editHigh) : null,
          unit: editUnit.trim(),
          qualitative_normal: editQual.trim() || null,
        },
        editReason.trim()
      );
      onAction(`Reference interval for ${selectedInterval.parameter_name} corrected and updated to new version.`);
      setEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error saving correction.');
    } finally {
      setSaving(false);
    }
  }

  async function openHistory(inv: DbReferenceInterval) {
    setSelectedInterval(inv);
    setHistoryModalOpen(true);
    try {
      const logs = await syncLoadReferenceAudits(inv.id);
      setAudits(logs);
    } catch (e) {
      console.error(e);
      setAudits([]);
    }
  }

  const approvedCount = intervals.filter((i) => i.is_approved).length;
  const unverifiedCount = intervals.filter((i) => !i.is_approved).length;

  return (
    <div className="reference-console-wrap">
      <div className="unverified-note field-wide">
        <span className="footnote-mark">i</span>
        <strong>Strict Clinical Governance:</strong> All 234 canonical reference records are initially unverified. Only explicitly approved intervals will be treated as medically validated normal ranges.
      </div>

      <div className="console-stats-bar">
        <div className="stat-pill">
          <span>Total Records</span>
          <strong>{intervals.length}</strong>
        </div>
        <div className="stat-pill stat-unverified">
          <span>Pending Owner Review</span>
          <strong>{unverifiedCount}</strong>
        </div>
        <div className="stat-pill stat-approved">
          <span>Owner Approved</span>
          <strong>{approvedCount}</strong>
        </div>
      </div>

      <div className="console-controls">
        <div className="search-field">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by test or parameter name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <button
            type="button"
            className={`btn-filter ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All ({intervals.length})
          </button>
          <button
            type="button"
            className={`btn-filter ${statusFilter === 'UNVERIFIED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('UNVERIFIED')}
          >
            Unverified ({unverifiedCount})
          </button>
          <button
            type="button"
            className={`btn-filter ${statusFilter === 'APPROVED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('APPROVED')}
          >
            Approved ({approvedCount})
          </button>
        </div>
      </div>

      <div className="console-table-container">
        <table className="console-table">
          <thead>
            <tr>
              <th>Test & Analyte</th>
              <th>Applicability</th>
              <th>Raw Source Spec</th>
              <th>Extracted Reference</th>
              <th>Status & Version</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading canonical reference records...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  No matching reference records found.
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <strong>{inv.test_name}</strong>
                    <br />
                    <small>{inv.parameter_name} ({inv.test_code})</small>
                  </td>
                  <td>
                    <span>Sex: {inv.gender}</span>
                    <br />
                    <small>Age: {inv.age_min_years}-{inv.age_max_years}y</small>
                  </td>
                  <td>
                    <code>{inv.original_source_wording || '—'}</code>
                    <br />
                    <small>{inv.source_location}</small>
                  </td>
                  <td>
                    {inv.low_value != null && inv.high_value != null ? (
                      <strong>{inv.low_value} – {inv.high_value} {inv.unit}</strong>
                    ) : inv.qualitative_normal ? (
                      <strong>{inv.qualitative_normal}</strong>
                    ) : (
                      <em>Descriptive / Observation</em>
                    )}
                  </td>
                  <td>
                    <span className={`status-pill ${inv.is_approved ? 'status-issued' : 'status-draft'}`}>
                      {inv.is_approved ? 'Approved' : 'Unverified'}
                    </span>
                    <br />
                    <small>v{inv.reference_version || 1}</small>
                  </td>
                  <td>
                    <div className="action-button-group">
                      {!inv.is_approved ? (
                        <button
                          type="button"
                          className="button button-primary btn-sm"
                          title="Approve Interval"
                          onClick={() => handleApprove(inv)}
                        >
                          <Check size={13} /> Approve
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="button button-secondary btn-sm"
                          title="Revoke Approval"
                          onClick={() => handleReject(inv)}
                        >
                          <X size={13} /> Revoke
                        </button>
                      )}
                      <button
                        type="button"
                        className="button button-secondary btn-sm"
                        title="Correct Error"
                        onClick={() => openEdit(inv)}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="button button-secondary btn-sm"
                        title="View Audit History"
                        onClick={() => openHistory(inv)}
                      >
                        <History size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT / CORRECTION MODAL */}
      {editModalOpen && selectedInterval && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-head">
              <h3>Correct Reference: {selectedInterval.test_name} - {selectedInterval.parameter_name}</h3>
              <button type="button" onClick={() => setEditModalOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveCorrection}>
              <div className="modal-body">
                <p className="modal-intro">
                  Original Source: <code>{selectedInterval.original_source_wording}</code> ({selectedInterval.source_location})
                </p>
                <div className="form-grid-2">
                  <label className="field">
                    <span>Lower Limit</span>
                    <input
                      type="number"
                      step="any"
                      value={editLow}
                      onChange={(e) => setEditLow(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Upper Limit</span>
                    <input
                      type="number"
                      step="any"
                      value={editHigh}
                      onChange={(e) => setEditHigh(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Unit</span>
                    <input
                      type="text"
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Qualitative Expected</span>
                    <input
                      type="text"
                      value={editQual}
                      onChange={(e) => setEditQual(e.target.value)}
                    />
                  </label>
                </div>
                <label className="field" style={{ marginTop: '1rem' }}>
                  <span>Clinical Rationale / Audit Reason *</span>
                  <textarea
                    rows={3}
                    placeholder="Provide justification (e.g. Corrected transcription error against Roche Cobas reference sheet)..."
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="button button-secondary" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save & Increment Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {historyModalOpen && selectedInterval && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-head">
              <h3>Audit History: {selectedInterval.parameter_name}</h3>
              <button type="button" onClick={() => setHistoryModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {audits.length === 0 ? (
                <p>No audit log events recorded yet for this interval. Record remains in baseline extracted state (v{selectedInterval.reference_version || 1}).</p>
              ) : (
                <div className="audit-timeline">
                  {audits.map((a) => (
                    <div key={a.id} className="audit-event">
                      <span className="audit-action">{a.action}</span>
                      <span className="audit-date">{new Date(a.created_at).toLocaleString()}</span>
                      <p className="audit-reason">{a.reason || 'No comment recorded'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="button button-secondary" onClick={() => setHistoryModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
