import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Clock, MapPin, Search, ArrowRight, UserCheck, RefreshCw, CheckCircle, AlertTriangle, Edit2, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { useAuth } from "../context/AuthContext"

const API_BASE = 'http://10.152.129.95:5000/api/admin';

const getLocationString = (loc: any): string => {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    return loc.address || (loc.lat !== undefined && loc.lng !== undefined ? `${loc.lat}, ${loc.lng}` : '');
  }
  return '';
};

export function SupervisorComplaints() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkerMap, setSelectedWorkerMap] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Assignment State
  const [editingComplaint, setEditingComplaint] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    workerId: '',
    startDate: '',
    dueDate: '',
    priority: '',
    description: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const openEditModal = (c: any) => {
    setEditingComplaint(c);
    setEditForm({
      workerId: c.workerId?._id || c.workerId || '',
      startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
      dueDate: c.dueDate ? new Date(c.dueDate).toISOString().split('T')[0] : '',
      priority: c.priority || 'Medium',
      description: c.description || ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComplaint || !editForm.workerId) {
      showToast('error', 'Please select a field worker');
      return;
    }

    setSavingEdit(true);
    try {
      const response = await fetch(`${API_BASE}/complaints/${editingComplaint._id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workerId: editForm.workerId,
          startDate: editForm.startDate || undefined,
          dueDate: editForm.dueDate || undefined,
          priority: editForm.priority || undefined,
          description: editForm.description || undefined,
          isEdit: true
        })
      });

      if (!response.ok) throw new Error('Failed to update assignment');
      const data = await response.json().catch(() => null);
      if (data?.emailSent) {
        showToast('success', 'Assignment updated successfully. Updated email sent to the field worker.');
      } else if (data?.emailSent === false) {
        showToast('success', 'Assignment updated successfully, but the updated email could not be sent.');
      } else {
        showToast('success', 'Assignment updated successfully!');
      }
      setEditingComplaint(null);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Error updating assignment');
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compRes, workRes] = await Promise.all([
        fetch(`${API_BASE}/complaints?limit=100`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/personnel`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (compRes.ok) {
        const compData = await compRes.json();
        setComplaints(compData.complaints || []);
      }
      if (workRes.ok) {
        const workData = await workRes.json();
        setWorkers((workData || []).filter((w: any) => w.role === 'worker'));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWorker = async (complaintId: string) => {
    const workerId = selectedWorkerMap[complaintId];
    const startDate = selectedWorkerMap[`${complaintId}_start`];
    const dueDate = selectedWorkerMap[`${complaintId}_due`];

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
        body: JSON.stringify({ workerId, startDate, dueDate })
      });

      if (!response.ok) throw new Error('Failed to assign task');
      const data = await response.json().catch(() => null);
      if (data?.emailSent) {
        showToast('success', 'Work assigned successfully. Assignment email sent to the field worker.');
      } else if (data?.emailSent === false) {
        showToast('success', 'Work assigned successfully, but the assignment email could not be sent.');
      } else {
        showToast('success', 'Task successfully assigned to field worker with schedule dates!');
      }
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Error assigning task');
    } finally {
      setAssigningId(null);
    }
  };

  const filtered = complaints.filter(c => {
    if (!c) return false;
    const locStr = getLocationString(c.location);
    return (c.title || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.category || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      locStr.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-7xl mx-auto font-sans relative"
    >
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Complaint Queue</h1>
          <p className="mt-1 text-slate-500">Review and assign tasks to field workers.</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-sm self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Queue
        </button>
      </div>

      <Card className="rounded-[20px] border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800">All Complaints</CardTitle>
          <CardDescription>Filter and manage incoming civic issues.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search complaints by title or category..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0]" 
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm font-semibold">
                No complaints found.
              </div>
            ) : (
              filtered.map((c) => (
                <div key={c._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                          #CMP-{String(c._id).slice(-4).toUpperCase()}
                        </span>
                        <h3 className="font-bold text-slate-800">{c.title}</h3>
                        {c.communityIssue?.supporterCount > 1 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 border border-indigo-200">
                            👥 {c.communityIssue.supporterCount} Citizens Joined
                          </span>
                        )}
                        {c.communityIssue?.verification?.reopenSignaled && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
                            ⚠️ Reopen Signal Alert
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><MapPin size={14}/> {getLocationString(c.location) || c.category || 'General City'}</span>
                        <span className="flex items-center gap-1"><Clock size={14}/> {new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                  
                  <div className="flex items-center gap-3">
                    {/* Worker Selector & Date Picker */}
                    {!c.workerId ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={selectedWorkerMap[c._id] || ''}
                          onChange={(e) => setSelectedWorkerMap({ ...selectedWorkerMap, [c._id]: e.target.value })}
                          className="h-9 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#4CC9B0]"
                        >
                          <option value="">Select Field Worker...</option>
                          {workers.map(w => (
                            <option key={w._id} value={w._id}>{w.fullName} ({w.city || 'Field'})</option>
                          ))}
                        </select>
                        <input
                          type="date"
                          title="Start Date"
                          onChange={(e) => setSelectedWorkerMap(prev => ({ ...prev, [`${c._id}_start`]: e.target.value }))}
                          className="h-9 px-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#4CC9B0]"
                        />
                        <input
                          type="date"
                          title="Due Date"
                          onChange={(e) => setSelectedWorkerMap(prev => ({ ...prev, [`${c._id}_due`]: e.target.value }))}
                          className="h-9 px-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#4CC9B0]"
                        />
                        <button
                          onClick={() => handleAssignWorker(c._id)}
                          disabled={assigningId === c._id}
                          className="h-9 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          Assign Task
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-200 text-slate-800">
                            <UserCheck size={14} className="text-[#4CC9B0]" />
                            {c.workerId?.fullName || 'Assigned Worker'}
                          </span>
                          {c.status !== 'Resolved' && c.status !== 'Closed' && (
                            <button
                              onClick={() => openEditModal(c)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-[#4CC9B0]/20 hover:text-[#2d947e] text-slate-700 transition-all border border-slate-200 shadow-sm"
                              title="Edit Assignment"
                            >
                              <Edit2 size={12} className="text-[#4CC9B0]" />
                              Edit Assignment
                            </button>
                          )}
                        </div>
                        {c.isTimerRunning && (
                          <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full animate-pulse border border-emerald-200">
                            ⏱ Working Now
                          </span>
                        )}
                        {typeof c.timeSpentSeconds === 'number' && c.timeSpentSeconds > 0 && (
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            Logged: {Math.floor(c.timeSpentSeconds / 60)}m {c.timeSpentSeconds % 60}s
                          </span>
                        )}
                        {c.dueDate && (
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <Clock size={11} /> Due: {new Date(c.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}

                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                      c.status === 'Resolved' || c.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'Assigned' || c.status === 'Working' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {c.status}
                    </span>

                    <Link to={`/supervisor/complaints/${c._id}`} className="flex items-center justify-center p-2 rounded-lg bg-white border border-slate-200 hover:border-[#4CC9B0] hover:text-[#4CC9B0] transition-colors">
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Assignment Modal */}
      <AnimatePresence>
        {editingComplaint && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Edit2 size={18} className="text-[#4CC9B0]" /> Edit Assignment
                  </h3>
                  <p className="text-xs text-slate-400">
                    #CMP-{String(editingComplaint._id).slice(-4).toUpperCase()} &bull; {editingComplaint.title}
                  </p>
                </div>
                <button
                  onClick={() => setEditingComplaint(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Field Worker *
                  </label>
                  <select
                    value={editForm.workerId}
                    onChange={(e) => setEditForm({ ...editForm, workerId: e.target.value })}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#4CC9B0]"
                  >
                    <option value="">Select Field Worker...</option>
                    {workers.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.fullName} ({w.city || w.department || 'Field Force'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Scheduled Start Date
                    </label>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#4CC9B0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Estimated Due Date
                    </label>
                    <input
                      type="date"
                      value={editForm.dueDate}
                      onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#4CC9B0]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#4CC9B0]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assignment Instructions / Description
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#4CC9B0] resize-none"
                    placeholder="Update work instructions or description..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingComplaint(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}


