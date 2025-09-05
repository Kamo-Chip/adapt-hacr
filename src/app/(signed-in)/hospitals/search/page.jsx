"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
    Search,
    MapPin,
    Phone,
    Mail,
    Globe,
    Building2,
    Navigation,
    Filter,
    SortAsc,
    Clock,
    CheckCircle,
} from "lucide-react"

// Mock hospital data - in real app this would come from API
const hospitals = [
    {
        id: "hosp-001",
        name: "South Africatta National Hospital",
        type: "hospital",
        address: "Hospital Rd, Upper Hill",
        city: "Johannesburg",
        state: "Johannesburg County",
        phone: "+254-20-2726300",
        email: "info@knh.or.ke",
        website: "https://knh.or.ke",
        distance: 2.5,
        totalCapacity: 2000,
        currentCapacity: 1200,
        availableCapacity: 800,
        departments: ["Emergency Medicine", "Cardiology", "Neurology", "Surgery", "Pediatrics", "Oncology"],
        rating: 4.5,
        responseTime: "45 min",
        acceptanceRate: 92,
    },
    {
        id: "hosp-002",
        name: "Aga Khan University Hospital",
        type: "hospital",
        address: "3rd Parklands Ave",
        city: "Johannesburg",
        state: "Johannesburg County",
        phone: "+254-20-3662000",
        email: "info@aku.edu",
        website: "https://aku.edu",
        distance: 5.2,
        totalCapacity: 254,
        currentCapacity: 180,
        availableCapacity: 74,
        departments: ["Cardiology", "Neurology", "Orthopedics", "Internal Medicine", "Radiology"],
        rating: 4.8,
        responseTime: "30 min",
        acceptanceRate: 96,
    },
    {
        id: "hosp-003",
        name: "Johannesburg Hospital",
        type: "hospital",
        address: "Argwings Kodhek Rd",
        city: "Johannesburg",
        state: "Johannesburg County",
        phone: "+254-20-2845000",
        email: "info@johannesburghospital.org",
        website: "https://johannesburghospital.org",
        distance: 3.8,
        totalCapacity: 350,
        currentCapacity: 220,
        availableCapacity: 130,
        departments: ["Emergency Medicine", "Cardiology", "Orthopedics", "Surgery", "Obstetrics & Gynecology"],
        rating: 4.6,
        responseTime: "35 min",
        acceptanceRate: 89,
    },
    {
        id: "hosp-004",
        name: "Mater Misericordiae Hospital",
        type: "hospital",
        address: "Dunga Rd, South B",
        city: "Johannesburg",
        state: "Johannesburg County",
        phone: "+254-20-5514000",
        email: "info@materSouth Africa.com",
        website: "https://materSouth Africa.com",
        distance: 4.1,
        totalCapacity: 300,
        currentCapacity: 190,
        availableCapacity: 110,
        departments: ["Emergency Medicine", "Pediatrics", "Obstetrics & Gynecology", "Internal Medicine"],
        rating: 4.4,
        responseTime: "40 min",
        acceptanceRate: 94,
    },
    {
        id: "hosp-005",
        name: "Karen Hospital",
        type: "hospital",
        address: "Karen Rd",
        city: "Johannesburg",
        state: "Johannesburg County",
        phone: "+254-20-6610000",
        email: "info@karenhospital.org",
        website: "https://karenhospital.org",
        distance: 8.7,
        totalCapacity: 120,
        currentCapacity: 85,
        availableCapacity: 35,
        departments: ["Internal Medicine", "Pediatrics", "Surgery", "Radiology"],
        rating: 4.3,
        responseTime: "50 min",
        acceptanceRate: 87,
    },
    {
        id: "clinic-001",
        name: "Avenue Healthcare",
        type: "clinic",
        address: "Kiambu Rd",
        city: "Johannesburg",
        state: "Johannesburg County",
        phone: "+254-20-4442000",
        email: "info@avenuehealthcare.co.ke",
        website: "https://avenuehealthcare.co.ke",
        distance: 6.3,
        totalCapacity: 50,
        currentCapacity: 30,
        availableCapacity: 20,
        departments: ["Internal Medicine", "Pediatrics", "Emergency Medicine"],
        rating: 4.1,
        responseTime: "25 min",
        acceptanceRate: 91,
    },
]

