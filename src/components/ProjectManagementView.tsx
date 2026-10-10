import React, { useState } from 'react';
import { Project, UserRole, WorkCategory, Department, ProjectStatus } from '../types';
import { Search, Plus, Filter, MapPin, Calendar, CheckCircle2, AlertCircle, ArrowUpDown } from 'lucide-react';

interface ProjectManagementViewProps {
  projects: Project[];
  userRole: UserRole;
  onSelectProject: (project: Project) => void;
  onOpenCreateModal: () => void;
}

export const ProjectManagementView: React.FC<ProjectManagementViewProps> = ({
  projects,
  userRole,
  onSelectProject,
  onOpenCreateModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const canCreate = userRole === 'dept_officer' || userRole === 'city_admin';

  const filteredProjects = projects.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.title.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        p.roadSegment.toLowerCase().includes(q) ||
        p.contractor.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (deptFilter !== 'all' && p.department !== deptFilter) return false;
    if (categoryFilter !== 'all' && p.workCategory !== categoryFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;

    return true;
  });

  const statusBadge = {
    planned: 'bg-slate-100 text-slate-700 border-slate-200',
    in_progress: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    delayed: 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
    halted: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by title, road segment, code, or contractor..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-hidden bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              onClick={onOpenCreateModal}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Municipal Project
            </button>
          )}
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filters:
        </span>

        {/* Dept Filter */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="p-1.5 border border-slate-200 rounded bg-white text-slate-700"
        >
          <option value="all">All Departments</option>
          <option value="Highways & Road Infrastructure">Highways & Road Infrastructure</option>
          <option value="Water Supply & Sewage Board">Water Supply & Sewage Board</option>
          <option value="City Municipal Corporation">City Municipal Corporation</option>
          <option value="Electricity & Power Utilities">Electricity & Power Utilities</option>
          <option value="Optical Fiber & Telecom">Optical Fiber & Telecom</option>
        </select>

        {/* Work Category */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="p-1.5 border border-slate-200 rounded bg-white text-slate-700"
        >
          <option value="all">All Categories</option>
          <option value="road_resurfacing">Road Resurfacing</option>
          <option value="water_pipeline">Water Pipeline</option>
          <option value="drainage">Drainage Canal</option>
          <option value="power_grid">Power Grid</option>
          <option value="telecom_duct">Telecom Conduit</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-1.5 border border-slate-200 rounded bg-white text-slate-700"
        >
          <option value="all">All Statuses</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="delayed">Delayed</option>
          <option value="completed">Completed</option>
        </select>

        {(deptFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setDeptFilter('all');
              setCategoryFilter('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="text-slate-500 hover:text-slate-900 ml-auto cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Project Title & Road Corridor</th>
                <th className="py-3 px-4">Department & Category</th>
                <th className="py-3 px-4">Contractor</th>
                <th className="py-3 px-4">Planned Window</th>
                <th className="py-3 px-4">Budget</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No municipal projects match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProject(p)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-500 whitespace-nowrap">
                      {p.projectCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                        {p.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                        {p.roadSegment}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{p.department}</div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {p.workCategory.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">{p.contractor}</td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[11px] whitespace-nowrap">
                      {p.plannedStartDate} → {p.plannedEndDate}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-slate-800 whitespace-nowrap">
                      ₹{p.estimatedBudget.toFixed(1)} L
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-slate-900 h-full rounded-full"
                            style={{ width: `${p.progressPercentage}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-600 tabular-nums">
                          {p.progressPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                          statusBadge[p.status] || 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(p);
                        }}
                        className="px-2.5 py-1 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 font-medium cursor-pointer shadow-2xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
