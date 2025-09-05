"use client"

import { useState } from "react"
import { Bell, CheckCircle, AlertTriangle, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const mockNotifications = [
    {
        id: "1",
        type: "urgent",
        title: "Urgent Referral Response Required",
        message:
            "St. Mary's Hospital has requested additional information for referral #REF-2024-001.",
        timestamp: "2 minutes ago",
        read: false,
        referralId: "REF-2024-001",
    },
    {
        id: "2",
        type: "success",
        title: "Referral Accepted",
        message: "Your referral to City General Hospital has been accepted and scheduled.",
        timestamp: "1 hour ago",
        read: false,
        referralId: "REF-2024-002",
    },
    {
        id: "3",
        type: "warning",
        title: "Referral Deadline Approaching",
        message: "Referral #REF-2024-003 requires response within 24 hours.",
        timestamp: "3 hours ago",
        read: true,
        referralId: "REF-2024-003",
    },
    {
        id: "4",
        type: "info",
        title: "System Maintenance Scheduled",
        message: "MedRef will undergo maintenance on Sunday, 2:00 AM - 4:00 AM EST.",
        timestamp: "1 day ago",
        read: true,
    },
    {
        id: "5",
        type: "success",
        title: "Profile Updated",
        message: "Your hospital credentials have been successfully verified.",
        timestamp: "2 days ago",
        read: true,
    },
]

const getNotificationIcon = (type) => {
    switch (type) {
        case "success":
            return <CheckCircle className="h-5 w-5 text-trust-green" />
        case "warning":
            return <AlertTriangle className="h-5 w-5 text-warning-amber" />
        case "urgent":
            return <AlertTriangle className="h-5 w-5 text-urgent-red" />
        case "info":
        default:
            return <Info className="h-5 w-5 text-medical-blue" />
    }
}

const getNotificationBadge = (type) => {
    switch (type) {
        case "success":
            return (
                <Badge
                    variant="secondary"
                    className="bg-trust-green/10 text-trust-green border-trust-green/20"
                >
                    Success
                </Badge>
            )
        case "warning":
            return (
                <Badge
                    variant="secondary"
                    className="bg-warning-amber/10 text-warning-amber border-warning-amber/20"
                >
                    Warning
                </Badge>
            )
        case "urgent":
            return (
                <Badge
                    variant="secondary"
                    className="bg-urgent-red/10 text-urgent-red border-urgent-red/20"
                >
                    Urgent
                </Badge>
            )
        case "info":
        default:
            return (
                <Badge
                    variant="secondary"
                    className="bg-medical-blue/10 text-medical-blue border-medical-blue/20"
                >
                    Info
                </Badge>
            )
    }
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState(mockNotifications)
    const [activeTab, setActiveTab] = useState("all")

    const markAsRead = (id) => {
        setNotifications((prev) =>
            prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
        )
    }

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
    }

    const deleteNotification = (id) => {
        setNotifications((prev) => prev.filter((notif) => notif.id !== id))
    }

    const filteredNotifications = notifications.filter((notif) => {
        if (activeTab === "unread") return !notif.read
        if (activeTab === "urgent") return notif.type === "urgent"
        return true
    })

    const unreadCount = notifications.filter((n) => !n.read).length

    return (
        <div className="min-h-screen bg-background">


            <div className="border-b bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-medical-blue/10 rounded-lg flex items-center justify-center">
                                <Bell className="w-6 h-6 text-medical-blue" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
                                <p className="text-muted-foreground mt-1">Stay updated with your referral activities</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {unreadCount > 0 && (
                                <Button onClick={markAllAsRead} variant="outline">
                                    Mark All as Read ({unreadCount})
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="container p-6 max-w-4xl mx-auto">

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                        <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                        <TabsTrigger value="urgent">
                            Urgent ({notifications.filter((n) => n.type === "urgent").length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="space-y-4">
                        {filteredNotifications.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Bell className="h-12 w-12 text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        No notifications
                                    </h3>
                                    <p className="text-gray-600 text-center">
                                        {activeTab === "unread"
                                            ? "You're all caught up! No unread notifications."
                                            : activeTab === "urgent"
                                                ? "No urgent notifications at this time."
                                                : "You don't have any notifications yet."}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredNotifications.map((notification) => (
                                <Card
                                    key={notification.id}
                                    className={`transition-all hover:shadow-md ${!notification.read
                                        ? "border-l-4 border-l-medical-blue bg-medical-blue/5"
                                        : ""
                                        }`}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                {getNotificationIcon(notification.type)}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <CardTitle className="text-lg">
                                                            {notification.title}
                                                        </CardTitle>
                                                        {getNotificationBadge(notification.type)}
                                                        {!notification.read && (
                                                            <div className="w-2 h-2 bg-medical-blue rounded-full" />
                                                        )}
                                                    </div>
                                                    <p className="text-gray-600">{notification.message}</p>
                                                    {notification.referralId && (
                                                        <p className="text-sm text-medical-blue font-medium mt-1">
                                                            Referral ID: {notification.referralId}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!notification.read && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => markAsRead(notification.id)}
                                                    >
                                                        Mark as Read
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => deleteNotification(notification.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-sm text-gray-500">
                                            {notification.timestamp}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
