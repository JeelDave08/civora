import { User, Mail, Phone, MapPin, Camera, Edit } from "lucide-react"
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
}