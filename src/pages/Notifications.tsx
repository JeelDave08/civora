import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, CheckCircle, Clock, AlertTriangle, MessageSquare, MapPin, Trash2, Check, UserCheck, Activity, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { useAuth } from "../context/AuthContext"
import { Link } from "react-router-dom"

export function Notifications() {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  useEffect(() => {
    fetchLiveCitizenNotifications()
  }, [token])

  const fetchLiveCitizenNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch("http://localhost:5000/api/citizen/complaints", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const complaints = await res.json()
        const generatedList: any[] = []

        complaints.forEach((c: any) => {
          const compCode = `#CMP-${String(c._id).slice(-4).toUpperCase()}`
          const workerName = c.workerId?.fullName || c.workerId?.name || "Field Agent"
          const title = c.title || "Complaint Issue"

          // 1. Complaint Registered / Submitted notification
          generatedList.push({
            id: `${c._id}-submitted`,
            rawId: c._id,
            type: "submitted",
            title: "Complaint Received",
            message: `Your complaint ${compCode} ('${title}') has been successfully registered and sent for supervisor review.`,
            time: new Date(c.createdAt).toLocaleDateString(),
            timestamp: new Date(c.createdAt).getTime(),
            read: true,
            icon: CheckCircle,
            color: "text-blue-500",
            bg: "bg-blue-50",
            badgeText: "Submitted",
            badgeBg: "bg-blue-100 text-blue-700"
          })

          // 2. Field Worker Assigned notification
          if (c.workerId || c.status === "Assigned" || c.status === "Working" || c.status === "Resolved") {
            generatedList.push({
              id: `${c._id}-assigned`,
              rawId: c._id,
              type: "assigned",
              title: "Field Worker Assigned",
              message: `Field agent ${workerName} has been assigned to work on your complaint ${compCode} ('${title}').`,
              time: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : new Date(c.createdAt).toLocaleDateString(),
              timestamp: new Date(c.updatedAt || c.createdAt).getTime() + 1000,
              read: false,
              icon: UserCheck,
              color: "text-purple-600",
              bg: "bg-purple-50",
              badgeText: "Worker Assigned",
              badgeBg: "bg-purple-100 text-purple-700"
            })
          }

          // 3. Work In Progress / Working notification
          if (c.status === "Working" || c.status === "In Progress" || c.status === "Resolved") {
            generatedList.push({
              id: `${c._id}-working`,
              rawId: c._id,
              type: "working",
              title: "Work In Progress",
              message: `Work has actively commenced on site by field team for ${compCode} ('${title}'). Status is currently IN PROCESS.`,
              time: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : new Date(c.createdAt).toLocaleDateString(),
              timestamp: new Date(c.updatedAt || c.createdAt).getTime() + 2000,
              read: false,
              icon: Activity,
              color: "text-amber-600",
              bg: "bg-amber-50",
              badgeText: "In Process",
              badgeBg: "bg-amber-100 text-amber-700"
            })
          }

          // 4. Resolved notification
          if (c.status === "Resolved" || c.status === "Closed") {
            generatedList.push({
              id: `${c._id}-resolved`,
              rawId: c._id,
              type: "resolved",
              title: "Issue Resolved & Closed",
              message: `Great news! Your complaint ${compCode} ('${title}') has been completed, verified by supervisor, and marked RESOLVED.`,
              time: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : new Date(c.createdAt).toLocaleDateString(),
              timestamp: new Date(c.updatedAt || c.createdAt).getTime() + 3000,
              read: false,
              icon: CheckCircle,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
              badgeText: "Resolved",
              badgeBg: "bg-emerald-100 text-emerald-700"
            })
          }
        })

        // Sort most recent first
        generatedList.sort((a, b) => b.timestamp - a.timestamp)
        setNotifications(generatedList)
      }
    } catch (err) {
      console.error("Error fetching live citizen notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const filteredNotifications = notifications.filter(n => filter === "all" ? true : !n.read)
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-heading flex items-center gap-3">
            Notifications 
            {unreadCount > 0 && <Badge variant="destructive" className="rounded-full px-2">{unreadCount} New</Badge>}
          </h1>
          <p className="mt-1 text-muted-foreground">Live lifecycle updates on your reported issues (Worker Assignment, In Process & Resolution).</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted p-1 rounded-xl">
            <button 
              onClick={() => setFilter("all")} 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === "all" ? "bg-white text-heading shadow-sm" : "text-muted-foreground hover:text-heading"}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter("unread")} 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === "unread" ? "bg-white text-heading shadow-sm" : "text-muted-foreground hover:text-heading"}`}
            >
              Unread
            </button>
          </div>
          <Button variant="outline" size="icon" onClick={markAllRead} title="Mark all as read">
            <Check size={18} />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm font-medium">Fetching real-time complaint status notifications...</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`transition-all hover:shadow-md ${!notif.read ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
                    <CardContent className="p-4 sm:p-6 flex gap-4">
                      <div className={`shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center ${notif.bg} ${notif.color} shadow-sm`}>
                        <notif.icon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-base truncate ${!notif.read ? 'font-bold text-heading' : 'font-semibold text-heading/80'}`}>
                              {notif.title}
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${notif.badgeBg}`}>
                              {notif.badgeText}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 font-medium">{notif.time}</span>
                        </div>
                        <p className={`text-sm leading-relaxed ${!notif.read ? 'text-heading/80 font-medium' : 'text-muted-foreground'}`}>
                          {notif.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-4 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-4">
                            {!notif.read && (
                              <button onClick={() => markAsRead(notif.id)} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                                <Check size={14} /> Mark as read
                              </button>
                            )}
                            <button onClick={() => deleteNotification(notif.id)} className="text-xs font-medium text-destructive hover:underline flex items-center gap-1">
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>

                          {notif.rawId && (
                            <Link 
                              to={`/citizen/complaint/${notif.rawId}`} 
                              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Track Live Status <ArrowRight size={13} />
                            </Link>
                          )}
                        </div>
                      </div>
                      {!notif.read && (
                        <div className="shrink-0 flex items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse"></div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center py-20"
              >
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Bell size={32} className="text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-semibold text-heading">No notifications</h3>
                <p className="text-muted-foreground mt-2">You're all caught up! Updates regarding your submitted complaints will appear here.</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
