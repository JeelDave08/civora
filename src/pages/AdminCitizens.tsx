import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Users, UserPlus, UserCheck, UserX } from "lucide-react"

export function AdminCitizens() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-heading">Citizen Directory</h1>
          <p className="text-muted-foreground mt-1">Manage registered citizens and their details.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Citizens", count: "12,450", icon: Users, color: "text-primary" },
          { title: "New Registrations", count: "340", icon: UserPlus, color: "text-blue-500" },
          { title: "Active Users", count: "8,200", icon: UserCheck, color: "text-emerald-500" },
          { title: "Suspended", count: "45", icon: UserX, color: "text-red-500" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.count}</div>
              <p className="text-xs text-muted-foreground mt-1">Updated just now</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Citizen Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-10">
            Citizen data table will be displayed here.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
