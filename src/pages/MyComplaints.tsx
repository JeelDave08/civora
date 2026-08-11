import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Filter, ArrowUpDown, Eye, Clock, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Link } from "react-router-dom"

const complaintsData = [
  { id: "CIV-8492", category: "Road", description: "Large pothole on main street", date: "2023-10-25", status: "Resolved", priority: "High" },
  { id: "CIV-8491", category: "Garbage", description: "Trash not collected for 3 days", date: "2023-10-24", status: "In Progress", priority: "Medium" },
  { id: "CIV-8490", category: "Street Light", description: "Street light broken near park", date: "2023-10-22", status: "Pending", priority: "Low" },
  { id: "CIV-8489", category: "Water", description: "Water pipeline leakage", date: "2023-10-20", status: "Resolved", priority: "Emergency" },
  { id: "CIV-8488", category: "Drainage", description: "Blocked drainage causing waterlogging", date: "2023-10-18", status: "In Progress", priority: "High" },
]

export function MyComplaints() {
  const [searchTerm, setSearchTerm] = useState("")

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Resolved": return <Badge variant="success" className="gap-1"><CheckCircle size={12} /> {status}</Badge>
      case "In Progress": return <Badge variant="info" className="gap-1"><Clock size={12} /> {status}</Badge>
      case "Pending": return <Badge variant="warning" className="gap-1"><AlertTriangle size={12} /> {status}</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "Emergency": return "text-destructive"
      case "High": return "text-warning"
      case "Medium": return "text-info"
      case "Low": return "text-muted-foreground"
      default: return ""
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-heading">My Complaints</h1>
          <p className="mt-1 text-muted-foreground">Track and manage the issues you have reported.</p>
        </div>
        <Button asChild>
          <Link to="/citizen/raise-complaint">Raise New Complaint</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search by ID, Category or Description..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter size={16} /> Filter
              </Button>
              <Button variant="outline" className="gap-2">
                <ArrowUpDown size={16} /> Sort
              </Button>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaintsData.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-medium">{complaint.id}</TableCell>
                    <TableCell>{complaint.category}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{complaint.description}</TableCell>
                    <TableCell>{complaint.date}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="gap-2">
                        <Link to={`/citizen/complaint/${complaint.id}`}>
                          <Eye size={16} /> View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {complaintsData.map((complaint) => (
              <motion.div 
                key={complaint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border rounded-xl p-4 bg-background/50 hover:bg-muted/30 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">{complaint.id}</span>
                    <h4 className="font-semibold text-heading mt-2">{complaint.category}</h4>
                  </div>
                  {getStatusBadge(complaint.status)}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{complaint.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{complaint.date}</span>
                  <Link to={`/citizen/complaint/${complaint.id}`} className="text-primary font-medium hover:underline flex items-center gap-1">
                    Details <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination Placeholder */}
          <div className="flex items-center justify-between border-t border-border mt-6 pt-6">
            <span className="text-sm text-muted-foreground">Showing 1 to 5 of 24 entries</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" className="bg-primary/10 text-primary border-primary/20">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
