"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useAuth } from '@/features/auth/AuthContext';
import POSWasteIntegrationService from '@/lib/posWasteIntegration';
import { seedMensaPilotData } from '@/features/mensa-pilot/pilotData';
import { 
  Camera, 
  Upload, 
  Scan, 
  CheckCircle, 
  RefreshCw,
  Eye,
  Scale,
  Trash2,
  Activity,
  Clock,
  User,
  MapPin,
  Pencil,
  Leaf,
  Package,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/shared/hooks/use-toast';

interface ScanResult {
  items: Array<{
    name: string;
    category: string;
    weight: number;
    confidence: number;
    freshness: 'fresh' | 'rotten';
    freshnessConfidence: number;
    freshnessReason: string;
  }>;
  totalWeightKg: number;
  co2Kg: number;
  costEUR: number;
  confidence: number;
  freshness: 'fresh' | 'rotten';
  freshnessConfidence: number;
  freshnessReason: string;
  matchedMenuItem?: string | null;
  inMenu?: boolean;
  menuMatchScore?: number | null;
}

interface WasteEventData {
  amountKg: number;
  type: 'food' | 'oil' | 'packaging' | 'organic';
  station: 'kitchen' | 'bar' | 'dining';
  staffId?: number;
  photoUrl?: string;
  confidence?: number;
  notes?: string;
}

const SNAPSHOT_INTERVAL_MS = 5000;

const FOOD_LIBRARY = [
  { name: 'Mixed vegetables', category: 'vegetable', costPerKg: 6.5, co2PerKg: 2.4 },
  { name: 'Bread waste', category: 'bakery', costPerKg: 3.1, co2PerKg: 1.8 },
  { name: 'Pasta', category: 'grain', costPerKg: 4.2, co2PerKg: 1.6 },
  { name: 'Rice', category: 'grain', costPerKg: 2.8, co2PerKg: 1.2 },
  { name: 'Grilled chicken', category: 'protein', costPerKg: 11.5, co2PerKg: 6.1 },
  { name: 'Fish fillet', category: 'protein', costPerKg: 12.9, co2PerKg: 5.4 },
  { name: 'Salad mix', category: 'vegetable', costPerKg: 5.4, co2PerKg: 2.1 },
  { name: 'Potato wedges', category: 'vegetable', costPerKg: 3.6, co2PerKg: 1.4 },
  { name: 'Fruit medley', category: 'fruit', costPerKg: 7.2, co2PerKg: 1.9 },
  { name: 'Dessert tray', category: 'dessert', costPerKg: 9.8, co2PerKg: 3.2 },
];

export default function HardwareCapturePage() {
  const [activeTab, setActiveTab] = useState('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [lastThrottle, setLastThrottle] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordingToPOS, setRecordingToPOS] = useState(false);
  const [lastSnapshotUrl, setLastSnapshotUrl] = useState<string | null>(null);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<string | null>(null);
  const [lastScanAt, setLastScanAt] = useState<string | null>(null);
  const [posMatchMessage, setPosMatchMessage] = useState<string | null>(null);
  const [scaleWeight, setScaleWeight] = useState<number | null>(null);
  const [scaleUnit, setScaleUnit] = useState<string>('kg');
  const [scaleStatus, setScaleStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [tareWeightGrams, setTareWeightGrams] = useState<number>(0);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [recoveringToInventory, setRecoveringToInventory] = useState(false);
  
  // Form data for manual confirmation
  const [wasteType, setWasteType] = useState<'food' | 'oil' | 'packaging' | 'organic'>('food');
  const [station, setStation] = useState<'kitchen' | 'bar' | 'dining'>('kitchen');
  const [notes, setNotes] = useState('');

  const { currentUser } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanInProgressRef = useRef(false);
  const lastSnapshotUrlRef = useRef<string | null>(null);
  const isMensaPilot = process.env.NEXT_PUBLIC_MENSA_PILOT === 'true';
  const scaleSocketRef = useRef<WebSocket | null>(null);
  const isLocalHost = (host: string) => ['localhost', '127.0.0.1', '::1'].includes(host);
  const resolveScaleBridgeUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_SCALE_BRIDGE_WS;
    if (envUrl) {
      if (typeof window === 'undefined') {
        return envUrl;
      }
      const host = window.location.hostname;
      const envIsLocal = /localhost|127\.0\.0\.1/.test(envUrl);
      if (!isLocalHost(host) && envIsLocal) {
        // Ignore localhost env in production browser
      } else {
        return envUrl;
      }
    }
    if (typeof window === 'undefined') {
      return 'ws://localhost:8787/ws';
    }
    const { protocol, hostname, port } = window.location;
    const isLocalAccess = isLocalHost(hostname) || port === '3000';
    if (isLocalAccess) {
      return `ws://${hostname}:8787/ws`;
    }
    const wsProtocol = protocol === 'https:' ? 'wss' : 'ws';
    return `${wsProtocol}://${window.location.host}/scale-bridge/ws`;
  };
  const scaleBridgeUrl = resolveScaleBridgeUrl();
  const scaleReconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scaleHasConnectedRef = useRef(false);
  const scalePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scaleWeightRef = useRef<number | null>(null);

  const getScaleHealthUrl = () => {
    const url = new URL(scaleBridgeUrl);
    const protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    const basePath = url.pathname.replace(/\/ws$/, '');
    return `${protocol}//${url.host}${basePath}/health`;
  };

  const normalizeScaleUnit = (unit?: string | null) => {
    if (!unit) return 'kg';
    const normalized = unit.toLowerCase();
    if (['g', 'gram', 'grams'].includes(normalized)) return 'g';
    if (['kg', 'kgs', 'kilogram', 'kilograms'].includes(normalized)) return 'kg';
    if (['lb', 'lbs', 'pound', 'pounds'].includes(normalized)) return 'lb';
    return unit;
  };

  const resolveScaleUnit = (weight: number, unit?: string | null) => {
    const normalized = normalizeScaleUnit(unit);
    if (normalized === 'kg' && weight > 5 && weight <= 500) {
      return 'g';
    }
    return normalized;
  };

  const toKg = (weight: number, unit?: string | null) => {
    const normalized = normalizeScaleUnit(unit);
    if (normalized === 'g') return weight / 1000;
    if (normalized === 'lb') return weight * 0.45359237;
    return weight;
  };

  useEffect(() => {
    if (!isMensaPilot) return;
    if (!currentUser?.id) return;
    seedMensaPilotData(currentUser.id);
  }, [currentUser?.id, isMensaPilot]);

  const tareWeightKg = tareWeightGrams / 1000;
  const netWeightKg = scaleWeight !== null
    ? Math.max(0, scaleWeight - tareWeightKg)
    : null;

  useEffect(() => {
    scaleWeightRef.current = netWeightKg;
  }, [netWeightKg]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Exponential backoff: 2s → 4s → 8s → 16s → 30s cap
    let reconnectDelay = 2000;
    const RECONNECT_MIN = 2000;
    const RECONNECT_MAX = 30000;
    const resetBackoff = () => { reconnectDelay = RECONNECT_MIN; };
    const nextBackoff = () => {
      const delay = reconnectDelay;
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX);
      return delay;
    };

    const connect = async () => {
      if (scaleSocketRef.current?.readyState === WebSocket.OPEN) return;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 800);
        try {
          const healthUrl = getScaleHealthUrl();
          const response = await fetch(healthUrl, { signal: controller.signal });
          if (!response.ok) {
            setScaleStatus('disconnected');
            scaleReconnectRef.current = setTimeout(connect, nextBackoff());
            return;
          }
        } catch {
          setScaleStatus('disconnected');
          scaleReconnectRef.current = setTimeout(connect, nextBackoff());
          return;
        } finally {
          clearTimeout(timeout);
        }

        // Health check passed — reset backoff before connecting WS
        resetBackoff();

        const socket = new WebSocket(scaleBridgeUrl);
        scaleSocketRef.current = socket;

        socket.addEventListener('open', () => {
          scaleHasConnectedRef.current = true;
          setScaleStatus('connected');
          resetBackoff();
        });

        socket.addEventListener('message', (event) => {
          try {
            const payload = JSON.parse(event.data as string);
            if (payload?.type === 'weight' && typeof payload.weight === 'number') {
              const unit = resolveScaleUnit(payload.weight, payload.unit);
              setScaleUnit(unit);
              setScaleWeight(toKg(payload.weight, unit));
            }
          } catch {
            // ignore parse errors silently
          }
        });

        socket.addEventListener('close', () => {
          setScaleStatus('disconnected');
          scaleReconnectRef.current = setTimeout(connect, nextBackoff());
        });

        socket.addEventListener('error', () => {
          setScaleStatus(scaleHasConnectedRef.current ? 'error' : 'disconnected');
          scaleReconnectRef.current = setTimeout(connect, nextBackoff());
        });
      } catch {
        setScaleStatus(scaleHasConnectedRef.current ? 'error' : 'disconnected');
        scaleReconnectRef.current = setTimeout(connect, nextBackoff());
      }
    };

    connect();

    // HTTP polling only as a fallback when WebSocket is not connected (10s interval)
    if (!scalePollRef.current) {
      scalePollRef.current = setInterval(async () => {
        // Skip polling when WebSocket is alive
        if (scaleSocketRef.current?.readyState === WebSocket.OPEN) return;
        try {
          const healthUrl = getScaleHealthUrl();
          const weightUrl = healthUrl.replace('/health', '/weight');
          const response = await fetch(weightUrl);
          if (!response.ok) return;
          const data = await response.json();
          if (typeof data.weight === 'number') {
            const unit = resolveScaleUnit(data.weight, data.unit);
            setScaleUnit(unit);
            setScaleWeight(toKg(data.weight, unit));
          }
        } catch {
          // ignore polling errors silently
        }
      }, 10000);
    }

    return () => {
      if (scaleReconnectRef.current) {
        clearTimeout(scaleReconnectRef.current);
      }
      if (scalePollRef.current) {
        clearInterval(scalePollRef.current);
        scalePollRef.current = null;
      }
      scaleSocketRef.current?.close();
      scaleSocketRef.current = null;
      scaleHasConnectedRef.current = false;
    };
  }, [scaleBridgeUrl]);


  // Record waste event to POS system
  const recordWasteToPOS = async (wasteData: any) => {
    if (!currentUser) return;
    
    try {
      setRecordingToPOS(true);
      const integrationService = POSWasteIntegrationService;
      
      await integrationService.recordWaste({
        itemName: wasteData.name || 'Unknown waste',
        quantity: wasteData.weight || 0,
        unit: 'kg',
        wasteType: 'food',
        cost: wasteData.costEUR || 0,
        reason: 'captured_via_scanner',
        category: wasteData.category || wasteType
      });
      
      toast({
        title: "✅ Recorded to POS",
        description: "Waste event synced with point of sale system"
      });
    } catch (error) {
      console.error('Failed to record to POS:', error);
      toast({
        title: "Warning",
        description: "Waste recorded locally, POS sync failed",
        variant: "destructive"
      });
    } finally {
      setRecordingToPOS(false);
    }
  };

  // Throttling mechanism (5 seconds)
  const checkThrottle = useCallback((silent?: boolean) => {
    const now = Date.now();
    if (now - lastThrottle < SNAPSHOT_INTERVAL_MS) {
      if (!silent) {
        toast({
          title: "Please wait",
          description: `Wait ${Math.ceil((SNAPSHOT_INTERVAL_MS - (now - lastThrottle)) / 1000)} seconds before next scan`,
          variant: "destructive"
        });
      }
      return false;
    }
    setLastThrottle(now);
    return true;
  }, [lastThrottle]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        if (!window.isSecureContext && !isLocalHost(window.location.hostname)) {
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
          facingMode: 'environment' // Use back camera on mobile
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // Capture photo from camera
  const updateSnapshotUrl = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    if (lastSnapshotUrlRef.current) {
      URL.revokeObjectURL(lastSnapshotUrlRef.current);
    }
    lastSnapshotUrlRef.current = url;
    setLastSnapshotUrl(url);
    setLastSnapshotAt(new Date().toLocaleTimeString());
  }, []);

  const toDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const parseWeightKg = (weightText: string | number | undefined) => {
    if (!weightText) return 0.5;
    if (typeof weightText === 'number') return weightText;
    const match = weightText.match(/([0-9]+(?:\.[0-9]+)?)/);
    return match ? Number(match[1]) : 0.5;
  };

  const mapAnalysisToScan = useCallback((analysis: any, weightOverride?: number | null): ScanResult => {
    const dishName = analysis?.dishName || 'Unknown Dish';
    const category = analysis?.category || 'food';
    const fallbackWeight = parseWeightKg(analysis?.estimatedWeight);
    const safeOverride = typeof weightOverride === 'number' && !Number.isNaN(weightOverride)
      ? weightOverride
      : null;
    const weightKg = safeOverride ?? fallbackWeight;
    const resolvedWeight = Number.isFinite(weightKg) ? weightKg : fallbackWeight;
    const finalWeight = Number.isFinite(resolvedWeight) ? resolvedWeight : 0.5;
    const confidence = Math.min(1, (Number(analysis?.confidence) || 80) / 100);
    const matched = FOOD_LIBRARY.find(item => item.name.toLowerCase() === dishName.toLowerCase());
    const costPerKg = matched?.costPerKg ?? 4.5;
    const co2PerKg = matched?.co2PerKg ?? 2.1;
    const roundedWeight = Number(finalWeight.toFixed(2));
    const safeCost = Number.isFinite(roundedWeight) ? Number((roundedWeight * costPerKg).toFixed(2)) : 0;
    const safeCo2 = Number.isFinite(roundedWeight) ? Number((roundedWeight * co2PerKg).toFixed(2)) : 0;
    const freshness: 'fresh' | 'rotten' = analysis?.freshness === 'fresh' ? 'fresh' : 'rotten';
    const freshnessConfidence = typeof analysis?.freshnessConfidence === 'number' ? analysis.freshnessConfidence : 60;
    const freshnessReason = analysis?.freshnessReason || '';

    return {
      items: [
        {
          name: dishName,
          category,
          weight: roundedWeight,
          confidence,
          freshness,
          freshnessConfidence,
          freshnessReason,
        }
      ],
      totalWeightKg: roundedWeight,
      co2Kg: safeCo2,
      costEUR: safeCost,
      confidence,
      freshness,
      freshnessConfidence,
      freshnessReason,
      matchedMenuItem: analysis?.matchedMenuItem ?? null,
      inMenu: analysis?.inMenu ?? false,
      menuMatchScore: typeof analysis?.menuMatchScore === 'number' ? analysis.menuMatchScore : null,
    };
  }, [parseWeightKg]);

  const analyzeSnapshot = useCallback(async (imageBlob: Blob) => {
    try {
      scanInProgressRef.current = true;
      const imageDataUrl = await toDataUrl(imageBlob);
      const response = await fetch('/api/analyzeWaste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageDataUrl,
          source: 'station',
          station,
          weightKg: typeof scaleWeightRef.current === 'number' ? scaleWeightRef.current : null
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      const weightOverride = typeof scaleWeightRef.current === 'number'
        ? scaleWeightRef.current
        : null;
      const mapped = mapAnalysisToScan(data, weightOverride);
      setScanResult(mapped);
      setLastScanAt(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Scan Failed',
        description: 'Unable to analyze this image. Please try again.',
        variant: 'destructive'
      });
    } finally {
      scanInProgressRef.current = false;
      setIsScanning(false);
    }
  }, [mapAnalysisToScan, station, toDataUrl]);

  const capturePhoto = useCallback(async (options?: { silent?: boolean; source?: 'auto' | 'manual' }) => {
    if (!checkThrottle(options?.silent)) return;
    
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
      
      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          updateSnapshotUrl(blob);
          await analyzeSnapshot(blob);
        }
      }, 'image/jpeg', 0.7);
    }
  }, [checkThrottle, analyzeSnapshot, updateSnapshotUrl]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Process uploaded file
  const processUploadedFile = async () => {
    if (!selectedFile || !checkThrottle()) return;
    
    setIsScanning(true);
    await analyzeSnapshot(selectedFile);
  };


  useEffect(() => {
    return () => {
      stopCamera();
      if (lastSnapshotUrlRef.current) {
        URL.revokeObjectURL(lastSnapshotUrlRef.current);
      }
    };
  }, []);

  // Category helpers for interactive scan results
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      vegetable: '🥬', bakery: '🍞', grain: '🌾', protein: '🍗',
      fruit: '🍎', dessert: '🍰', food: '🍽️', oil: '🫒',
      packaging: '📦', organic: '🌱'
    };
    return icons[category] || '🍽️';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      vegetable: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      bakery: 'bg-amber-50 text-amber-700 border-amber-200',
      grain: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      protein: 'bg-rose-50 text-rose-700 border-rose-200',
      fruit: 'bg-orange-50 text-orange-700 border-orange-200',
      dessert: 'bg-pink-50 text-pink-700 border-pink-200',
      food: 'bg-blue-50 text-blue-700 border-blue-200',
    };
    return colors[category] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const updateItemWeight = (index: number, newWeightGrams: number) => {
    if (!scanResult) return;
    const newWeightKg = newWeightGrams / 1000;
    const updatedItems = scanResult.items.map((item, i) =>
      i === index ? { ...item, weight: Number(newWeightKg.toFixed(3)) } : item
    );
    const totalWeightKg = updatedItems.reduce((sum, item) => sum + item.weight, 0);
    const matched = FOOD_LIBRARY.find(f => f.name.toLowerCase() === updatedItems[0]?.name.toLowerCase());
    const costPerKg = matched?.costPerKg ?? 4.5;
    const co2PerKg = matched?.co2PerKg ?? 2.1;
    setScanResult({
      ...scanResult,
      items: updatedItems,
      totalWeightKg: Number(totalWeightKg.toFixed(3)),
      costEUR: Number((totalWeightKg * costPerKg).toFixed(2)),
      co2Kg: Number((totalWeightKg * co2PerKg).toFixed(2)),
    });
    setEditingItemIndex(null);
  };

  const removeItem = (index: number) => {
    if (!scanResult) return;
    const updatedItems = scanResult.items.filter((_, i) => i !== index);
    if (updatedItems.length === 0) {
      setScanResult(null);
      return;
    }
    const totalWeightKg = updatedItems.reduce((sum, item) => sum + item.weight, 0);
    const matched = FOOD_LIBRARY.find(f => f.name.toLowerCase() === updatedItems[0]?.name.toLowerCase());
    const costPerKg = matched?.costPerKg ?? 4.5;
    const co2PerKg = matched?.co2PerKg ?? 2.1;
    setScanResult({
      ...scanResult,
      items: updatedItems,
      totalWeightKg: Number(totalWeightKg.toFixed(3)),
      costEUR: Number((totalWeightKg * costPerKg).toFixed(2)),
      co2Kg: Number((totalWeightKg * co2PerKg).toFixed(2)),
    });
  };

  const recoverToInventory = async () => {
    if (!scanResult || scanResult.freshness !== 'fresh') return;
    setRecoveringToInventory(true);
    try {
      const item = scanResult.items[0];
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recover',
          items: [{
            name: item?.name || 'Recovered Item',
            category: item?.category || 'food',
            quantity: 1,
            weight: scanResult.totalWeightKg,
            unit: 'kg',
            source: 'waste-recovery',
            notes: `Recovered from waste scan — AI classified as fresh (${scanResult.freshnessConfidence}% confidence). ${scanResult.freshnessReason}`,
          }]
        })
      });
      if (!res.ok) throw new Error('Inventory API error');
      toast({
        title: '♻️ Recovered to Inventory',
        description: `${item?.name} (${(scanResult.totalWeightKg * 1000).toFixed(0)}g) added back to inventory as fresh stock.`,
      });
      setScanResult(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setNotes('');
    } catch (err) {
      console.error('Recovery error:', err);
      toast({
        title: 'Recovery Failed',
        description: 'Could not add item to inventory. Please try manually.',
        variant: 'destructive',
      });
    } finally {
      setRecoveringToInventory(false);
    }
  };

  // Shared scan results card — used by both Camera and Upload tabs
  const renderScanResults = (emptyIcon: React.ReactNode, emptyText: string, emptySubText: string) => (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>Scan Results</span>
            </CardTitle>
            <CardDescription>AI-detected waste items</CardDescription>
          </div>
          {scanResult && (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={scanResult.freshness === 'fresh'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-red-300 bg-red-50 text-red-700'
                }
              >
                {scanResult.freshness === 'fresh' ? (
                  <><ShieldCheck className="w-3 h-3 mr-1" /> Fresh</>
                ) : (
                  <><AlertTriangle className="w-3 h-3 mr-1" /> Spoiled</>
                )}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {posMatchMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{posMatchMessage}</span>
          </div>
        )}
        {scanResult ? (
          <div className="space-y-5">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 text-center border border-blue-100">
                <Scale className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-700">{(scanResult.totalWeightKg * 1000).toFixed(0)}</p>
                <p className="text-xs font-medium text-blue-600/70">grams</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 p-4 text-center border border-red-100">
                <Activity className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-700">€{scanResult.costEUR.toFixed(2)}</p>
                <p className="text-xs font-medium text-red-600/70">cost</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 text-center border border-emerald-100">
                <Leaf className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-emerald-700">{scanResult.co2Kg.toFixed(1)}</p>
                <p className="text-xs font-medium text-emerald-600/70">kg CO₂</p>
              </div>
            </div>

            {/* Freshness Classification Banner */}
            {scanResult.freshness === 'fresh' ? (
              <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-800">Fresh — Recoverable</p>
                      <p className="text-sm text-emerald-600 mt-0.5">{scanResult.freshnessReason}</p>
                      <p className="text-xs text-emerald-500 mt-1">{scanResult.freshnessConfidence}% confidence</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                    onClick={recoverToInventory}
                    disabled={recoveringToInventory}
                  >
                    {recoveringToInventory ? (
                      <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Recovering…</>
                    ) : (
                      <><Package className="h-4 w-4 mr-1.5" /> Recover to Inventory</>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-800">Spoiled — Must Dispose</p>
                    <p className="text-sm text-red-600 mt-0.5">{scanResult.freshnessReason}</p>
                    <p className="text-xs text-red-500 mt-1">{scanResult.freshnessConfidence}% confidence</p>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Match */}
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Menu Match</span>
              </div>
              {scanResult.inMenu && scanResult.matchedMenuItem ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                  ✓ {scanResult.matchedMenuItem}
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                  Not in menu
                </Badge>
              )}
            </div>

            {/* Detected Items */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Detected Items</h4>
              <div className="space-y-2">
                {scanResult.items.map((item, index) => (
                  <div
                    key={index}
                    className="group relative rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:shadow-md hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-lg border border-slate-100">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium mt-1 ${getCategoryColor(item.category)}`}>
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {editingItemIndex === index ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={editWeight}
                              onChange={(e) => setEditWeight(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = parseFloat(editWeight);
                                  if (!isNaN(val) && val > 0) updateItemWeight(index, val);
                                }
                                if (e.key === 'Escape') setEditingItemIndex(null);
                              }}
                              className="w-20 h-8 text-right text-sm"
                              autoFocus
                            />
                            <span className="text-xs text-slate-500">g</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const val = parseFloat(editWeight);
                                if (!isNaN(val) && val > 0) updateItemWeight(index, val);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingItemIndex(index);
                              setEditWeight((item.weight * 1000).toFixed(0));
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 transition-colors hover:bg-slate-100"
                          >
                            <span className="text-lg font-bold text-slate-900">{(item.weight * 1000).toFixed(0)}</span>
                            <span className="text-sm text-slate-500">g</span>
                            <Pencil className="h-3 w-3 text-slate-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-slate-50 p-4 mb-4">
              {emptyIcon}
            </div>
            <p className="text-slate-600 font-medium">{emptyText}</p>
            <p className="text-sm text-slate-400 mt-1">{emptySubText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Confirm and log the waste event
  const confirmAndLog = async () => {
    if (!scanResult) return;
    
    const eventData: WasteEventData = {
      amountKg: scanResult.totalWeightKg,
      type: wasteType,
      station: station,
      confidence: scanResult.confidence,
      notes: notes || 'Auto-logged via AI scanner'
    };
    
    try {
      // Record to waste tracking API
      const response = await fetch('/api/waste/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
      
      // Record to POS integration system
      await recordWasteToPOS({
        name: scanResult.items[0]?.name || 'Mixed waste',
        weight: scanResult.totalWeightKg,
        costEUR: scanResult.costEUR,
        category: wasteType
      });
      
      if (response.ok) {
        toast({
          title: "Waste Event Logged",
          description: `Successfully logged ${scanResult.totalWeightKg.toFixed(1)}kg of ${wasteType} waste • Synced with POS`,
          variant: "default"
        });
        
        // Reset form
        setScanResult(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        setNotes('');
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error('Failed to log event');
      }
    } catch (error) {
      console.error('Error logging event:', error);
      toast({
        title: "Logging Failed",
        description: "Unable to log waste event. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hardware Capture</h1>
          <p className="text-slate-600 mt-1">Scan and log waste items using camera or file upload</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>AI Scanner Online</span>
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-full">
          <TabsTrigger value="camera" className="flex items-center space-x-2">
            <Camera className="w-4 h-4" />
            <span>Camera</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center space-x-2">
            <Scale className="w-4 h-4" />
            <span>Manual Entry</span>
          </TabsTrigger>
        </TabsList>

        {/* Camera Tab */}
        <TabsContent value="camera" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Camera Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="w-5 h-5" />
                  <span>Live Camera</span>
                </CardTitle>
                <CardDescription>Point camera at waste items to scan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${scaleStatus === 'connected' ? 'bg-emerald-500' : scaleStatus === 'error' ? 'bg-red-500' : 'bg-slate-400'}`} />
                    <span className="font-medium text-slate-700">Scale Bridge</span>
                    <span className="text-xs text-slate-500">{scaleStatus}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Live weight</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {scaleWeight !== null
                        ? (normalizeScaleUnit(scaleUnit) === 'g'
                          ? `${(scaleWeight * 1000).toFixed(2)} g`
                          : `${scaleWeight.toFixed(3)} kg`)
                        : '—'}
                    </p>
                  </div>
                </div>
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
                        <p>Scanning...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <canvas ref={canvasRef} className="hidden" />

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-slate-50 px-4 py-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Camera className="h-4 w-4 text-emerald-600" />
                      Capture waste on demand
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last snapshot: {lastSnapshotAt || '—'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Scan className="h-3 w-3" />
                        Last analysis: {lastScanAt || '—'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button 
                    onClick={startCamera} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                  <Button 
                    onClick={stopCamera}
                    variant="outline"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Stop Camera
                  </Button>
                  <Button 
                    onClick={() => capturePhoto({ source: 'manual' })}
                    disabled={isScanning}
                    className="w-full"
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    {isScanning ? 'Scanning...' : 'Capture Waste'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {renderScanResults(
                <Scan className="w-12 h-12 text-slate-300" />,
                'No scan results yet',
                'Use camera to scan waste items'
              )}
            </div>
          </div>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Upload Image</span>
                </CardTitle>
                <CardDescription>Upload a photo of waste items to scan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select Image</Label>
                  <Input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </div>

                {previewUrl && (
                  <div className="space-y-3">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button 
                      onClick={processUploadedFile}
                      disabled={isScanning}
                      className="w-full"
                    >
                      <Scan className="w-4 h-4 mr-2" />
                      {isScanning ? 'Processing...' : 'Process Image'}
                    </Button>
                  </div>
                )}

                {!selectedFile && (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Choose an image file to upload</p>
                    <p className="text-sm text-slate-500">Supports JPG, PNG, HEIC</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {renderScanResults(
              <Upload className="w-12 h-12 text-slate-300" />,
              'No scan results yet',
              'Upload an image to scan'
            )}
          </div>
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Manual Entry Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scale className="w-5 h-5" />
                  <span>Manual Entry</span>
                </CardTitle>
                <CardDescription>Manually log waste items without scanning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manual-weight">Weight (kg)</Label>
                    <Input
                      id="manual-weight"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      className="text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-items">Number of Items</Label>
                    <Input
                      id="manual-items"
                      type="number"
                      min="1"
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-category">Waste Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food Waste</SelectItem>
                      <SelectItem value="oil">Oil Waste</SelectItem>
                      <SelectItem value="packaging">Packaging</SelectItem>
                      <SelectItem value="organic">Organic Waste</SelectItem>
                      <SelectItem value="mixed">Mixed Waste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-station">Station</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="dining">Dining Area</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="prep">Prep Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-staff">Staff Member</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Chef John</SelectItem>
                      <SelectItem value="2">Server Maria</SelectItem>
                      <SelectItem value="3">Manager Alex</SelectItem>
                      <SelectItem value="4">Bartender Sam</SelectItem>
                      <SelectItem value="5">Prep Cook Lisa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-reason">Waste Reason (Optional)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overproduction">Overproduction</SelectItem>
                      <SelectItem value="spoilage">Spoilage</SelectItem>
                      <SelectItem value="customer-leftover">Customer Leftover</SelectItem>
                      <SelectItem value="prep-waste">Prep Waste</SelectItem>
                      <SelectItem value="expired">Expired Items</SelectItem>
                      <SelectItem value="accident">Accident/Spill</SelectItem>
                      <SelectItem value="portion-error">Portion Error</SelectItem>
                      <SelectItem value="quality-issue">Quality Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-notes">Additional Notes</Label>
                  <Input
                    id="manual-notes"
                    placeholder="Optional details about the waste..."
                  />
                </div>

                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-blue-800">
                    Manual entries are marked for verification by management
                  </span>
                </div>

                <Button className="w-full" size="lg">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Log Waste Entry
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions & Stats */}
            <div className="space-y-6">
              {/* Today's Manual Entries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Today's Entries</span>
                  </CardTitle>
                  <CardDescription>Manual waste logs for today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Food waste - Kitchen</p>
                          <p className="text-sm text-gray-600">2.3 kg • Chef John • 14:30</p>
                        </div>
                      </div>
                      <Badge variant="outline">Manual</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Packaging - Bar</p>
                          <p className="text-sm text-gray-600">0.8 kg • Server Maria • 13:15</p>
                        </div>
                      </div>
                      <Badge variant="outline">Manual</Badge>
                    </div>

                    <div className="text-center pt-3">
                      <p className="text-sm text-gray-600">5 manual entries today</p>
                      <p className="text-xs text-gray-500">€12.45 estimated cost</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Entry Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">87%</p>
                      <p className="text-sm text-green-800">AI Scanned</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">13%</p>
                      <p className="text-sm text-blue-800">Manual Entry</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 border rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span>This Week</span>
                      <span className="font-medium">23 entries</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span>Average per day</span>
                      <span className="font-medium">3.3 entries</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="w-4 h-4 mr-2" />
                    View All Manual Entries
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Staff Entry History
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="w-4 h-4 mr-2" />
                    Station Breakdown
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirmation Section */}
      {scanResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Confirm & Log</span>
            </CardTitle>
            <CardDescription>Verify details and log the waste event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="waste-type">Waste Type</Label>
                <Select value={wasteType} onValueChange={(value) => setWasteType(value as typeof wasteType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food Waste</SelectItem>
                    <SelectItem value="oil">Oil Waste</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                    <SelectItem value="organic">Organic Waste</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="station">Station</Label>
                <Select value={station} onValueChange={(value) => setStation(value as typeof station)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="dining">Dining Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={confirmAndLog}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm & Log Event
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setScanResult(null);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
