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
  const [registrationMethod, setRegistrationMethod] = useState<"camera" | "upload">("camera");

  const handleMethodChange = (method: "camera" | "upload") => {
    setRegistrationMethod(method);
    setImgSrc(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImgSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgSrc) {
      toast.error(
        registrationMethod === "camera"
          ? "Please capture a photo first"
          : "Please upload a photo first"
      );
      return;
    }

    setLoading(true);
    try {
      const mimeMatch = imgSrc.match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const extension = mimeType.split('/')[1] || 'jpg';
      const file = dataURLtoFile(imgSrc, `${formData.staff_id}.${extension}`);
      
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
      
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || "Error registering staff");
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
              <input type="text" name="staff_id" required value={formData.staff_id} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base md:text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="CLN001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base md:text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="John Doe" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department/Area</label>
            <input type="text" name="department" required value={formData.department} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base md:text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Main Building - 1st Floor" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <input type="tel" name="mobile" required value={formData.mobile} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base md:text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="+1 234 567 890" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <select name="shift" value={formData.shift} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base md:text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none">
                <option>Morning</option>
                <option>Evening</option>
                <option>Night</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base md:text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
              <input type="date" name="joining_date" required value={formData.joining_date} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base md:text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
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

      {/* Photo Section */}
      <div className="w-full md:w-1/2 p-8 bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm">
          {/* Method Selector Tabs */}
          <div className="flex border border-gray-200 rounded-xl p-1 bg-white mb-6 w-full shadow-sm">
            <button
              type="button"
              onClick={() => handleMethodChange("camera")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                registrationMethod === "camera"
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-950 hover:bg-gray-50"
              }`}
            >
              <Camera className="w-4 h-4" />
              Live Capture
            </button>
            <button
              type="button"
              onClick={() => handleMethodChange("upload")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                registrationMethod === "upload"
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-950 hover:bg-gray-50"
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload Photo
            </button>
          </div>

          {!imgSrc ? (
            registrationMethod === "camera" ? (
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
                  type="button"
                  onClick={capture}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-gray-900 rounded-full px-6 py-2.5 text-sm font-medium shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" /> Capture Face
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-2xl aspect-square flex flex-col items-center justify-center p-6 bg-white shadow-md cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="p-4 bg-gray-50 rounded-full group-hover:bg-primary/5 transition-colors mb-4">
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Upload employee photo</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG, WEBP up to 10MB</p>
              </div>
            )
          ) : (
            <div className="bg-black rounded-2xl overflow-hidden aspect-square relative shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc} alt="Employee face" className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={retake}
                  className="bg-white text-gray-900 rounded-full px-6 py-2.5 text-sm font-medium shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> {registrationMethod === "camera" ? "Retake Image" : "Remove Image"}
                </button>
              </div>
              
              <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full p-2 shadow-lg animate-scale-in">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <h4 className="text-sm font-semibold text-gray-800">Instructions</h4>
            <ul className="mt-2 text-xs text-gray-500 space-y-1.5">
              {registrationMethod === "camera" ? (
                <>
                  <li>• Ensure the face is well-lit and clearly visible.</li>
                  <li>• Keep the face inside the dashed box.</li>
                  <li>• Look straight into the camera without glasses/masks.</li>
                </>
              ) : (
                <>
                  <li>• Upload a clear, front-facing portrait.</li>
                  <li>• Ensure the employee&apos;s face is fully visible.</li>
                  <li>• Neutral lighting and plain background recommended.</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
