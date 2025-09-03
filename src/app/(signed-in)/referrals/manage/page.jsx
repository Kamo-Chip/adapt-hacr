"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  FileText,
  User,
  Calendar,
  Clock,
  Phone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  MessageSquare,
  Hospital,
  MapPin,
} from "lucide-react"
import { format } from "date-fns"
import {
  getSpecificReferrals,
  getGeneralReferrals,
  approveReferral,          // NOTE: updates ALL pending referrals assigned to this clerk_id   // NOTE: updates ALL pending assigned to this clerk_id
  rejectReferral,    // NOTE: currently sets status back to "pending" in your code
  completeReferral,          // NOTE: updates ALL approved assigned to this clerk_id
} from "@/utils/db/client.js"  

/** @typedef {import("../types").Referral} Referral */
/** @typedef {import("../types").User} User */
/** @typedef {import("../types").Hospital} Hospital */
/** @typedef {import("../types").ReferralDocument} ReferralDocument */

// Mock referral data - in real app this would come from API
// const referrals = [
//   {
//     id: "REF-2024-001234",
//     type: "specific",
//     status: "pending",
//     urgency: "high",
//     patient: {
//       name: "John Doe",
//       id: "P-2024-001",
//       phone: "+254-700-123-456",
//       whatsapp: "+254-700-123-456",
//       age: 45,
//       gender: "male",
//     },
//     referring: {
//       hospital: "South Africatta National Hospital",
//       doctor: "Dr. Sarah Johnson",
//       department: "Emergency Medicine",
//     },
//     medical: {
//       condition: "Acute myocardial infarction with ST elevation",
//       department: "Cardiology",
//       summary:
//         "45-year-old male presenting with severe chest pain, elevated troponins, and ST elevation on ECG. Requires immediate cardiac catheterization and possible PCI.",
//       allergies: "Penicillin",
//       medications: "Aspirin 75mg, Atorvastatin 40mg",
//       notes: "Patient is stable but requires urgent intervention. Family history of CAD.",
//     },
//     documents: [
//       { name: "ECG_Report.pdf", type: "medical_report", size: "2.3 MB" },
//       { name: "Lab_Results.pdf", type: "lab_result", size: "1.8 MB" },
//       { name: "Chest_Xray.jpg", type: "xray", size: "4.2 MB" },
//     ],
//     createdAt: new Date("2024-01-15T10:30:00"),
//     preferredDate: new Date("2024-01-15T14:00:00"),
//     aiSummary:
//       "Critical cardiac case requiring immediate intervention. Patient presents with classic STEMI symptoms and requires emergency cardiac catheterization within 90 minutes for optimal outcomes.",
//   },
//   {
//     id: "REF-2024-001235",
//     type: "general",
//     status: "pending",
//     urgency: "medium",
//     patient: {
//       name: "Jane Smith",
//       id: "P-2024-002",
//       phone: "+254-700-234-567",
//       whatsapp: "+254-700-234-567",
//       age: 32,
//       gender: "female",
//     },
//     referring: {
//       hospital: "Nairobi Hospital",
//       doctor: "Dr. Michael Chen",
//       department: "Internal Medicine",
//     },
//     medical: {
//       condition: "Chronic headaches with neurological symptoms",
//       department: "Neurology",
//       summary:
//         "32-year-old female with 3-month history of progressive headaches, visual disturbances, and occasional numbness in left arm. MRI shows possible space-occupying lesion.",
//       allergies: "None known",
//       medications: "Ibuprofen 400mg PRN",
//       notes: "Patient anxious about symptoms. Requires neurological evaluation and possible advanced imaging.",
//     },
//     documents: [
//       { name: "MRI_Brain.pdf", type: "medical_report", size: "8.5 MB" },
//       { name: "Neurological_Exam.pdf", type: "medical_report", size: "1.2 MB" },
//     ],
//     createdAt: new Date("2024-01-15T09:15:00"),
//     preferredDate: new Date("2024-01-16T10:00:00"),
//     aiSummary:
//       "Neurological case requiring specialist evaluation. Progressive symptoms with imaging findings suggest need for comprehensive neurological workup and possible neurosurgical consultation.",
//   },
//   {
//     id: "REF-2024-001236",
//     type: "specific",
//     status: "accepted",
//     urgency: "low",
//     patient: {
//       name: "Michael Johnson",
//       id: "P-2024-003",
//       phone: "+254-700-345-678",
//       whatsapp: "+254-700-345-678",
//       age: 28,
//       gender: "male",
//     },
//     referring: {
//       hospital: "Mater Hospital",
//       doctor: "Dr. Emily Rodriguez",
//       department: "Orthopedics",
//     },
//     medical: {
//       condition: "Chronic knee pain following sports injury",
//       department: "Orthopedics",
//       summary:
//         "28-year-old athlete with persistent knee pain 6 months post-injury. Conservative treatment failed. MRI shows meniscal tear requiring arthroscopic repair.",
//       allergies: "None",
//       medications: "Naproxen 500mg BD",
//       notes: "Patient is motivated for surgery and rehabilitation. Good candidate for arthroscopic procedure.",
//     },
//     documents: [
//       { name: "Knee_MRI.pdf", type: "medical_report", size: "6.1 MB" },
//       { name: "Physical_Therapy_Notes.pdf", type: "medical_report", size: "0.8 MB" },
//     ],
//     createdAt: new Date("2024-01-14T16:45:00"),
//     preferredDate: new Date("2024-01-18T08:00:00"),
//     acceptedAt: new Date("2024-01-15T08:30:00"),
//     aiSummary:
//       "Elective orthopedic case for arthroscopic knee surgery. Well-documented case with clear surgical indication and good patient compliance expected.",
//   },
// ]

