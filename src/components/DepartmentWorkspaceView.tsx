import React, { useState } from 'react';
import { Project, ProjectConflict, CitizenReport, AuditLog, UserProfile, UserRole } from '../types';
import { dataStore } from '../lib/dataStore';
import {
  ShieldCheck,
  ClipboardCheck,
  History,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Lock,
  ArrowRight,
  HardHat,
  Building,
  CheckSquare,
} from 'lucide-react';

interface DepartmentWorkspaceViewProps {
  projects: Project[];
  conflicts: ProjectConflict[];
  reports: CitizenReport[];
  auditLogs: AuditLog[];
  currentUser: UserProfile;
  initialSubTab?: 'work_orders' | 'inter_agency' | 'field_signoffs' | 'audit';
  onSelectConflict: (conflict: ProjectConflict) => void;
  onRefresh: () => void;
  onSwitchPersona?: (role: UserRole) => void;
}

interface WorkOrder {
  id: string;
  orderNumber: string;
  projectCode: string;
  title: string;
  department: string;
  roadSegment: string;
  contractor: string;
  budgetLakhs: number;
  status: 'pending_approval' | 'approved' | 'in_execution' | 'completed';
  requiredClearance: string;
}

export const DepartmentWorkspaceView: React.FC<DepartmentWorkspaceViewProps> = ({
  projects,
  conflicts,
  reports,
  auditLogs,
  currentUser,
  initialSubTab,
  onSelectConflict,
  onRefresh,
  onSwitchPersona,
}) => {
  const [subTab, setSubTab] = useState<'work_orders' | 'inter_agency' | 'field_signoffs' | 'audit'>(
    initialSubTab || 'work_orders'
  );

  React.useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Work orders local state
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([
    {
      id: 'wo-1',
      orderNumber: 'WO-2026-7842',
      projectCode: 'HW-2026-089',
      title: 'Tambaram GST Road Milling & High-Density Bitumen Laying',
      department: 'Highways & Road Infrastructure',
      roadSegment: 'GST Road (Tambaram to Chromepet)',
      contractor: 'Apex Infra Highways Pvt Ltd',
      budgetLakhs: 420.0,
      status: 'pending_approval',
      requiredClearance: 'Pending Water Board Feeder Testing Clearance',
    },
    {
      id: 'wo-2',
      orderNumber: 'WO-2026-3104',
      projectCode: 'WS-2026-114',
      title: 'Feeder Main Hydrostatic Pressure Testing & Pipe Laying',
      department: 'Water Supply & Sewage Board',
      roadSegment: 'GST Road Corridor',
      contractor: 'Cauvery Water Tech Works',
      budgetLakhs: 285.5,
      status: 'approved',
      requiredClearance: 'Traffic Police Arterial Diversion Permit Approved',
    },
    {
      id: 'wo-3',
      orderNumber: 'WO-2026-5591',
      projectCode: 'MC-2026-042',
      title: 'Precast Box Culvert Drainage Construction',
      department: 'City Municipal Corporation',
      roadSegment: 'Vandalur-Kelambakkam Road',
      contractor: 'Metro Drainage Solutions',
      budgetLakhs: 195.0,
      status: 'in_execution',
      requiredClearance: 'Zonal Structural Audit Complete',
    },
  ]);

  const [approvedActionMsg, setApprovedActionMsg] = useState<string | null>(null);

  // Field sign-offs state
  const [verifiedSignoffs, setVerifiedSignoffs] = useState<{ [key: string]: boolean }>({
    'CS-2026-7842': true,
    'CS-2026-3104': true,
  });

  const isCitizen = currentUser.role === 'citizen';

  const handleApproveWorkOrder = (id: string, orderNumber: string) => {
    setWorkOrders((prev) =>
      prev.map((wo) =>
        wo.id === id ? { ...wo, status: 'approved' } : wo
      )
    );
    dataStore.logAudit('WORK_ORDER_APPROVED', 'work_orders', id, {
      orderNumber,
      approvedBy: currentUser.fullName,
      role: currentUser.role,
    });
    setApprovedActionMsg(`Work Order ${orderNumber} officially authorized and dispatched.`);
    setTimeout(() => setApprovedActionMsg(null), 4000);
    onRefresh();
  };

  const handleSignoffReport = (refNo: string) => {
    setVerifiedSignoffs((prev) => ({ ...prev, [refNo]: true }));
    const rep = reports.find((r) => r.referenceNo === refNo);
    if (rep) {
      dataStore.updateReportStatus(rep.id, 'resolved', 'Field inspection sign-off completed by Executive Engineer.', rep.departmentAssigned, 4);
    }
    setApprovedActionMsg(`Field sign-off completed for incident ${refNo}.`);
    setTimeout(() => setApprovedActionMsg(null), 4000);
    onRefresh();
  };

  // If Public Citizen persona is selected: display clean restricted message
  if (isCitizen) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 shadow-xs text-center max-w-2xl mx-auto space-y-4 my-8">
        <div className="w-14 h-14 bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-amber-600" />
        </div>
        <div className="space-y-1">
          <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold uppercase tracking-wide">
            Executive Authorization Required
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">
            Restricted Municipal Executive Workspace
          </h2>
          <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
            The Department Workspace contains internal operational work orders, inter-agency right-of-way approvals, and field engineering sign-offs. This console is restricted to municipal engineering personnel.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          {onSwitchPersona && (
            <>
              <button
                onClick={() => onSwitchPersona('dept_officer')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <HardHat className="w-4 h-4 text-amber-400" /> Switch to Highways Engineer
              </button>
              <button
                onClick={() => onSwitchPersona('city_admin')}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <ShieldCheck className="w-4 h-4 text-teal-600" /> Switch to City Admin (IAS)
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const activeConflicts = conflicts.filter(
    (c) => c.status !== 'dismissed' && c.status !== 'resolved_sequenced'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner with Officer Credentials */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Department Executive Workspace</span>
            <span>·</span>
            <span className="font-mono text-teal-300 uppercase font-semibold">
              {currentUser.role.replace('_', ' ')}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">{currentUser.fullName}</h2>
          <div className="text-xs text-slate-400 mt-0.5">
            {currentUser.designation} — {currentUser.department}
          </div>
        </div>

        {/* Workspace Subtabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-lg text-xs flex-wrap">
          <button
            onClick={() => setSubTab('work_orders')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              subTab === 'work_orders' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Work Order Queue ({workOrders.length})
          </button>
          <button
            onClick={() => setSubTab('inter_agency')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              subTab === 'inter_agency' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Inter-Agency Accords ({conflicts.length})
          </button>
          <button
            onClick={() => setSubTab('field_signoffs')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              subTab === 'field_signoffs' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Field Sign-Offs ({reports.length})
          </button>
          <button
            onClick={() => setSubTab('audit')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              subTab === 'audit' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Master Audit Trail ({auditLogs.length})
          </button>
        </div>
      </div>

      {approvedActionMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2 text-xs shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{approvedActionMsg}</span>
        </div>
      )}

      {/* Subtab 1: Work Order Approval Table */}
      {subTab === 'work_orders' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Municipal Work Order Approvals & Right-of-Way Issuance
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review capital infrastructure authorizations before contractor mobilization.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              TAMBARAM ZONAL DESK
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">Project Title & Corridor</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Contractor</th>
                  <th className="py-3 px-3">Budget</th>
                  <th className="py-3 px-3">Inter-Agency Clearance</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {wo.orderNumber}
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-bold text-slate-900">{wo.title}</div>
                      <div className="text-[11px] text-slate-500">{wo.roadSegment}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{wo.department}</td>
                    <td className="py-3 px-3 text-slate-600">{wo.contractor}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      ₹{wo.budgetLakhs.toFixed(1)} L
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600 max-w-xs">
                      {wo.requiredClearance}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          wo.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : wo.status === 'in_execution'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {wo.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {wo.status === 'pending_approval' ? (
                        <button
                          onClick={() => handleApproveWorkOrder(wo.id, wo.orderNumber)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                        >
                          Approve Work Order
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 2: Inter-Agency Coordination Log */}
      {subTab === 'inter_agency' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Inter-Agency Coordination Log & Right-of-Way Accords
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Formal scheduling protocols between Highways, Water Board, and Power Grids.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {conflicts.length} REGISTERED CLASHES
            </span>
          </div>

          <div className="space-y-4">
            {conflicts.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>{c.roadSegment}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        c.status === 'resolved_sequenced'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : c.status === 'override_concurrent'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectConflict(c)}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
                  >
                    Open in Conflict Center →
                  </button>
                </div>

                <div className="text-slate-700 leading-relaxed">
                  <strong>Conflict Accord:</strong> {c.conflictReason}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 font-mono">
                  <div>Agency 1: {c.projectA?.title} ({c.projectA?.plannedStartDate} to {c.projectA?.plannedEndDate})</div>
                  <div>Agency 2: {c.projectB?.title} ({c.projectB?.plannedStartDate} to {c.projectB?.plannedEndDate})</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 3: Field Verification Sign-offs */}
      {subTab === 'field_signoffs' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Field Verification Sign-offs & Resolution Evidence
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sign off verified citizen hazard remediations with executive inspector endorsement.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              TAMBARAM ZONAL SUB-DIVISION
            </span>
          </div>

          <div className="space-y-3">
            {reports.map((rep) => {
              const isSigned = verifiedSignoffs[rep.referenceNo] || rep.status === 'resolved';
              return (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {rep.referenceNo}
                      </span>
                      <span className="font-bold text-slate-900">{rep.title}</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">📍 {rep.landmark}</div>
                    <div className="text-slate-600 text-[11px]">{rep.internalNotes}</div>
                  </div>

                  <div className="shrink-0">
                    {isSigned ? (
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Executive Sign-Off Active
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSignoffReport(rep.referenceNo)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer shadow-2xs"
                      >
                        Sign Off Resolution
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab 4: Master Audit Trail */}
      {subTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              Master Immutable Audit Ledger
            </h3>
            <span className="text-xs font-mono text-slate-500">
              TAMPER-EVIDENT HASH STAMPS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor & Persona</th>
                  <th className="py-2.5 px-3">Action Event</th>
                  <th className="py-2.5 px-3">Target Entity</th>
                  <th className="py-2.5 px-3">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-bold text-slate-900">{log.actorName}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {log.entityType} ({log.entityId?.slice(0, 8)})
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
