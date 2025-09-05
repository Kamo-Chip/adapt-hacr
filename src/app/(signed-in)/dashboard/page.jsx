"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/page-header"
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Area,
    AreaChart,
} from "recharts"
import { TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownRight, Calendar, AlertTriangle, ChartSpline } from "lucide-react"

// Mock data - in real app this would come from API
const referralStats = {
    sent: 156,
    received: 89,
    pending: 23,
    completed: 198,
}

const capacityData = [
    { hospital: "South Africatta National", current: 1200, total: 2000, percentage: 60 },
    { hospital: "Aga Khan", current: 180, total: 254, percentage: 71 },
    { hospital: "Johannesburg Hospital", current: 220, total: 350, percentage: 63 },
    { hospital: "Mater Hospital", current: 190, total: 300, percentage: 63 },
    { hospital: "Karen Hospital", current: 85, total: 120, percentage: 71 },
]

const departmentReferrals = [
    { department: "Cardiology", count: 45, percentage: 28 },
    { department: "Neurology", count: 32, percentage: 20 },
    { department: "Orthopedics", count: 28, percentage: 17 },
    { department: "Emergency", count: 25, percentage: 16 },
    { department: "Pediatrics", count: 18, percentage: 11 },
    { department: "Others", count: 12, percentage: 8 },
]

const weeklyTrends = [
    { day: "Mon", sent: 12, received: 8, accepted: 7 },
    { day: "Tue", sent: 15, received: 11, accepted: 9 },
    { day: "Wed", sent: 18, received: 14, accepted: 12 },
    { day: "Thu", sent: 22, received: 16, accepted: 14 },
    { day: "Fri", sent: 25, received: 18, accepted: 16 },
    { day: "Sat", sent: 8, received: 6, accepted: 5 },
    { day: "Sun", sent: 6, received: 4, accepted: 3 },
]

const responseTimeData = [
    { time: "0-30min", count: 45, color: "var(--trust-green)" },
    { time: "30-60min", count: 32, color: "var(--warning-amber)" },
    { time: "1-2hrs", count: 18, color: "var(--medical-blue)" },
    { time: "2+ hrs", count: 8, color: "var(--urgent-red)" },
]

export default function DashboardPage() {
    return (
        <div className="flex flex-col">
            <div className="border-b bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-medical-blue/10 rounded-lg flex items-center justify-center">
                                <ChartSpline className="w-6 h-6 text-medical-blue" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                                <p className="text-muted-foreground mt-1">Overview of your referral activities</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm">
                                <Calendar className="w-4 h-4 mr-2" />
                                Last 30 days
                            </Button>
                            <Button size="sm">Export Report</Button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 space-y-4 p-4 pt-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Referrals Sent</CardTitle>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-medical-blue">{referralStats.sent}</div>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <TrendingUp className="w-3 h-3 mr-1 text-trust-green" />
                                <span className="text-trust-green">+12%</span>
                                <span className="ml-1">from last month</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Referrals Received</CardTitle>
                            <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-trust-green">{referralStats.received}</div>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <TrendingUp className="w-3 h-3 mr-1 text-trust-green" />
                                <span className="text-trust-green">+8%</span>
                                <span className="ml-1">from last month</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-warning-amber">2.5hrs</div>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <TrendingDown className="w-3 h-3 mr-1 text-trust-green" />
                                <span className="text-trust-green">-15%</span>
                                <span className="ml-1">improvement</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Referrals</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-urgent-red">{referralStats.pending}</div>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <span>Requires attention</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Weekly Trends */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Weekly Referral Trends</CardTitle>
                            <CardDescription>Sent vs Received referrals over the past week</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300} >
                                <AreaChart data={weeklyTrends}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="day" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Area
                                        type="natural"
                                        dataKey="sent"
                                        stackId="1"
                                        stroke="var(--medical-blue)"
                                        fill="var(--medical-blue)"
                                        fillOpacity={0.6}
                                        name="Sent"
                                    />
                                    <Area
                                        type="natural"
                                        dataKey="received"
                                        stackId="2"
                                        stroke="hsl(var(--trust-green))"
                                        fill="hsl(var(--trust-green))"
                                        fillOpacity={0.6}
                                        name="Received"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Response Time Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Response Time Distribution</CardTitle>
                            <CardDescription>How quickly referrals are being processed</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={responseTimeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="count"
                                    >
                                        {responseTimeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                {responseTimeData.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm text-muted-foreground">{item.time}</span>
                                        <span className="text-sm font-medium ml-auto">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Department Referrals and Hospital Capacity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Common Referral Departments */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Referrals by Department</CardTitle>
                            <CardDescription>Most common medical specialties for referrals</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {departmentReferrals.map((dept, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{dept.department}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">{dept.count}</span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {dept.percentage}%
                                                </Badge>
                                            </div>
                                        </div>
                                        <Progress value={dept.percentage} className="h-2" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hospital Capacity */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hospital Capacity Status</CardTitle>
                            <CardDescription>Current bed occupancy across network hospitals</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {capacityData.map((hospital, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{hospital.hospital}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">
                                                    {hospital.current}/{hospital.total}
                                                </span>
                                                <Badge
                                                    variant={
                                                        hospital.percentage > 70
                                                            ? "destructive"
                                                            : hospital.percentage > 50
                                                                ? "secondary"
                                                                : "default"
                                                    }
                                                    className="text-xs"
                                                >
                                                    {hospital.percentage}%
                                                </Badge>
                                            </div>
                                        </div>
                                        <Progress value={hospital.percentage} className="h-2" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Referral Activity</CardTitle>
                        <CardDescription>Latest referrals and their status updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                {
                                    patient: "John Doe",
                                    id: "REF-2024-001234",
                                    department: "Cardiology",
                                    hospital: "Johannesburg Hospital",
                                    status: "accepted",
                                    time: "2 hours ago",
                                    urgency: "high",
                                },
                                {
                                    patient: "Jane Smith",
                                    id: "REF-2024-001235",
                                    department: "Neurology",
                                    hospital: "Aga Khan Hospital",
                                    status: "pending",
                                    time: "4 hours ago",
                                    urgency: "medium",
                                },
                                {
                                    patient: "Michael Johnson",
                                    id: "REF-2024-001236",
                                    department: "Orthopedics",
                                    hospital: "South Africatta National",
                                    status: "completed",
                                    time: "6 hours ago",
                                    urgency: "low",
                                },
                            ].map((referral, index) => (
                                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{referral.patient}</span>
                                                <Badge
                                                    variant={
                                                        referral.urgency === "high"
                                                            ? "destructive"
                                                            : referral.urgency === "medium"
                                                                ? "secondary"
                                                                : "outline"
                                                    }
                                                    className="text-xs"
                                                >
                                                    {referral.urgency} priority
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {referral.id} • {referral.department} • {referral.hospital}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            variant={
                                                referral.status === "accepted"
                                                    ? "default"
                                                    : referral.status === "completed"
                                                        ? "secondary"
                                                        : "outline"
                                            }
                                            className={
                                                referral.status === "accepted"
                                                    ? "bg-trust-green text-trust-green-foreground"
                                                    : referral.status === "completed"
                                                        ? "bg-medical-blue text-medical-blue-foreground"
                                                        : ""
                                            }
                                        >
                                            {referral.status}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">{referral.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
