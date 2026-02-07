"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Camera, RefreshCw, Scan } from 'lucide-react';
import { toast } from '@/shared/hooks/use-toast';

interface LineScanResult {
  photoType: string;
  itemName: string;
  weightKg: number;
  co2Kg: number;
  confidence: number;
  matchedMenuItem?: string | null;
  inMenu?: boolean;
}

const DEFAULT_CO2_PER_KG = 2.1;

export default function WasteWatchdogLinePage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<LineScanResult | null>(null);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<string | null>(null);
  const [lastScanAt, setLastScanAt] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanInProgressRef = useRef(false);

  const startCamera = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host);
        if (!window.isSecureContext && !isLocal) {
          toast({
            title: 'Camera Error',
            description: 'Camera requires HTTPS or localhost.',
            variant: 'destructive'
          });
          return;
        }
      }
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera not available. Use HTTPS or grant permissions.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please check permissions.',
        variant: 'destructive'
      });
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const parseWeightKg = (weightText: string | number | undefined) => {
    if (!weightText) return 0.3;
    if (typeof weightText === 'number') return weightText;
    const match = weightText.match(/([0-9]+(?:\.[0-9]+)?)/);
    return match ? Number(match[1]) : 0.3;
  };

  const toDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const analyzeSnapshot = useCallback(async (blob: Blob) => {
    try {
      scanInProgressRef.current = true;
      const imageDataUrl = await toDataUrl(blob);
      const response = await fetch('/api/analyzeWaste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageDataUrl,
          source: 'line'
        })
      });

      if (!response.ok) {
        throw new Error('AI analysis failed');
      }

      const data = await response.json();
      const itemName = data.dishName || 'Unknown item';
      const photoType = data.category || 'Food Waste';
      const weightKg = parseWeightKg(data.estimatedWeight);
      const co2Kg = Number((weightKg * DEFAULT_CO2_PER_KG).toFixed(2));

      setScanResult({
        photoType,
        itemName,
        weightKg,
        co2Kg,
        confidence: 1,
        matchedMenuItem: data.matchedMenuItem ?? null,
        inMenu: data.inMenu ?? false
      });
      setLastScanAt(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Line scan error:', error);
      toast({
        title: 'Scan Failed',
        description: 'Unable to analyze this image. Please try again.',
        variant: 'destructive'
      });
    } finally {
      scanInProgressRef.current = false;
      setIsScanning(false);
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (scanInProgressRef.current) return;

    setIsScanning(true);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      const sourceWidth = video.videoWidth;
      const sourceHeight = video.videoHeight;
      const longestSide = Math.max(sourceWidth, sourceHeight);
      const targetLongestSide = 1024;
      const scale = longestSide > targetLongestSide ? targetLongestSide / longestSide : 1;
      const targetWidth = Math.round(sourceWidth * scale);
      const targetHeight = Math.round(sourceHeight * scale);

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      context.drawImage(video, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(async (blob) => {
        if (blob) {
          setLastSnapshotAt(new Date().toLocaleTimeString());
          await analyzeSnapshot(blob);
        }
      }, 'image/jpeg', 0.7);
    }
  }, [analyzeSnapshot]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Waste Watchdog Line</h1>
          <p className="text-slate-600 mt-1">Capture images to estimate volume-based waste, no scale required.</p>
        </div>
        <Badge variant="outline" className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span>AI Scanner Online</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Line Camera</span>
            </CardTitle>
            <CardDescription>Capture waste image for analysis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative bg-slate-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    videoRef.current.play();
                  }
                }}
              />
              {isScanning && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>Analyzing...</p>
                  </div>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Last snapshot: {lastSnapshotAt || '—'}</span>
              <span>Last analysis: {lastScanAt || '—'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button onClick={startCamera} variant="outline" className="w-full">
                Start Camera
              </Button>
              <Button onClick={stopCamera} variant="outline" className="w-full">
                Stop Camera
              </Button>
              <Button onClick={capturePhoto} disabled={isScanning} className="w-full">
                <Scan className="w-4 h-4 mr-2" />
                {isScanning ? 'Scanning...' : 'Capture Waste'}
              </Button>
            </div>

                {scanResult && (
                  <div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm">
                    <span className="text-slate-600">Menu match</span>
                    {scanResult.inMenu && scanResult.matchedMenuItem ? (
                      <span className="font-medium text-emerald-600">
                        {scanResult.matchedMenuItem}
                      </span>
                    ) : (
                      <span className="font-medium text-rose-600">Not in menu</span>
                    )}
                  </div>
                )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scan className="w-5 h-5" />
              <span>Line Results</span>
            </CardTitle>
            <CardDescription>Photo type, volume-based weight, and CO₂ estimate.</CardDescription>
          </CardHeader>
          <CardContent>
            {scanResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-slate-600">Photo Type</p>
                    <p className="text-lg font-bold text-slate-900">{scanResult.photoType}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-600">Estimated Weight</p>
                    <p className="text-lg font-bold text-blue-600">{(scanResult.weightKg * 1000).toFixed(2)} g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-600">CO₂</p>
                    <p className="text-lg font-bold text-green-600">{scanResult.co2Kg.toFixed(2)} kg</p>
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="text-sm text-slate-500">Item</p>
                  <p className="text-base font-semibold text-slate-900">{scanResult.itemName}</p>
                </div>

              </div>
            ) : (
              <div className="text-center py-12">
                <Scan className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No results yet</p>
                <p className="text-sm text-slate-500">Capture an image to analyze waste.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
