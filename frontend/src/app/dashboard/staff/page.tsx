"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import api from "@/lib/api";
import { Users, Trash2, Search, Pencil, X } from "lucide-react";
import { toast } from "sonner";

type StaffRecord = {
  staff_id: string;
  name: string;
  department: string;
  shift: string;
  mobile: string;
  gender: string;
  joining_date: string;
};

export default function StaffDirectory() {
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStaff, setEditingStaff] = useState<StaffRecord | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    department: "",
    shift: "",
    mobile: "",
    gender: "",
    joining_date: "",
  });

  const fetchStaff = async () => {
    try {
      const response = await api.get("/staff");
      setStaff(response.data.staff);
    } catch (error) {
      console.error("Error fetching staff", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleDelete = async (staff_id: string) => {
    if (confirm(`Are you sure you want to delete staff member ${staff_id}?`)) {
      try {
        await api.delete(`/staff/${staff_id}`);
        toast.success("Staff deleted successfully");
        fetchStaff();
      } catch {
        toast.error("Failed to delete staff");
      }
    }
  };

  const handleEditClick = (person: StaffRecord) => {
    setEditingStaff(person);
    setEditForm({
      name: person.name || "",
      department: person.department || "",
      shift: person.shift || "",
      mobile: person.mobile || "",
      gender: person.gender || "",
      joining_date: person.joining_date ? String(person.joining_date).split("T")[0] : "",
    });
  };

  const handleEditChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      await api.put(`/staff/${editingStaff.staff_id}`, editForm);
      toast.success("Staff updated successfully");
      setEditingStaff(null);
      fetchStaff();
    } catch {
      toast.error("Failed to update staff");
    }
  };

  const filteredStaff = staff.filter((s: StaffRecord) => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.staff_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Staff Directory</h2>
          <p className="text-sm text-gray-500">Manage all registered cleaning staff members.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, ID, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department & Shift</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">Loading staff data...</td>
              </tr>
            ) : filteredStaff.length > 0 ? (
              filteredStaff.map((person: StaffRecord, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {person.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{person.name}</p>
                        <p className="text-xs text-gray-500">{person.staff_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{person.mobile}</div>
                    <div className="text-xs text-gray-500">{person.gender}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{person.department}</div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                      {person.shift} Shift
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(person.joining_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(person)}
                        className="text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded-lg transition-colors"
                        title="Edit Staff"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(person.staff_id)}
                        className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg transition-colors"
                        title="Delete Staff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="w-12 h-12 text-gray-300 mb-3" />
                    <p>No staff members found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Staff</h3>
                <p className="text-sm text-gray-500">Update {editingStaff.name}&apos;s details.</p>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Full Name</span>
                  <input
                    type="text"
                    name="name"
                    required
                    value={editForm.name}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Department</span>
                  <input
                    type="text"
                    name="department"
                    required
                    value={editForm.department}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Shift</span>
                  <select
                    name="shift"
                    required
                    value={editForm.shift}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select shift</option>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Mobile</span>
                  <input
                    type="text"
                    name="mobile"
                    required
                    value={editForm.mobile}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Gender</span>
                  <select
                    name="gender"
                    required
                    value={editForm.gender}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Joining Date</span>
                  <input
                    type="date"
                    name="joining_date"
                    required
                    value={editForm.joining_date}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
