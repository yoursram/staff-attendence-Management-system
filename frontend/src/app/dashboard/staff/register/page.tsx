"use client";

import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, RefreshCw, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function RegisterStaff() {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    staff_id: "",
    name: "",
    department: "",
    shift: "Morning",
    mobile: "",
    gender: "Male",
    joining_date: new Date().toISOString().split('T')[0],
  });

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Convert base64 to File
  const dataURLtoFile = (dataurl: string, filename: string) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)![1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgSrc) {
      toast.error("Please capture a photo first");
      return;
    }

    setLoading(true);
    try {
      const file = dataURLtoFile(imgSrc, `${formData.staff_id}.jpg`);
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });
      submitData.append("file", file);

      await api.post("/staff/register", submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success("Staff registered successfully!");
      
      // Reset form
      setFormData({
        staff_id: "",
        name: "",
        department: "",
        shift: "Morning",
        mobile: "",
        gender: "Male",
        joining_date: new Date().toISOString().split('T')[0],
      });
      setImgSrc(null);
      
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error registering staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
      
      {/* Form Section */}
      <div className="w-full md:w-1/2 p-8 border-r border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Register Staff</h2>
          <p className="text-sm text-gray-500 mt-1">Fill in the details and capture face data.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
              <input type="text" name="staff_id" required value={formData.staff_id} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="CLN001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="John Doe" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department/Area</label>
            <input type="text" name="department" required value={formData.department} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Main Building - 1st Floor" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <input type="tel" name="mobile" required value={formData.mobile} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="+1 234 567 890" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <select name="shift" value={formData.shift} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none">
                <option>Morning</option>
                <option>Evening</option>
                <option>Night</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
              <input type="date" name="joining_date" required value={formData.joining_date} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading || !imgSrc}
              className={`w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${
                loading || !imgSrc ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {loading ? (
                <RefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5" />
              ) : (
                <CheckCircle2 className="-ml-1 mr-2 h-5 w-5" />
              )}
              {loading ? 'Saving...' : 'Register Staff & Generate Embedding'}
            </button>
          </div>
        </form>
      </div>

      {/* Camera Section */}
      <div className="w-full md:w-1/2 p-8 bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm">
          {!imgSrc ? (
            <div className="bg-black rounded-2xl overflow-hidden aspect-square relative shadow-lg">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: 400, height: 400, facingMode: "user" }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-2 border-primary/50 m-8 rounded-lg pointer-events-none border-dashed" />
              
              <button
                onClick={capture}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-gray-900 rounded-full px-6 py-2.5 text-sm font-medium shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Camera className="w-4 h-4" /> Capture Face
              </button>
            </div>
          ) : (
            <div className="bg-black rounded-2xl overflow-hidden aspect-square relative shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc} alt="Captured face" className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <button
                  onClick={retake}
                  className="bg-white text-gray-900 rounded-full px-6 py-2.5 text-sm font-medium shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Retake Image
                </button>
              </div>
              
              <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full p-2 shadow-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <h4 className="text-sm font-semibold text-gray-800">Instructions</h4>
            <ul className="mt-2 text-xs text-gray-500 space-y-1">
              <li>• Ensure the face is well-lit and clearly visible.</li>
              <li>• Keep the face inside the dashed box.</li>
              <li>• Look straight into the camera without glasses/masks.</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
