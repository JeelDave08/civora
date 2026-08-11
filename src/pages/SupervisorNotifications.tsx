import { Bell, CheckCircle2, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"

export function SupervisorNotifications() {
  const notifications = [
    { id: 1, type: "verification", title: "Verification Required", message: "Worker Mike Ross has completed task #CMP-893.", time: "10 min ago", icon: AlertCircle, color: "text-purple-500", bg: "bg-purple-50" },
    { id: 2, type: "system", title: "New Assignment Available", message: "Complaint #CMP-895 requires worker assignment.", time: "1 hr ago", icon: Bell, color: "text-blue-500", bg: "bg-blue-50" },
    { id: 3, type: "success", title: "Citizen Satisfied", message: "Citizen verified completion of #CMP-880. Ticket closed.", time: "3 hrs ago", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-4xl mx-auto font-sans"
    >
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
        <p className="mt-1 text-slate-500">Stay updated on your team's progress and system alerts.</p>
      </div>

      <Card className="rounded-[20px] border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <CardContent className="p-2 sm:p-6">
          <div className="space-y-4">
            {notifications.map((n) => (
              <div key={n.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.bg} ${n.color}`}>
                  <n.icon size={18} />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-sm">{n.title}</h4>
                    <span className="text-xs text-slate-400">{n.time}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
