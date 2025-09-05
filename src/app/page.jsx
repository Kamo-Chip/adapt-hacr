"use client";

import Loading from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { checkUserExists, createUser, checkOnboardingStatus } from "@/utils/db/client";
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
    useUser
} from "@clerk/nextjs";
import {
    ArrowRight,
    CheckCircle,
    Clock,
    FileText,
    Hospital,
    MapPin,
    Phone,
    Search,
    Shield,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LandingPage() {
    const { isSignedIn, isLoaded, user } = useUser();
    const [isPageLoading, setIsPageLoading] = useState(true);
    const router = useRouter();
    const userId = user?.id ?? null;
    useEffect(() => {
        if (!isLoaded) return;

        const redirectToDashboard = () => {
            router.push("/dashboard");
        };

        const redirectToOnboard = () => {
            router.push("/onboard");
        };

        const handleUserRedirect = async () => {
            if (!user) return;

            const userExists = await checkUserExists(user.id);


            if (userExists) {
                const onboardingComplete = await checkOnboardingStatus(user.id);
                if (onboardingComplete) {
                    redirectToDashboard();
                } else {
                    redirectToOnboard();
                }
            } else {
                const res = await createUser(user.id, user.emailAddresses[0].emailAddress, user.fullName ?? "");
                if (res) {
                    redirectToOnboard();
                }
            }
            setIsPageLoading(false);
        };

        if (isSignedIn) {
            handleUserRedirect();
        } else {
            setIsPageLoading(false);
        }
    }, [isSignedIn, isLoaded, userId]);

    if (isPageLoading) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-medical-blue rounded-lg flex items-center justify-center">
                                <Hospital className="w-5 h-5 text-medical-blue-foreground" />
                            </div>
                            <span className="text-xl font-semibold text-foreground">
                                MedRef
                            </span>
                        </div>
                        <nav className="hidden md:flex items-center gap-6">
                            <Link
                                href="#features"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Features
                            </Link>
                            <Link
                                href="#benefits"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Benefits
                            </Link>
                            <Link
                                href="#contact"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Contact
                            </Link>
                        </nav>
                        <div className="flex items-center gap-3">
                            <SignedOut>
                                <SignInButton>
                                    <Button variant={"outline"}>Sign in</Button>
                                </SignInButton>
                                <SignUpButton>
                                    <Button>Sign up</Button>
                                </SignUpButton>
                            </SignedOut>
                            <SignedIn>
                                <UserButton />
                            </SignedIn>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center space-y-6">
                        <Badge variant="secondary" className="mb-4">
                            ⚕️ Streamlining Healthcare Referrals
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-bold text-balance leading-tight">
                            Connect Hospitals,{" "}
                            <span className="text-medical-blue">Save Lives</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
                            MedRef revolutionizes medical referrals with intelligent hospital
                            matching, real-time capacity tracking, and seamless patient
                            transfers across healthcare networks.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                            <Button size="lg" className="text-lg px-8" asChild>
                                <Link href="/sign-up">
                                    Start Referring Patients
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-4 bg-muted/30">
                <div className="container mx-auto max-w-4xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div className="space-y-2">
                            <div className="text-3xl font-bold text-medical-blue">500+</div>
                            <div className="text-sm text-muted-foreground">
                                Connected Hospitals
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-3xl font-bold text-trust-green">10,000+</div>
                            <div className="text-sm text-muted-foreground">
                                Successful Referrals
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-3xl font-bold text-warning-amber">
                                2.5hrs
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Avg Response Time
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-3xl font-bold text-medical-blue">98%</div>
                            <div className="text-sm text-muted-foreground">
                                Acceptance Rate
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-balance">
                            Everything You Need for Seamless Referrals
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                            Comprehensive tools designed specifically for healthcare
                            professionals
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Card className="border-2 hover:border-medical-blue/20 transition-colors">
                            <CardHeader>
                                <div className="w-12 h-12 bg-medical-blue/10 rounded-lg flex items-center justify-center mb-4">
                                    <Search className="w-6 h-6 text-medical-blue" />
                                </div>
                                <CardTitle>Smart Hospital Matching</CardTitle>
                                <CardDescription>
                                    AI-powered system finds the best hospitals based on capacity,
                                    distance, and specialization
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-2 hover:border-trust-green/20 transition-colors">
                            <CardHeader>
                                <div className="w-12 h-12 bg-trust-green/10 rounded-lg flex items-center justify-center mb-4">
                                    <Clock className="w-6 h-6 text-trust-green" />
                                </div>
                                <CardTitle>Real-Time Capacity</CardTitle>
                                <CardDescription>
                                    Live updates on hospital bed availability and department
                                    capacity across your network
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-2 hover:border-warning-amber/20 transition-colors">
                            <CardHeader>
                                <div className="w-12 h-12 bg-warning-amber/10 rounded-lg flex items-center justify-center mb-4">
                                    <FileText className="w-6 h-6 text-warning-amber" />
                                </div>
                                <CardTitle>Digital Documentation</CardTitle>
                                <CardDescription>
                                    Secure upload and sharing of medical records, X-rays, and
                                    patient documents
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-2 hover:border-medical-blue/20 transition-colors">
                            <CardHeader>
                                <div className="w-12 h-12 bg-medical-blue/10 rounded-lg flex items-center justify-center mb-4">
                                    <Users className="w-6 h-6 text-medical-blue" />
                                </div>
                                <CardTitle>Patient Communication</CardTitle>
                                <CardDescription>
                                    Automated WhatsApp notifications keep patients informed
                                    throughout the referral process
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-2 hover:border-trust-green/20 transition-colors">
                            <CardHeader>
                                <div className="w-12 h-12 bg-trust-green/10 rounded-lg flex items-center justify-center mb-4">
                                    <Shield className="w-6 h-6 text-trust-green" />
                                </div>
                                <CardTitle>Secure & Compliant</CardTitle>
                                <CardDescription>
                                    Enterprise-grade security ensures patient data privacy and
                                    regulatory compliance
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-2 hover:border-warning-amber/20 transition-colors">
                            <CardHeader>
                                <div className="w-12 h-12 bg-warning-amber/10 rounded-lg flex items-center justify-center mb-4">
                                    <CheckCircle className="w-6 h-6 text-warning-amber" />
                                </div>
                                <CardTitle>Priority Management</CardTitle>
                                <CardDescription>
                                    Intelligent urgency classification ensures critical cases
                                    receive immediate attention
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-3xl md:text-4xl font-bold text-balance">
                                    Reduce Referral Time by 70%
                                </h2>
                                <p className="text-xl text-muted-foreground text-pretty">
                                    Transform your referral process from hours to minutes with
                                    intelligent automation and real-time coordination.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 bg-trust-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <CheckCircle className="w-4 h-4 text-trust-green-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">
                                            Instant Hospital Availability
                                        </h3>
                                        <p className="text-muted-foreground">
                                            See real-time bed capacity and department availability
                                            across your network
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-6 h-6 bg-trust-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <CheckCircle className="w-4 h-4 text-trust-green-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">
                                            Automated Documentation
                                        </h3>
                                        <p className="text-muted-foreground">
                                            Digital forms and document sharing eliminate paperwork
                                            delays
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-6 h-6 bg-trust-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <CheckCircle className="w-4 h-4 text-trust-green-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">
                                            Smart Matching Algorithm
                                        </h3>
                                        <p className="text-muted-foreground">
                                            AI finds the optimal hospital based on distance, capacity,
                                            and specialization
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="bg-card border rounded-2xl p-8 shadow-lg">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Referral Status
                                        </span>
                                        <Badge className="bg-trust-green text-trust-green-foreground">
                                            Accepted
                                        </Badge>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Patient: John Doe</span>
                                            <span className="text-sm text-muted-foreground">
                                                ID: P-2024-001
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Department: Cardiology</span>
                                            <span className="text-sm text-urgent-red">
                                                High Priority
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">
                                                Hospital: Johannesburg Hospital
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                2.3km away
                                            </span>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <div className="text-sm text-muted-foreground">
                                            Response Time
                                        </div>
                                        <div className="text-2xl font-bold text-trust-green">
                                            12 minutes
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-4xl text-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-balance">
                            Ready to Transform Your Referral Process?
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                            Join hundreds of healthcare facilities already using MedRef to
                            save time and improve patient outcomes.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                            <Button size="lg" className="text-lg px-8" asChild>
                                <Link href="/sign-up">
                                    Start Referring Patients
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="border-t bg-muted/30 py-16 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-medical-blue rounded-lg flex items-center justify-center">
                                    <Hospital className="w-5 h-5 text-medical-blue-foreground" />
                                </div>
                                <span className="text-xl font-semibold">MedRef</span>
                            </div>
                            <p className="text-muted-foreground text-sm">
                                Connecting healthcare facilities for better patient outcomes
                                across South Africa and beyond.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold">Product</h3>
                            <div className="space-y-2 text-sm">
                                <Link
                                    href="#features"
                                    className="block text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Features
                                </Link>
                                <Link
                                    href="#"
                                    className="block text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Pricing
                                </Link>
                                <Link
                                    href="#"
                                    className="block text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Demo
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold">Support</h3>
                            <div className="space-y-2 text-sm">
                                <Link
                                    href="#"
                                    className="block text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Help Center
                                </Link>
                                <Link
                                    href="#"
                                    className="block text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Documentation
                                </Link>
                                <Link
                                    href="#"
                                    className="block text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Contact Us
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold">Contact</h3>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    <span>+27 72 480 1111</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>Johannesburg, South Africa</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
                        <p>
                            &copy; {new Date().getFullYear()} MedRef. All rights reserved. | Privacy Policy | Terms
                            of Service
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
