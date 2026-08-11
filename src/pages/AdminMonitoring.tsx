import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Activity, Cpu, Database, Network } from "lucide-react"

export function AdminMonitoring() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-heading">System Monitoring</h1>
          <p className="text-muted-foreground mt-1">Real-time health and performance metrics of city systems.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Server Uptime", value: "99.99%", icon: Server, color: "text-emerald-500" },
          { title: "CPU Usage", value: "42%", icon: Cpu, color: "text-blue-500" },
          { title: "Database Load", value: "28%", icon: Database, color: "text-purple-500" },
          { title: "Network Status", value: "Stable", icon: Network, color: "text-amber-500" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-10">
            Real-time logs and system alerts will appear here.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Server(props: any) {
  return <Activity {...props} />
}
