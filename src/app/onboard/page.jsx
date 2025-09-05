"use client"

import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete"
import SearchableInput from "@/components/searchable-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/utils/supabase/client"
import { useUser } from "@clerk/nextjs"
import {
    ArrowLeft,
    ArrowRight,
    Building,
    CheckCircle,
    CircleSmall,
    Clock,
    Hospital,
    LoaderCircle,
    Search,
    Shield,
    Trash2,
    User
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export const DEPARTMENTS = [
    // General & Primary Care
    { value: "general-medicine", title: "General Medicine / Family Medicine" },
    { value: "internal-medicine", title: "Internal Medicine" },

    // Emergency & Critical Care
    { value: "emergency", title: "Emergency" },
    { value: "icu", title: "Intensive Care Unit (ICU)" },
    { value: "high-care", title: "High Care Unit" },

    // Surgical
    { value: "general-surgery", title: "General Surgery" },
    { value: "orthopedics", title: "Orthopedics" },
    { value: "neurosurgery", title: "Neurosurgery" },
    { value: "cardiothoracic-surgery", title: "Cardiothoracic Surgery" },
    { value: "plastic-surgery", title: "Plastic & Reconstructive Surgery" },
    { value: "ent-surgery", title: "ENT (Ear, Nose, Throat)" },

    // Medical Specialties
    { value: "cardiology", title: "Cardiology" },
    { value: "pulmonology", title: "Pulmonology / Respiratory Medicine" },
    { value: "gastroenterology", title: "Gastroenterology" },
    { value: "nephrology", title: "Nephrology" },
    { value: "endocrinology", title: "Endocrinology" },
    { value: "rheumatology", title: "Rheumatology" },
    { value: "oncology", title: "Oncology" },
    { value: "hematology", title: "Hematology" },
    { value: "dermatology", title: "Dermatology" },
    { value: "neurology", title: "Neurology" },
    { value: "infectious-diseases", title: "Infectious Diseases" },

    // Women & Children’s Health
    { value: "obgyn", title: "Obstetrics & Gynecology (OB/GYN)" },
    { value: "pediatrics", title: "Pediatrics" },
    { value: "neonatology", title: "Neonatology" },

    // Diagnostic & Support
    { value: "radiology", title: "Radiology / Imaging" },
    { value: "pathology", title: "Pathology / Laboratory" },
    { value: "pharmacy", title: "Pharmacy" },

    // Rehabilitation & Allied Health
    { value: "physiotherapy", title: "Physiotherapy" },
    { value: "occupational-therapy", title: "Occupational Therapy" },
    { value: "speech-therapy", title: "Speech & Language Therapy" },
    { value: "psychiatry", title: "Psychiatry" },
    { value: "psychology", title: "Psychology" },
    { value: "nutrition", title: "Nutrition & Dietetics" },
];


const steps = [
    {
        id: 1,
        title: "Welcome to MedRef",
        description: "Let's get you set up to start making referrals",
    },
    {
        id: 2,
        title: "Your Profile",
        description: "Tell us about yourself and your role",
    },
    {
        id: 3,
        title: "Facility Information",
        description: "Add details about your healthcare facility",
    },
    {
        id: 4,
        title: "You're All Set!",
        description: "Ready to start making referrals",
    },
]

export default function OnboardPage() {
    const { user } = useUser();

    const [currentStep, setCurrentStep] = useState(1)
    const [userData, setUserData] = useState({
        name: "",
        role: "",
        hospital_id: "",
        onboarding_complete: true,
    })
    const [facilityData, setFacilityData] = useState({
        name: "",
        type: "",
        address_line1: "",
        city: "",
        province: "",
        postal_code: "",
        country: "",
        latitude: "",
        longitude: "",
    })
    const [isCreatingFacility, setIsCreatingFacility] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    /**
     * @type {Array<{
     *   hospital_id: string,
     *   department: string,
     *   capacity_total: number,
     *   capacity_available: number
     * }>}
     */
    const [departmentData, setDepartmentData] = useState([])

    const progress = (currentStep / steps.length) * 100

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleInputChange = (field, value, isFacilityField = false) => {
        if (isFacilityField) {
            setFacilityData((prev) => ({ ...prev, [field]: value }))
        } else {
            setUserData((prev) => ({ ...prev, [field]: value }))
        }
    }

    const handleFacilityLocationSelect = (locationData) => {
        setFacilityData((prev) => ({
            ...prev,
            ...locationData,
        }))
    }

    const searchFacilities = async (
        query
    ) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("hospitals")
            .select("id, name")
            .ilike("name", `%${query}%`);
        return { data: data ?? [], error };
    };

    const createFacility = async (facilityData) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("hospitals")
            .insert([facilityData])
            .select();
        if (error) {
            console.error("Error creating facility:", error);
            return null;
        }
        return data;
    };

    const updateUser = async (userId, updates) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("users")
            .update(updates)
            .eq("clerk_id", userId)
            .select()
            .single();
        if (error) {
            console.error("Error updating user:", error);
            return null;
        }
        return data;
    };

    const insertDepartments = async (departments) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("hospital_capacity")
            .insert(departments)
            .select();

        if (error) {
            console.error("Error inserting departments:", error);
            return null;
        }
        return data;
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            let facilityId = facilityData.id;

            if (isCreatingFacility) {
                // Create the facility first
                const newFacility = await createFacility(facilityData);
                if (newFacility && newFacility.length > 0) {
                    facilityId = newFacility[0].id;
                    setUserData((prev) => ({
                        ...prev,
                        hospital_id: facilityId,
                    }));
                    setFacilityData((prev) => ({ ...prev, id: facilityId }));
                }
            }
            // Now update the user with the new facility ID
            await updateUser(user.id, { ...userData, hospital_id: facilityId });

            // Insert departments with the new facility ID
            const departments = departmentData.map((dept) => ({
                ...dept,
                hospital_id: facilityId,
            }));
            await insertDepartments(departments);
        } catch (error) {
            console.error("Error during submission:", error);
        } finally {
            setIsSubmitting(false);
        }

    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-medical-blue/10 rounded-full flex items-center justify-center mx-auto">
                            <Hospital className="w-10 h-10 text-medical-blue" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold text-balance">Welcome to MedRef</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                                You're about to join a network of healthcare professionals streamlining patient referrals across South Africa.
                                Let's get you set up in just a few minutes.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6 mt-8">
                            <div className="space-y-3">
                                <div className="w-12 h-12 bg-trust-green/10 rounded-lg flex items-center justify-center mx-auto">
                                    <Search className="w-6 h-6 text-trust-green" />
                                </div>
                                <h3 className="font-semibold">Smart Matching</h3>
                                <p className="text-sm text-muted-foreground">
                                    Find the right hospital instantly based on capacity and specialization
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="w-12 h-12 bg-warning-amber/10 rounded-lg flex items-center justify-center mx-auto">
                                    <Clock className="w-6 h-6 text-warning-amber" />
                                </div>
                                <h3 className="font-semibold">Real-Time Updates</h3>
                                <p className="text-sm text-muted-foreground">
                                    Get live capacity updates and instant referral responses
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="w-12 h-12 bg-medical-blue/10 rounded-lg flex items-center justify-center mx-auto">
                                    <Shield className="w-6 h-6 text-medical-blue" />
                                </div>
                                <h3 className="font-semibold">Secure & Compliant</h3>
                                <p className="text-sm text-muted-foreground">Compliant platform ensuring patient data privacy</p>
                            </div>
                        </div>
                    </div>
                )

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-medical-blue/10 rounded-full flex items-center justify-center mx-auto">
                                <User className="w-8 h-8 text-medical-blue" />
                            </div>
                            <h2 className="text-2xl font-bold">Your Profile</h2>
                            <p className="text-muted-foreground">Help us personalize your MedRef experience</p>
                        </div>
                        <div className="grid md:grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={userData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="role">Your Role</Label>
                                <Select value={userData.role} onValueChange={(value) => handleInputChange("role", value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="doctor">Doctor</SelectItem>
                                        <SelectItem value="nurse">Nurse</SelectItem>
                                        <SelectItem value="administrator">Administrator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-trust-green/10 rounded-full flex items-center justify-center mx-auto">
                                <Building className="w-8 h-8 text-trust-green" />
                            </div>
                            <h2 className="text-2xl font-bold">Facility Information</h2>
                            <p className="text-muted-foreground">Tell us about your healthcare facility</p>
                        </div>

                        {isCreatingFacility ? (<div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="location">Facility Location</Label>
                                <GooglePlacesAutocomplete
                                    id="location"
                                    value={facilityData.location}
                                    onChange={(value) => handleInputChange("location", value, true)}
                                    onSelect={handleFacilityLocationSelect}
                                    placeholder="e.g., Johannesburg, South Africa"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="facilityName">Facility Name</Label>
                                <Input
                                    id="facilityName"
                                    value={facilityData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value, true)}
                                    placeholder="e.g., Johannesburg Hospital"
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="facilityType">Facility Type</Label>
                                    <Select
                                        value={facilityData.type}
                                        onValueChange={(value) => handleInputChange("type", value, true)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select facility type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="public-hospital">Public Hospital</SelectItem>
                                            <SelectItem value="private-hospital">Private Hospital</SelectItem>
                                            <SelectItem value="clinic">Clinic</SelectItem>
                                            <SelectItem value="health-center">Health Center</SelectItem>
                                            <SelectItem value="dispensary">Dispensary</SelectItem>
                                            <SelectItem value="specialized">Specialized Center</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="departments">Available Departments</Label>
                                <Select
                                    onValueChange={(value) => {
                                        console.log(value);
                                        const updatedDepartmentData = [...departmentData];
                                        updatedDepartmentData.push({
                                            department: value,
                                            capacity_total: 0,
                                            capacity_available: 0,
                                        });
                                        setDepartmentData(updatedDepartmentData);
                                    }}
                                >
                                    <SelectTrigger >
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent position="bottom">
                                        {DEPARTMENTS.map((dept) => (
                                            <SelectItem key={dept.value} value={dept.value}>
                                                {dept.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {departmentData.length > 0 && (<div className="mt-2 flex flex-col">
                                    <div className="text-muted-foreground text-sm grid grid-cols-2">
                                        <Label>Selected Departments</Label>
                                        <Label>Capacity</Label>
                                    </div>
                                    <ul className="grid grid-cols-1 flex-wrap gap-2">
                                        {departmentData.map((dept, index) => (
                                            <li key={index} className="rounded-md py-1 grid grid-cols-2">
                                                <span className="flex items-center gap-2">
                                                    <CircleSmall className="w-3 h-3 text-foreground" fill="currentColor" />
                                                    <span>{dept.department}</span>
                                                </span>

                                                <div className="flex items-center gap-2">
                                                    <Input type="number" placeholder="Capacity" className="w-24" min={0} value={dept.capacity_total} onChange={(e) => {
                                                        const updatedDepartmentData = [...departmentData];
                                                        updatedDepartmentData[index].capacity_total = Number(e.target.value);
                                                        updatedDepartmentData[index].capacity_available = Number(e.target.value);
                                                        setDepartmentData(updatedDepartmentData);
                                                    }} />
                                                    <Button variant={"ghost"} size={"icon"} onClick={() => {
                                                        const updatedDepartmentData = departmentData.filter((_, i) => i !== index);
                                                        setDepartmentData(updatedDepartmentData);
                                                    }}>
                                                        <Trash2 className="w-5 h-5 text-red-500" />
                                                    </Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>)}


                            </div>
                        </div>) : (<SearchableInput
                            dbCall={searchFacilities}
                            onSelect={(item) => {
                                setUserData((prev) => ({
                                    ...prev,
                                    hospital_id: item.id,
                                }));
                                setFacilityData((prev) => ({ ...prev, id: item.id }));
                            }}
                            selected={facilityData}
                            isCreationAllowed={true}
                            createSearchType={() =>
                                setIsCreatingFacility(true)

                            }
                            placeholder="Search for a facility..."
                            getLabel={(item) => item.name}
                            clearOnSelect={false}
                        />)}


                    </div>
                )

            case 4:
                return (
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-trust-green/10 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-10 h-10 text-trust-green" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold text-balance">You're All Set!</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                                Welcome to the MedRef network! You can now start making referrals and help improve
                                patient outcomes across our healthcare system.
                            </p>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    useEffect(() => {
        if (currentStep === steps.length) {
            handleSubmit();
        }
    }, [currentStep]);

    useEffect(() => {
        if (user) {
            setUserData((prev) => ({
                ...prev,
                name: user.fullName || "",
            }))
        }
    }, [user]);

    return (
        <div className="max-h-screen bg-background overflow-y-scroll">
            {/* Header */}
            <header className="sticky top-0 border-b bg-card/50 backdrop-blur-sm z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-medical-blue rounded-lg flex items-center justify-center">
                                <Hospital className="w-5 h-5 text-medical-blue-foreground" />
                            </div>
                            <span className="text-xl font-semibold text-foreground">MedRef</span>
                        </div>
                        <Badge variant="secondary">
                            Step {currentStep} of {steps.length}
                        </Badge>
                    </div>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="border-b bg-muted/30">
                <div className="container mx-auto px-4 py-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Setup Progress</span>
                            <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <Card className="border-2">
                        <CardContent className="space-y-6">
                            {renderStepContent()}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between pt-6 border-t">
                                <Button
                                    variant="outline"
                                    onClick={handlePrevious}
                                    disabled={currentStep === 1}
                                    className="flex items-center gap-2 bg-transparent"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Previous
                                </Button>

                                {currentStep === steps.length ? (
                                    <Button asChild className="flex items-center gap-2" disabled={isSubmitting}>
                                        <Link href="/dashboard">
                                            {isSubmitting ? <LoaderCircle className="w-5 h-5 animate-spin mx-auto" /> : <>Go to Dashboard
                                                <ArrowRight className="w-4 h-4" /></>}

                                        </Link>
                                    </Button>
                                ) : (
                                    <Button onClick={handleNext} className="flex items-center gap-2">
                                        Next
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
