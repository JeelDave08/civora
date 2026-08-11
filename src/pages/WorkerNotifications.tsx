import { Bell, MapPin, CheckCircle2, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/Card"

export function WorkerNotifications() {
  const notifications = [
    { id: 1, type: "system", title: "New Task Assigned", message: "You have been assigned to Complaint #CMP-893 at Downtown Sector 4.", time: "10 min ago", icon: MapPin, color: "text-blue-500", bg: "bg-blue-50" },
    { id: 2, type: "success", title: "Task Verified", message: "Supervisor Harvey approved your work on #CMP-880.", time: "1 hr ago", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
    { id: 3, type: "alert", title: "Rework Requested", message: "Supervisor requested rework on #CMP-881 due to missing after-image.", time: "Yesterday", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-4xl mx-auto font-sans"
    >
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
        <p className="mt-1 text-slate-500">Stay updated on your new assignments and supervisor feedback.</p>
      </div>

      <Card className="rounded-[24px] border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white">
        <CardContent className="p-4 sm:p-8">
          <div className="space-y-4">
            {notifications.map((n) => (
              <div key={n.id} className="flex gap-4 p-5 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow cursor-pointer bg-slate-50 hover:bg-white">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${n.bg} ${n.color}`}>
                  <n.icon size={22} />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-base">{n.title}</h4>
                    <span className="text-xs font-semibold text-slate-400">{n.time}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1.5 font-medium">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
