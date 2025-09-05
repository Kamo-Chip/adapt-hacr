"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Building2, MapPin, Phone, Mail, Globe, Users, Stethoscope, Plus, Trash2, Save, Edit } from "lucide-react"
import { DEPARTMENTS } from "@/app/onboard/page"
import { useUser } from "@clerk/nextjs"
import { fetchProfile, fetchDepartments, isAdmin, addDepartmentToDB, updateDepartmentInDB, removeDepartmentFromDB, userHospital } from "@/utils/db/client"
import Loading from "@/components/loading"
import toast from "react-hot-toast"

export default function ProfilePage() {
    const { user, isLoaded } = useUser();

    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [profile, setProfile] = useState({
        id: "",
        name: "",
        type: "",
        address_line1: "",
        city: "",
        province: "",
        postal_code: "",
        country: "",
        latitude: 0,
        longitude: 0,
        email: "",
        whatsapp_number: "",
        website: "",
        created_at: "",
        updated_at: "",
    })

    const [departments, setDepartments] = useState([])
    const [newDepartment, setNewDepartment] = useState("")
    const [Admin, setAdminStat] = useState(false);
    const [hospitalId, setHospitalId] = useState("");
    const [editingDepartments, setEditingDepartments] = useState({});

    useEffect(() => {
        const loadData = async () => {
            if(!isLoaded || !user){
                setLoading(false);
                return;
            }
            try {
                // Get hospital ID first
                const hid = await userHospital(user.id);
                setHospitalId(hid);

                // Load profile and departments
                const [profileData, departmentData, adminData] = await Promise.all([
                    fetchProfile(user.id),
                    fetchDepartments(hid),
                    isAdmin(user.id)
                ]);

                setProfile(profileData);

                // Ensure all department fields have proper values (not null)
                const safeDepartmentData = departmentData.map(dept => ({
                    ...dept,
                    capacity_total: dept.capacity_total || 0,
                    capacity_available: dept.capacity_available || 0,
                    hod: dept.hod || "",
                    phone: dept.phone || "",
                    email: dept.email || ""
                }));

                setDepartments(safeDepartmentData);
                setAdminStat(adminData);

                // Initialize editing state for each department
                const editingState = {};
                safeDepartmentData.forEach(dept => {
                    editingState[dept.id] = false;
                });
                setEditingDepartments(editingState);
            } catch (err) {
                console.error("Failed to load data:", err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [isLoaded, user]);

    const handleEdit = () => {
        if (Admin) {
            setIsEditing(true);
        } else {
            toast.error("Only Administrators Can Edit Hospital Details")
        }
    }

    const handleSave = () => {
        setIsEditing(false)
        console.log("[v0] Saving profile:", profile)
        // Add your save profile logic here
        toast.success("Profile updated successfully")
    }

    const addDepartment = async () => {
    if (!newDepartment) {
        toast.error("Please select a department to add");
        return;
    }

    // Check for duplicates
    if (departments.find((d) => d.department === newDepartment)) {
        toast.error("This department already exists");
        return;
    }

    try {
        // Create new department with default values
        const newDept = {
            hospital_id: hospitalId,
            department: newDepartment,
            capacity_total: 0,
            capacity_available: 0,
            hod: "",
            phone: "",
            email: "",
        };

        // Add to database
        const savedDept = await addDepartmentToDB(newDept);
        
        // Ensure all fields have proper values
        const safeDept = {
            ...savedDept,
            capacity_total: savedDept.capacity_total || 0,
            capacity_available: savedDept.capacity_available || 0,
            hod: savedDept.hod || "",
            phone: savedDept.phone || "",
            email: savedDept.email || ""
        };
        
        // Update local state
        setDepartments([...departments, safeDept]);
        setNewDepartment("");
        
        // Add to editing state
        setEditingDepartments(prev => ({...prev, [safeDept.id]: true}));
        
        toast.success("Department added successfully. Please fill in the details and click Update.");
    } catch (error) {
        console.error("Failed to add department:", error);
        toast.error("Failed to add department");
    }
};

    const removeDepartment = async (id) => {
        try {
            await removeDepartmentFromDB(id)
            setDepartments(departments.filter((d) => d.id !== id))

            // Remove from editing state
            setEditingDepartments(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });

            toast.success("Department removed successfully")
        } catch (error) {
            console.error("Failed to remove department:", error)
            toast.error("Failed to remove department")
        }
    }

    const toggleEditDepartment = (id) => {
        setEditingDepartments(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    }

    const updateDepartment = async (id, field, value) => {
        // Update local state only
        setDepartments(departments.map((d) => (d.id === id ? { ...d, [field]: value } : d)))
    }

    const saveDepartment = async (dept) => {
        // Validate capacity values
        if (dept.capacity_total === "" || isNaN(dept.capacity_total) || dept.capacity_total < 0) {
            toast.error("Please enter a valid number for total capacity")
            return
        }

        if (dept.capacity_available === "" || isNaN(dept.capacity_available) || dept.capacity_available < 0) {
            toast.error("Please enter a valid number for available capacity")
            return
        }

        // Ensure available capacity doesn't exceed total capacity
        if (parseInt(dept.capacity_available) > parseInt(dept.capacity_total)) {
            toast.error("Available capacity cannot exceed total capacity")
            return;
        }

        try {
            // Update in database
            await updateDepartmentInDB(dept.id, {
                capacity_total: dept.capacity_total,
                capacity_available: dept.capacity_available,
                hod: dept.hod,
                phone: dept.phone,
                email: dept.email
            })

            // Update editing state
            setEditingDepartments(prev => ({
                ...prev,
                [dept.id]: false
            }));

            toast.success("Department updated successfully")
        } catch (error) {
            console.error("Failed to update department:", error)
            toast.error("Failed to update department")
        }
    }

    const totalAvailable = departments.reduce(
        (sum, d) => sum + (d.capacity_available ?? 0),
        0
    );
    const totalCapacity = departments.reduce(
        (sum, d) => sum + (d.capacity_total ?? 0),
        0
    );
    const totalOccupied = totalCapacity - totalAvailable;
    const occupancyPct =
        totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    if (loading) return <Loading />
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-medical-blue/10 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-medical-blue" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Hospital Profile</h1>
                            <p className="text-muted-foreground mt-1">Manage your hospital information and departments</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <Tabs defaultValue="general" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">General Information</TabsTrigger>
                        <TabsTrigger value="departments">Departments</TabsTrigger>
                        <TabsTrigger value="capacity">Capacity Management</TabsTrigger>
                    </TabsList>

                    {/* General Information (Combined) */}
                    <TabsContent value="general" className="space-y-6">
                        <div className="flex justify-end mb-4">
                            {isEditing ? (
                                <>
                                    <Button variant="outline" onClick={() => setIsEditing(false)} className="mr-2">
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSave}>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={handleEdit}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </Button>
                            )}
                        </div>


                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5" />
                                    Hospital Information
                                </CardTitle>
                                <CardDescription>Basic information about your healthcare facility</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Hospital Name</Label>
                                        <Input
                                            id="name"
                                            value={profile.name ?? ""}
                                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Facility Type</Label>
                                        <Select
                                            value={profile.type} 
                                            onValueChange={(value) => setProfile({ ...profile, type: value })}
                                            disabled={!isEditing}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
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
                                    <Label htmlFor="website">Website</Label>
                                    <div className="flex">
                                        <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <Input
                                            id="website"
                                            value={profile.website ?? ""}
                                            onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                                            disabled={!isEditing}
                                            className="rounded-l-none"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    Location Information
                                </CardTitle>
                                <CardDescription>Physical address and geographic coordinates</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="address">Street Address</Label>
                                    <Textarea
                                        id="address"
                                        value={profile.address_line1}
                                        onChange={(e) => setProfile({ ...profile, address_line1: e.target.value })}
                                        disabled={!isEditing}
                                        rows={2}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={profile.city ?? ""}
                                            onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">Province</Label>
                                        <Input
                                            id="state"
                                            value={profile.province ?? ""}
                                            onChange={(e) => setProfile({ ...profile, province: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">County</Label>
                                        <Input
                                            id="state"
                                            value={profile.country ?? ""}
                                            onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="postal">Postal Code</Label>
                                        <Input
                                            id="postal"
                                            value={profile.postal_code?? ""}
                                            onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Phone className="w-5 h-5" />
                                    Contact Information
                                </CardTitle>
                                <CardDescription>Phone numbers and email addresses for communication</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Main Phone</Label>
                                        <div className="flex">
                                            <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                                                <Phone className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <Input
                                                id="phone"
                                                value={profile.whatsapp_number ?? ""}
                                                onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value })}
                                                disabled={!isEditing}
                                                className="rounded-l-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="flex">
                                        <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                                            <Mail className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={profile.email ?? ""}
                                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                            disabled={!isEditing}
                                            className="rounded-l-none"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Departments */}
                    <TabsContent value="departments" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Stethoscope className="w-5 h-5" />
                                    Medical Departments
                                </CardTitle>
                                <CardDescription>Manage the medical specialties available at your facility</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Add Department */}
                                <div className="flex gap-3">
                                    <Select value={newDepartment} onValueChange={setNewDepartment} disabled={!Admin}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder={Admin ? "Select department to add" : "Admins only"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DEPARTMENTS
                                                .filter((dept) => !departments.find((d) => d.department === dept.value))
                                                .map((dept, idx) => (
                                                    <SelectItem key={idx} value={dept.value}>
                                                        {dept.title}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={addDepartment} disabled={!newDepartment || !Admin}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Department
                                    </Button>
                                </div>

                                <Separator />

                                {/* Department List */}
                                <div className="space-y-4">
                                    {departments.map((dept) => (
                                        <Card key={dept.id} className="border-2">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-lg">
                                                        {DEPARTMENTS.find(d => d.value === dept.department)?.title || dept.department}
                                                    </CardTitle>
                                                    <div className="flex gap-2">
                                                        {editingDepartments[dept.id] ? (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => toggleEditDepartment(dept.id)}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => saveDepartment(dept)}
                                                                >
                                                                    <Save className="w-4 h-4 mr-1" />
                                                                    Update
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => removeDepartment(dept.id)}
                                                                    className="text-destructive hover:text-destructive"
                                                                    disabled={!Admin}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => toggleEditDepartment(dept.id)}
                                                                    disabled={!Admin}
                                                                >
                                                                    <Edit className="w-4 h-4 mr-1" />
                                                                    Edit
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Total Capacity *</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={dept.capacity_total}
                                                            onChange={(e) =>
                                                                updateDepartment(dept.id, "capacity_total", parseInt(e.target.value) || 0)
                                                            }
                                                            disabled={!editingDepartments[dept.id] || !Admin}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Available Capacity *</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={dept.capacity_total}
                                                            value={dept.capacity_available}
                                                            onChange={(e) =>
                                                                updateDepartment(dept.id, "capacity_available", parseInt(e.target.value) || 0)
                                                            }
                                                            disabled={!editingDepartments[dept.id] || !Admin}
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Head of Department (HOD)</Label>
                                                    <Input
                                                        value={dept.hod}
                                                        onChange={(e) => updateDepartment(dept.id, "hod", e.target.value)}
                                                        disabled={!editingDepartments[dept.id] || !Admin}
                                                        placeholder="Dr. Name"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Contact Phone</Label>
                                                        <Input
                                                            value={dept.phone}
                                                            onChange={(e) => updateDepartment(dept.id, "phone", e.target.value)}
                                                            disabled={!editingDepartments[dept.id] || !Admin}
                                                            placeholder="+254-20-1234567"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Contact Email</Label>
                                                        <Input
                                                            type="email"
                                                            value={dept.email}
                                                            onChange={(e) => updateDepartment(dept.id, "email", e.target.value)}
                                                            disabled={!editingDepartments[dept.id] || !Admin}
                                                            placeholder="department@hospital.com"
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Capacity Management */}
                    <TabsContent value="capacity" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Hospital Capacity
                                </CardTitle>
                                <CardDescription>
                                    Manage overall hospital capacity and bed availability
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-6 bg-muted/30 rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold">Capacity Overview</h3>
                                        <Badge
                                            variant={
                                                occupancyPct > 80
                                                    ? "destructive"
                                                    : occupancyPct > 60
                                                        ? "secondary"
                                                        : "default"
                                            }
                                            className="text-sm"
                                        >
                                            {occupancyPct}% Occupied
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Available Beds</span>
                                            <span className="font-medium text-trust-green">
                                                {totalAvailable}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Occupied Beds</span>
                                            <span className="font-medium text-warning-amber">
                                                {totalOccupied}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Total Capacity</span>
                                            <span className="font-medium">{totalCapacity}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Department Capacity Summary</h3>
                                    <div className="grid gap-4">
                                        {departments.map((dept) => {
                                            const deptOccupied = (dept.capacity_total || 0) - (dept.capacity_available || 0);
                                            const deptOccupancyPct = dept.capacity_total > 0 ?
                                                Math.round((deptOccupied / dept.capacity_total) * 100) : 0;

                                            return (
                                                <div key={dept.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div className="space-y-1">
                                                        <div className="font-medium">
                                                            {DEPARTMENTS.find(d => d.value === dept.department)?.title || dept.department}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {dept.hod || "No head assigned"}
                                                        </div>
                                                    </div>
                                                    <div className="text-right space-y-1">
                                                        <div className="text-sm font-medium">
                                                            {deptOccupied}/{dept.capacity_total}
                                                        </div>
                                                        <Badge
                                                            variant={
                                                                deptOccupancyPct > 80
                                                                    ? "destructive"
                                                                    : deptOccupancyPct > 60
                                                                        ? "secondary"
                                                                        : "default"
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {deptOccupancyPct}%
                                                        </Badge>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}