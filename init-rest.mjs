import fs from 'fs';
import path from 'path';

const pages = {
  'Feedback.tsx': `import { useState } from "react"
import { Star, Send, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"

export function Feedback() {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-heading">Share Your Feedback</h1>
        <p className="mt-2 text-muted-foreground">Help us improve the Civora platform and city services.</p>
      </div>

      <Card>
        <CardContent className="p-8">
          <form className="space-y-6">
            <div className="flex flex-col items-center space-y-2 mb-8">
              <label className="text-sm font-medium text-heading mb-2">How would you rate your overall experience?</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star 
                      size={40} 
                      className={\`\${(hover || rating) >= star ? "fill-warning text-warning" : "text-muted"} transition-colors\`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-heading">Subject</label>
              <Input placeholder="What is this regarding?" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-heading">Your Comments</label>
              <textarea 
                className="w-full min-h-[120px] p-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Tell us what you loved or what we can do better..."
              />
            </div>
            
            <Button type="button" className="w-full gap-2">
              Submit Feedback <Send size={16} />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}`,
  'Profile.tsx': `import { User, Mail, Phone, MapPin, Camera, Edit } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"

export function Profile() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-heading">My Profile</h1>
        <p className="mt-1 text-muted-foreground">Manage your personal information and preferences.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 h-fit">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-card shadow-lg">
                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <button className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center border-4 border-card hover:bg-primary/90 transition-colors">
                <Camera size={16} />
              </button>
            </div>
            <h3 className="text-xl font-bold text-heading">John Doe</h3>
            <p className="text-muted-foreground text-sm mb-4">Verified Citizen</p>
            <div className="w-full pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Mail size={16} /> john.doe@example.com
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Phone size={16} /> +1 (555) 000-0000
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-heading">Personal Information</h3>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit size={16} /> Edit
              </Button>
            </div>
            
            <form className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-heading">First Name</label>
                  <Input defaultValue="John" readOnly className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-heading">Last Name</label>
                  <Input defaultValue="Doe" readOnly className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-heading">Email</label>
                  <Input defaultValue="john.doe@example.com" readOnly className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-heading">Phone Number</label>
                  <Input defaultValue="+1 (555) 000-0000" readOnly className="bg-muted/50" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-heading">Address</label>
                  <Input defaultValue="123 Main St, Apt 4B, Springfield, ST 12345" readOnly className="bg-muted/50" />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}`,
  'Settings.tsx': `import { Bell, Lock, Globe, Shield, Smartphone } from "lucide-react"
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
}`,
  'NotFound.tsx': `import { Link } from "react-router-dom"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center mb-8 text-primary">
        <AlertCircle size={64} />
      </div>
      <h1 className="text-6xl font-bold text-heading mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-heading mb-4">Page not found</h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button asChild size="lg" className="gap-2">
        <Link><ArrowLeft size={18} /> Back to Home</Link>
      </Button>
    </div>
  )
}`
};

for (const [filename, content] of Object.entries(pages)) {
  const targetPath = path.join('c:/Civora/src/pages', filename);
  fs.writeFileSync(targetPath, content);
}
console.log('Pages generated successfully.');
