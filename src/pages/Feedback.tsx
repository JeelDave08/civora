import { useState } from "react"
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
                      className={`${(hover || rating) >= star ? "fill-warning text-warning" : "text-muted"} transition-colors`} 
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
}