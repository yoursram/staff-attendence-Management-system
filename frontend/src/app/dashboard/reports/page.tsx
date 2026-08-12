"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Download, FileSpreadsheet, Search, Calendar, UserCheck, UserX, Users } from "lucide-react";

export default function Reports() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchDailyReport = async (date: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/attendance/daily?date=${date}`);
      setRecords(response.data.records);
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching daily report", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyReport(selectedDate);
  }, [selectedDate]);

  const filteredRecords = records.filter((record: any) => 
    record.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    record.staff_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    if (records.length === 0) return;
    const headers = ["Staff ID", "Name", "Department", "Time", "Status"];
    const csvContent = [
      headers.join(","),
      ...records.map((r: any) => `${r.staff_id},"${r.name}","${r.department}",${r.time},${r.status}`)
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_report_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Staff</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</h3>
          </div>
          <div className="p-3 rounded-full bg-blue-50 text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Present</p>
            <h3 className="text-2xl font-bold text-green-600 mt-1">{stats.present}</h3>
          </div>
          <div className="p-3 rounded-full bg-green-50 text-green-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Absent</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.absent}</h3>
          </div>
          <div className="p-3 rounded-full bg-red-50 text-red-600">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Daily Report</h2>
            <p className="text-sm text-gray-500">View attendance records for a specific date.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-base md:text-sm focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div className="relative flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-base md:text-sm focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <button
              onClick={exportCSV}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shrink-0"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">Loading data...</td>
                </tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((record: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {record.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{record.name}</p>
                          <p className="text-xs text-gray-500">{record.staff_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileSpreadsheet className="w-12 h-12 text-gray-300 mb-3" />
                      <p>No records found for {selectedDate}.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
