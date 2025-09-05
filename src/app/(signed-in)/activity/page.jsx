"use client"

import { useState } from "react"
import { Activity, User, FileText, Hospital, Clock, Filter } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

const mockActivityLogs = [
    {
        id: "1",
        type: "referral",
        action: "Referral Created",
        description: "Created new referral for patient John Doe to Cardiology department",
        timestamp: "2024-01-15 14:30:22",
        user: "Dr. Sarah Johnson",
        referralId: "REF-2024-001",
        hospitalName: "St. Mary's Hospital",
    },
    {
        id: "2",
        type: "referral",
        action: "Referral Updated",
        description: "Updated priority level from Normal to Urgent",
        timestamp: "2024-01-15 13:45:10",
        user: "Dr. Sarah Johnson",
        referralId: "REF-2024-001",
    },
    {
        id: "3",
        type: "hospital",
        action: "Hospital Response",
        description: "City General Hospital accepted referral and provided appointment slot",
        timestamp: "2024-01-15 12:20:15",
        user: "System",
        referralId: "REF-2024-002",
        hospitalName: "City General Hospital",
    },
    {
        id: "4",
        type: "profile",
        action: "Profile Updated",
        description: "Updated contact information and medical license verification",
        timestamp: "2024-01-15 11:15:30",
        user: "Dr. Sarah Johnson",
    },
    {
        id: "5",
        type: "referral",
        action: "Referral Cancelled",
        description: "Cancelled referral due to patient request",
        timestamp: "2024-01-15 10:30:45",
        user: "Dr. Michael Chen",
        referralId: "REF-2024-003",
    },
    {
        id: "6",
        type: "system",
        action: "Login",
        description: "User logged into the system",
        timestamp: "2024-01-15 09:00:12",
        user: "Dr. Sarah Johnson",
    },
    {
        id: "7",
        type: "hospital",
        action: "Hospital Search",
        description: "Searched for hospitals in Cardiology specialty within 50km radius",
        timestamp: "2024-01-14 16:45:20",
        user: "Dr. Sarah Johnson",
    },
    {
        id: "8",
        type: "referral",
        action: "Referral Submitted",
        description: "Submitted referral to multiple hospitals for review",
        timestamp: "2024-01-14 15:20:35",
        user: "Dr. Sarah Johnson",
        referralId: "REF-2024-004",
    },
]

const getActivityIcon = (type) => {
    switch (type) {
        case "referral":
            return <FileText className="h-5 w-5 text-medical-blue" />
        case "profile":
            return <User className="h-5 w-5 text-trust-green" />
        case "hospital":
            return <Hospital className="h-5 w-5 text-warning-amber" />
        case "system":
        default:
            return <Activity className="h-5 w-5 text-gray-500" />
    }
}

const getActivityBadge = (type) => {
    switch (type) {
        case "referral":
            return (
                <Badge variant="secondary" className="bg-medical-blue/10 text-medical-blue border-medical-blue/20">
                    Referral
                </Badge>
            )
        case "profile":
            return (
                <Badge variant="secondary" className="bg-trust-green/10 text-trust-green border-trust-green/20">
                    Profile
                </Badge>
            )
        case "hospital":
            return (
                <Badge variant="secondary" className="bg-warning-amber/10 text-warning-amber border-warning-amber/20">
                    Hospital
                </Badge>
            )
        case "system":
        default:
            return (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200">
                    System
                </Badge>
            )
    }
}

export default function ActivityLogPage() {
    const [activities, setActivities] = useState(mockActivityLogs)
    const [filterType, setFilterType] = useState("all")
    const [searchTerm, setSearchTerm] = useState("")

    const filteredActivities = activities.filter((activity) => {
        const matchesType = filterType === "all" || activity.type === filterType
        const matchesSearch =
            searchTerm === "" ||
            activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (activity.referralId && activity.referralId.toLowerCase().includes(searchTerm.toLowerCase()))

        return matchesType && matchesSearch
    })

    return (
        <div className="min-h-screen bg-background">


            <div className="border-b bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-medical-blue/10 rounded-lg flex items-center justify-center">
                                <Activity className="w-6 h-6 text-medical-blue" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">Activity Log</h1>
                                <p className="text-muted-foreground mt-1">Track all system activities and user actions</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <div className="container p-6 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex-1">
                        <Input
                            placeholder="Search activities..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full sm:w-48">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Activities</SelectItem>
                            <SelectItem value="referral">Referrals</SelectItem>
                            <SelectItem value="profile">Profile</SelectItem>
                            <SelectItem value="hospital">Hospital</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-4">
                    {filteredActivities.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Activity className="h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                                <p className="text-gray-600 text-center">
                                    {searchTerm
                                        ? `No activities match your search "${searchTerm}"`
                                        : "No activities to display for the selected filter."}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredActivities.map((activity, index) => (
                            <Card key={activity.id} className="transition-all hover:shadow-md">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col items-center">
                                            {getActivityIcon(activity.type)}
                                            {index < filteredActivities.length - 1 && <div className="w-px h-12 bg-gray-200 mt-4" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-gray-900">{activity.action}</h3>
                                                {getActivityBadge(activity.type)}
                                            </div>

                                            <p className="text-gray-600 mb-3">{activity.description}</p>

                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <User className="h-4 w-4" />
                                                    <span>{activity.user}</span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{activity.timestamp}</span>
                                                </div>

                                                {activity.referralId && (
                                                    <div className="flex items-center gap-1">
                                                        <FileText className="h-4 w-4" />
                                                        <span className="text-medical-blue font-medium">{activity.referralId}</span>
                                                    </div>
                                                )}

                                                {activity.hospitalName && (
                                                    <div className="flex items-center gap-1">
                                                        <Hospital className="h-4 w-4" />
                                                        <span>{activity.hospitalName}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {filteredActivities.length > 0 && (
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            Showing {filteredActivities.length} of {activities.length} activities
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
