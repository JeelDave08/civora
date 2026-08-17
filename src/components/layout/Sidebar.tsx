import { Link, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { LayoutDashboard, Users, FileText, Settings, Map, Activity, ListChecks, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "../ui/Button"

import { useAuth } from "../../context/AuthContext"

const ADMIN_ITEMS = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Services", href: "/admin/services", icon: FileText },
  { name: "Citizens", href: "/admin/citizens", icon: Users },
  { name: "City Map", href: "/admin/map", icon: Map },
  { name: "Monitoring", href: "/admin/monitoring", icon: Activity },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

const SUPERVISOR_ITEMS = [
  { name: "Dashboard", href: "/supervisor/dashboard", icon: LayoutDashboard },
  { name: "Complaints", href: "/supervisor/complaints", icon: ListChecks },
  { name: "My Team", href: "/supervisor/team", icon: Users },
  { name: "Notifications", href: "/supervisor/notifications", icon: Bell },
]

const WORKER_ITEMS = [
  { name: "Dashboard", href: "/worker/dashboard", icon: LayoutDashboard },
  { name: "My Tasks", href: "/worker/tasks", icon: FileText },
  { name: "Map", href: "/worker/map", icon: Map },
  { name: "Notifications", href: "/worker/notifications", icon: Bell },
]

export function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()
  
  let navItems = ADMIN_ITEMS;
  if (user?.role === 'supervisor') navItems = SUPERVISOR_ITEMS;
  if (user?.role === 'worker') navItems = WORKER_ITEMS;

  const portalTitle = user?.role === 'supervisor' ? 'Civora Supervisor' : user?.role === 'worker' ? 'Civora Worker' : 'Civora Admin';

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-border bg-white/50 backdrop-blur-xl lg:flex">
      <div className="flex pt-8 pb-6 items-center gap-3 px-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#52CCA7] text-white shadow-sm">
          <Activity size={28} strokeWidth={2.5} />
        </div>
        <span className="text-2xl font-bold tracking-tight text-[#293B47] leading-tight">{portalTitle}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-6 px-4 text-[13px] font-bold uppercase tracking-widest text-[#7B8A98]">
          MAIN MENU
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link key={item.name} to={item.href} className="relative">
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-black/5",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon size={20} className={cn(isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.name}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-6">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 p-5 border border-primary/20">
          <h4 className="mb-1 text-sm font-semibold text-heading">City Health</h4>
          <p className="mb-4 text-xs text-muted-foreground">All systems are running optimally.</p>
          <Button variant="default" size="sm" className="w-full">
            View Report
          </Button>
        </div>
      </div>
    </aside>
  )
}
