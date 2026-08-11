import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Activity, Server, ShieldCheck, Zap } from "lucide-react"

export function AdminServices() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-heading">City Services</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor all smart city services.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Waste Management", status: "Active", icon: Server, color: "text-emerald-500" },
          { title: "Traffic Control", status: "Active", icon: Activity, color: "text-blue-500" },
          { title: "Public Safety", status: "Active", icon: ShieldCheck, color: "text-purple-500" },
          { title: "Power Grid", status: "Maintenance", icon: Zap, color: "text-amber-500" },
        ].map((service, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{service.title}</CardTitle>
              <service.icon className={`h-4 w-4 ${service.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{service.status}</div>
              <p className="text-xs text-muted-foreground mt-1">System running optimally</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
