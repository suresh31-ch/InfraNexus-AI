import React, { useState } from 'react';
import { Department, WorkCategory, ProjectStatus } from '../types';
import { dataStore } from '../lib/dataStore';
import { Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CreateProjectModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState<Department>('Highways & Road Infrastructure');
  const [workCategory, setWorkCategory] = useState<WorkCategory>('road_resurfacing');
  const [roadSegment, setRoadSegment] = useState('');
  const [zone, setZone] = useState('Zone 3 - Southern Metropolitan');
  const [contractor, setContractor] = useState('');
  const [budget, setBudget] = useState('150.0');
  const [plannedStartDate, setPlannedStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedEndDate, setPlannedEndDate] = useState(
    new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
  );
  const [latitude, setLatitude] = useState('12.9250');
  const [longitude, setLongitude] = useState('80.1280');
  const [radius, setRadius] = useState('200');

  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];

    if (!title.trim()) errs.push('Project title is required.');
    if (!roadSegment.trim()) errs.push('Road segment corridor is required.');
    if (!contractor.trim()) errs.push('Contractor name is required.');

    const bVal = parseFloat(budget);
    if (isNaN(bVal) || bVal < 0) errs.push('Budget must be a positive number.');

    const latVal = parseFloat(latitude);
    const lngVal = parseFloat(longitude);
    if (isNaN(latVal) || isNaN(lngVal)) errs.push('Valid latitude and longitude are required.');

    if (new Date(plannedEndDate).getTime() < new Date(plannedStartDate).getTime()) {
      errs.push('Planned end date must be on or after planned start date.');
    }

    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setErrors([]);

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const prefix = {
      'Highways & Road Infrastructure': 'HW',
      'Water Supply & Sewage Board': 'WS',
      'Electricity & Power Utilities': 'EL',
      'Optical Fiber & Telecom': 'TL',
      'City Municipal Corporation': 'MC',
    }[department];

    dataStore.addProject({
      projectCode: `${prefix}-2026-${randomSuffix}`,
      title: title.trim(),
      description: description.trim() || 'Municipal capital works approved by zonal engineering division.',
      department,
      workCategory,
      roadSegment: roadSegment.trim(),
      zone,
      contractor: contractor.trim(),
      estimatedBudget: bVal,
      plannedStartDate,
      plannedEndDate,
      status: 'planned' as ProjectStatus,
      progressPercentage: 0,
      latitude: latVal,
      longitude: lngVal,
      workZoneRadiusMeters: parseInt(radius, 10) || 200,
      isDemoSeed: false,
    });

    setSubmitting(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-base font-bold text-slate-900">Add New Infrastructure Project</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs text-slate-700">
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 space-y-1">
              {errors.map((err, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-800 block mb-1">Project Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. GST Road Service Lane Milling & Asphalting"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Department *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Highways & Road Infrastructure">Highways & Road Infrastructure</option>
                <option value="Water Supply & Sewage Board">Water Supply & Sewage Board</option>
                <option value="Electricity & Power Utilities">Electricity & Power Utilities</option>
                <option value="Optical Fiber & Telecom">Optical Fiber & Telecom</option>
                <option value="City Municipal Corporation">City Municipal Corporation</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">Work Category *</label>
              <select
                value={workCategory}
                onChange={(e) => setWorkCategory(e.target.value as WorkCategory)}
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="road_resurfacing">Road Resurfacing</option>
                <option value="water_pipeline">Water Pipeline</option>
                <option value="drainage">Drainage & Culvert</option>
                <option value="power_grid">Power Grid Underground</option>
                <option value="telecom_duct">Telecom Micro-Duct</option>
                <option value="gas_pipeline">Gas Pipeline</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Road Segment / Corridor *</label>
              <input
                type="text"
                required
                value={roadSegment}
                onChange={(e) => setRoadSegment(e.target.value)}
                placeholder="e.g. Grand Southern Trunk (GST) Road - Tambaram Corridor"
                className="w-full p-2.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Zonal Jurisdiction</label>
              <input
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="e.g. Zone 3 - Southern Metropolitan"
                className="w-full p-2.5 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Contractor / Agency *</label>
              <input
                type="text"
                required
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                placeholder="e.g. National Highways Infra Corp"
                className="w-full p-2.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Estimated Budget (₹ Lakhs) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Planned Start Date *</label>
              <input
                type="date"
                required
                value={plannedStartDate}
                onChange={(e) => setPlannedStartDate(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Planned End Date *</label>
              <input
                type="date"
                required
                value={plannedEndDate}
                onChange={(e) => setPlannedEndDate(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Latitude</label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="12.9250"
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Longitude</label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="80.1280"
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Work Radius (meters)</label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-800 block mb-1">Project Scope & Scope of Work</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of works and road lanes impacted..."
              className="w-full p-2.5 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50"
            >
              Save Project & Run Conflict Scan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
