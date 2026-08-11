import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, CheckCircle, Clock, AlertTriangle, MessageSquare, MapPin, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

const dummyNotifications = [
  { id: 1, type: "status", title: "Complaint Resolved", message: "Your complaint CIV-8492 regarding 'Pothole on Main St' has been marked as resolved.", time: "2 hours ago", read: false, icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
  { id: 2, type: "update", title: "Status Update", message: "Work has commenced on CIV-8488 'Blocked drainage'. Expected completion in 2 days.", time: "5 hours ago", read: false, icon: Clock, color: "text-info", bg: "bg-info/10" },
  { id: 3, type: "alert", title: "Area Alert", message: "Water supply will be affected tomorrow from 10 AM to 4 PM in your locality due to maintenance.", time: "1 day ago", read: true, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
  { id: 4, type: "comment", title: "New Comment", message: "Rajesh Kumar (Field Agent) added a comment to your complaint CIV-8491.", time: "2 days ago", read: true, icon: MessageSquare, color: "text-primary", bg: "bg-primary/10" },
  { id: 5, type: "system", title: "Account Verified", message: "Your citizen profile has been successfully verified. You can now use all features.", time: "1 week ago", read: true, icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
]

export function Notifications() {
  const [notifications, setNotifications] = useState(dummyNotifications)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const filteredNotifications = notifications.filter(n => filter === "all" ? true : !n.read)
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-heading flex items-center gap-3">
            Notifications 
            {unreadCount > 0 && <Badge variant="destructive" className="rounded-full px-2">{unreadCount} New</Badge>}
          </h1>
          <p className="mt-1 text-muted-foreground">Stay updated on your complaints and city alerts.</p>
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
                <Card className={`transition-colors ${!notif.read ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
                  <CardContent className="p-4 sm:p-6 flex gap-4">
                    <div className={`shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${notif.bg} ${notif.color}`}>
                      <notif.icon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className={`text-base truncate ${!notif.read ? 'font-bold text-heading' : 'font-semibold text-heading/80'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{notif.time}</span>
                      </div>
                      <p className={`text-sm leading-relaxed ${!notif.read ? 'text-heading/80 font-medium' : 'text-muted-foreground'}`}>
                        {notif.message}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-4">
                        {!notif.read && (
                          <button onClick={() => markAsRead(notif.id)} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                            <Check size={14} /> Mark as read
                          </button>
                        )}
                        <button onClick={() => deleteNotification(notif.id)} className="text-xs font-medium text-destructive hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                    {!notif.read && (
                      <div className="shrink-0 flex items-center">
                        <div className="h-3 w-3 rounded-full bg-primary animate-pulse"></div>
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
              <p className="text-muted-foreground mt-2">You're all caught up! Check back later for updates.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
