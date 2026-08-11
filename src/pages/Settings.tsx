import { Bell, Lock, Globe, Shield, Smartphone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

export function Settings() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-heading">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account preferences and application settings.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3 bg-muted/50 text-heading">
            <Bell size={18} /> Notifications
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
            <Lock size={18} /> Security
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
            <Globe size={18} /> Language
          </Button>
        </div>

        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <h3 className="text-xl font-bold text-heading border-b border-border pb-4">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-heading">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive updates about your complaints via email.</p>
                  </div>
                  <input type="checkbox" className="toggle-checkbox" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-heading">SMS Alerts</h4>
                    <p className="text-sm text-muted-foreground">Get urgent city alerts via SMS.</p>
                  </div>
                  <input type="checkbox" className="toggle-checkbox" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-heading">Push Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive notifications in your browser.</p>
                  </div>
                  <input type="checkbox" className="toggle-checkbox" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-4">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  )
}