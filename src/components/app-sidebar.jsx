"use client";

import {
    Activity,
    Bell,
    ClipboardList,
    Hospital,
    LayoutDashboard,
    Search,
    Settings,
    User,
    UserPlus
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { getPendingReferralsCount, getUserHospital } from "@/utils/db/client";
import { UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

// Navigation items
const navigationItems = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Create Referral",
        url: "/referrals/create",
        icon: UserPlus,
    },
    {
        title: "Manage Referrals",
        url: "/referrals/manage",
        icon: ClipboardList,
        badge: "3", // I'll come back here
    },
    {
        title: "Hospital Search",
        url: "/hospitals/search",
        icon: Search,
    },
    {
        title: "Profile",
        url: "/profile",
        icon: User,
    },
];

const secondaryItems = [
    {
        title: "Notifications",
        url: "/notifications",
        icon: Bell,
        badge: "2",
    },
    {
        title: "Activity Log",
        url: "/activity",
        icon: Activity,
    },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { user } = useUser();
    const [referralCount, setReferralCount] = useState(0);
    const [userHospital, setUserHospital] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        // Fetch the number of pending referrals for the user's hospital
        async function fetchPendingReferrals() {
            try {
                const res = await getPendingReferralsCount(user.id);
                setReferralCount(res || 0);
            } catch (error) {
                console.error("Error fetching referral count:", error);
            }
        }

        async function fetchUserHospital() {
            try {
                const res = await getUserHospital(user.id);
                setUserHospital(res || null);
            } catch (error) {
                console.error("Error fetching user's hospital:", error);
            }
        }

        async function fetchData() {
            setLoading(true);
            await fetchPendingReferrals()
            await fetchUserHospital();
            setLoading(false);
        }

        fetchData();
    }, [user])
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-medical-blue text-medical-blue-foreground">
                                    <Hospital className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">MedRef</span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        Healthcare Referrals
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navigationItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                            {item.url === "/referrals/manage" && referralCount > 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-auto h-5 w-5 shrink-0 items-center justify-center rounded-full bg-urgent-red text-urgent-red-foreground text-xs"
                                                >
                                                    {referralCount}
                                                </Badge>
                                            )}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Tools</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {secondaryItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                            {item.badge && (
                                                <Badge
                                                    variant="outline"
                                                    className="ml-auto h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs"
                                                >
                                                    {item.badge}
                                                </Badge>
                                            )}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <div className="flex items-center gap-2 p-2 mb-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                                    <UserButton />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        {user?.fullName || ""}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {userHospital ? userHospital.name : ""}
                                    </span>
                                </div>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
