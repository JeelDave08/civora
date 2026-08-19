import { useState, useEffect } from "react"
import { Bell, CheckCircle2, AlertCircle, Clock, UserCheck, Briefcase, Loader2, LogIn, Activity } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/Card"
import { useAuth } from "../context/AuthContext"

const API_BASE = 'http://localhost:5000/api/admin';

export function SupervisorNotifications() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchSupervisorNotifications();
  }, []);

  const fetchSupervisorNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/activity-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching supervisor notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationStyle = (action: string) => {
    switch (action) {
      case 'USER_LOGIN':
        return { icon: LogIn, color: 'text-blue-500', bg: 'bg-blue-50' };
      case 'CREATE_PERSONNEL':
        return { icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' };
      case 'ASSIGN_COMPLAINT':
        return { icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-50' };
      case 'UPDATE_COMPLAINT_STATUS':
        return { icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50' };
      default:
        return { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-100' };
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-4xl mx-auto font-sans"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Supervisor Activity & Telemetry</h1>
          <p className="mt-1 text-slate-500">Live operational feed of field worker logins, task process updates, and field assignments.</p>
        </div>
        <button 
          onClick={fetchSupervisorNotifications}
          className="text-xs font-bold text-[#4CC9B0] bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-2 rounded-xl transition-all"
        >
          Refresh Feed
        </button>
      </div>

      <Card className="rounded-[24px] border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 text-[#4CC9B0] animate-spin mb-2" />
              <p className="text-sm font-medium">Fetching real-time team notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-600">No activity recorded yet.</p>
              <p className="text-xs text-slate-400 mt-1">Field worker logins and task updates will appear here live.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => {
                const style = getNotificationStyle(n.action);
                const IconComponent = style.icon;
                return (
                  <div key={n.id} className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${style.bg} ${style.color} shadow-sm`}>
                      <IconComponent size={20} />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-sm">{n.title}</h4>
                        <span className="text-[11px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100 flex items-center gap-1">
                          <Clock size={11} /> {n.time}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">{n.details}</p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="font-bold uppercase text-slate-500">Actor: {n.actorName}</span>
                        <span>•</span>
                        <span className="capitalize bg-slate-200/60 text-slate-700 px-2 py-0.5 rounded-md font-bold">{n.actorRole}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