const allDepartments = [
    "Emergency Medicine",
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Obstetrics & Gynecology",
    "Internal Medicine",
    "Surgery",
    "Radiology",
    "Oncology",
]

export default function HospitalSearchPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedType, setSelectedType] = useState("all")
    const [selectedDepartments, setSelectedDepartments] = useState([])
    const [sortBy, setSortBy] = useState("distance")
    const [minCapacity, setMinCapacity] = useState("")
    const [showFilters, setShowFilters] = useState(false)

    const filteredAndSortedHospitals = useMemo(() => {
        const filtered = hospitals.filter((hospital) => {
            // Search query filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                if (
                    !hospital.name.toLowerCase().includes(query) &&
                    !hospital.address.toLowerCase().includes(query) &&
                    !hospital.city.toLowerCase().includes(query)
                ) {
                    return false
                }
            }

            // Type filter
            if (selectedType !== "all" && hospital.type !== selectedType) {
                return false
            }

            // Department filter
            if (selectedDepartments.length > 0) {
                if (!selectedDepartments.some((dept) => hospital.departments.includes(dept))) {
                    return false
                }
            }

            // Capacity filter
            if (minCapacity && hospital.availableCapacity < Number.parseInt(minCapacity)) {
                return false
            }

            return true
        })

        // Sort results
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "distance":
                    return a.distance - b.distance
                case "capacity":
                    return b.availableCapacity - a.availableCapacity
                case "rating":
                    return b.rating - a.rating
                case "response":
                    return Number.parseInt(a.responseTime) - Number.parseInt(b.responseTime)
                default:
                    return 0
            }
        })

        return filtered
    }, [searchQuery, selectedType, selectedDepartments, sortBy, minCapacity])

    const toggleDepartment = (department) => {
        setSelectedDepartments((prev) =>
            prev.includes(department) ? prev.filter((d) => d !== department) : [...prev, department]
        )
    }

    const clearFilters = () => {
        setSearchQuery("")
        setSelectedType("all")
        setSelectedDepartments([])
        setSortBy("distance")
        setMinCapacity("")
    }

    const getCapacityStatus = (hospital) => {
        const percentage = (hospital.currentCapacity / hospital.totalCapacity) * 100
        if (percentage > 80) return { status: "high", color: "urgent-red", text: "High Occupancy" }
        if (percentage > 60) return { status: "medium", color: "warning-amber", text: "Moderate" }
        return { status: "low", color: "trust-green", text: "Available" }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-medical-blue/10 rounded-lg flex items-center justify-center">
                                <Search className="w-6 h-6 text-medical-blue" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">Hospital Search</h1>
                                <p className="text-muted-foreground mt-1">Find the best hospitals for your referrals</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                                <Filter className="w-4 h-4 mr-2" />
                                {showFilters ? "Hide" : "Show"} Filters
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <div className={`space-y-6 ${showFilters ? "block" : "hidden lg:block"}`}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Search & Filters</CardTitle>
                                <CardDescription>Refine your hospital search</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Search Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="search">Search Hospitals</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            placeholder="Hospital name or location"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Hospital Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="type">Hospital Type</Label>
                                    <Select value={selectedType} onValueChange={setSelectedType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="hospital">Hospital</SelectItem>
                                            <SelectItem value="clinic">Clinic</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Sort By */}
                                <div className="space-y-2">
                                    <Label htmlFor="sort">Sort By</Label>
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="distance">Distance</SelectItem>
                                            <SelectItem value="capacity">Available Capacity</SelectItem>
                                            <SelectItem value="rating">Rating</SelectItem>
                                            <SelectItem value="response">Response Time</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Minimum Capacity */}
                                <div className="space-y-2">
                                    <Label htmlFor="capacity">Minimum Available Beds</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        placeholder="e.g., 10"
                                        value={minCapacity}
                                        onChange={(e) => setMinCapacity(e.target.value)}
                                    />
                                </div>

                                <Separator />

                                {/* Departments */}
                                <div className="space-y-3">
                                    <Label>Required Departments</Label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {allDepartments.map((department) => (
                                            <div key={department} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={department}
                                                    checked={selectedDepartments.includes(department)}
                                                    onCheckedChange={() => toggleDepartment(department)}
                                                />
                                                <Label htmlFor={department} className="text-sm font-normal">
                                                    {department}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Button variant="outline" onClick={clearFilters} className="w-full bg-transparent">
                                    Clear All Filters
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Results */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Results Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {filteredAndSortedHospitals.length} Hospital{filteredAndSortedHospitals.length !== 1 ? "s" : ""} Found
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Sorted by {sortBy === "distance" ? "distance" : sortBy === "capacity" ? "available capacity" : sortBy}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <SortAsc className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Best matches first</span>
                            </div>
                        </div>

                        {/* Hospital Cards */}
                        <div className="space-y-4">
                            {filteredAndSortedHospitals.map((hospital) => {
                                const capacityStatus = getCapacityStatus(hospital)
                                return (
                                    <Card key={hospital.id} className="border-2 hover:border-medical-blue/20 transition-colors">
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                {/* Hospital Info */}
                                                <div className="lg:col-span-2 space-y-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3">
                                                                <h3 className="text-xl font-semibold">{hospital.name}</h3>
                                                                <Badge variant="outline" className="capitalize">
                                                                    {hospital.type}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <MapPin className="w-4 h-4" />
                                                                <span className="text-sm">
                                                                    {hospital.address}, {hospital.city}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm">
                                                                <div className="flex items-center gap-1">
                                                                    <Navigation className="w-4 h-4 text-medical-blue" />
                                                                    <span>{hospital.distance} km away</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="w-4 h-4 text-warning-amber" />
                                                                    <span>~{hospital.responseTime} response</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <CheckCircle className="w-4 h-4 text-trust-green" />
                                                                    <span>{hospital.acceptanceRate}% acceptance</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Departments */}
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-medium">Available Departments</Label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {hospital.departments.map((dept) => (
                                                                <Badge
                                                                    key={dept}
                                                                    variant="secondary"
                                                                    className={
                                                                        selectedDepartments.includes(dept)
                                                                            ? "bg-medical-blue/10 text-medical-blue border-medical-blue"
                                                                            : ""
                                                                    }
                                                                >
                                                                    {dept}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Contact Info */}
                                                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="w-4 h-4" />
                                                            <span>{hospital.phone}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Mail className="w-4 h-4" />
                                                            <span>{hospital.email}</span>
                                                        </div>
                                                        {hospital.website && (
                                                            <div className="flex items-center gap-1">
                                                                <Globe className="w-4 h-4" />
                                                                <span>Website</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Capacity & Actions */}
                                                <div className="space-y-4">
                                                    <Card className="border-2">
                                                        <CardContent className="p-4 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-medium">Bed Availability</span>
                                                                <Badge
                                                                    className={`bg-${capacityStatus.color}/10 text-${capacityStatus.color} border-${capacityStatus.color}/20`}
                                                                >
                                                                    {capacityStatus.text}
                                                                </Badge>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-sm">
                                                                    <span>Available</span>
                                                                    <span className="font-medium text-trust-green">{hospital.availableCapacity}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span>Occupied</span>
                                                                    <span className="font-medium text-warning-amber">{hospital.currentCapacity}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span>Total</span>
                                                                    <span className="font-medium">{hospital.totalCapacity}</span>
                                                                </div>
                                                            </div>
                                                            <div className="w-full bg-muted rounded-full h-2">
                                                                <div
                                                                    className={`h-2 rounded-full bg-${capacityStatus.color}`}
                                                                    style={{
                                                                        width: `${(hospital.currentCapacity / hospital.totalCapacity) * 100}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>

                        {filteredAndSortedHospitals.length === 0 && (
                            <Card className="border-2 border-dashed">
                                <CardContent className="p-12 text-center">
                                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No hospitals found</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Try adjusting your search criteria or filters to find more results.
                                    </p>
                                    <Button variant="outline" onClick={clearFilters}>
                                        Clear Filters
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
