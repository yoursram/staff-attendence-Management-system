"use client";

import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, CheckCircle2, UserX, ScanFace, Play, Square, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function ScanAttendance() {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const dataURLtoFile = (dataurl: string, filename: string) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)![1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  };

  const submitScan = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    setIsSubmitting(true);
    try {
      const file = dataURLtoFile(imageSrc, 'scan.jpg');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('camera_location', 'Main Gate');
      formData.append('confirm', 'false');

      const response = await api.post('/attendance/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.requires_verification) {
        const detected = response.data.data?.recognized_people || [];
        setCandidates(detected);
        setSelectedIds(detected.map((person: any) => person.staff_id));
        setLastResult({ type: 'review', message: response.data.message, data: detected });
        toast.info('Please verify the detected people before saving attendance.');
      } else if (response.data.success) {
        toast.success(response.data.message);
        setLastResult({ type: 'success', data: response.data.data });
      } else {
        setLastResult({ type: 'unknown', message: response.data.message });
      }
    } catch (error) {
      console.error('Scan error', error);
      toast.error('Unable to process attendance scan.');
    } finally {
      setIsSubmitting(false);
    }
  }, [webcamRef]);

  const confirmAttendance = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    setIsSubmitting(true);
    try {
      const file = dataURLtoFile(imageSrc, 'scan.jpg');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('camera_location', 'Main Gate');
      formData.append('confirm', 'true');
      formData.append('confirmed_staff_ids', selectedIds.join(','));

      const response = await api.post('/attendance/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('Attendance saved for the verified people.');
        setLastResult({ type: 'success', data: response.data.data });
        setCandidates([]);
        setSelectedIds([]);
      } else {
        toast.error(response.data.message || 'Could not save attendance.');
      }
    } catch (error) {
      console.error('Confirm attendance error', error);
      toast.error('Unable to confirm attendance.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedIds, webcamRef]);

  const toggleSelection = (staffId: string) => {
    setSelectedIds((current) =>
      current.includes(staffId) ? current.filter((id) => id !== staffId) : [...current, staffId]
    );
  };

  const toggleScan = () => {
    setIsScanning(!isScanning);
    if (!isScanning) {
      toast.info('Camera Started');
    } else {
      toast.info('Camera Stopped');
      setLastResult(null);
      setCandidates([]);
      setSelectedIds([]);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start h-full">
      <div className="w-full lg:w-2/3 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ScanFace className="text-primary" /> Live Scanner
          </h2>
          <div className="flex gap-2">
            <button
              onClick={submitScan}
              disabled={!isScanning || isSubmitting}
              className="flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
            >
              <Camera className="w-4 h-4 mr-2" /> Capture & Review
            </button>
            <button
              onClick={toggleScan}
              className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm ${
                isScanning ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {isScanning ? (
                <><Square className="w-4 h-4 mr-2" fill="currentColor" /> Stop Scanner</>
              ) : (
                <><Play className="w-4 h-4 mr-2" fill="currentColor" /> Start Scanner</>
              )}
            </button>
          </div>
        </div>

        <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-inner">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'user' }}
            className={`w-full h-full object-cover transition-opacity duration-300 ${isScanning ? 'opacity-100' : 'opacity-50'}`}
          />

          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 bg-black/40">
              <Camera className="w-16 h-16 mb-4 opacity-50" />
              <p>Scanner is currently stopped.</p>
              <p className="text-sm">Click Start Scanner and capture an image to review detected people.</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-1/3 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[300px]">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Verification</h3>

          {!lastResult ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <ScanFace className="w-12 h-12 mb-3 opacity-20" />
              <p>Capture an image to review matches.</p>
            </div>
          ) : lastResult.type === 'review' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <ShieldCheck className="w-4 h-4" />
                <span>{lastResult.message}</span>
              </div>
              <div className="space-y-2">
                {candidates.map((person) => (
                  <label key={person.staff_id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 cursor-pointer">
                    <span>
                      <span className="font-semibold text-gray-800">{person.name}</span>
                      <span className="ml-2 text-xs text-gray-500">{person.staff_id}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(person.staff_id)}
                      onChange={() => toggleSelection(person.staff_id)}
                    />
                  </label>
                ))}
              </div>
              <button
                onClick={confirmAttendance}
                disabled={isSubmitting || selectedIds.length === 0}
                className="w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Save Verified Attendance
              </button>
            </div>
          ) : lastResult.type === 'success' ? (
            <div className="flex flex-col items-center bg-green-50 border border-green-100 p-6 rounded-xl text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h4 className="text-xl font-bold text-gray-900">Attendance Saved</h4>
              <div className="w-full mt-4 text-left text-sm text-gray-700">
                {(lastResult.data?.marked_people || []).map((person: any) => (
                  <div key={person.staff_id} className="mb-2 rounded border border-green-100 bg-white p-2">
                    {person.name} ({person.staff_id})
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center bg-red-50 border border-red-100 p-6 rounded-xl text-center">
              <UserX className="w-16 h-16 text-red-500 mb-4" />
              <h4 className="text-lg font-bold text-gray-900">Unknown Person</h4>
              <p className="text-sm text-gray-500 mt-1">{lastResult.message || 'Face not found in the database.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
