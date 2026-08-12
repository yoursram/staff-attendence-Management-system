"use client";

import { useEffect, useState, useTransition } from "react";
import api from "@/lib/api";
import {
  Search,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  FileSpreadsheet,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  RefreshCw,
  LogOut,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";

interface StaffMember {
  staff_id: string;
  name: string;
  department: string;
  shift: string;
  mobile: string;
  gender: string;
  status: "Present" | "Absent" | "Checked In" | "Checked Out" | string;
  time: string | null;
  check_in_ip: string;
  weekly_hours: number;
  notes: string;
}

export default function StaffAttendance() {
  const [items, setItems] = useState<StaffMember[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [department, setDepartment] = useState("");
  const [shift, setShift] = useState("");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<keyof StaffMember>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Temp state for mobile filter sheet before applying
  const [tempDepartment, setTempDepartment] = useState("");
  const [tempShift, setTempShift] = useState("");

  const departments = ["All", "Cleaning", "Maintenance", "Security", "Kitchen", "Reception"];
  const shifts = ["All", "Morning", "Evening", "Night"];

  // Fetch paginated attendance records
  const fetchAttendance = async (currentPage = page) => {
    setLoading(true);
    try {
      const response = await api.get("/attendance/paginated", {
        params: {
          page: currentPage,
          limit,
          search,
          date,
          department: department === "All" ? "" : department,
          shift: shift === "All" ? "" : shift
        }
      });
      setItems(response.data.items || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error("Error fetching attendance data", error);
      toast.error("Failed to fetch attendance data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(1);
    setPage(1);
  }, [search, date, department, shift]);

  // Handle manual refetch
  const handleRefresh = () => {
    fetchAttendance(page);
    toast.success("Attendance list refreshed");
  };

  // Optimistic handler for Check-In
  const handleCheckIn = async (staffId: string) => {
    // 1. Snapshot previous state for rollback
    const previousItems = [...items];

    // Get current formatted time e.g., 05:30 PM
    const now = new Date();
    const currentFormattedTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    // 2. Optimistically update local UI state
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.staff_id === staffId
          ? {
              ...item,
              status: "Checked In",
              time: currentFormattedTime,
              notes: `Checked in manually at ${currentFormattedTime}.`
            }
          : item
      )
    );
    toast.success("Recording check-in...");

    try {
      // 3. Make real API request
      const response = await api.post("/attendance/check-in", {
        staff_id: staffId,
        date: date,
        status: "Checked In"
      });

      if (response.data.success) {
        toast.success(`Check-In confirmed for ${staffId}`);
      } else {
        throw new Error("API reported failure");
      }
    } catch (error) {
      // 4. Rollback state if server request fails
      console.error("Check-in error:", error);
      setItems(previousItems);
      toast.error("Failed to complete Check-In. Rolled back changes.");
    }
  };

  // Optimistic handler for Check-Out
  const handleCheckOut = async (staffId: string) => {
    const previousItems = [...items];

    // Optimistically update
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.staff_id === staffId
          ? {
              ...item,
              status: "Checked Out",
              notes: "Checked out manually."
            }
          : item
      )
    );
    toast.success("Recording check-out...");

    try {
      const response = await api.post("/attendance/check-out", {
        staff_id: staffId,
        date: date
      });

      if (response.data.success) {
        toast.success(`Check-Out confirmed for ${staffId}`);
      } else {
        throw new Error("API failure");
      }
    } catch (error) {
      console.error("Check-out error:", error);
      setItems(previousItems);
      toast.error("Failed to complete Check-Out. Rolled back changes.");
    }
  };

  // Inline action for toggling Status (Mark Attendance)
  const handleMarkAttendance = async (staffId: string, targetStatus: "Present" | "Absent") => {
    const previousItems = [...items];

    const now = new Date();
    const timeVal = targetStatus === "Present" ? now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }) : null;

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.staff_id === staffId
          ? {
              ...item,
              status: targetStatus,
              time: timeVal,
              notes: targetStatus === "Present" ? `Marked Present at ${timeVal}.` : "Marked Absent."
            }
          : item
      )
    );

    try {
      const response = await api.post("/attendance/check-in", {
        staff_id: staffId,
        date: date,
        status: targetStatus
      });

      if (response.data.success) {
        toast.success(`Successfully marked as ${targetStatus}`);
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      console.error(error);
      setItems(previousItems);
      toast.error("Failed to mark attendance. Rolled back changes.");
    }
  };

  // Sorting comparator
  const handleSort = (field: keyof StaffMember) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  // Apply filters on mobile
  const applyMobileFilters = () => {
    setDepartment(tempDepartment);
    setShift(tempShift);
    setIsFilterSheetOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setDepartment("");
    setShift("");
    setTempDepartment("");
    setTempShift("");
    setIsFilterSheetOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (sortedItems.length === 0) {
      toast.warning("No data available to export");
      return;
    }
    const headers = ["Staff ID", "Name", "Department", "Shift", "Status", "Time", "Check-In IP", "Weekly Hours", "Notes"];
    const csvContent = [
      headers.join(","),
      ...sortedItems.map((r) =>
        `"${r.staff_id}","${r.name}","${r.department}","${r.shift}","${r.status}","${r.time || "-"}","${r.check_in_ip}",${r.weekly_hours},"${r.notes}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `staff_attendance_report_${date}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report exported successfully");
  };

  // Get status variant for badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Present":
      case "Checked In":
        return <Badge variant="success" className="gap-1"><CheckCircle className="w-3 h-3" /> {status}</Badge>;
      case "Checked Out":
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> {status}</Badge>;
      case "Absent":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> {status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="relative min-h-screen pb-24 md:pb-8 flex flex-col gap-6">
      {/* 📱 Mobile Sticky Navbar (< 768px) */}
      <div className="sticky top-0 z-20 md:hidden bg-white border-b border-gray-200 px-4 py-3 -mx-8 -mt-8 flex items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-base md:text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all h-10"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-base md:text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-primary/20 h-10 w-32"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setTempDepartment(department);
              setTempShift(shift);
              setIsFilterSheetOpen(true);
            }}
            className="h-10 w-10 shrink-0"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 💻 Desktop Header & Filter Bar (>= 768px) */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Attendance Register</h2>
          <p className="text-sm text-gray-500">Track and manage staff daily check-ins, check-outs, and shift logs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="h-9 gap-2">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 gap-2">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* 💻 Desktop Filter Controls (>= 768px) */}
      <Card className="hidden md:block">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-base md:text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-input rounded-lg px-3 py-2 text-base md:text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Department</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="border border-input rounded-lg px-3 py-2 text-base md:text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            >
              {departments.map((d) => (
                <option key={d} value={d === "All" ? "" : d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Shift</span>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="border border-input rounded-lg px-3 py-2 text-base md:text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            >
              {shifts.map((s) => (
                <option key={s} value={s === "All" ? "" : s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {(search || department || shift) && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 📳 Mobile Filter Sheet / Drawer */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent side="right" className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>Filter Staff Directory</SheetTitle>
            <SheetDescription>Refine the staff attendance records using the options below.</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6 flex-1">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Department</label>
              <div className="grid grid-cols-2 gap-2">
                {departments.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTempDepartment(d === "All" ? "" : d)}
                    className={`py-2 px-3 text-sm rounded-lg border text-left transition-colors ${
                      (d === "All" && !tempDepartment) || tempDepartment === d
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Shift</label>
              <div className="grid grid-cols-2 gap-2">
                {shifts.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTempShift(s === "All" ? "" : s)}
                    className={`py-2 px-3 text-sm rounded-lg border text-left transition-colors ${
                      (s === "All" && !tempShift) || tempShift === s
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="border-t pt-4">
            <Button variant="outline" className="w-full" onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button className="w-full" onClick={applyMobileFilters}>
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 📦 Main List Area */}
      <div className="flex-1">
        {/* Loading state skeleton */}
        {loading ? (
          <div className="space-y-4">
            {/* Skeletons for Mobile Stack */}
            <div className="block md:hidden space-y-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-10 flex-1 rounded-lg" />
                      <Skeleton className="h-10 flex-1 rounded-lg" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Skeletons for Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b flex justify-between">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="divide-y divide-gray-200">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 w-1/3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : sortedItems.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <UserCheck className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No Attendance Records</h3>
            <p className="text-sm text-gray-500 max-w-sm mt-1">
              We couldn't find any registered staff or attendance matching your search criteria. Try modifying your search.
            </p>
            <Button className="mt-4" onClick={resetFilters}>
              Reset Filters
            </Button>
          </Card>
        ) : (
          <>
            {/* 📱 Mobile View (< 768px): Stacked Cards */}
            <div className="block md:hidden space-y-4">
              <Accordion type="single" className="w-full space-y-3">
                {sortedItems.map((member) => (
                  <Card
                    key={member.staff_id}
                    className={`overflow-hidden border transition-all ${
                      member.status === "Present" || member.status === "Checked In"
                        ? "border-emerald-100 bg-emerald-50/20"
                        : member.status === "Checked Out"
                        ? "border-amber-100 bg-amber-50/10"
                        : "border-gray-200"
                    }`}
                  >
                    <CardContent className="p-4">
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-gray-200 shadow-sm shrink-0">
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm leading-tight">{member.name}</h4>
                            <p className="text-xs text-gray-500">{member.staff_id}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(member.status)}
                          {member.time && (
                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> {member.time}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Department and Shift Tag */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs bg-white text-gray-700 border-gray-200">
                          {member.department}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-white text-gray-700 border-gray-200">
                          {member.shift} Shift
                        </Badge>
                      </div>

                      {/* Accordion containing extended details */}
                      <AccordionItem value={member.staff_id} className="border-t border-dashed border-gray-200/80">
                        <AccordionTrigger className="text-xs font-semibold py-2.5 text-gray-600 hover:text-gray-900">
                          <span>Details & Logs</span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-3 text-xs space-y-2">
                          <div className="grid grid-cols-2 gap-y-2 gap-x-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            <div>
                              <span className="text-gray-400 block font-medium">Check-In IP</span>
                              <span className="font-mono text-gray-700 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" /> {member.check_in_ip}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400 block font-medium">Weekly Hours</span>
                              <span className="font-semibold text-gray-700 block mt-0.5">
                                {member.weekly_hours} hrs
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-400 block font-medium">Notes</span>
                              <span className="text-gray-600 block mt-0.5">{member.notes}</span>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Wide touch actions (min height 48px) */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                        {member.status === "Present" || member.status === "Checked In" ? (
                          <Button
                            onClick={() => handleCheckOut(member.staff_id)}
                            variant="outline"
                            className="w-full text-amber-600 border-amber-200 hover:bg-amber-50 h-12 text-sm font-semibold rounded-xl"
                          >
                            Check-Out
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleCheckIn(member.staff_id)}
                            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 h-12 text-sm font-semibold rounded-xl"
                          >
                            Check-In
                          </Button>
                        )}
                        <Button
                          onClick={() =>
                            handleMarkAttendance(
                              member.staff_id,
                              member.status === "Absent" ? "Present" : "Absent"
                            )
                          }
                          variant="ghost"
                          className={`w-full h-12 text-sm font-semibold rounded-xl border ${
                            member.status === "Absent"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          }`}
                        >
                          {member.status === "Absent" ? "Mark Present" : "Mark Absent"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </Accordion>
            </div>

            {/* 💻 Tablet/Desktop View (>= 768px): Data Table */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        onClick={() => handleSort("name")}
                        className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          Staff Details <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        onClick={() => handleSort("department")}
                        className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          Dept & Shift <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Log Details
                      </th>
                      <th
                        scope="col"
                        onClick={() => handleSort("status")}
                        className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          Status <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Quick Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedItems.map((member) => (
                      <tr key={member.staff_id} className="hover:bg-gray-50/50 transition-colors">
                        {/* Name & Avatar */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border shadow-sm">
                              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{member.name}</div>
                              <div className="text-xs text-gray-500">{member.staff_id}</div>
                            </div>
                          </div>
                        </td>

                        {/* Dept & Shift */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{member.department}</div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 mt-1">
                            {member.shift} Shift
                          </span>
                        </td>

                        {/* Log Details (IP & Time) */}
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-600 font-medium">IP: <span className="font-mono">{member.check_in_ip}</span></div>
                          <div className="text-xs text-gray-500 mt-0.5">Hours: <span className="font-semibold">{member.weekly_hours} hrs/wk</span></div>
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(member.status)}
                            {member.time && (
                              <span className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" /> {member.time}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Quick actions buttons */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            {member.status === "Present" || member.status === "Checked In" ? (
                              <Button
                                onClick={() => handleCheckOut(member.staff_id)}
                                variant="outline"
                                size="sm"
                                className="text-amber-600 border-amber-200 hover:bg-amber-50 h-8"
                              >
                                Check-Out
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleCheckIn(member.staff_id)}
                                size="sm"
                                className="bg-emerald-600 text-white hover:bg-emerald-700 h-8"
                              >
                                Check-In
                              </Button>
                            )}
                            <Button
                              onClick={() =>
                                handleMarkAttendance(
                                  member.staff_id,
                                  member.status === "Absent" ? "Present" : "Absent"
                                )
                              }
                              variant="ghost"
                              size="sm"
                              className={`h-8 border ${
                                member.status === "Absent"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                                  : "bg-red-50 text-red-700 border-red-100 hover:bg-red-100"
                              }`}
                            >
                              {member.status === "Absent" ? "Mark Present" : "Mark Absent"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Desktop pagination controls */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-semibold">{(page - 1) * limit + 1}</span> to{" "}
                  <span className="font-semibold">{Math.min(page * limit, total)}</span> of{" "}
                  <span className="font-semibold">{total}</span> staff members
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPage = Math.max(page - 1, 1);
                      setPage(newPage);
                      fetchAttendance(newPage);
                    }}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPage = page + 1;
                      setPage(newPage);
                      fetchAttendance(newPage);
                    }}
                    disabled={page * limit >= total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 📱 Mobile Fixed Bottom Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 flex justify-between items-center shadow-lg gap-3">
        <div className="text-xs font-semibold text-gray-600">
          Selected Date: <span className="text-gray-900 block font-bold">{date}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="h-10 text-xs gap-1.5 rounded-lg px-3">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-10 text-xs gap-1.5 rounded-lg px-3">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>
    </div>
  );
}
