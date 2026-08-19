import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Users, Search, ArrowRight, Activity, MapPin, UserPlus, Mail, Loader2, CheckCircle2, AlertCircle, X, KeyRound } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { useAuth } from "../context/AuthContext"

const API_BASE = 'http://localhost:5000/api/admin';

export function SupervisorTeam() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    personalEmail: "",
    password: "",
    department: "Roads & Transport"
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    const activeToken = token || localStorage.getItem('token');
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/personnel-monitoring?role=worker`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkers(data.personnel || []);
      }
    } catch (err) {
      console.error('Error fetching workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) return;

    setActionLoading(true);
    setToast(null);

    const activeToken = token || localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/personnel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          ...formData,
          role: 'worker'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', text: data.message || 'Field worker account created successfully! Credentials emailed.' });
        setFormData({ fullName: "", email: "", personalEmail: "", password: "", department: "Roads & Transport" });
        setShowAddWorker(false);
        fetchWorkers();
      } else {
        setToast({ type: 'error', text: data.message || 'Error processing request' });
      }
    } catch (err) {
      setToast({ type: 'error', text: 'Server connection error. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredWorkers = workers.filter(w => 
    (w.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.department || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-7xl mx-auto font-sans"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Team</h1>
          <p className="mt-1 text-slate-500">Manage field workers, assign credentials, and monitor task progress.</p>
        </div>
        <button 
          onClick={() => setShowAddWorker(!showAddWorker)} 
          className="flex items-center gap-2 bg-[#4CC9B0] hover:bg-[#3bb59d] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
        >
          <UserPlus size={18} /> Add New Field Worker
        </button>
      </div>

      {toast && (
        <div className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {toast.text}
          </div>
          <button onClick={() => setToast(null)} className="text-current opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      <AnimatePresence>
        {showAddWorker && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="rounded-[24px] border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-t-4 border-t-[#4CC9B0] mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800">Assign New Field Worker</CardTitle>
                  <CardDescription className="text-xs">Create a field worker user account and dispatch login credentials directly to their personal email.</CardDescription>
                </div>
                <button onClick={() => setShowAddWorker(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddWorker} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Worker Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.fullName} 
                      onChange={e => setFormData({...formData, fullName: e.target.value})} 
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm" 
                      placeholder="e.g. Rajesh Kumar"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Civora Login Email (Portal User ID)</label>
                    <input 
                      type="email" 
                      required 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm font-medium" 
                      placeholder="rajesh.worker@civora.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Personal Real Email (Credentials Sent Here)</label>
                    <input 
                      type="email" 
                      required 
                      value={formData.personalEmail} 
                      onChange={e => setFormData({...formData, personalEmail: e.target.value})} 
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm font-medium" 
                      placeholder="rajesh.personal@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Password</label>
                    <input 
                      type="password" 
                      required 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm" 
                      placeholder="Temporary password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Department / Service</label>
                    <select
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value})}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] bg-white text-sm font-semibold text-slate-800"
                    >
                      <option value="Roads & Transport">Roads & Transport</option>
                      <option value="Water Supply">Water Supply</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Waste Management">Waste Management</option>
                      <option value="Public Safety">Public Safety</option>
                      <option value="Parks & Recreation">Parks & Recreation</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button 
                      type="submit" 
                      disabled={actionLoading}
                      className="w-full h-11 rounded-xl bg-[#4CC9B0] hover:bg-[#3bb59d] text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={18} />}
                      Create & Email Credentials
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="rounded-[24px] border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Assigned Field Workers Directory</CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">View active field personnel, monitor open workload, and inspect credentials dispatch.</CardDescription>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search field workers by name, email, department..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 h-10 pl-10 pr-4 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0]" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 text-[#4CC9B0] animate-spin mb-2" />
              <p className="text-sm font-medium">Loading field force database...</p>
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-600">No field workers found.</p>
              <p className="text-xs text-slate-400 mt-1">Use the "Add New Field Worker" button above to assign field staff.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkers.map((w) => (
                <div key={w._id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4CC9B0] to-[#7DB9D7] flex items-center justify-center font-bold text-white text-lg shadow-sm">
                          {w.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">{w.fullName}</h3>
                          <span className="inline-block bg-teal-50 text-[#4CC9B0] px-2 py-0.5 rounded-md text-[10px] font-black uppercase border border-teal-100">
                            {w.department || 'General'}
                          </span>
                        </div>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Active Account"></span>
                    </div>

                    <div className="space-y-1 my-3 bg-white p-3 rounded-xl border border-slate-100 text-xs">
                      <p className="text-slate-600 font-semibold flex items-center gap-1.5 truncate">
                        <Mail size={13} className="text-[#4CC9B0]" /> Login: <span className="text-slate-800 font-bold">{w.email}</span>
                      </p>
                      {w.personalEmail && (
                        <p className="text-slate-400 font-medium text-[11px] truncate">
                          Personal: {w.personalEmail}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1 text-slate-400 mb-0.5"><Activity size={13}/> <span className="text-[10px] font-bold uppercase">Active Tasks</span></div>
                        <p className="font-extrabold text-slate-800 text-lg">{w.activeTasks ?? 0}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1 text-slate-400 mb-0.5"><CheckCircle2 size={13} className="text-emerald-500" /> <span className="text-[10px] font-bold uppercase">Resolved</span></div>
                        <p className="font-extrabold text-emerald-600 text-lg">{w.resolvedTasks ?? 0}</p>
                      </div>
                    </div>
                  </div>

                  <Link to={`/supervisor/team/${w._id}`} className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:border-[#4CC9B0] hover:text-[#4CC9B0] transition-colors text-xs shadow-sm">
                    Worker Details & History <ArrowRight size={15} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
