"use client";

import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import {
  Camera,
  CheckCircle2,
  UserX,
  ScanFace,
  Play,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Users,
  Clock,
  CheckSquare,
  Square,
  X
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function ScanAttendance() {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // State for already marked pop-up modal
  const [alreadyMarkedList, setAlreadyMarkedList] = useState<any[]>([]);
  const [showAlreadyMarkedModal, setShowAlreadyMarkedModal] = useState(false);

  const toggleCamera = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    toast.info(`Switched to ${nextMode === "user" ? "Front" : "Rear"} Camera`);
  };

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

    setCapturedImage(imageSrc);
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

      const data = response.data;
      const alreadyMarked = data.data?.already_marked_people || [];

      // Check if any person in the photo already marked attendance today
      if (alreadyMarked.length > 0) {
        setAlreadyMarkedList(alreadyMarked);
        setShowAlreadyMarkedModal(true);
        toast.warning(`${alreadyMarked.length} person(s) already took attendance today.`);
      }

      if (data.requires_verification) {
        const detected = data.data?.recognized_people || [];
        setCandidates(detected);
        
        // Auto-select staff who haven't marked yet, or all if everyone is new
        const unmarkedIds = detected.filter((p: any) => !p.is_already_marked).map((p: any) => p.staff_id);
        setSelectedIds(unmarkedIds.length > 0 ? unmarkedIds : detected.map((p: any) => p.staff_id));
        
        setLastResult({ type: 'review', message: data.message, data: detected });
        toast.info(`Detected ${detected.length} person(s). Verify before saving.`);
        setIsScanning(false);
      } else if (data.success) {
        toast.success(data.message);
        setLastResult({ type: 'success', data: data.data });
        setIsScanning(false);
      } else {
        setLastResult({ type: 'unknown', message: data.message });
        setIsScanning(false);
      }
    } catch (error) {
      console.error('Scan error', error);
      toast.error('Unable to process attendance scan.');
    } finally {
      setIsSubmitting(false);
    }
  }, [webcamRef, setIsScanning]);

  const confirmAttendance = useCallback(async () => {
    if (selectedIds.length === 0) {
      toast.warning('Please select at least one staff member to save.');
      return;
    }

    setIsSubmitting(true);
    try {
      let succeeded = false;
      let resultData: any = null;

      // 1. First attempt: call /attendance/scan with the saved photo from the scan step
      const imageToUse = capturedImage || webcamRef.current?.getScreenshot();
      if (imageToUse) {
        try {
          const file = dataURLtoFile(imageToUse, 'scan.jpg');
          const formData = new FormData();
          formData.append('file', file);
          formData.append('camera_location', 'Main Gate');
          formData.append('confirm', 'true');
          formData.append('confirmed_staff_ids', selectedIds.join(','));

          const response = await api.post('/attendance/scan', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (response.data?.success && response.data?.data) {
            succeeded = true;
            resultData = response.data.data;
          }
        } catch (scanErr) {
          console.warn('Confirm via scan endpoint failed, falling back to direct check-in:', scanErr);
        }
      }

      // 2. Reliable direct check-in fallback for all verified staff
      if (!succeeded) {
        const checkInPromises = selectedIds.map(async (staffId) => {
          try {
            await api.post('/attendance/check-in', {
              staff_id: staffId,
              status: 'Present'
            });
            const cand = candidates.find((c) => c.staff_id === staffId);
            return {
              staff_id: staffId,
              name: cand?.name || staffId,
              status: 'Present',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              date: new Date().toISOString().split('T')[0]
            };
          } catch (err) {
            console.error(`Error checking in staff ${staffId}:`, err);
            return null;
          }
        });

        const markedResults = (await Promise.all(checkInPromises)).filter(Boolean);
        if (markedResults.length > 0) {
          succeeded = true;
          resultData = {
            marked_people: markedResults,
            total_marked: markedResults.length,
            already_marked_people: []
          };
        }
      }

      if (succeeded) {
        toast.success('Attendance saved successfully!');
        setLastResult({ type: 'success', data: resultData });

        const alreadyMarked = resultData?.already_marked_people || [];
        if (alreadyMarked.length > 0) {
          setAlreadyMarkedList(alreadyMarked);
          setShowAlreadyMarkedModal(true);
        }

        setCandidates([]);
        setSelectedIds([]);
        setCapturedImage(null);
      } else {
        toast.error('Could not save attendance for selected staff.');
      }
    } catch (error: any) {
      console.error('Confirm attendance error', error);
      toast.error(error.response?.data?.detail || 'Unable to confirm attendance.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedIds, capturedImage, candidates, webcamRef]);

  const toggleSelection = (staffId: string) => {
    setSelectedIds((current) =>
      current.includes(staffId) ? current.filter((id) => id !== staffId) : [...current, staffId]
    );
  };

  const selectAll = () => {
    setSelectedIds(candidates.map((c) => c.staff_id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
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
      setCapturedImage(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start h-full w-full relative">
      {/* 🚨 Already Taken Attendance Pop-up Modal */}
      {showAlreadyMarkedModal && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 relative space-y-5">
            {/* Top Close Icon */}
            <button
              onClick={() => setShowAlreadyMarkedModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Warning Header */}
            <div className="flex items-center gap-3 border-b pb-4 border-amber-100">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Attendance Already Taken</h3>
                <p className="text-xs text-amber-700 font-medium">Recorded for today</p>
              </div>
            </div>

            {/* Already Marked Staff List */}
            <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
              {alreadyMarkedList.map((person) => (
                <div key={person.staff_id} className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{person.name}</p>
                    <p className="text-xs text-gray-500 font-mono">ID: {person.staff_id}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-200 text-amber-900">
                      <Clock className="w-3 h-3" /> {person.time || "Today"}
                    </span>
                    <p className="text-[10px] text-amber-800 mt-0.5 font-medium">{person.status || "Present"}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
              Duplicate attendance entries are automatically detected and skipped for today.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowAlreadyMarkedModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm transition-colors shadow-md flex items-center justify-center gap-2"
              >
                Got It / Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 Full Screen Overlay Camera View when scanning */}
      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col justify-between select-none animate-in fade-in duration-200">
          {/* Top Floating Control Bar */}
          <header className="bg-gradient-to-b from-black/80 to-transparent px-6 py-4 flex items-center justify-between text-white shrink-0 z-10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-sm font-bold tracking-wider uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" /> Multi-Person Scanner Active
              </span>
            </div>
            <button
              onClick={toggleScan}
              className="bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white px-4 py-2 rounded-xl text-xs font-bold border border-white/10"
            >
              Close Scanner
            </button>
          </header>

          {/* Full Screen Webcam container */}
          <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: facingMode }}
              className="w-full h-full object-cover"
            />
            {/* Guide overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
              <div className="w-72 h-72 sm:w-96 sm:h-96 border-2 border-dashed border-emerald-400/60 rounded-3xl flex items-center justify-center relative">
                {/* Corner markers */}
                <div className="w-8 h-8 border-t-4 border-l-4 border-emerald-400 absolute top-0 left-0 rounded-tl-xl" />
                <div className="w-8 h-8 border-t-4 border-r-4 border-emerald-400 absolute top-0 right-0 rounded-tr-xl" />
                <div className="w-8 h-8 border-b-4 border-l-4 border-emerald-400 absolute bottom-0 left-0 rounded-bl-xl" />
                <div className="w-8 h-8 border-b-4 border-r-4 border-emerald-400 absolute bottom-0 right-0 rounded-br-xl" />
                <span className="text-xs text-white/80 bg-black/60 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm">
                  Align multiple faces inside box
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Floating Control Bar */}
          <footer className="z-10 bg-gradient-to-t from-black/90 to-transparent p-6 flex flex-col items-center gap-4 shrink-0 pb-12">
            <div className="flex items-center gap-8 w-full justify-center">
              {/* Switch camera button */}
              <button
                onClick={toggleCamera}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center transition-all border border-white/10"
                title="Switch Camera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* Capture button */}
              <button
                onClick={submitScan}
                disabled={isSubmitting}
                className="w-20 h-20 rounded-full border-4 border-emerald-400 flex items-center justify-center active:scale-95 transition-all bg-white hover:bg-gray-100 disabled:opacity-50 cursor-pointer shadow-2xl relative"
                title="Capture Multiple Persons"
              >
                <div className="w-16 h-16 rounded-full bg-white border border-gray-300 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-emerald-600" />
                </div>
              </button>

              {/* Spacer */}
              <div className="w-12 h-12" />
            </div>
            <p className="text-white/80 text-xs tracking-wide font-medium bg-black/40 px-3 py-1 rounded-full border border-white/10">
              Detects and captures multiple people simultaneously
            </p>
          </footer>
        </div>
      )}

      {/* Regular Inline View when NOT scanning */}
      <div className="w-full lg:w-2/3 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ScanFace className="text-primary" /> Live Multi-Person Scanner
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Captures and processes multiple employee faces at once</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleScan}
              className="flex items-center px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm bg-primary text-white hover:bg-primary/90"
            >
              <Play className="w-4 h-4 mr-2" fill="currentColor" /> Start Scanner
            </button>
          </div>
        </div>

        <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-inner flex flex-col items-center justify-center text-white/70">
          <Camera className="w-16 h-16 mb-4 opacity-50 text-emerald-400 animate-pulse" />
          <p className="font-semibold text-gray-300">Multi-Person Scanner is ready.</p>
          <p className="text-sm text-gray-400 mt-1 max-w-sm text-center px-4">
            Click &quot;Start Scanner&quot; to open full-screen mode and scan staff members together.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/3 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[300px]">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
            <span>Verification</span>
            {candidates.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {candidates.length} Detected
              </span>
            )}
          </h3>

          {!lastResult ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <ScanFace className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Capture an image to review matches.</p>
            </div>
          ) : lastResult.type === 'review' ? (
            <div className="space-y-4">
              {/* Message Banner */}
              <div className="flex items-start gap-2 text-xs p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>{lastResult.message}</span>
              </div>

              {/* Select/Deselect All bar */}
              <div className="flex justify-between items-center text-xs text-gray-500 border-b pb-2">
                <span>Select persons to check-in:</span>
                <div className="flex gap-3">
                  <button onClick={selectAll} className="text-primary hover:underline font-medium">Select All</button>
                  <button onClick={deselectAll} className="text-gray-400 hover:underline">Deselect All</button>
                </div>
              </div>

              {/* List of Detected Persons */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {candidates.map((person) => {
                  const isSelected = selectedIds.includes(person.staff_id);
                  return (
                    <div
                      key={person.staff_id}
                      onClick={() => toggleSelection(person.staff_id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          person.is_already_marked ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {person.name ? person.name.charAt(0) : "S"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">{person.name}</span>
                            <span className="text-[10px] font-mono text-gray-400">({person.staff_id})</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-500">
                              Confidence: {(person.confidence * 100).toFixed(0)}%
                            </span>
                            {person.is_already_marked && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> Checked-in {person.marked_time}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-emerald-600">
                        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-300" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              <button
                onClick={confirmAttendance}
                disabled={isSubmitting || selectedIds.length === 0}
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Save Verified Attendance ({selectedIds.length})
              </button>
            </div>
          ) : lastResult.type === 'success' ? (
            <div className="flex flex-col items-center bg-emerald-50 border border-emerald-100 p-6 rounded-xl text-center">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mb-3" />
              <h4 className="text-lg font-bold text-gray-900">Attendance Saved</h4>
              <p className="text-xs text-gray-600 mt-1 mb-3">Recorded for today successfully.</p>
              
              <div className="w-full space-y-1.5 max-h-48 overflow-y-auto text-left text-xs">
                {(lastResult.data?.marked_people || []).map((person: any) => (
                  <div key={person.staff_id} className="p-2 rounded-lg border border-emerald-200 bg-white flex justify-between items-center">
                    <span className="font-medium text-gray-800">{person.name} ({person.staff_id})</span>
                    <span className="text-emerald-700 font-semibold">{person.time}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center bg-red-50 border border-red-100 p-6 rounded-xl text-center">
              <UserX className="w-14 h-14 text-red-500 mb-3" />
              <h4 className="text-lg font-bold text-gray-900">Unknown Person</h4>
              <p className="text-sm text-gray-500 mt-1">{lastResult.message || 'Face not found in database.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

