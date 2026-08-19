import { useState, useEffect } from "react"
import { CheckCircle, Clock, MapPin, Camera, Navigation2, CheckSquare, AlertTriangle, Image as ImageIcon, ChevronRight, Activity, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/Card"
import { useAuth } from "../context/AuthContext"

const API_BASE = 'http://localhost:5000/api/admin';

const getLocationString = (loc: any): string => {
  if (!loc) return 'City Area';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    return loc.address || (loc.lat !== undefined && loc.lng !== undefined ? `${loc.lat}, ${loc.lng}` : 'City Area');
  }
  return 'City Area';
};

export function WorkerDashboard() {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<any | null>(null);

  useEffect(() => {
    fetchWorkerTasks();
  }, []);

  const fetchWorkerTasks = async () => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/complaints?limit=100`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        const myTasks = (data.complaints || []).filter((c: any) => 
          c && (c.workerId?._id === user?.id || c.workerId === user?.id || (user?.role === 'worker' && c.status === 'Assigned'))
        );
        setTasks(myTasks);
        if (myTasks.length > 0) {
          setActiveTask(myTasks[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching worker tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/complaints/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchWorkerTasks();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const completedCount = tasks.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
  const pendingCount = tasks.filter(t => t.status === 'Assigned' || t.status === 'Working' || t.status === 'New').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 p-6 lg:p-10 max-w-6xl mx-auto font-sans"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Worker Operations Portal</h1>
          <p className="mt-1 text-slate-500">Your assigned tasks, active work items, and completion dispatch.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchWorkerTasks}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold border border-emerald-100">
            <Activity size={16} /> Online & Ready
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total Assigned</p>
            <p className="text-3xl font-black text-slate-800">{tasks.length}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner">
            <MapPin size={28} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Completed</p>
            <p className="text-3xl font-black text-slate-800">{completedCount}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner">
            <CheckCircle size={28} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Pending Action</p>
            <p className="text-3xl font-black text-slate-800">{pendingCount}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner">
            <Clock size={28} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Active Task Area */}
        <div className="lg:col-span-2 space-y-6">
          {activeTask ? (
            <Card className="rounded-[32px] overflow-hidden border-none shadow-[0_8px_30px_rgba(0,0,0,0.06)] bg-white relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#4CC9B0]/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
              
              <CardContent className="p-0 z-10 relative">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                        {activeTask.status}
                      </span>
                      <span className="text-slate-400 text-xs font-bold">#CMP-{String(activeTask._id).slice(-4).toUpperCase()}</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{activeTask.title}</h2>
                    <p className="flex items-center gap-1.5 mt-2 text-slate-500 font-medium">
                      <MapPin size={16} className="text-[#4CC9B0]" /> {getLocationString(activeTask.location) || activeTask.category || 'City Area'}
                    </p>
                  </div>
                  <button className="h-12 px-6 flex items-center justify-center gap-2 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 shrink-0">
                    <Navigation2 size={18} /> Navigate
                  </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-lg">Proof of Work</h3>
                    
                    <div className="group p-6 border-2 border-slate-200 border-dashed rounded-3xl bg-slate-50/50 hover:bg-white hover:border-[#4CC9B0] transition-all cursor-pointer text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[#4CC9B0]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <Camera className="mx-auto text-slate-400 group-hover:text-[#4CC9B0] mb-3 transition-colors" size={32} />
                      <p className="text-sm font-bold text-slate-700 group-hover:text-[#4CC9B0] transition-colors">Upload Before Image</p>
                      <p className="text-xs text-slate-500 mt-1">Required before starting work</p>
                    </div>

                    <div className="group p-6 border-2 border-slate-200 border-dashed rounded-3xl bg-slate-50/50 hover:bg-white hover:border-blue-500 transition-all cursor-pointer text-center relative overflow-hidden opacity-80 hover:opacity-100">
                      <ImageIcon className="mx-auto text-slate-400 group-hover:text-blue-500 mb-3 transition-colors" size={32} />
                      <p className="text-sm font-bold text-slate-700 group-hover:text-blue-500 transition-colors">Upload After Image</p>
                      <p className="text-xs text-slate-500 mt-1">Required for completion</p>
                    </div>
                  </div>

                  <div className="space-y-4 flex flex-col h-full">
                    <h3 className="font-bold text-slate-800 text-lg">Task Actions</h3>
                    <div className="flex-1 space-y-3">
                      <textarea 
                        className="w-full h-32 p-4 rounded-3xl border-2 border-slate-100 focus:outline-none focus:border-[#4CC9B0] bg-slate-50/50 focus:bg-white resize-none text-sm transition-all"
                        placeholder="Describe the work done or materials utilized..."
                      ></textarea>
                    </div>
                    <button 
                      onClick={() => handleStatusChange(activeTask._id, 'Resolved')}
                      className="w-full h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-[#4CC9B0] to-[#3bb59d] text-white rounded-2xl font-bold hover:shadow-[0_8px_25px_rgba(76,201,176,0.4)] hover:-translate-y-0.5 transition-all"
                    >
                      <CheckSquare size={20} /> Mark Task Completed
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100">
              <CheckSquare size={48} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-bold text-slate-700">No active tasks assigned</h3>
              <p className="text-xs text-slate-400 mt-1">Check back later when a supervisor assigns new work to you.</p>
            </div>
          )}
        </div>
        
        {/* Sidebar Tasks */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <AlertTriangle className="text-amber-400 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Safety First!</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Ensure you wear high-visibility gear at intersection zones. Report any immediate hazards to the supervisor.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-slate-800">Task Roster</h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2.5 py-1 rounded-full">{tasks.length} Total</span>
            </div>
            
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No task history found.</p>
              ) : (
                tasks.map(t => (
                  <div 
                    key={t._id} 
                    onClick={() => setActiveTask(t)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
                      activeTask?._id === t._id ? 'border-[#4CC9B0] bg-[#4CC9B0]/5 shadow-md' : 'border-slate-100 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{t.title}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium"><MapPin size={12}/> {getLocationString(t.location) || t.category || 'City'}</p>
                    </div>
                    <ChevronRight size={16} className={activeTask?._id === t._id ? "text-[#4CC9B0]" : "text-slate-400"} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  )
}
