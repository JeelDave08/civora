import { useState } from "react"
import { Bell, Lock, Save, CheckCircle, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuth } from "../context/AuthContext"

export function Settings() {
  const { user, token } = useAuth()
  const [activeTab, setActiveTab] = useState<"notifications" | "security" | "verification">("notifications")
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const [settingsData, setSettingsData] = useState({
    emailAlerts: true,
    smsAlerts: true,
    pushNotifications: true,
    twoFactor: false,
    systemMode: "Automatic"
  })

  const [verificationSettings, setVerificationSettings] = useState({
    reopenThreshold: 2,
    verificationRadiusKm: 2.5
  })

  const handleSave = async () => {
    try {
      setSaving(true)
      if (activeTab === "verification") {
        await fetch("http://localhost:5000/api/admin/settings/citizen-verification", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(verificationSettings)
        })
      }
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (e) {
      console.error("Save error:", e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Settings & Governance</h1>
        <p className="mt-1 text-slate-500">Manage application notification preferences, security rules, and citizen accountability thresholds.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          <Button
            variant={activeTab === "notifications" ? "default" : "ghost"}
            onClick={() => setActiveTab("notifications")}
            className="w-full justify-start gap-3"
          >
            <Bell size={18} /> Notifications
          </Button>
          <Button
            variant={activeTab === "verification" ? "default" : "ghost"}
            onClick={() => setActiveTab("verification")}
            className="w-full justify-start gap-3"
          >
            <ShieldCheck size={18} /> Verification Rules
          </Button>
          <Button
            variant={activeTab === "security" ? "default" : "ghost"}
            onClick={() => setActiveTab("security")}
            className="w-full justify-start gap-3"
          >
            <Lock size={18} /> Security & Auth
          </Button>
        </div>

        {/* Settings Content Area */}
        <div className="md:col-span-3 space-y-6">
          {savedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in">
              <CheckCircle size={18} />
              Settings updated successfully!
            </div>
          )}

          {activeTab === "verification" && (
            <Card className="border-purple-100 shadow-sm rounded-2xl border-2">
              <CardHeader className="bg-purple-50/50 border-b border-purple-100">
                <CardTitle className="text-xl font-bold text-purple-900">Citizen Verification & Community Accountability Rules</CardTitle>
                <CardDescription>Configure thresholds for automatic ticket reopening and citizen notification radius.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800">Community Reopen Threshold ("Still Exists" Votes)</label>
                  <p className="text-xs text-slate-500 mb-2">Number of citizen votes signaling issue still exists before the complaint is automatically reopened for supervisor review.</p>
                  <Input 
                    type="number"
                    min={1}
                    max={10}
                    value={verificationSettings.reopenThreshold}
                    onChange={(e) => setVerificationSettings({ ...verificationSettings, reopenThreshold: parseInt(e.target.value) || 2 })}
                    className="max-w-xs font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <label className="text-sm font-bold text-slate-800">Nearby Citizen Targeting Radius (km)</label>
                  <p className="text-xs text-slate-500 mb-2">Maximum distance radius to notify nearby citizens for resolution verification.</p>
                  <Input 
                    type="number"
                    step={0.5}
                    min={0.5}
                    max={20}
                    value={verificationSettings.verificationRadiusKm}
                    onChange={(e) => setVerificationSettings({ ...verificationSettings, verificationRadiusKm: parseFloat(e.target.value) || 2.5 })}
                    className="max-w-xs font-bold text-slate-800"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="border-slate-100 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">Notification Preferences</CardTitle>
                <CardDescription>Configure how system admins and citizens receive complaint alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Emergency Email Broadcasts</h4>
                    <p className="text-xs text-slate-500">Send high-priority alerts to administrative staff instantly.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsData.emailAlerts}
                    onChange={(e) => setSettingsData({ ...settingsData, emailAlerts: e.target.checked })}
                    className="w-5 h-5 accent-[#4CC9B0] rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">SMS Emergency Gateway</h4>
                    <p className="text-xs text-slate-500">Notify assigned supervisors on critical level civic complaints.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsData.smsAlerts}
                    onChange={(e) => setSettingsData({ ...settingsData, smsAlerts: e.target.checked })}
                    className="w-5 h-5 accent-[#4CC9B0] rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Browser Push Notifications</h4>
                    <p className="text-xs text-slate-500">Receive live popup activity notifications inside the dashboard.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsData.pushNotifications}
                    onChange={(e) => setSettingsData({ ...settingsData, pushNotifications: e.target.checked })}
                    className="w-5 h-5 accent-[#4CC9B0] rounded cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="border-slate-100 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">Security & Authentication</CardTitle>
                <CardDescription>Manage security protocols and admin authorization settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Enforce 2FA for Admin Portal</h4>
                    <p className="text-xs text-slate-500">Require two-factor authentication code for administrative logins.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsData.twoFactor}
                    onChange={(e) => setSettingsData({ ...settingsData, twoFactor: e.target.checked })}
                    className="w-5 h-5 accent-[#4CC9B0] rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-slate-700">Admin Account</label>
                  <Input value={user?.email || "admin@civora.com"} disabled className="bg-slate-50 font-mono text-xs" />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={handleSave} className="gap-2 bg-[#4CC9B0] hover:bg-[#3bb59d] text-white font-semibold">
              <Save size={16} /> Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}