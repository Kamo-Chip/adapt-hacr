"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { User, Phone, FileText, Upload, CalendarIcon, Shield, Search, X, CheckCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createReferral, fetchHospitals, findOptimalHospital, validHospitalSelection, saveDraft } from "@/utils/db/client"
import { DEPARTMENTS } from "@/app/onboard/page"
import Loading from "@/components/loading"
import { useUser } from "@clerk/nextjs"
import { createClient } from "@/utils/supabase/client";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import toast from "react-hot-toast"

const urgencyLevels = [
    { value: "high", label: "High Priority", color: "red-500", description: "Immediate attention required" },
    { value: "medium", label: "Medium Priority", color: "amber-500", description: "Urgent but not critical" },
    { value: "low", label: "Low Priority", color: "green-500", description: "Routine referral" },
]

export default function CreateReferralPage() {

    const { user } = useUser();

    const [date, setDate] = useState()
    const [documents, setDocuments] = useState([])
    const [selectedHospital, setSelectedHospital] = useState("")
    const [referralType, setReferralType] = useState("general")
    const [loading, setLoading] = useState(true)
    const [hospitals, setHospitals] = useState([])
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        patientName: "",
        whatsappNumber: "",
        gender: "",
        medicalCondition: "",
        department: "",
        urgency: "",
        reasonForReferral: "",
        currentTreatment: "",
        medicalConsent: true,
        whatsappConsent: true,
        preferredDate: null,
        allergies: "",
        medications: "",
    })

    const [errors, setErrors] = useState({})

    const resetForm = () => {
        setDate(null);
        setDocuments([]);
        setSelectedHospital("");
        setReferralType("general");

        setFormData({
            patientName: "",
            whatsappNumber: "",
            gender: "",
            emergencyContact: "",
            medicalCondition: "",
            department: "",
            urgency: "",
            reasonForReferral: "",
            currentTreatment: "",
            medicalConsent: true,
            whatsappConsent: true,
            preferredDate: null,
            allergies: "",
            medications: "",
        });

        setErrors({});
    };

    useEffect(() => {
        const loadDraft = async () => {
            try {
                const supabase = createClient();
                const { data } = await supabase
                    .from("draft_referrals")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("status", "draft")
                    .single();

                if (data) {
                    setFormData(data.data);
                    setDocuments(data.documents || []);
                    setReferralType(data.referralType);
                }
            } catch (err) {
                console.error("Error loading draft:", err);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) loadDraft();
    }, [user]);

    useEffect(() => {
        if (!user?.id) return;

        const loadHospitals = async () => {
            try {
                const data = await fetchHospitals(user.id)
                console.log(data)
                setHospitals(data)
            } catch (err) {
                console.log(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadHospitals()
    }, [user])

    const phoneRegex = /^\+?\d{9,15}$/

    const validateField = (field, value) => {
        switch (field) {
            case "patientName":
                return value.trim() === "" ? "Required" : ""
            case "whatsappNumber":
                return !phoneRegex.test(value) ? "Invalid phone number" : ""
            case "medicalCondition":
            case "reasonForReferral":
                return value.trim() === "" ? "Required" : ""
            case "department":
            case "urgency":
                return value === "" ? "Required" : ""
            case "medicalConsent":
            case "whatsappConsent":
                return value !== true ? "Required" : ""
            case "selectedHospital":
                return referralType === "specific" && value === "" ? "Required" : ""
            default:
                return ""
        }
    }

    const handleInputChangeValidated = (field, valueOrEvent) => {
        const value = valueOrEvent?.target ? valueOrEvent.target.value : valueOrEvent
        setFormData((prev) => ({ ...prev, [field]: value }))
        setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }))
    }

    const handlePhoneChange = (field, e) => {
        let value = e.target.value
        value = value.replace(/[^\d+]/g, "")
        setFormData((prev) => ({ ...prev, [field]: value }))
        setErrors((prev) => ({
            ...prev,
            [field]: !phoneRegex.test(value) ? "Invalid phone number" : ""
        }))
    }


    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files || [])
        setDocuments((prev) => [...prev, ...files])
    }

    const removeDocument = (index) => {
        setDocuments((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (!user?.id) {
            toast.error("User not authenticated");
            return;
        }

        setSubmitting(true); // Start loading

        try {
            let chosenHospital = selectedHospital;

            if (referralType === "specific") {
                const result = await validHospitalSelection(selectedHospital, formData.department);
                if (!result.isValid) {
                    toast.error(
                        !result.hasDepartment
                            ? "Selected hospital does not have this department."
                            : "No capacity available in the selected department."
                    );
                    return;
                }
            } else {
                const hospital = await findOptimalHospital(user.id, formData.department);
                if (!hospital.success) {
                    toast.error(hospital.message);
                    return;
                }
                chosenHospital = hospital.data;
            }

            const submissionData = { ...formData, preferredDate: date };

            const supabase = createClient();
            await supabase
                .from("draft_referrals")
                .delete()
                .eq("user_id", user.id);

            await createReferral(submissionData, documents, chosenHospital, referralType, user.id);
            toast.success("Referral submitted successfully!");
            await fetch(`/api/notify`, {
                method: "POST",
                body: JSON.stringify({
                    to: formData.whatsappNumber,
                    name: formData.patientName,
                    dateStr: date.toLocaleDateString(),
                    type: "initial",
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            resetForm();
        } catch (err) {
            console.error(err);
            toast.error(err?.message || err?.error?.message || "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!user?.id) return toast.error("User not authenticated");

        try {
            setSubmitting(true);
            const result = await saveDraft(formData, documents, referralType, user.id);
            if (result.success) toast.success("Draft saved successfully!");
            else toast.error("Failed to save draft");
        } catch (err) {
            console.error(err);
            toast.error("Error saving draft");
        } finally {
            setSubmitting(false);
        }
    };



    const isFormValid = () => {
        return (
            formData.patientName &&
            phoneRegex.test(formData.whatsappNumber) &&
            formData.medicalCondition &&
            formData.department &&
            formData.urgency &&
            formData.reasonForReferral &&
            (referralType === "general" || selectedHospital != "")
        )
    }

    if (loading) return <Loading />

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background">
                <div className="border-b bg-card/50 backdrop-blur-sm">
                    <div className="container mx-auto px-4 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-medical-blue/10 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-medical-blue" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-foreground">Create Referral</h1>
                                    <p className="text-muted-foreground mt-1">Submit a new patient referral request</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" onClick={handleSaveDraft} disabled={submitting}>
                                    Save Draft
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={handleSubmit}
                                    disabled={!isFormValid() || submitting}
                                    className="bg-medical-blue hover:bg-medical-blue/90"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Submit Referral
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Patient Information
                            </CardTitle>
                            <CardDescription>Basic patient details and contact information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="patientName">Patient Full Name *</Label>
                                    <div className="relative">
                                        <Input
                                            id="patientName"
                                            value={formData.patientName}
                                            onChange={(e) => handleInputChangeValidated("patientName", e)}
                                            placeholder="Enter patient's full name"
                                            className={cn(
                                                errors.patientName && "border-red-500 focus:border-red-500 focus:ring-red-500"
                                            )}
                                        />
                                        {errors.patientName && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{errors.patientName}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>

                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="whatsappNumber">Phone number *</Label>
                                    <div className="relative flex">
                                        <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                                            <Phone className="w-4 h-4 text-trust-green" />
                                        </div>
                                        <Input
                                            id="whatsappNumber"
                                            value={formData.whatsappNumber}
                                            onChange={(e) => handlePhoneChange("whatsappNumber", e)}
                                            placeholder="+27607001234"
                                            className={cn(
                                                "rounded-l-none transition-all duration-200 focus:outline-none focus:ring-4 w-fit",
                                                errors.whatsappNumber
                                                    ? "border-red-500 focus:ring-red-400"
                                                    : "border-gray-300 focus:ring-medical-blue"
                                            )}
                                        />
                                        {errors.whatsappNumber && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{errors.whatsappNumber}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Sex</Label>
                                    <Select value={formData.gender} onValueChange={(value) => handleInputChangeValidated("gender", value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select sex" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>


                    {/* Medical Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Medical Information
                            </CardTitle>
                            <CardDescription>Medical condition and referral details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="department">Medical Department *</Label>
                                    <div className="relative">
                                        <Select value={formData.department} onValueChange={(value) => handleInputChangeValidated("department", value)}>
                                            <SelectTrigger className={errors.department ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}>
                                                <SelectValue placeholder="Select department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DEPARTMENTS.map((dept, idx) => (
                                                    <SelectItem key={idx} value={dept.value}>
                                                        {dept.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.department && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{errors.department}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="urgency">Urgency Level *</Label>
                                    <div className="relative">
                                        <Select value={formData.urgency} onValueChange={(value) => handleInputChangeValidated("urgency", value)}>
                                            <SelectTrigger className={errors.urgency ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}>
                                                <SelectValue placeholder="Select urgency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {urgencyLevels.map((level) => (
                                                    <SelectItem key={level.value} value={level.value}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(`w-2 h-2 rounded-full bg-${level.color}`)} />
                                                            <span>{level.label}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.urgency && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{errors.urgency}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="medicalCondition">Medical Condition *</Label>
                                <div className="relative">
                                    <Textarea
                                        id="medicalCondition"
                                        value={formData.medicalCondition}
                                        onChange={(e) => handleInputChangeValidated("medicalCondition", e)}
                                        placeholder="Describe the patient's medical condition"
                                        rows={3}
                                        className={errors.medicalCondition ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                                    />
                                    {errors.medicalCondition && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{errors.medicalCondition}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reasonForReferral">Reason for Referral *</Label>
                                <div className="relative">
                                    <Textarea
                                        id="reasonForReferral"
                                        value={formData.reasonForReferral}
                                        onChange={(e) => handleInputChangeValidated("reasonForReferral", e)}
                                        placeholder="Why is this referral necessary?"
                                        rows={3}
                                        className={errors.reasonForReferral ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                                    />
                                    {errors.reasonForReferral && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{errors.reasonForReferral}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="allergies">Known Allergies</Label>
                                    <Textarea
                                        id="allergies"
                                        value={formData.allergies}
                                        onChange={(e) => handleInputChangeValidated("allergies", e)}
                                        placeholder="List any known allergies"
                                        rows={2}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="medications">Current Medications</Label>
                                    <Textarea
                                        id="medications"
                                        value={formData.medications}
                                        onChange={(e) => handleInputChangeValidated("medications", e)}
                                        placeholder="List current medications"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Document Upload */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                Medical Documents
                            </CardTitle>
                            <CardDescription>Upload medical reports, X-rays, and other relevant documents</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Upload Medical Documents</p>
                                    <p className="text-xs text-muted-foreground">Drag and drop files here, or click to browse</p>
                                    <p className="text-xs text-muted-foreground">
                                        Supported formats: PDF, JPG, PNG, DICOM (Max 10MB per file)
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png,.dicom"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>

                            {documents.length > 0 && (
                                <div className="space-y-3">
                                    <Label>Uploaded Documents</Label>
                                    {documents.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeDocument(index)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Hospital Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="w-5 h-5" />
                                Hospital Selection
                            </CardTitle>
                            <CardDescription>Choose referral type and destination hospital</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <Label>Referral Type</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card
                                        className={cn(
                                            "cursor-pointer border-2 transition-colors",
                                            referralType === "general" ? "border-medical-blue bg-medical-blue/5" : "border-muted",
                                        )}
                                        onClick={() => setReferralType("general")}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        "w-4 h-4 rounded-full border-2",
                                                        referralType === "general"
                                                            ? "border-medical-blue bg-medical-blue"
                                                            : "border-muted-foreground",
                                                    )}
                                                />
                                                <div>
                                                    <p className="font-medium">General Referral</p>
                                                    <p className="text-sm text-muted-foreground">System finds best available hospital</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card
                                        className={cn(
                                            "cursor-pointer border-2 transition-colors",
                                            referralType === "specific" ? "border-medical-blue bg-medical-blue/5" : "border-muted",
                                        )}
                                        onClick={() => setReferralType("specific")}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        "w-4 h-4 rounded-full border-2",
                                                        referralType === "specific"
                                                            ? "border-medical-blue bg-medical-blue"
                                                            : "border-muted-foreground",
                                                    )}
                                                />
                                                <div>
                                                    <p className="font-medium">Specific Hospital</p>
                                                    <p className="text-sm text-muted-foreground">Choose a particular hospital</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {referralType === "specific" && (
                                <div className="space-y-2">
                                    <Label htmlFor="hospital">Select Hospital</Label>
                                    <Select value={selectedHospital} onValueChange={setSelectedHospital}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a hospital" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {hospitals?.map((hospital, idx) => (
                                                <SelectItem key={idx} value={hospital.id}>{hospital.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Preferences and Consent */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Preferences & Consent
                            </CardTitle>
                            <CardDescription>Patient preferences and required consent forms</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Preferred Referral Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : "Select preferred date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            disabled={(date) => date < new Date()}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <Checkbox
                                        id="medicalConsent"
                                        checked={formData.medicalConsent}
                                        onCheckedChange={(checked) => handleInputChangeValidated("medicalConsent", checked)}
                                    />
                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="medicalConsent"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Medical Information Consent *
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Patient consents to sharing medical information with the receiving hospital for treatment purposes.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <Checkbox
                                        id="whatsappConsent"
                                        checked={formData.whatsappConsent}
                                        onCheckedChange={(checked) => handleInputChangeValidated("whatsappConsent", checked)}
                                    />
                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="whatsappConsent"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            WhatsApp Communication Consent *
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Patient consents to receiving referral updates and appointment notifications via WhatsApp.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Section */}
                    <Card className="border-2 border-medical-blue/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold">Ready to Submit Referral?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Please review all information before submitting. You'll receive a confirmation once processed.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" onClick={handleSaveDraft} disabled={submitting}>
                                        Save Draft
                                    </Button>

                                    <Button
                                        size="lg"
                                        onClick={handleSubmit}
                                        disabled={!isFormValid() || submitting}
                                        className="bg-medical-blue hover:bg-medical-blue/90"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Submit Referral
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TooltipProvider>
    )
}
