import { motion } from "framer-motion"
import { Award, Star, TrendingUp, Gift, Trophy, Shield, Zap, Users, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

export function Rewards() {
  const achievements = [
    { title: "First Report", desc: "Successfully reported your first issue.", icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10", completed: true },
    { title: "Community Helper", desc: "Report 5 issues that get resolved.", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", completed: true },
    { title: "Eagle Eye", desc: "Report an emergency priority issue.", icon: Zap, color: "text-orange-500", bg: "bg-orange-500/10", completed: false, progress: "0/1" },
    { title: "Civic Champion", desc: "Accumulate 1000 impact points.", icon: Trophy, color: "text-purple-500", bg: "bg-purple-500/10", completed: false, progress: "450/1000" },
  ]
  
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-heading">Rewards & Impact</h1>
        <p className="mt-1 text-muted-foreground">Earn points and badges for your active participation in improving the city.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Score Card */}
        <Card className="md:col-span-2 bg-gradient-to-br from-primary to-primary/80 border-none text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
            <Trophy size={250} />
          </div>
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col h-full justify-between gap-8">
              <div>
                <p className="font-medium text-white/80 uppercase tracking-wider text-sm mb-1">Your Civic Score</p>
                <div className="flex items-end gap-3">
                  <h2 className="text-6xl font-bold">450</h2>
                  <span className="text-xl font-medium text-white/80 pb-1.5">pts</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span>Level 2: Active Citizen</span>
                  <span>550 pts to Level 3</span>
                </div>
                <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card className="h-[calc(50%-12px)]">
            <CardContent className="p-6 flex items-center gap-4 h-full">
              <div className="h-12 w-12 rounded-full bg-success/10 text-success flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Issues Resolved</p>
                <p className="text-2xl font-bold text-heading">12</p>
              </div>
            </CardContent>
          </Card>
          <Card className="h-[calc(50%-12px)]">
            <CardContent className="p-6 flex items-center gap-4 h-full">
              <div className="h-12 w-12 rounded-full bg-warning/10 text-warning flex items-center justify-center">
                <Award size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Badges Earned</p>
                <p className="text-2xl font-bold text-heading">4</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 pt-4">
        {/* Achievements */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-heading flex items-center gap-2"><Star size={20} className="text-primary"/> Achievements</h3>
          <div className="space-y-4">
            {achievements.map((item, i) => (
              <Card key={i} className={`transition-all ${item.completed ? 'bg-card' : 'bg-muted/30 opacity-70'}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex shrink-0 items-center justify-center ${item.completed ? item.bg + ' ' + item.color : 'bg-muted text-muted-foreground'}`}>
                    <item.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-heading">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  {!item.completed && (
                    <div className="text-sm font-medium text-muted-foreground">
                      {item.progress}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Redeem */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-heading flex items-center gap-2"><Gift size={20} className="text-primary"/> Redeem Points</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: "Free Parking Pass", pts: 200, icon: "🅿️" },
              { title: "Property Tax Discount", pts: 1000, icon: "📄" },
              { title: "City Event Ticket", pts: 500, icon: "🎫" },
              { title: "Public Transit Pass", pts: 300, icon: "🚌" },
            ].map((reward, i) => (
              <Card key={i} className="text-center hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{reward.icon}</div>
                  <h4 className="font-semibold text-heading mb-2 text-sm">{reward.title}</h4>
                  <Badge variant="secondary" className="font-bold text-primary bg-primary/10 border-none">{reward.pts} pts</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
