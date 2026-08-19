import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Clock, MapPin, Search, ArrowRight, UserCheck, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { useAuth } from "../context/AuthContext"

const API_BASE = 'http://localhost:5000/api/admin';

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
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        #CMP-{String(c._id).slice(-4).toUpperCase()}
                      </span>
                      <h3 className="font-bold text-slate-800">{c.title}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><MapPin size={14}/> {getLocationString(c.location) || c.category || 'General City'}</span>
                      <span className="flex items-center gap-1"><Clock size={14}/> {new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Worker Selector or Assigned badge */}
                    {!c.workerId ? (
                      <div className="flex items-center gap-2">
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
                        <button
                          onClick={() => handleAssignWorker(c._id)}
                          disabled={assigningId === c._id}
                          className="h-9 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          Assign
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-800">
                        <UserCheck size={14} className="text-[#4CC9B0]" />
                        {c.workerId?.fullName || 'Assigned'}
                      </span>
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
    </motion.div>
  )
}

