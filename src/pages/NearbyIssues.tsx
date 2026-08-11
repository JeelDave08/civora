import { MapPin, AlertTriangle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

export function NearbyIssues() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-heading">Nearby Issues</h1>
        <p className="text-muted-foreground mt-1">Discover and track civic issues reported in your local area.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 flex flex-col h-[600px]">
          <CardHeader>
            <CardTitle>Map View</CardTitle>
            <CardDescription>Visualizing issues within 5km radius</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 bg-muted/30 m-6 mt-0 rounded-xl flex items-center justify-center border border-border">
            <div className="text-center text-muted-foreground">
              <MapPin size={48} className="mx-auto mb-4 opacity-50" />
              <p>Map Integration Placeholder</p>
              <p className="text-sm">Google Maps / Mapbox will be rendered here.</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2">
          {[
            { title: "Pothole on Main St", status: "In Progress", time: "2 hours ago", color: "text-amber-500", bg: "bg-amber-500/10" },
            { title: "Broken Streetlight", status: "Reported", time: "5 hours ago", color: "text-red-500", bg: "bg-red-500/10" },
            { title: "Water Leakage", status: "Resolved", time: "1 day ago", color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { title: "Fallen Tree", status: "In Progress", time: "2 days ago", color: "text-amber-500", bg: "bg-amber-500/10" },
          ].map((issue, i) => (
            <Card key={i} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 flex gap-4">
                <div className={`h-12 w-12 rounded-full ${issue.bg} ${issue.color} flex items-center justify-center shrink-0`}>
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-heading text-sm">{issue.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock size={12} /> {issue.time}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${issue.bg} ${issue.color}`}>
                      {issue.status}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
