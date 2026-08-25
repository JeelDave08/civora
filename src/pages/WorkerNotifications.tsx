import { useState, useEffect } from "react"
import { Bell, MapPin, CheckCircle2, AlertCircle, Play, StopCircle, Clock, Loader2, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/Card"
import { useAuth } from "../context/AuthContext"
import { Link } from "react-router-dom"

export function WorkerNotifications() {
  const { token, user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkerLiveNotifications()
  }, [token, user])

  const fetchWorkerLiveNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch("http://localhost:5000/api/admin/complaints?limit=100", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const allComps = data.complaints || []
        
        // Filter strictly for this worker
        const myComps = allComps.filter((c: any) => {
          if (!c.workerId) return false;
          const wId = typeof c.workerId === 'object' ? (c.workerId._id || c.workerId.id) : c.workerId;
          const wEmail = typeof c.workerId === 'object' ? c.workerId.email : null;
          return wId === user?.id || (wEmail && user?.email && wEmail.toLowerCase() === user.email.toLowerCase());
        })

        const notifList: any[] = []

        myComps.forEach((c: any) => {
          const compCode = `#CMP-${String(c._id).slice(-4).toUpperCase()}`

          // 1. Task Assignment Notification
          notifList.push({
            id: `${c._id}-assign`,
            title: `New Task Assignment`,
            message: `Supervisor assigned you complaint ${compCode} ('${c.title}'). Please navigate to site and start work timer.`,
            time: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Recently",
            icon: MapPin,
            color: "text-blue-500",
            bg: "bg-blue-50",
            taskId: c._id
          })

          // 2. Active timer / working state notification
          if (c.isTimerRunning || c.status === "Working") {
            const timeStr = c.timeSpentSeconds ? `${Math.floor(c.timeSpentSeconds / 60)} mins` : 'Active now'
            notifList.push({
              id: `${c._id}-work`,
              title: `Work Timer Running`,
              message: `Task ${compCode} ('${c.title}') is in active working state. Total recorded time: ${timeStr}.`,
              time: "In Progress",
              icon: Play,
              color: "text-amber-500",
              bg: "bg-amber-50",
              taskId: c._id
            })
          }

          // 3. Completed task notification
          if (c.status === "Resolved" || c.status === "Closed") {
            const totalMins = Math.floor((c.timeSpentSeconds || 0) / 60)
            notifList.push({
              id: `${c._id}-done`,
              title: `Task Marked Completed`,
              message: `You successfully completed ${compCode}. Total time spent working: ${totalMins} minutes.`,
              time: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : "Resolved",
              icon: CheckCircle2,
              color: "text-emerald-500",
              bg: "bg-emerald-50",
              taskId: c._id
            })
          }
        })

        setNotifications(notifList)
      }
    } catch (err) {
      console.error("Error fetching worker notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-4xl mx-auto font-sans"
    >
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Worker Notifications</h1>
        <p className="mt-1 text-slate-500">Stay updated on your newly assigned tasks and active work item status.</p>
      </div>

      <Card className="rounded-[24px] border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white">
        <CardContent className="p-4 sm:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Loader2 size={32} className="animate-spin text-[#4CC9B0]" />
              <p className="text-sm font-medium">Loading task assignment notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="mx-auto text-slate-300 mb-3" size={40} />
              <h3 className="text-lg font-bold text-slate-700">No new notifications</h3>
              <p className="text-xs text-slate-400 mt-1">When a supervisor assigns work to you, notifications will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((n) => (
                <div key={n.id} className="flex gap-4 p-5 rounded-2xl border border-slate-100 hover:shadow-md transition-all bg-slate-50 hover:bg-white">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${n.bg} ${n.color}`}>
                    <n.icon size={22} />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800 text-base">{n.title}</h4>
                      <span className="text-xs font-semibold text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1.5 font-medium">{n.message}</p>

                    <div className="mt-3 flex justify-end">
                      <Link 
                        to="/worker/dashboard" 
                        className="text-xs font-bold text-[#4CC9B0] hover:underline flex items-center gap-1 bg-[#4CC9B0]/10 px-3 py-1.5 rounded-xl"
                      >
                        Open Task & Start Work <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
