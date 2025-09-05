"use client"

import Loading from "@/components/loading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    approveReferral,
    cancelReferral, // NOTE: currently sets status back to "pending" in your code
    completeReferral,
    getApprovedReferrals,
    getGeneralReferrals,
    getHospitalById,
    getMyReferrals,
    getSpecificReferrals, // NOTE: updates ALL pending referrals assigned to this clerk_id   // NOTE: updates ALL pending assigned to this clerk_id
    rejectReferral,
    userHospitalId,
} from "@/utils/db/client.js"
import { useUser } from "@clerk/nextjs"
import clsx from "clsx"
import { format } from "date-fns/format"
import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    FileText,
    Hospital,
    Loader2,
    MapPin,
    MessageSquare,
    Phone,
    User,
    XCircle
} from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

export default function ReferralManagePage() {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useUser();
    const [hospitalId, setHospitalId] = useState(null);
    const [buttonLoading, setButtonLoading] = useState({});

    const loadReferrals = async () => {
        setLoading(true);
        setError(null);
        try {
            const [specRes, genRes, myRes, manRes] = await Promise.allSettled([
                getSpecificReferrals(user.id),
                getGeneralReferrals(user.id),
                getMyReferrals(user.id),
                getApprovedReferrals(user.id),
            ]);

            const mergedMap = new Map();
            [...(specRes?.value ?? []), ...(genRes?.value ?? []), ...(myRes?.value ?? []), ...(manRes?.value ?? [])].forEach(r => r && mergedMap.set(r.id, r));
            const merged = Array.from(mergedMap.values()).sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );
            console.log("Loaded referrals:", merged);
            setReferrals(merged);
        } catch (e) {
            setError(e instanceof Error ? e : new Error("Unknown error"));
            console.error("Failed to load referrals:", e);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---------------------------------------------------------------

    /** Approves referrals assigned to this clerk (server fn is bulk by clerkId) */
    const onApprove = async (id) => {
        console.log("[onApprove] Called with id:", id);
        if (!user?.id || !id) return toast.error("User not authenticated or no referral selected.");
        setLoading(true);
        setError(null);

        const loadingKey = `${id}_approve`;
        setButtonLoading((prev) => ({ ...prev, [loadingKey]: true }));
        try {
            const result = await approveReferral(id, user.id);
            // get hospital by id
            const hospital = await getHospitalById(result.to_hospital_id);

            await fetch(`/api/notify`, {
                method: "POST",
                body: JSON.stringify({
                    to: result.patient_phone_number,
                    name: result.patient_name,
                    dateStr: result.preferred_referral_date,
                    hospital_name: hospital.name,
                    hospital_address_line1: hospital.address_line1,
                    hospital_city: hospital.city,
                    type: "confirmed",
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            await loadReferrals();
            toast.success("Referral accepted.");
        } catch (e) {
            setError(e instanceof Error ? e : new Error("Unknown error"));
            toast.error("Failed to accept referral: " + (e.message || "Unknown error"));
            console.error("Error in onApprove:", e);
        } finally {
            setButtonLoading((prev) => ({ ...prev, [loadingKey]: false }));
            setLoading(false);
        }
    };

    const onReject = async (id) => {
        if (!user?.id || !id) return toast.error("User not authenticated or no referral selected.");

        setLoading(true);
        setError(null);

        const loadingKey = `${id}_reject`;
        setButtonLoading((prev) => ({ ...prev, [loadingKey]: true }));
        console.log("Attempting to reject referral:", id, "by user:", user.id);
        try {
            const result = await rejectReferral(id, user.id);

            await loadReferrals();
            toast.success("Referral rejected.");
        } catch (e) {
            setError(e instanceof Error ? e : new Error("Unknown error"));
            toast.error("Failed to reject referral: " + (e.message || "Unknown error"));
        } finally {
            setButtonLoading((prev) => ({ ...prev, [loadingKey]: false }));
            setLoading(false);
        }
    };

    const onComplete = async (id) => {
        if (!user?.id || !id) return toast.error("User not authenticated or no referral selected.");
        setLoading(true);
        setError(null);

        const loadingKey = `${id}_complete`;
        setButtonLoading((prev) => ({ ...prev, [loadingKey]: true }));
        console.log("Attempting to complete referral:", id, "by user:", user.id);
        try {
            const result = await completeReferral(id, user.id);
            if (result) {
                await fetch(`/api/notify`, {
                    method: "POST",
                    body: JSON.stringify({
                        to: result.patient_phone_number,
                        name: result.patient_name,
                        dateStr: result.preferred_referral_date,
                        type: "completed",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                await loadReferrals();
                toast.success("Referral marked as complete.");
            } else {
                toast.error("Failed to complete referral");
            }

        } catch (e) {
            setError(e instanceof Error ? e : new Error("Unknown error"));
            console.error("Error in onComplete:", e);
        } finally {
            setButtonLoading((prev) => ({ ...prev, [loadingKey]: false }));
            setLoading(false);
        }
    };

    const onCancel = async (id) => {

        if (!user?.id || !id) return toast.error("User not authenticated or no referral selected.");
        setLoading(true);
        setError(null);

        const loadingKey = `${id}_cancel`;
        setButtonLoading((prev) => ({ ...prev, [loadingKey]: true }));
        console.log("Attempting to cancel referral:", id, "by user:", user.id);
        try {
            const result = await cancelReferral(id, user.id);

            await loadReferrals();
            toast.success("Referral marked as cancelled.");
        } catch (e) {
            setError(e instanceof Error ? e : new Error("Unknown error"));
            toast.error("Failed to cancel referral");
        } finally {
            setButtonLoading((prev) => ({ ...prev, [loadingKey]: false }));
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchHospital = async () => {
            const id = await userHospitalId(user?.id);
            setHospitalId(id);
        };
        if (user?.id) fetchHospital();
    }, [user?.id]);

    // --- Render (minimal placeholder) -----------------------------------------

    const specificReferrals = referrals.filter((r) => r.referral_type === "specific" && r.status === "pending" && r.to_hospital_id === hospitalId);
    const generalReferrals = referrals.filter((r) => r.referral_type === "general" && r.status === "pending" && r.to_hospital_id === hospitalId);
    const myReferrals = referrals.filter((r) => r.created_by_user_id === user?.id);
    const manageReferrals = referrals.filter((r) => r.status === "approved" && r.to_hospital_id === hospitalId);

    useEffect(() => {
        if (!user) return;
        loadReferrals();
    }, [user]);

    if (loading && referrals.length === 0) return <Loading />;
    if (error) return <p>Failed to load referrals.</p>;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-medical-blue/10 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-medical-blue" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">Referral Management</h1>
                                <p className="text-muted-foreground mt-1">Review and manage incoming patient referrals</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-sm">
                                {referrals.filter((r) => r.status === "pending").length} Pending
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                                {referrals.filter((r) => r.status === "approved").length} Accepted
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <Tabs defaultValue="specific" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="specific" className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Specific Referrals ({specificReferrals.length})
                        </TabsTrigger>
                        <TabsTrigger value="general" className="flex items-center gap-2">
                            <Hospital className="w-4 h-4" />
                            General Referrals ({generalReferrals.length})
                        </TabsTrigger>
                        <TabsTrigger value="my_referrals" className="flex items-center gap-2">
                            <Hospital className="w-4 h-4" />
                            Manage My Referrals ({myReferrals.length})
                        </TabsTrigger>
                        <TabsTrigger value="manage_referrals" className="flex items-center gap-2">
                            <Hospital className="w-4 h-4" />
                            Manage Approved Referrals ({manageReferrals.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="specific" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Specific Referrals</CardTitle>
                                <CardDescription>Referrals specifically requesting your hospital for treatment</CardDescription>
                            </CardHeader>
                        </Card>

                        <div className="space-y-4">
                            {specificReferrals.map((referral) => (
                                <ReferralCard key={referral.id} referral={referral} type="specific" onApprove={() => onApprove(referral.id)} onReject={() => onReject(referral.id)} buttonLoading={buttonLoading} />
                            ))}
                            {specificReferrals.length === 0 && (
                                <Card className="border-2 border-dashed">
                                    <CardContent className="p-12 text-center">
                                        <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No specific referrals</h3>
                                        <p className="text-muted-foreground">
                                            {"You don't have any referrals specifically requesting your hospital at the moment."}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="general" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>General Referrals</CardTitle>
                                <CardDescription>
                                    Referrals matched to your hospital by the system based on capacity and specialization
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <div className="space-y-4">
                            {generalReferrals.map((referral) => (
                                <ReferralCard key={referral.id} referral={referral} type="general" onApprove={() => onApprove(referral.id)} onReject={() => onReject(referral.id)} buttonLoading={buttonLoading} />
                            ))}
                            {generalReferrals.length === 0 && (
                                <Card className="border-2 border-dashed">
                                    <CardContent className="p-12 text-center">
                                        <Hospital className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No general referrals</h3>
                                        <p className="text-muted-foreground">
                                            No referrals have been automatically matched to your hospital at the moment.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="my_referrals" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Manage My Referrals</CardTitle>
                                <CardDescription>See Progress on referrals you sent out to other hospitals</CardDescription>
                            </CardHeader>
                        </Card>

                        <div className="space-y-4">
                            {myReferrals.map((referral) => (
                                <ReferralCard key={referral.id} referral={referral} type="my_referrals" onCancel={() => onCancel(referral.id)} buttonLoading={buttonLoading} />
                            ))}
                            {myReferrals.length === 0 && (
                                <Card className="border-2 border-dashed">
                                    <CardContent className="p-12 text-center">
                                        <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No referrals sent</h3>
                                        <p className="text-muted-foreground">
                                            {"You don't have any referrals specifically requesting your hospital at the moment."}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="manage_referrals" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Manage Referrals</CardTitle>
                                <CardDescription>Manage the referrals you have accepted</CardDescription>
                            </CardHeader>
                        </Card>

                        <div className="space-y-4">
                            {manageReferrals.map((referral) => (
                                <ReferralCard key={referral.id} referral={referral} type="manage_referrals" onComplete={() => onComplete(referral.id)} buttonLoading={buttonLoading} />
                            ))}
                            {manageReferrals.length === 0 && (
                                <Card className="border-2 border-dashed">
                                    <CardContent className="p-12 text-center">
                                        <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No referrals accepted yet.</h3>
                                        <p className="text-muted-foreground">
                                            {"You don't have any referrals specifically requesting your hospital at the moment."}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}


const ReferralCard = ({ referral, type, onApprove, onReject, onComplete, onCancel, buttonLoading = {} }) => {
    const approveLoading = buttonLoading[`${referral.id}_approve`];
    const rejectLoading = buttonLoading[`${referral.id}_reject`];
    const completeLoading = buttonLoading[`${referral.id}_complete`];
    const cancelLoading = buttonLoading[`${referral.id}_cancel`];
    return (
        <Card className="border-2 hover:border-medical-blue/20 transition-colors">
            <CardContent>
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">

                        <div className="flex items-center gap-3">
                            <Badge
                                className={clsx({
                                    "bg-urgent-red/10 text-urgent-red border-urgent-red/20": referral.urgency === "high",
                                    "bg-warning-amber/10 text-warning-amber border-warning-amber/20": referral.urgency === "medium",
                                    "bg-trust-green/10 text-trust-green border-trust-green/20": referral.urgency === "low",
                                    "muted": !["high", "medium", "low"].includes(referral.urgency),
                                })}
                            >
                                {referral.urgency} priority
                            </Badge>
                            <Badge
                                className={clsx({
                                    "bg-urgent-red/10 text-urgent-red border-urgent-red/20": referral.status === "rejected",
                                    "bg-warning-amber/10 text-warning-amber border-warning-amber/20": referral.status === "pending",
                                    "bg-trust-green/10 text-trust-green border-trust-green/20": referral.status === "approved",
                                    "bg-medical-blue/10 text-medical-blue border-medical-blue/20": referral.status === "completed",
                                    "muted": referral.status !== "pending" && referral.status !== "approved" && referral.status !== "rejected" && referral.status !== "completed",
                                })}
                            >
                                {referral.status}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Time submitted: {format(new Date(referral.created_at), "MMM dd, yyyy 'at' HH:mm")}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>Preferred Consultation Date: {format(new Date(referral.preferred_referral_date), "dd MMM")}</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Summary */}
                    <Card className="bg-medical-blue/5 border-medical-blue/20">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-medical-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <MessageSquare className="w-4 h-4 text-medical-blue" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-medical-blue">AI Summary</p>
                                    <p className="text-sm text-foreground">{referral.ai_summary}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Patient & Referring Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">Patient Information</span>
                            </div>
                            <div className="space-y-1 text-sm">
                                <p>
                                    <span className="font-medium">{referral.patient_name}</span> (
                                    {referral.patient_gender})
                                </p>
                                <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    <span>{referral.patient_phone_number}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Hospital className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">Referring Hospital</span>
                            </div>
                            <div className="space-y-1 text-sm">
                                <p className="font-medium">{referral.from_hospital_id.name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Medical Information */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">Medical Information</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="font-medium">Condition: </span>
                                    <span>{referral.condition_description}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Department: </span>
                                    <Badge variant="outline">{referral.department}</Badge>
                                </div>
                                {referral.known_allergies && (
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-urgent-red" />
                                        <span className="font-medium">Allergies: </span>
                                        <span className="text-urgent-red">{referral.known_allergies}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Documents */}
                        {referral.document_urls.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">Medical Documents ({referral.document_urls.length})</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {referral.document_urls.map((doc, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 border rounded w-full">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{`File ${index + 1}`}</p>
                                                    <p className="text-xs text-muted-foreground">{doc.size}</p>
                                                </div>
                                            </div>
                                            <Button asChild>
                                                <a href={doc} target="_blank" rel="noopener noreferrer" download>
                                                    <Download className="w-5 h-5" />
                                                </a>
                                            </Button>

                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>



                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">

                        <div className="flex items-center gap-2 ml-auto">
                            {(type === "specific" || type === "general") && referral.status === "pending" && (
                                <>
                                    <Button variant="destructive" onClick={onReject} disabled={rejectLoading} >
                                        {rejectLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        {rejectLoading ? "Rejecting..." : "Reject Referral"}
                                    </Button>

                                    <Button
                                        onClick={onApprove}
                                        className="bg-trust-green hover:bg-trust-green/90 text-trust-green-foreground"
                                        disabled={approveLoading}
                                    >
                                        {approveLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                        {approveLoading ? "Accepting..." : "Accept Referral"}
                                    </Button>
                                </>
                            )}

                            {type === "my_referrals" && referral.status === "pending" && (
                                <Button
                                    onClick={onCancel}
                                    className="bg-orange-500 hover:bg-orange-600 text-white"
                                    disabled={cancelLoading}
                                >
                                    {cancelLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                    {cancelLoading ? "Cancelling..." : "Cancel Referral"}
                                </Button>
                            )}

                            {type === "manage_referrals" && referral.status === "approved" && (
                                <Button
                                    onClick={onComplete}
                                    className="bg-medical-blue hover:bg-medical-blue/90"
                                    disabled={completeLoading}
                                >
                                    {completeLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    {completeLoading ? "Completing..." : "Mark Complete"}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card >);
}