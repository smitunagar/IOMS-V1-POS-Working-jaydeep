"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
}

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
          })
          .catch((err) => {
            console.error("Error stopping scanner:", err);
          });
      }
    };
  }, []);

  // Check camera permission on mount
  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setPermissionStatus('denied');
        setError('Camera not available. Use HTTPS or grant permissions.');
        return;
      }
      // Check if browser supports permissions API
      if (navigator.permissions && navigator.permissions.query) {
        const permissionResult = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionStatus(permissionResult.state);
        
        // Listen for permission changes
        permissionResult.onchange = () => {
          setPermissionStatus(permissionResult.state);
        };
      } else {
        // Fallback: try to access camera to check permission
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop()); // Stop immediately
          setPermissionStatus('granted');
        } catch {
          setPermissionStatus('prompt');
        }
      }
    } catch (err) {
      console.error("Error checking camera permission:", err);
      setPermissionStatus('prompt');
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      setError(null);
      setPermissionStatus('checking');

      if (!navigator?.mediaDevices?.getUserMedia) {
        setPermissionStatus('denied');
        setError('Camera not available. Use HTTPS or grant permissions.');
        return false;
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Prefer back camera on mobile
        } 
      });
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionStatus('granted');
      return true;
    } catch (err: any) {
      console.error("Camera permission denied:", err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        setError("Camera permission denied. Please allow camera access in your browser settings and try again.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionStatus('denied');
        setError("No camera found. Please ensure your device has a camera.");
      } else {
        setPermissionStatus('denied');
        setError(err.message || "Failed to access camera. Please check your browser settings.");
      }
      return false;
    }
  };

  const startScanning = async () => {
    try {
      setError(null);
      setScannedCode(null);

      // First, request camera permission if not already granted
      if (permissionStatus !== 'granted') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          setIsScanning(false);
          return;
        }
      }

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const selectedCameraId = cameraId || devices[0].id;
        setCameraId(selectedCameraId);

        // Create scanner instance
        const scanner = new Html5Qrcode("qr-reader", {
          verbose: false,
        });

        scannerRef.current = scanner;

        // Start scanning
        await scanner.start(
          selectedCameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Success callback
            setScannedCode(decodedText);
            setIsScanning(false);
            onScanSuccess(decodedText);
            
            // Stop scanning after successful scan
            scanner
              .stop()
              .then(() => {
                scanner.clear();
              })
              .catch((err) => {
                console.error("Error stopping scanner:", err);
              });
          },
          (errorMessage) => {
            // Error callback - ignore NotFoundException (no QR code found yet)
            if (errorMessage && !errorMessage.includes("NotFoundException")) {
              console.log("Scan error (ignored):", errorMessage);
            }
          }
        );

        setIsScanning(true);
      } else {
        setError("No cameras found. Please ensure your device has a camera.");
      }
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
        setPermissionStatus('denied');
      } else {
        setError(
          err.message || "Failed to access camera. Please check permissions."
        );
      }
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setIsScanning(false);
        setError(null);
      } catch (err: any) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const handleClose = () => {
    stopScanning();
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-enterprise p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-wm-blue rounded-xl flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-wm-blue">Scan QR Code</h3>
            <p className="text-sm text-gray-500">Scan a QR code to process orders</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close Scanner"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Scanner Container */}
        <div
          ref={scannerContainerRef}
          id="qr-reader"
          className="w-full bg-gray-100 rounded-xl overflow-hidden"
          style={{ minHeight: "300px" }}
        />

        {/* Permission Status Messages */}
        {permissionStatus === 'denied' && !error && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="font-bold text-yellow-700">Camera Permission Required</span>
            </div>
            <p className="text-sm text-yellow-600 mt-1">
              Please allow camera access to scan QR codes. Click "Start Scanning" to request permission.
            </p>
          </div>
        )}

        {permissionStatus === 'checking' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="font-bold text-blue-700">Checking camera permission...</span>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {scannedCode && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-bold text-green-700">QR Code Scanned Successfully!</span>
            </div>
            <p className="text-sm text-green-600 font-mono break-all">{scannedCode}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-bold text-red-700">Error</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            {permissionStatus === 'denied' && (
              <div className="mt-2 text-xs text-red-500">
                <p>To enable camera access:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Click the camera icon in your browser's address bar</li>
                  <li>Or go to browser Settings → Privacy → Site Settings → Camera</li>
                  <li>Allow camera access for this site</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center gap-3">
          {!isScanning ? (
            <button
              onClick={startScanning}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-wm-blue hover:bg-[#23294a] text-white font-bold rounded-xl transition-colors"
            >
              <Camera className="w-5 h-5" />
              Start Scanning
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
              Stop Scanning
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

