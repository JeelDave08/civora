import { useState } from "react"
import { Bell, Lock, Globe, Shield, Save, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuth } from "../context/AuthContext"

export function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"notifications" | "security" | "system">("notifications")
  const [savedSuccess, setSavedSuccess] = useState(false)

  const [settingsData, setSettingsData] = useState({
    emailAlerts: true,
    smsAlerts: true,
    pushNotifications: true,
    twoFactor: false,
    systemMode: "Automatic",
    geocodeProvider: "LocationIQ",
    apiKey: "pk.0c9741909440306217e5f3b924862636"
  })

  const handleSave = () => {
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Admin Settings</h1>
        <p className="mt-1 text-slate-500">Manage application preferences, system configurations, and security rules.</p>
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
            variant={activeTab === "security" ? "default" : "ghost"}
            onClick={() => setActiveTab("security")}
            className="w-full justify-start gap-3"
          >
            <Lock size={18} /> Security & Auth
          </Button>
          <Button
            variant={activeTab === "system" ? "default" : "ghost"}
            onClick={() => setActiveTab("system")}
            className="w-full justify-start gap-3"
          >
            <Globe size={18} /> System & Geocoding
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

          {activeTab === "system" && (
            <Card className="border-slate-100 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">Geocoding & API Config</CardTitle>
                <CardDescription>Configure GIS location resolution and LocationIQ geocoding settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Geocoding Provider</label>
                  <Input value={settingsData.geocodeProvider} disabled className="bg-slate-50 font-semibold text-xs" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">LocationIQ Access Token</label>
                  <Input
                    value={settingsData.apiKey}
                    onChange={(e) => setSettingsData({ ...settingsData, apiKey: e.target.value })}
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400">Token used for reverse geocoding citizen complaints into human-readable addresses.</p>
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