import { User, Mail, Phone, MapPin, Camera, Edit, Save } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { useAuth } from "../context/AuthContext"
import { useState, useEffect, useRef } from "react"

export function Profile() {
  const { user, token, login } = useAuth()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    profileImage: ""
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/citizen/profile", {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          const nameParts = (data.fullName || user?.name || "").split(" ")
          setFormData({
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            email: data.email || user?.email || "",
            phone: data.phone || "",
            address: data.address || "",
            profileImage: data.profileImage || ""
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      }
    }
    if (token) fetchProfile()
  }, [token, user])

  const handleSave = async () => {
    if (!isEditing) {
      setIsEditing(true)
      return
    }
    
    setIsSaving(true)
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim()
      const res = await fetch("http://localhost:5000/api/citizen/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName,
          phone: formData.phone,
          address: formData.address,
          profileImage: formData.profileImage
        })
      })
      if (res.ok) {
        setIsEditing(false)
        const updatedData = await res.json()
        if (user && token) {
          login(token, {
            ...user,
            name: updatedData.fullName || user.name,
            profileImage: updatedData.profileImage || user.profileImage
          })
        }
      } else {
        alert("Failed to save profile. Is the backend running the latest code?")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Network error. Please make sure the backend is running.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const uploadData = new FormData()
    uploadData.append("file", file)
    uploadData.append("upload_preset", "civora")
    uploadData.append("cloud_name", "racerjru")

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/racerjru/image/upload", {
        method: "POST",
        body: uploadData
      })
      const uploadedImage = await res.json()
      const newImageUrl = uploadedImage.secure_url
      
      setFormData(prev => ({ ...prev, profileImage: newImageUrl }))
      
      // Auto-trigger editing mode so the user can see the Save button
      setIsEditing(true)
    } catch (err) {
      console.error("Error uploading to Cloudinary:", err)
    } finally {
      setIsUploading(false)
    }
  }

  const displayAvatar = formData.profileImage || `https://api.dicebear.com/7.x/notionists/svg?seed=${formData.firstName || user?.name || 'Citizen'}`
  const displayFullName = `${formData.firstName} ${formData.lastName}`.trim() || user?.name || 'Civora Citizen'


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
              <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-card shadow-lg relative bg-muted">
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center border-4 border-card hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Camera size={16} />
              </button>
            </div>
            <h3 className="text-xl font-bold text-heading">{displayFullName}</h3>
            <p className="text-muted-foreground text-sm mb-4">Verified Citizen</p>
            <div className="w-full pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Mail size={16} /> {formData.email}
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Phone size={16} /> {formData.phone || "Not set"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-heading">Personal Information</h3>
              <Button variant={isEditing ? "default" : "outline"} size="sm" className="gap-2" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : isEditing ? (
                  <><Save size={16} /> Save</>
                ) : (
                  <><Edit size={16} /> Edit</>
                )}
              </Button>
            </div>
            
            <form className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-heading">First Name</label>
                  <Input 
                    value={formData.firstName} 
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    readOnly={!isEditing} 
                    className={!isEditing ? "bg-muted/50" : ""} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-heading">Last Name</label>
                  <Input 
                    value={formData.lastName} 
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    readOnly={!isEditing} 
                    className={!isEditing ? "bg-muted/50" : ""} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-heading">Email</label>
                  <Input value={formData.email} readOnly className="bg-muted/50 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-heading">Phone Number</label>
                  <Input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    readOnly={!isEditing} 
                    placeholder="Add phone number"
                    className={!isEditing ? "bg-muted/50" : ""} 
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-heading">Address</label>
                  <Input 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    readOnly={!isEditing} 
                    placeholder="Add your address"
                    className={!isEditing ? "bg-muted/50" : ""} 
                  />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}