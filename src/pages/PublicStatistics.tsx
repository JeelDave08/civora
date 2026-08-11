import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts"
import { Building2, CheckCircle, Clock, AlertTriangle, TrendingUp, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"

const monthlyData = [
  { name: "Jan", complaints: 400, resolved: 350 },
  { name: "Feb", complaints: 300, resolved: 280 },
  { name: "Mar", complaints: 550, resolved: 450 },
  { name: "Apr", complaints: 450, resolved: 400 },
  { name: "May", complaints: 600, resolved: 520 },
  { name: "Jun", complaints: 700, resolved: 650 },
]

const categoryData = [
  { name: "Roads", value: 35 },
  { name: "Water", value: 25 },
  { name: "Garbage", value: 20 },
  { name: "Electricity", value: 15 },
  { name: "Others", value: 5 },
]

const COLORS = ['#4CC9B0', '#7DB9D7', '#F59E0B', '#A855F7', '#EF4444']

export function PublicStatistics() {
  const stats = [
    { title: "Total Registered", value: "24,592", icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
    { title: "Successfully Resolved", value: "21,405", icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
    { title: "In Progress", value: "2,840", icon: Clock, color: "text-info", bg: "bg-info/10" },
    { title: "Avg. Resolution Time", value: "48 hrs", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-heading">Public Statistics</h1>
        <p className="mt-1 text-muted-foreground">Transparency dashboard showing city-wide civic issue resolution performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <stat.icon size={28} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h4 className="text-2xl font-bold text-heading">{stat.value}</h4>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Complaints Over Time</CardTitle>
            <CardDescription>Monthly comparison of registered vs resolved issues.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CC9B0" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4CC9B0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }} />
                  <Area type="monotone" dataKey="complaints" stroke="#F59E0B" fillOpacity={1} fill="url(#colorComplaints)" name="Registered" />
                  <Area type="monotone" dataKey="resolved" stroke="#4CC9B0" fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Issues by Category</CardTitle>
            <CardDescription>Distribution of complaints across different civic domains.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <div className="h-[250px] w-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {categoryData.map((category, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-sm font-medium text-heading w-24">{category.name}</span>
                  <span className="text-sm text-muted-foreground">{category.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
          <CardDescription>Resolution rate and efficiency by municipal department.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Public Works', total: 400, resolved: 320 },
                  { name: 'Sanitation', total: 300, resolved: 280 },
                  { name: 'Water Board', total: 200, resolved: 150 },
                  { name: 'Electricity', total: 278, resolved: 250 },
                  { name: 'Parks', total: 189, resolved: 180 },
                ]}
                margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
              >
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", backgroundColor: "white" }} cursor={{fill: '#f4f7fb'}} />
                <Bar dataKey="total" fill="#E6ECF1" radius={[4, 4, 0, 0]} name="Total Assigned" />
                <Bar dataKey="resolved" fill="#4CC9B0" radius={[4, 4, 0, 0]} name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
