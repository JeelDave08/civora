import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Clock, MapPin, Search, ChevronRight, AlertTriangle, Loader2, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
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

export function WorkerTasks() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/complaints?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const allComps = data.complaints || [];
        const assignedComps = allComps.filter((c: any) => {
          if (!c.workerId) return false;
          const wId = (typeof c.workerId === 'object' ? (c.workerId._id || c.workerId.id) : c.workerId)?.toString();
          const wEmail = typeof c.workerId === 'object' ? c.workerId.email : null;
          
          const currentUserId = (user?.id || (user as any)?._id)?.toString();
          const currentUserEmail = user?.email?.toLowerCase();

          const matchesId = Boolean(wId && currentUserId && wId === currentUserId);
          const matchesEmail = Boolean(wEmail && currentUserEmail && wEmail.toLowerCase() === currentUserEmail);

          return matchesId || matchesEmail;
        });
        setTasks(assignedComps);
      }
    } catch (err) {
      console.error('Error fetching worker tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter(t => {
    const locStr = getLocationString(t.location);
    const search = searchQuery.toLowerCase();
    return (t.title || '').toLowerCase().includes(search) ||
      (t.category || '').toLowerCase().includes(search) ||
      locStr.toLowerCase().includes(search) ||
      String(t._id).toLowerCase().includes(search);
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-5xl mx-auto font-sans"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Tasks</h1>
          <p className="mt-1 text-slate-500">View and manage your assigned fieldwork tasks.</p>
        </div>
        <button
          onClick={fetchTasks}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Tasks
        </button>
      </div>

      <Card className="rounded-[24px] border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-xl font-bold text-slate-800">Assigned Work Queue</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by title, category, or location..." 
                className="w-full h-12 pl-12 pr-4 rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-[#4CC9B0] focus:bg-white bg-slate-50/50 transition-all text-sm font-medium" 
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-slate-400 font-medium flex items-center justify-center gap-2">
                <Loader2 className="animate-spin text-[#4CC9B0]" size={20} /> Loading assigned tasks...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">
                No active tasks found assigned to you.
              </div>
            ) : (
              filteredTasks.map((t) => {
                const taskId = `#CMP-${String(t._id).slice(-4).toUpperCase()}`;
                const locationStr = getLocationString(t.location) || t.category || 'Field Site';
                return (
                  <Link key={t._id} to={`/worker/tasks/${t._id}`}>
                    <div className="p-5 rounded-3xl border border-slate-100 bg-white hover:border-[#4CC9B0]/40 hover:shadow-lg transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">{taskId}</span>
                          <h3 className="font-bold text-slate-800 group-hover:text-[#4CC9B0] transition-colors text-lg">{t.title}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-medium text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1.5"><MapPin size={16}/> {locationStr}</span>
                          {t.dueDate && (
                            <span className="flex items-center gap-1 text-slate-400 text-xs">
                              <Clock size={14} /> Due: {new Date(t.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${
                          t.priority === 'Critical' ? 'bg-rose-100 text-rose-700' :
                          t.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {t.priority === 'Critical' && <AlertTriangle size={14} className="mr-1" />}
                          {t.priority || 'Medium'}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${
                          t.status === 'Working' || t.status === 'In Progress' ? 'bg-[#4CC9B0]/10 text-[#4CC9B0]' :
                          t.status === 'Resolved' || t.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {t.status}
                        </span>
                        <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-[#4CC9B0]/10 flex items-center justify-center transition-colors shrink-0">
                          <ChevronRight size={18} className="text-slate-400 group-hover:text-[#4CC9B0]" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
