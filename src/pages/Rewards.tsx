import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Award, Star, Gift, Trophy, Zap, Users, CheckCircle, Ticket, Loader2, Copy, Check, Sparkles, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { useAuth } from "../context/AuthContext"

export function Rewards() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [points, setPoints] = useState(450)
  const [rewardsList, setRewardsList] = useState<any[]>([])
  const [claimedVouchers, setClaimedVouchers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"catalog" | "my-claims">("catalog")

  // Modal / Claiming State
  const [selectedReward, setSelectedReward] = useState<any | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [claimedResult, setClaimedResult] = useState<any | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const achievements = [
    { title: "First Report", desc: "Successfully reported your first issue.", icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10", completed: true },
    { title: "Community Helper", desc: "Report 5 issues that get resolved.", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", completed: true },
    { title: "Eagle Eye", desc: "Report an emergency priority issue.", icon: Zap, color: "text-orange-500", bg: "bg-orange-500/10", completed: false, progress: "0/1" },
    { title: "Civic Champion", desc: "Accumulate 1000 impact points.", icon: Trophy, color: "text-purple-500", bg: "bg-purple-500/10", completed: points >= 1000, progress: `${points}/1000` },
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resCatalog, resClaims] = await Promise.all([
        fetch("http://localhost:5000/api/citizen/rewards", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/citizen/rewards/my-claims", { headers: { Authorization: `Bearer ${token}` } })
      ])

      if (resCatalog.ok) {
        const data = await resCatalog.json()
        setRewardsList(data.rewards || [])
        setPoints(data.points ?? 450)
      }

      if (resClaims.ok) {
        const claimsData = await resClaims.json()
        setClaimedVouchers(claimsData || [])
      }
    } catch (err) {
      console.error("Error fetching rewards data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimReward = async () => {
    if (!selectedReward) return
    setClaiming(true)
    setErrorMessage("")

    try {
      const res = await fetch("http://localhost:5000/api/citizen/rewards/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rewardId: selectedReward._id })
      })

      const data = await res.json()

      if (res.ok) {
        setPoints(data.remainingPoints)
        setClaimedResult(data)
        setClaimedVouchers(prev => [data.claim, ...prev])
      } else {
        setErrorMessage(data.message || "Failed to claim reward.")
      }
    } catch (err: any) {
      setErrorMessage("Network error claiming reward.")
    } finally {
      setClaiming(false)
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Loading Civic Rewards Catalog...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-heading">Rewards & Impact</h1>
          <p className="mt-1 text-muted-foreground">Earn points and badges for active participation in city improvements.</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-muted/60 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "catalog" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-heading"
            }`}
          >
            <Gift size={14} className="inline mr-1.5" /> Rewards Catalog
          </button>
          <button
            onClick={() => setActiveTab("my-claims")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "my-claims" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-heading"
            }`}
          >
            <Ticket size={14} className="inline mr-1.5" /> My Vouchers ({claimedVouchers.length})
          </button>
        </div>
      </div>

      {/* Main Points Card */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-primary to-primary/80 border-none text-white overflow-hidden relative shadow-lg">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
            <Trophy size={250} />
          </div>
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col h-full justify-between gap-8">
              <div>
                <p className="font-medium text-white/80 uppercase tracking-wider text-sm mb-1">Your Civic Score</p>
                <div className="flex items-end gap-3">
                  <h2 className="text-6xl font-bold">{points}</h2>
                  <span className="text-xl font-medium text-white/80 pb-1.5">pts</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span>Level 2: Active Citizen</span>
                  <span>{1000 - points > 0 ? `${1000 - points} pts to Level 3` : 'Level 3 Unlocked!'}</span>
                </div>
                <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (points / 1000) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card className="h-[calc(50%-12px)] border-border">
            <CardContent className="p-6 flex items-center gap-4 h-full">
              <div className="h-12 w-12 rounded-full bg-success/10 text-success flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">My Claims</p>
                <p className="text-2xl font-bold text-heading">{claimedVouchers.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="h-[calc(50%-12px)] border-border">
            <CardContent className="p-6 flex items-center gap-4 h-full">
              <div className="h-12 w-12 rounded-full bg-warning/10 text-warning flex items-center justify-center">
                <Award size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Badges Earned</p>
                <p className="text-2xl font-bold text-heading">2</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Catalog View */}
      {activeTab === "catalog" && (
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

          {/* Redeem Catalog */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-heading flex items-center gap-2"><Gift size={20} className="text-primary"/> Redeem Points</h3>
            <div className="grid grid-cols-2 gap-4">
              {rewardsList.map((reward) => {
                const canAfford = points >= reward.pointsCost
                return (
                  <Card
                    key={reward._id}
                    onClick={() => {
                      setSelectedReward(reward)
                      setClaimedResult(null)
                      setErrorMessage("")
                    }}
                    className={`text-center transition-all cursor-pointer group ${
                      canAfford ? 'hover:border-primary/60 hover:shadow-md' : 'opacity-70 bg-muted/20'
                    }`}
                  >
                    <CardContent className="p-6 flex flex-col items-center justify-between h-full">
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{reward.icon || "🎁"}</div>
                      <h4 className="font-semibold text-heading text-sm mb-1">{reward.title}</h4>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{reward.description}</p>
                      <Badge variant="secondary" className={`font-bold border-none px-3 py-1 ${canAfford ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                        {reward.pointsCost} pts
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* My Claims View */}
      {activeTab === "my-claims" && (
        <div className="space-y-4 pt-4">
          <h3 className="text-xl font-bold text-heading flex items-center gap-2"><Ticket size={20} className="text-primary" /> Active Voucher Passes</h3>

          {claimedVouchers.length === 0 ? (
            <Card className="text-center py-16">
              <Ticket size={48} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-heading font-semibold text-lg">No Vouchers Claimed Yet</p>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">Redeem your civic points in the rewards catalog to get municipal transit passes, parking discounts, and more!</p>
              <Button onClick={() => setActiveTab("catalog")} className="mt-4 gap-2">
                <Gift size={16} /> Browse Catalog
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {claimedVouchers.map((voucher) => (
                <Card key={voucher._id} className="border-dashed border-2 border-primary/30 bg-primary/5">
                  <CardContent className="p-6 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-md">
                        {voucher.status} Pass
                      </span>
                      <h4 className="font-bold text-heading text-base mt-2">{voucher.rewardTitle}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Expires: {new Date(voucher.expiresAt).toLocaleDateString()}</p>
                      <div className="mt-3 bg-white border border-primary/20 rounded-lg px-3 py-1.5 inline-flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-primary tracking-widest">{voucher.couponCode}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(voucher.couponCode)} className="shrink-0 gap-1.5">
                      <Copy size={14} /> Copy
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Claim Modal */}
      <AnimatePresence>
        {selectedReward && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-6"
            >
              {!claimedResult ? (
                <>
                  <div className="text-center space-y-2">
                    <div className="text-5xl mx-auto mb-2">{selectedReward.icon}</div>
                    <h3 className="text-2xl font-bold text-heading">{selectedReward.title}</h3>
                    <p className="text-sm text-muted-foreground">{selectedReward.description}</p>
                  </div>

                  <div className="bg-muted p-4 rounded-xl space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Points</span>
                      <span className="font-bold text-heading">{points} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Voucher Cost</span>
                      <span className="font-bold text-rose-500">-{selectedReward.pointsCost} pts</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between font-bold">
                      <span>Points Remaining</span>
                      <span className={points - selectedReward.pointsCost >= 0 ? "text-success" : "text-rose-500"}>
                        {points - selectedReward.pointsCost} pts
                      </span>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle size={16} /> {errorMessage}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setSelectedReward(null)} className="w-full">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleClaimReward}
                      disabled={claiming || points < selectedReward.pointsCost}
                      className="w-full bg-primary text-white"
                    >
                      {claiming ? <Loader2 size={16} className="animate-spin" /> : `Confirm (${selectedReward.pointsCost} pts)`}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-6 py-4">
                  <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
                    <Sparkles size={32} />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-heading">Voucher Claimed!</h3>
                    <p className="text-sm text-muted-foreground mt-1">Show this promo code at municipal services.</p>
                  </div>

                  <div className="bg-primary/10 border-2 border-dashed border-primary/40 p-4 rounded-xl space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Coupon Code</p>
                    <p className="text-2xl font-mono font-bold text-primary tracking-widest">{claimedResult.couponCode}</p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(claimedResult.couponCode)}
                      className="w-full gap-2"
                    >
                      {copiedCode ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                      {copiedCode ? "Copied!" : "Copy Code"}
                    </Button>
                    <Button onClick={() => setSelectedReward(null)} className="w-full">
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
