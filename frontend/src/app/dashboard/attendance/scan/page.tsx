"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Camera, CheckCircle2, UserX, ScanFace, Play, Square } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function ScanAttendance() {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // Convert base64 to File
  const dataURLtoFile = (dataurl: string, filename: string) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)![1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  const captureAndScan = useCallback(async () => {
    if (!isScanning) return;
    
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      try {
        const file = dataURLtoFile(imageSrc, 'scan.jpg');
        const formData = new FormData();
        formData.append("file", file);
        formData.append("camera_location", "Main Gate");

        const response = await api.post("/attendance/scan", formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
          toast.success(response.data.message);
          setLastResult({
            type: 'success',
            ...response.data.data
          });
        } else {
          if (response.data.message === "Unknown Person") {
            // Optional: don't show toast for every unknown frame, just update UI
            setLastResult({ type: 'unknown', message: 'Unknown Person' });
          } else if (response.data.message.includes("Already recorded")) {
             setLastResult({ type: 'warning', ...response.data.data, message: response.data.message });
          }
        }
      } catch (error) {
        console.error("Scan error", error);
      }
    }
  }, [isScanning, webcamRef]);

  // Scan interval loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      interval = setInterval(() => {
        captureAndScan();
      }, 7000); // Check every 7 seconds to avoid spamming the backend
    }
    return () => clearInterval(interval);
  }, [isScanning, captureAndScan]);

  const toggleScan = () => {
    setIsScanning(!isScanning);
    if (!isScanning) {
      toast.info("Camera Started");
    } else {
      toast.info("Camera Stopped");
      setLastResult(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start h-full">
      {/* Live Camera View */}
      <div className="w-full lg:w-2/3 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ScanFace className="text-primary" /> Live Scanner
          </h2>
          <button
            onClick={toggleScan}
            className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm ${
              isScanning 
                ? "bg-red-100 text-red-700 hover:bg-red-200" 
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {isScanning ? (
              <><Square className="w-4 h-4 mr-2" fill="currentColor" /> Stop Scanner</>
            ) : (
              <><Play className="w-4 h-4 mr-2" fill="currentColor" /> Start Scanner</>
            )}
          </button>
        </div>

        <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-inner">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            className={`w-full h-full object-cover transition-opacity duration-300 ${isScanning ? 'opacity-100' : 'opacity-50'}`}
          />
          
          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 bg-black/40">
              <Camera className="w-16 h-16 mb-4 opacity-50" />
              <p>Scanner is currently stopped.</p>
              <p className="text-sm">Click Start Scanner to begin recognizing faces.</p>
            </div>
          )}

          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-1/2 h-2/3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-primary/50 border-dashed rounded-lg" />
              {/* Optional: Add animated scan line here */}
            </div>
          )}
        </div>
      </div>

      {/* Results View */}
      <div className="w-full lg:w-1/3 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[300px]">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Recognition Result</h3>
          
          {!lastResult ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <ScanFace className="w-12 h-12 mb-3 opacity-20" />
              <p>Waiting for a face...</p>
            </div>
          ) : lastResult.type === 'success' ? (
            <div className="flex flex-col items-center bg-green-50 border border-green-100 p-6 rounded-xl text-center animate-in zoom-in duration-300">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h4 className="text-xl font-bold text-gray-900">{lastResult.name}</h4>
              <p className="text-sm font-medium text-gray-500 mt-1">{lastResult.staff_id}</p>
              
              <div className="w-full mt-6 bg-white rounded-lg p-4 shadow-sm border border-green-50 text-left">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Status</span>
                  <span className="font-semibold text-green-700">Present</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Time Marked</span>
                  <span className="font-semibold text-gray-800">{lastResult.time}</span>
                </div>
              </div>
            </div>
          ) : lastResult.type === 'warning' ? (
             <div className="flex flex-col items-center bg-yellow-50 border border-yellow-100 p-6 rounded-xl text-center animate-in zoom-in duration-300">
              <CheckCircle2 className="w-16 h-16 text-yellow-500 mb-4" />
              <h4 className="text-xl font-bold text-gray-900">{lastResult.name}</h4>
              <p className="text-sm font-medium text-gray-500 mt-1">{lastResult.staff_id}</p>
              
              <div className="w-full mt-6 bg-white rounded-lg p-4 shadow-sm border border-yellow-50 text-left">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Status</span>
                  <span className="font-semibold text-yellow-700">Already Marked</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center bg-red-50 border border-red-100 p-6 rounded-xl text-center">
              <UserX className="w-16 h-16 text-red-500 mb-4" />
              <h4 className="text-lg font-bold text-gray-900">Unknown Person</h4>
              <p className="text-sm text-gray-500 mt-1">Face not found in the database.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
