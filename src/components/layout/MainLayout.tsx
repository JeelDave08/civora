import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Navbar } from "./Navbar"

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col lg:pl-72">
        <Navbar />
        <main className="flex-1 p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