export default function ReferralManagePage({clerkId}) {
  const [referrals, setReferrals] = useState(/** @type {Referral[]} */([]));
  const [selectedReferral, setSelectedReferral] = useState(/** @type {Referral|null} */(null));
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {(Error|PostgrestError|null)} */(null));

  const loadReferrals = useCallback(async () => {
    if (!clerkId) return;
    setLoading(true);
    setError(null);
    try {
      const [specRes, genRes] = await Promise.allSettled([
        getSpecificReferrals(clerkId),
        getGeneralReferrals(clerkId),
      ]);

      /** @type {Referral[]} */
      const specific = specRes.status === "completed" ? (specRes.value ?? []) : [];
      /** @type {Referral[]} */
      const general  = genRes.status === "completed" ? (genRes.value ?? []) : [];

      // merge, dedupe by id, newest first
      const mergedMap = new Map();
      [...specific, ...general].forEach(r => r && mergedMap.set(r.id, r));
      const merged = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setReferrals(merged);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [clerkId]);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  // --- Actions ---------------------------------------------------------------

  /** Approves referrals assigned to this clerk (server fn is bulk by clerkId) */
  const handleAcceptReferral = async (referralId) => {
    try {
      setLoading(true);
      setError(null);

      // ⚠️ ApproveReferrals(clerkId) approves ALL pending assigned to this clerk, not just referralId
      await approveReferral(clerkId);

      // refresh list
      await loadReferrals();

      // clear selection if it matches
      setSelectedReferral(prev => (prev?.id === referralId ? null : prev));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  /** Rejects based on referral_type (also bulk by clerkId per your server fn) */
  const handleRejectReferral = async (referralId, reason) => {
    try {
      setLoading(true);
      setError(null);

      const ref = referrals.find(r => r.id === referralId);
      if (!ref) throw new Error("Referral not found in list");

      // Optional: stash reason somewhere (your API doesn't take it)
      // You could patch 'additional_notes' here via a separate update if desired.

      if (ref.referral_type === "specific") {
        await rejectSpecificReferral(clerkId);
      } else {
        await rejectGeneralReferral(clerkId); // NOTE: your impl sets status back to "pending"
      }

      await loadReferrals();
      setSelectedReferral(prev => (prev?.id === referralId ? null : prev));
      setRejectionReason("");
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  /** Completes referrals assigned to this clerk in "approved" state (bulk by clerkId) */
  const handleCompleteReferral = async (referralId) => {
    try {
      setLoading(true);
      setError(null);

      // ⚠️ completeReferral(clerkId) completes ALL approved assigned to this clerk
      await completeReferral(clerkId);

      await loadReferrals();
      setSelectedReferral(prev => (prev?.id === referralId ? null : prev));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // --- Render (minimal placeholder) -----------------------------------------
  if (loading && referrals.length === 0) return <p>Loading…</p>;
  if (error) return <p>Failed to load referrals.</p>;

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "high":
        return "urgent-red"
      case "medium":
        return "warning-amber"
      case "low":
        return "trust-green"
      default:
        return "muted"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning-amber"
      case "accepted":
        return "trust-green"
      case "rejected":
        return "urgent-red"
      case "completed":
        return "medical-blue"
      default:
        return "muted"
    }
  }

  const specificReferrals = referrals.filter((r) => r.type === "specific")
  const generalReferrals = referrals.filter((r) => r.type === "general")

  const ReferralCard = ({ referral }) => (
    <Card className="border-2 hover:border-medical-blue/20 transition-colors">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">{referral.id}</h3>
                <Badge
                  className={`bg-${getUrgencyColor(referral.urgency)}/10 text-${getUrgencyColor(referral.urgency)} border-${getUrgencyColor(referral.urgency)}/20`}
                >
                  {referral.urgency} priority
                </Badge>
                <Badge
                  className={`bg-${getStatusColor(referral.status)}/10 text-${getStatusColor(referral.status)} border-${getStatusColor(referral.status)}/20`}
                >
                  {referral.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{format(referral.createdAt, "MMM dd, yyyy 'at' HH:mm")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Preferred: {format(referral.preferredDate, "MMM dd, HH:mm")}</span>
                </div>
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
                  <p className="text-sm text-foreground">{referral.aiSummary}</p>
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
                  <span className="font-medium">{referral.patient.name}</span> ({referral.patient.age}y,{" "}
                  {referral.patient.gender})
                </p>
                <p>ID: {referral.patient.id}</p>
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{referral.patient.phone}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Hospital className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Referring Hospital</span>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{referral.referring.hospital}</p>
                <p>{referral.referring.doctor}</p>
                <p className="text-muted-foreground">{referral.referring.department}</p>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Medical Information</span>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Condition: </span>
                <span>{referral.medical.condition}</span>
              </div>
              <div>
                <span className="font-medium">Department: </span>
                <Badge variant="outline">{referral.medical.department}</Badge>
              </div>
              <div>
                <span className="font-medium">Summary: </span>
                <span>{referral.medical.summary}</span>
              </div>
              {referral.medical.allergies && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-urgent-red" />
                  <span className="font-medium">Allergies: </span>
                  <span className="text-urgent-red">{referral.medical.allergies}</span>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          {referral.documents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Medical Documents ({referral.documents.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {referral.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setSelectedReferral(referral)}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>

            <div className="flex items-center gap-2">
              {referral.status === "pending" && (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="text-destructive hover:text-destructive bg-transparent">
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject Referral</DialogTitle>
                        <DialogDescription>
                          Please provide a reason for rejecting this referral. This will be communicated to the
                          referring hospital.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reason">Rejection Reason</Label>
                          <Textarea
                            id="reason"
                            placeholder="Please explain why this referral cannot be accepted..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline">Cancel</Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              handleRejectReferral(referral.id, rejectionReason)
                              setRejectionReason("")
                            }}
                            disabled={!rejectionReason.trim()}
                          >
                            Reject Referral
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    onClick={() => handleAcceptReferral(referral.id)}
                    className="bg-trust-green hover:bg-trust-green/90 text-trust-green-foreground"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Referral
                  </Button>
                </>
              )}

              {referral.status === "accepted" && (
                <Button
                  onClick={() => handleCompleteReferral(referral.id)}
                  className="bg-medical-blue hover:bg-medical-blue/90"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

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
                {referrals.filter((r) => r.status === "accepted").length} Accepted
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="specific" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="specific" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Specific Referrals ({specificReferrals.length})
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Hospital className="w-4 h-4" />
              General Referrals ({generalReferrals.length})
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
                <ReferralCard key={referral.id} referral={referral} />
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
                <ReferralCard key={referral.id} referral={referral} />
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
        </Tabs>
      </div>

      {/* Detailed View Dialog */}
      {selectedReferral && (
        <Dialog open={!!selectedReferral} onOpenChange={() => setSelectedReferral(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Referral Details - {selectedReferral.id}
              </DialogTitle>
              <DialogDescription>Complete information for this patient referral</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Patient Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Patient Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Name:</span> {selectedReferral.patient.name}
                      </p>
                      <p>
                        <span className="font-medium">ID:</span> {selectedReferral.patient.id}
                      </p>
                      <p>
                        <span className="font-medium">Age:</span> {selectedReferral.patient.age} years
                      </p>
                      <p>
                        <span className="font-medium">Gender:</span> {selectedReferral.patient.gender}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span> {selectedReferral.patient.phone}
                      </p>
                      <p>
                        <span className="font-medium">WhatsApp:</span> {selectedReferral.patient.whatsapp}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Medical Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Condition:</span> {selectedReferral.medical.condition}
                      </p>
                      <p>
                        <span className="font-medium">Department:</span> {selectedReferral.medical.department}
                      </p>
                      <p>
                        <span className="font-medium">Allergies:</span> {selectedReferral.medical.allergies || "None"}
                      </p>
                      <p>
                        <span className="font-medium">Medications:</span>{" "}
                        {selectedReferral.medical.medications || "None"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Clinical Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Clinical Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{selectedReferral.medical.summary}</p>
                  {selectedReferral.medical.notes && (
                    <div className="mt-4 p-3 bg-muted/30 rounded">
                      <p className="text-sm">
                        <span className="font-medium">Additional Notes:</span> {selectedReferral.medical.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
