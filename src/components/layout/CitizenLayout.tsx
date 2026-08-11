import { Link, useLocation, Outlet } from "react-router-dom"
import { motion } from "framer-motion"
import { 
  LayoutDashboard, 
  PlusCircle, 
  List, 
  MapPin, 
  Navigation, 
  Bell, 
  Award, 
  User, 
  Settings, 
  LogOut,
  Search,
  Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "../ui/Button"

const NAV_ITEMS = [
  { name: "Dashboard", href: "/citizen", icon: LayoutDashboard },
  { name: "Raise Complaint", href: "/citizen/raise-complaint", icon: PlusCircle },
  { name: "My Complaints", href: "/citizen/my-complaints", icon: List },
  { name: "Track Complaint", href: "/citizen/track-complaint", icon: Navigation },
  { name: "Nearby Issues", href: "/citizen/nearby", icon: MapPin },
  { name: "Notifications", href: "/citizen/notifications", icon: Bell },
  { name: "Rewards", href: "/citizen/rewards", icon: Award },
  { name: "Profile", href: "/citizen/profile", icon: User },
  { name: "Settings", href: "/citizen/settings", icon: Settings },
]

export function CitizenSidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-border bg-white/50 backdrop-blur-xl lg:flex">
      <div className="flex h-20 items-center gap-3 px-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-md">
          <User size={24} />
        </div>
        <span className="text-2xl font-bold tracking-tight text-heading">Civora Citizen</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col justify-between">
        <nav className="flex flex-col gap-2">
          <div className="mb-4 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Citizen Portal
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== "/citizen" && location.pathname.startsWith(item.href))
            return (
              <Link key={item.name} to={item.href} className="relative">
                {isActive && (
                  <motion.div
                    layoutId="citizen-sidebar-active"
                    className="absolute inset-0 rounded-xl bg-secondary/10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-black/5",
                    isActive ? "text-secondary-foreground" : "text-muted-foreground"
                  )}
                >
                  <item.icon size={20} className={cn(isActive ? "text-secondary" : "text-muted-foreground")} />
                  <span className={isActive ? "text-heading" : ""}>{item.name}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="mt-8">
          <Link onClick={() => {
            const auth = localStorage.getItem('token');
            if (auth) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          }} to="/login" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
            <LogOut size={20} />
            Logout
          </Link>
        </div>
      </div>
    </aside>
  )
}

import { useAuth } from "../../context/AuthContext"

export function CitizenNavbar() {
  const { logout } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-white/70 px-6 backdrop-blur-xl lg:px-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu size={20} />
        </Button>
        <div className="relative hidden max-w-md lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search nearby issues, departments..."
            className="h-10 w-[300px] rounded-xl border border-border bg-background pl-10 pr-4 text-sm transition-all focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="relative rounded-full">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-secondary border border-white"></span>
        </Button>
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-heading">Alex Citizen</p>
            <p className="text-xs text-muted-foreground">Level 3 Contributor</p>
          </div>
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-secondary/20 bg-muted">
            <img 
              src="https://api.dicebear.com/7.x/notionists/svg?seed=Alex" 
              alt="Citizen" 
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <Link 
          to="/login"
          onClick={logout}
          className="ml-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </Link>
      </div>
    </header>
  )
}

export function CitizenLayout() {
  return (
    <div className="min-h-screen bg-background">
      <CitizenSidebar />
      <div className="flex flex-col lg:pl-72">
        <CitizenNavbar />
        <main className="flex-1 p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
