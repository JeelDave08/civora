import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { MapPin, Clock, CheckCircle, AlertTriangle, ArrowLeft, Building2, User, Calendar, MessageSquare, Send, Users, Bell, BellOff, ThumbsUp, ThumbsDown, ShieldCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { useAuth } from "../context/AuthContext"

export function ComplaintDetails() {
  const { id } = useParams()
  const { token } = useAuth()
  const [complaint, setComplaint] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Community Issue State
  const [communityData, setCommunityData] = useState<any>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [isFollowingLoading, setIsFollowingLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)


  useEffect(() => {
    const fetchComplaintDetails = async () => {
      try {
        setIsLoading(true)
        let data = null
        const response = await fetch(`http://localhost:5000/api/citizen/complaints/${id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
        
        if (response.ok) {
          data = await response.json()
        } else {
          // Fallback: search user complaints by suffix if full ID wasn't directly matched
          const listRes = await fetch(`http://localhost:5000/api/citizen/complaints`, {
            headers: { "Authorization": `Bearer ${token}` }
          })
          if (listRes.ok) {
            const list = await listRes.json()
            data = list.find((c: any) => c._id === id || c._id.endsWith(id || '') || c._id.substring(c._id.length - 6).toUpperCase() === id?.toUpperCase())
          }
        }

        if (data) {
          const formattedComplaint = {
            id: data._id.substring(data._id.length - 6).toUpperCase(),
            rawId: data._id,
            title: data.title,
            category: data.category,
            status: data.status,
            priority: data.priority,
            date: new Date(data.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
            description: data.description || data.title,
            location: typeof data.location === "object" ? (data.location?.address || "Unknown Location") : (data.location || "Unknown Location"),
            department: data.department || "Under Review",
            assignedTo: data.assignedTo || "Not Assigned Yet",
            images: (data.images && data.images.length > 0) ? data.images : (data.imageUrl ? [data.imageUrl] : []),
            aiAnalysis: data.aiAnalysis || null,
            aiAnalysisStatus: data.aiAnalysisStatus || "NOT_ANALYZED",
            timeline: [
              { status: "Complaint Registered", date: new Date(data.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }), active: true },
              { status: "Assigned to Department", date: ["Assigned", "Working", "Resolved", "Closed"].includes(data.status) ? "Completed" : "Pending", active: ["Assigned", "Working", "Resolved", "Closed"].includes(data.status) },
              { status: "Inspection Completed", date: ["Working", "Resolved", "Closed"].includes(data.status) ? "Completed" : "Pending", active: ["Working", "Resolved", "Closed"].includes(data.status) },
              { status: "Work in Progress", date: ["Working", "Resolved", "Closed"].includes(data.status) ? "In Progress" : "Pending", active: ["Working", "Resolved", "Closed"].includes(data.status) },
              { status: "Resolved", date: ["Resolved", "Closed"].includes(data.status) ? "Resolved" : "Pending", active: ["Resolved", "Closed"].includes(data.status) },
            ]
          }
          setComplaint(formattedComplaint)

          // Fetch Community Issue Telemetry
          fetchCommunityInfo(formattedComplaint.rawId)
        } else {
          setError("Failed to fetch complaint details.")
        }
      } catch (err) {
        console.error("Error fetching complaint details:", err)
        setError("Error loading complaint data.")
      } finally {
        setIsLoading(false)
      }
    }

    if (id && token) {
      fetchComplaintDetails()
    }
  }, [id, token])

  const fetchCommunityInfo = async (complaintRawId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/citizen/complaints/${complaintRawId}/community`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        const cData = await res.json()
        setCommunityData(cData)
      }
    } catch (cErr) {
      console.warn("Error fetching community telemetry:", cErr)
    }
  }

  const handleJoinIssue = async () => {
    if (!complaint?.rawId) return
    setIsJoining(true)
    try {
      const res = await fetch(`http://localhost:5000/api/citizen/complaints/${complaint.rawId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ comment: "Joined via complaint view" })
      })
      const data = await res.json()
      if (res.ok) {
        alert("You joined this community issue!")
        fetchCommunityInfo(complaint.rawId)
      } else {
        alert(data.message || "Could not join issue")
      }
    } catch (err: any) {
      alert("Error joining issue: " + err.message)
    } finally {
      setIsJoining(false)
    }
  }

  const handleToggleFollow = async () => {
    if (!complaint?.rawId || !communityData) return
    setIsFollowingLoading(true)
    try {
      const method = communityData.isFollowing ? "DELETE" : "POST"
      const res = await fetch(`http://localhost:5000/api/citizen/complaints/${complaint.rawId}/follow`, {
        method,
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        fetchCommunityInfo(complaint.rawId)
      }
    } catch (err) {
      console.error("Follow error:", err)
    } finally {
      setIsFollowingLoading(false)
    }
  }

  const handleVerifyResolution = async (vote: 'RESOLVED' | 'STILL_EXISTS') => {
    if (!complaint?.rawId) return
    setIsVerifying(true)
    try {
      const res = await fetch(`http://localhost:5000/api/citizen/complaints/${complaint.rawId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ vote })
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        fetchCommunityInfo(complaint.rawId)
      } else {
        alert(data.message || "Failed to record verification")
      }
    } catch (err: any) {
      alert("Error recording verification: " + err.message)
    } finally {
      setIsVerifying(false)
    }
  }


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground animate-pulse">Loading complaint details...</p>
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-16">
        <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-heading">Failed to Load Complaint</h3>
        <p className="text-muted-foreground">
          {error || "The complaint you are trying to view could not be found or you do not have permission to view it."}
        </p>
        <Button asChild>
          <Link to="/citizen/my-complaints">Back to My Complaints</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/citizen/my-complaints"><ArrowLeft size={20} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading flex items-center gap-3">
            Complaint #{complaint.id}
            <Badge variant="info" className="gap-1"><Clock size={12} /> {complaint.status}</Badge>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Community Issue Banner */}
          {communityData && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
                  👥
                </div>
                <div>
                  <h4 className="font-bold text-heading text-base flex items-center gap-2">
                    Community Issue
                    <span className="text-xs bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-semibold">
                      {communityData.supporterCount} Citizens Affected
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {communityData.hasJoined
                      ? "You are a registered supporter of this community issue!"
                      : "Multiple citizens can join this report to increase operational urgency."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {!communityData.hasJoined && (
                  <Button
                    size="sm"
                    onClick={handleJoinIssue}
                    disabled={isJoining}
                    className="h-9 text-xs bg-primary text-white gap-1.5 shadow-sm font-semibold"
                  >
                    {isJoining ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                    Join Issue
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleToggleFollow}
                  disabled={isFollowingLoading}
                  className="h-9 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                >
                  {communityData.isFollowing ? (
                    <>
                      <BellOff size={14} /> Following
                    </>
                  ) : (
                    <>
                      <Bell size={14} /> Follow Updates
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-heading">{complaint.title}</h3>
                  <Badge variant="outline" className="text-warning border-warning/50">{complaint.priority} Priority</Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">{complaint.description}</p>
              </div>


              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-heading">Location</p>
                    <p className="text-sm text-muted-foreground">{complaint.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-heading">Reported On</p>
                    <p className="text-sm text-muted-foreground">{complaint.date}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-heading">Department</p>
                    <p className="text-sm text-muted-foreground">{complaint.department}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-heading">Assigned To</p>
                    <p className="text-sm text-muted-foreground">{complaint.assignedTo}</p>
                  </div>
                </div>
              </div>

              {/* AI Photo & Issue Intelligence Card */}
              {complaint.aiAnalysis && (
                <div className="pt-4 border-t border-border">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border border-primary/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-heading flex items-center gap-2">
                        <span className="p-1 bg-primary/20 text-primary rounded-md">🤖</span> AI Photo Intelligence
                      </h4>
                      <Badge variant="outline" className="text-primary border-primary/30">
                        {complaint.aiAnalysis.confirmedByCitizen ? '✅ Citizen Confirmed' : 'Suggested'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">AI Detected Issue</span>
                        <span className="font-bold text-heading text-sm">{complaint.aiAnalysis.issueSummary || complaint.aiAnalysis.category || "Civic Issue"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">AI Signal Confidence</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {complaint.aiAnalysis.confidenceScore ? `${Math.round(complaint.aiAnalysis.confidenceScore * 100)}%` : '92%'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Suggested Category</span>
                        <span className="font-semibold text-heading">{complaint.aiAnalysis.category || complaint.category}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Suggested Priority</span>
                        <span className="font-semibold text-heading">{complaint.aiAnalysis.priority || complaint.priority}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-heading mb-3">Attached Media ({complaint.images?.length || 0} Photos)</h4>
                {complaint.images && complaint.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {complaint.images.map((img: string, i: number) => (
                      <div 
                        key={i} 
                        onClick={() => setSelectedImage(img)}
                        className="h-28 rounded-xl overflow-hidden border border-border cursor-pointer hover:shadow-md transition-all relative group bg-black/5"
                      >
                        <img src={img} alt={`Complaint photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                          Click to View
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                          Photo #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No media attached to this complaint.</p>
                )}
              </div>

              {/* Citizen Resolution Verification Card */}
              {(["Pending Citizen Verification", "Resolved", "Closed"].includes(complaint.status) || complaint.status?.includes("Community Reopened")) && (
                <div className="pt-4 border-t border-border">
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-50 via-white to-purple-50/30 border-2 border-purple-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-extrabold text-purple-900 flex items-center gap-2">
                        <ShieldCheck size={22} className="text-purple-600" /> Community Verification Engine
                      </h4>
                      <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                        complaint.status?.includes("Community Reopened") ? "bg-amber-100 text-amber-800 border border-amber-300" :
                        complaint.status === "Pending Citizen Verification" ? "bg-purple-100 text-purple-700" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>
                        {complaint.status}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-purple-100 text-center space-y-2">
                      <p className="text-sm font-black text-slate-800">Was this issue actually resolved in your area?</p>
                      <p className="text-xs text-slate-500">Your feedback updates the community accountability matrix.</p>
                      
                      {communityData?.userVerificationVote || communityData?.hasVoted ? (
                        <div className="mt-3 p-3 bg-purple-50 rounded-xl text-xs font-bold text-purple-800 border border-purple-200">
                          ✅ You submitted your verification vote: <span className="underline font-black">{communityData?.userVerificationVote || communityData?.userVote || "Recorded"}</span>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-4 pt-2">
                          <Button
                            size="lg"
                            onClick={async () => {
                              try {
                                setIsVerifying(true)
                                const res = await fetch(`http://localhost:5000/api/citizen/verification/${complaint.rawId}/respond`, {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ response: "YES_RESOLVED" })
                                })
                                const resData = await res.json()
                                if (res.ok) {
                                  alert(resData.message)
                                  fetchCommunityInfo(complaint.rawId)
                                } else {
                                  alert(resData.message || "Failed to submit response")
                                }
                              } catch (err: any) {
                                alert("Error submitting response: " + err.message)
                              } finally {
                                setIsVerifying(false)
                              }
                            }}
                            disabled={isVerifying}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-2xl text-xs gap-2 shadow-md hover:scale-105 transition-all"
                          >
                            {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                            ✅ Yes, Resolved
                          </Button>

                          <Button
                            size="lg"
                            variant="outline"
                            onClick={async () => {
                              try {
                                setIsVerifying(true)
                                const res = await fetch(`http://localhost:5000/api/citizen/verification/${complaint.rawId}/respond`, {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ response: "STILL_EXISTS" })
                                })
                                const resData = await res.json()
                                if (res.ok) {
                                  alert(resData.message)
                                  fetchCommunityInfo(complaint.rawId)
                                } else {
                                  alert(resData.message || "Failed to submit response")
                                }
                              } catch (err: any) {
                                alert("Error submitting response: " + err.message)
                              } finally {
                                setIsVerifying(false)
                              }
                            }}
                            disabled={isVerifying}
                            className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold px-6 py-2.5 rounded-2xl text-xs gap-2"
                          >
                            {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <ThumbsDown size={16} />}
                            ❌ Still Exists
                          </Button>
                        </div>
                      )}
                    </div>

                    {communityData?.verification && (
                      <div className="grid grid-cols-3 gap-3 text-center pt-2">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">👥 Notified</span>
                          <span className="text-lg font-black text-slate-800">{communityData.verification.citizensNotified || 0}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                          <span className="text-[9px] text-emerald-600 font-bold uppercase block">✅ Yes</span>
                          <span className="text-lg font-black text-emerald-600">{communityData.verification.resolvedCount || communityData.verification.yesCount || 0}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-rose-200">
                          <span className="text-[9px] text-rose-600 font-bold uppercase block">❌ Still Exists</span>
                          <span className="text-lg font-black text-rose-600">{communityData.verification.stillExistsCount || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare size={20} /> Comments & Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 mb-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex flex-shrink-0 items-center justify-center text-primary font-bold">
                    RK
                  </div>
                  <div className="flex-1 bg-muted/50 rounded-2xl rounded-tl-none p-4 border border-border/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-sm text-heading">Rajesh Kumar (Field Agent)</span>
                      <span className="text-xs text-muted-foreground">Oct 26, 11:30 AM</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Inspection completed. Materials have been ordered and work will commence tomorrow morning.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Input placeholder="Type a message or ask a question..." className="flex-1" />
                <Button size="icon" className="shrink-0"><Send size={18} /></Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resolution Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-border">
                {complaint.timeline.map((item: any, i: number) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-9 h-6 w-6 rounded-full border-4 border-card flex items-center justify-center ${item.active ? 'bg-primary text-white' : 'bg-muted'}`}>
                      {item.active && <CheckCircle size={12} />}
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${item.active ? 'text-heading' : 'text-muted-foreground'}`}>{item.status}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-border">
                <Button className="w-full gap-2" variant="outline" asChild>
                  <Link to={`/citizen/live-tracking/${complaint.id}`}>
                    <MapPin size={16} /> Track on Map
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-3xl max-h-[80vh] p-2 bg-card rounded-2xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <img src={selectedImage} alt="Full screen preview" className="max-w-full max-h-[75vh] object-contain rounded-xl" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
