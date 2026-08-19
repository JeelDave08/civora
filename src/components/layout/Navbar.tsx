import { Bell, Search, Menu, LogOut } from "lucide-react"
import { Button } from "../ui/Button"
import { useAuth } from "../../context/AuthContext"
import { Link } from "react-router-dom"

export function Navbar() {
  const { user, logout } = useAuth();

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
            placeholder="Search citizens, services, reports..."
            className="h-10 w-[300px] rounded-xl border border-border bg-background pl-10 pr-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="relative rounded-full">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive border border-white"></span>
        </Button>
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-heading">{user?.name || "Civora User"}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {(() => {
                const r = (user?.role || '').toLowerCase();
                return r === 'admin' ? 'Administrator' : r === 'supervisor' ? 'Supervisor' : r === 'worker' ? 'Field Worker' : 'Citizen';
              })()}
            </p>
          </div>
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary/20 bg-muted">
            <img 
              src={user?.profileImage || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'Admin'}`} 
              alt={user?.name || "User"} 
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
