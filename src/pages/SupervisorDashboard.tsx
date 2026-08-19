import { useState, useEffect } from "react"
import { Users, FileText, CheckCircle, Clock, MapPin, Search, AlertTriangle, ShieldCheck, UserCheck, ArrowUpRight, RefreshCw, Send, CheckSquare } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { useAuth } from "../context/AuthContext"

const API_BASE = 'http://localhost:5000/api/admin';

const getLocationString = (loc: any): string => {
  if (!loc) return 'City Location';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    return loc.address || (loc.lat !== undefined && loc.lng !== undefined ? `${loc.lat}, ${loc.lng}` : 'City Location');
  }
  return 'City Location';
};

export function SupervisorDashboard() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedWorkerMap, setSelectedWorkerMap] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchSupervisorData();
  }, [token]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSupervisorData = async () => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [compRes, workRes] = await Promise.all([
        fetch(`${API_BASE}/complaints?limit=50`, { headers: { 'Authorization': `Bearer ${activeToken}` } }),
        fetch(`${API_BASE}/personnel`, { headers: { 'Authorization': `Bearer ${activeToken}` } })
      ]);

      if (compRes.ok) {
        const compData = await compRes.json();
        setComplaints(Array.isArray(compData.complaints) ? compData.complaints : []);
      }

      if (workRes.ok) {
        const workData = await workRes.json();
        setWorkers((Array.isArray(workData) ? workData : []).filter((w: any) => w && w.role === 'worker'));
      }
    } catch (err) {
      console.error('Error loading supervisor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWorker = async (complaintId: string) => {
    const workerId = selectedWorkerMap[complaintId];
    if (!workerId) {
      showToast('error', 'Please select a field worker first');
      return;
    }

    setAssigningId(complaintId);
    try {
      const response = await fetch(`${API_BASE}/complaints/${complaintId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ workerId })
      });

      if (!response.ok) throw new Error('Failed to assign task');
      showToast('success', 'Task successfully assigned to field worker!');
      fetchSupervisorData();
    } catch (err: any) {
      showToast('error', err.message || 'Error assigning task');
    } finally {
      setAssigningId(null);
    }
  };

  const handleUpdateStatus = async (complaintId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE}/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');
      showToast('success', `Complaint status updated to ${newStatus}`);
      setComplaints(prev => prev.map(c => c._id === complaintId ? { ...c, status: newStatus } : c));
    } catch (err: any) {
      showToast('error', err.message || 'Error updating status');
    }
  };

  // Metrics
  const pendingCount = complaints.filter(c => c && (c.status === 'New' || c.status === 'Pending')).length;
  const assignedCount = complaints.filter(c => c && (c.status === 'Assigned' || c.status === 'Working' || c.status === 'In Progress')).length;
  const completedCount = complaints.filter(c => c && (c.status === 'Resolved' || c.status === 'Closed')).length;

  const filteredComplaints = complaints.filter(c => {
    if (!c) return false;
    const locStr = getLocationString(c.location);
    const matchesSearch = (c.title || '')?.toLowerCase().includes(searchQuery.toLowerCase()) || locStr.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'All') return matchesSearch;
    if (filterStatus === 'Pending') return matchesSearch && (c.status === 'New' || c.status === 'Pending');
    if (filterStatus === 'In Progress') return matchesSearch && (c.status === 'Assigned' || c.status === 'Working' || c.status === 'In Progress');
    if (filterStatus === 'Completed') return matchesSearch && (c.status === 'Resolved' || c.status === 'Closed');
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-10 h-10 text-[#4CC9B0] animate-spin" />
        <p className="text-sm font-bold text-slate-500">Loading Supervisor Dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto font-sans relative"
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-bold ${
              toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-[#1e293b] p-8 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#4CC9B0]/20 text-[#4CC9B0] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-[#4CC9B0]/30">
              Supervisor Command Center
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Field Operations Hub</h1>
          <p className="mt-1 text-slate-400 text-sm">Real-time dispatch, task delegation, and work status verification.</p>
        </div>
        <button
          onClick={fetchSupervisorData}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all backdrop-blur-md border border-white/10"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Operations
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Unassigned Issues</p>
            <p className="text-3xl font-black text-amber-600">{pendingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Active Dispatches</p>
            <p className="text-3xl font-black text-blue-600">{assignedCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Send size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Jobs Resolved</p>
            <p className="text-3xl font-black text-[#4CC9B0]">{completedCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#4CC9B0]/10 text-[#4CC9B0] flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Field Force</p>
            <p className="text-3xl font-black text-purple-600">{workers.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Main Operations Area */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Task Delegation Panel */}
        <Card className="lg:col-span-2 rounded-3xl border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-black text-slate-800">Dispatch & Work Management</CardTitle>
                <CardDescription className="text-xs">Delegate civic issues to field staff and verify progress.</CardDescription>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                {['All', 'Pending', 'In Progress', 'Completed'].map(st => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      filterStatus === st ? 'bg-[#4CC9B0] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search issues by title or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#4CC9B0]"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {filteredComplaints.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckSquare size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">No complaints matching filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredComplaints.map((c) => (
                  <div key={c._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          c.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {c.priority || 'Normal'}
                        </span>
                        <span className="text-xs font-bold text-slate-400">{c.category}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-[#4CC9B0] transition-colors">{c.title}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        {getLocationString(c.location)}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {/* Worker Selector or Assigned Label */}
                      {(!c.workerId && c.status !== 'Resolved') ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedWorkerMap[c._id] || ''}
                            onChange={(e) => setSelectedWorkerMap({ ...selectedWorkerMap, [c._id]: e.target.value })}
                            className="h-9 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#4CC9B0]"
                          >
                            <option value="">Select Worker...</option>
                            {workers.map(w => (
                              <option key={w._id} value={w._id}>{w.fullName} ({w.city || 'Field'})</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignWorker(c._id)}
                            disabled={assigningId === c._id}
                            className="h-9 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                          >
                            Assign
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <UserCheck size={14} className="text-[#4CC9B0]" />
                            {c.workerId?.fullName || 'Assigned Worker'}
                          </div>
                          
                          {c.status !== 'Resolved' && (
                            <button
                              onClick={() => handleUpdateStatus(c._id, 'Resolved')}
                              className="h-8 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                              Mark Done
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Field Staff Panel */}
        <Card className="rounded-3xl border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-black text-slate-800">Field Worker Status</CardTitle>
            <CardDescription className="text-xs">Live workforce roster.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {workers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No field workers registered yet.</p>
              ) : (
                workers.filter(w => w && w._id).map(w => (
                  <div key={w._id} className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/60 rounded-2xl border border-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4CC9B0] to-[#3bb59d] text-white flex items-center justify-center font-black text-xs shadow-sm">
                        {(w.fullName || '?')?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{w.fullName || 'Field Worker'}</p>
                        <p className="text-xs text-slate-500">{w.city || w.department || 'Field Specialist'}</p>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
