"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import {
  Camera,
  Upload,
  RefreshCw,
  Scan,
  CheckCircle,
  Scale,
  Activity,
  Leaf,
  MapPin,
  Trash2,
  Eye,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Pencil,
  DollarSign,
  Flame,
  FileText,
  BarChart3,
  Info,
} from 'lucide-react';
import { toast } from '@/shared/hooks/use-toast';

/* types */
interface Co2Match {
  ingredient: string;
  co2ePerKg: number | null;
  matchedLabel: string | null;
}

interface LineAnalysis {
  dishName: string;
  category: string;
  weightKg: number;
  costEUR: number;
  costBreakdown: string | null;
  co2Kg: number;
  co2ePerKg: number;
  co2Source: 'menu' | 'ai-predicted' | 'default';
  co2Matches: Co2Match[];
  confidence: number;
  freshness: 'fresh' | 'rotten';
  freshnessConfidence: number;
  freshnessReason: string;
  ingredients: string[];
  matchedMenuItem: string | null;
  inMenu: boolean;
}

const DEFAULT_CO2_PER_KG = 2.1;
const DEFAULT_COST_PER_KG = 4.5;

export default function WasteWatchdogLinePage() {
  const [activeTab, setActiveTab] = useState('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [analysis, setAnalysis] = useState<LineAnalysis | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<string | null>(null);
  const [lastScanAt, setLastScanAt] = useState<string | null>(null);

  const [manualDish, setManualDish] = useState('');
  const [manualWeight, setManualWeight] = useState('');
  const [manualCategory, setManualCategory] = useState('food');
  const [manualStation, setManualStation] = useState('kitchen');
  const [manualNotes, setManualNotes] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanInProgressRef = useRef(false);

  const isLocalHost = (host: string) => ['localhost', '127.0.0.1', '::1'].includes(host);

  const startCamera = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        if (!window.isSecureContext && !isLocalHost(window.location.hostname)) {
          toast({ title: 'Camera Error', description: 'Camera requires HTTPS or localhost.', variant: 'destructive' });
          return;
        }
      }
      if (!navigator?.mediaDevices?.getUserMedia) throw new Error('Camera not available.');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast({ title: 'Camera Error', description: 'Unable to access camera.', variant: 'destructive' });
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  const toDataUrl = (blob: Blob): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });

  const parseWeightKg = (wt: string | number | undefined) => {
    if (!wt) return 0.3;
    if (typeof wt === 'number') return wt;
    const m = wt.match(/([0-9]+(?:\.[0-9]+)?)/);
    return m ? Number(m[1]) : 0.3;
  };

  const mapToAnalysis = (data: any): LineAnalysis => {
    const weightKg = data.weightKg ?? parseWeightKg(data.estimatedWeight);
    const ingredients = data.recipeIngredients || data.predictedIngredients || [];
    const co2Matches: Co2Match[] = (data.co2Matches || []).map((m: any) => ({
      ingredient: m.ingredient,
      co2ePerKg: m.co2ePerKg ?? null,
      matchedLabel: m.matchedLabel ?? null,
    }));

    return {
      dishName: data.dishName || 'Unknown Dish',
      category: data.category || 'Food Waste',
      weightKg: Number.isFinite(weightKg) ? Number(weightKg.toFixed(3)) : 0.3,
      costEUR: data.estimatedCostEUR ?? Number((weightKg * DEFAULT_COST_PER_KG).toFixed(2)),
      costBreakdown: data.costBreakdown || null,
      co2Kg: data.co2Kg ?? Number((weightKg * DEFAULT_CO2_PER_KG).toFixed(3)),
      co2ePerKg: data.co2ePerKg ?? DEFAULT_CO2_PER_KG,
      co2Source: data.co2Source || 'default',
      co2Matches,
      confidence: Math.min(1, (Number(data.confidence) || 80) / 100),
      freshness: data.freshness === 'fresh' ? 'fresh' : 'rotten',
      freshnessConfidence: data.freshnessConfidence ?? 60,
      freshnessReason: data.freshnessReason || '',
      ingredients,
      matchedMenuItem: data.matchedMenuItem ?? null,
      inMenu: data.inMenu ?? false,
    };
  };

  const analyzeImage = useCallback(async (imageBlob: Blob) => {
    try {
      scanInProgressRef.current = true;
      setIsScanning(true);
      const imageDataUrl = await toDataUrl(imageBlob);

      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        const response = await fetch('/api/analyzeWaste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageDataUrl, source: 'line' }),
        });

        if (response.status === 429 && attempt < 3) {
          const wait = Number(response.headers.get('Retry-After') || 10) * 1000;
          toast({ title: `AI busy — retrying in ${wait / 1000}s (${attempt}/3)…` });
          await new Promise(r => setTimeout(r, wait));
          continue;
        }

        if (!response.ok) {
          lastError = new Error(`Analysis failed (${response.status})`);
          break;
        }

        const data = await response.json();
        setAnalysis(mapToAnalysis(data));
        setLastScanAt(new Date().toLocaleTimeString());
        return; // success
      }
      throw lastError ?? new Error('Analysis failed');
    } catch {
      toast({ title: 'Scan Failed', description: 'Unable to analyze this image. Please try again in a moment.', variant: 'destructive' });
    } finally {
      scanInProgressRef.current = false;
      setIsScanning(false);
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || scanInProgressRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const sw = video.videoWidth, sh = video.videoHeight;
    const longest = Math.max(sw, sh);
    const scale = longest > 1024 ? 1024 / longest : 1;
    canvas.width = Math.round(sw * scale);
    canvas.height = Math.round(sh * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (blob) {
        setLastSnapshotAt(new Date().toLocaleTimeString());
        await analyzeImage(blob);
      }
    }, 'image/jpeg', 0.7);
  }, [analyzeImage]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const processUploadedFile = async () => {
    if (!selectedFile) return;
    await analyzeImage(selectedFile);
  };

  const handleManualLog = async () => {
    const weight = parseFloat(manualWeight);
    if (!manualDish.trim() || isNaN(weight) || weight <= 0) {
      toast({ title: 'Missing info', description: 'Enter dish name and weight.', variant: 'destructive' });
      return;
    }
    try {
      await fetch('/api/waste/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountKg: weight,
          type: manualCategory,
          station: manualStation,
          notes: `Manual: ${manualDish}${manualNotes ? ' \u2014 ' + manualNotes : ''}`,
        }),
      });
      toast({ title: 'Logged', description: `${manualDish} (${weight} kg) recorded.` });
      setManualDish('');
      setManualWeight('');
      setManualNotes('');
    } catch {
      toast({ title: 'Error', description: 'Failed to log entry.', variant: 'destructive' });
    }
  };

  const confirmAndLog = async () => {
    if (!analysis) return;
    try {
      await fetch('/api/waste/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountKg: analysis.weightKg,
          type: 'food',
          station: 'kitchen',
          confidence: analysis.confidence,
          notes: `AI: ${analysis.dishName} | CO2: ${analysis.co2Kg} kg (${analysis.co2Source}) | Cost: EUR${analysis.costEUR}`,
        }),
      });
      toast({
        title: 'Waste Event Logged',
        description: `${analysis.dishName} - ${(analysis.weightKg * 1000).toFixed(0)}g, EUR${analysis.costEUR.toFixed(2)}, ${analysis.co2Kg.toFixed(2)} kg CO2`,
      });
      setAnalysis(null);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to log waste event.', variant: 'destructive' });
    }
  };

  const co2SourceBadge = (source: string) => {
    switch (source) {
      case 'menu':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">From Menu Recipe</Badge>;
      case 'ai-predicted':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">AI Predicted</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Default Estimate</Badge>;
    }
  };

  const renderResults = () => {
    if (!analysis) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-slate-50 p-4 mb-4">
              <BarChart3 className="w-12 h-12 text-slate-300" />
            </div>
            <p className="text-slate-600 font-medium">No analysis yet</p>
            <p className="text-sm text-slate-400 mt-1">Capture or upload an image to get a detailed breakdown</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{analysis.dishName}</CardTitle>
                <CardDescription>{analysis.category}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline"
                  className={analysis.freshness === 'fresh'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-red-300 bg-red-50 text-red-700'}>
                  {analysis.freshness === 'fresh' ? (
                    <><ShieldCheck className="w-3 h-3 mr-1" /> Fresh</>
                  ) : (
                    <><AlertTriangle className="w-3 h-3 mr-1" /> Spoiled</>
                  )}
                </Badge>
                {analysis.inMenu && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    <MapPin className="w-3 h-3 mr-1" /> In Menu
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 text-center border border-blue-100">
                <Scale className="w-4 h-4 text-blue-600 mx-auto mb-0.5" />
                <p className="text-xl font-bold text-blue-700">{(analysis.weightKg * 1000).toFixed(0)}</p>
                <p className="text-[11px] font-medium text-blue-600/70">grams</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 p-3 text-center border border-red-100">
                <DollarSign className="w-4 h-4 text-red-600 mx-auto mb-0.5" />
                <p className="text-xl font-bold text-red-700">\u20AC{analysis.costEUR.toFixed(2)}</p>
                <p className="text-[11px] font-medium text-red-600/70">cost</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 text-center border border-emerald-100">
                <Leaf className="w-4 h-4 text-emerald-600 mx-auto mb-0.5" />
                <p className="text-xl font-bold text-emerald-700">{analysis.co2Kg.toFixed(2)}</p>
                <p className="text-[11px] font-medium text-emerald-600/70">kg CO\u2082e</p>
              </div>
            </div>

            {analysis.matchedMenuItem && (
              <div className="flex items-center justify-between rounded-lg border px-3 py-2 mb-3">
                <span className="text-sm text-slate-600">Menu match</span>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">\u2713 {analysis.matchedMenuItem}</Badge>
              </div>
            )}

            {analysis.freshness === 'fresh' ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Fresh \u2014 Recoverable</p>
                    <p className="text-xs text-emerald-600">{analysis.freshnessReason} ({analysis.freshnessConfidence}%)</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Spoiled \u2014 Must Dispose</p>
                    <p className="text-xs text-red-600">{analysis.freshnessReason} ({analysis.freshnessConfidence}%)</p>
                  </div>
                </div>
              </div>
            )}

            {analysis.costBreakdown && (
              <div className="rounded-lg border bg-amber-50 border-amber-200 p-3 mb-3">
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Cost Breakdown</p>
                    <p className="text-xs text-amber-700 mt-0.5">{analysis.costBreakdown}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                CO\u2082 Emissions Breakdown
              </CardTitle>
              {co2SourceBadge(analysis.co2Source)}
            </div>
            <CardDescription className="text-xs">
              {analysis.co2Source === 'menu'
                ? 'Calculated from actual menu recipe ingredients matched against IFEU database'
                : analysis.co2Source === 'ai-predicted'
                  ? 'Calculated from AI-predicted ingredients matched against IFEU database'
                  : 'Using default estimate \u2014 upload more recipes for better accuracy'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 border p-3 mb-4">
              <div>
                <p className="text-sm font-medium text-slate-700">Total CO\u2082 equivalent</p>
                <p className="text-xs text-slate-500">{analysis.co2ePerKg.toFixed(2)} kg CO\u2082e/kg \u00D7 {analysis.weightKg.toFixed(3)} kg</p>
              </div>
              <p className="text-2xl font-bold text-emerald-700">{analysis.co2Kg.toFixed(3)} <span className="text-sm font-medium">kg</span></p>
            </div>

            {analysis.co2Matches.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingredient CO\u2082 Factors (IFEU)</h4>
                <div className="divide-y rounded-lg border overflow-hidden">
                  {analysis.co2Matches.map((match, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 text-sm bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${match.co2ePerKg !== null ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="text-slate-800 truncate">{match.ingredient}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {match.matchedLabel && match.matchedLabel !== match.ingredient && (
                          <span className="text-xs text-slate-400 max-w-[140px] truncate">\u2192 {match.matchedLabel}</span>
                        )}
                        {match.co2ePerKg !== null ? (
                          <span className="font-mono font-semibold text-slate-900">{match.co2ePerKg.toFixed(1)}</span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">no match</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                  <Info className="w-3 h-3" />
                  Values in kg CO\u2082e per kg food. Source: IFEU 2020 environmental footprints study (Germany).
                </p>
              </div>
            ) : analysis.ingredients.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Detected Ingredients</h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.ingredients.map((ing, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{ing}</Badge>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">No IFEU CO\u2082 matches found \u2014 using default estimate.</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No ingredient data available \u2014 using default CO\u2082 factor.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex gap-3">
              <Button onClick={confirmAndLog} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm & Log Waste Event
              </Button>
              <Button variant="outline" onClick={() => { setAnalysis(null); setSelectedFile(null); setPreviewUrl(null); }}>
                <Trash2 className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Waste Watchdog Line</h1>
          <p className="text-slate-600 mt-1">Capture, upload or manually log waste \u2014 AI analyses weight, cost, CO\u2082 & freshness</p>
        </div>
        <Badge variant="outline" className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span>AI Scanner Online</span>
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="camera" className="flex items-center gap-2">
            <Camera className="w-4 h-4" /> Camera
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Pencil className="w-4 h-4" /> Manual Entry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="camera" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5" /> Line Camera</CardTitle>
                <CardDescription>Point camera at waste for AI analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative bg-slate-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"
                    onLoadedMetadata={() => videoRef.current?.play()} />
                  {isScanning && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p>Analyzing\u2026</p>
                      </div>
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Last snapshot: {lastSnapshotAt || '\u2014'}</span>
                  <span>Last analysis: {lastScanAt || '\u2014'}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Button onClick={startCamera} variant="outline"><Eye className="w-4 h-4 mr-1" /> Start</Button>
                  <Button onClick={stopCamera} variant="outline"><Trash2 className="w-4 h-4 mr-1" /> Stop</Button>
                  <Button onClick={capturePhoto} disabled={isScanning}>
                    <Scan className="w-4 h-4 mr-1" /> {isScanning ? 'Scanning\u2026' : 'Capture'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-4">{renderResults()}</div>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" /> Upload Image</CardTitle>
                <CardDescription>Upload a photo of waste for detailed analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="line-file-upload">Select Image</Label>
                  <Input ref={fileInputRef} id="line-file-upload" type="file" accept="image/*" onChange={handleFileUpload} />
                </div>
                {previewUrl ? (
                  <div className="space-y-3">
                    <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg border" />
                    <Button onClick={processUploadedFile} disabled={isScanning} className="w-full">
                      <Scan className="w-4 h-4 mr-2" />
                      {isScanning ? 'Analyzing\u2026' : 'Analyze Image'}
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Choose an image file</p>
                    <p className="text-sm text-slate-500">JPG, PNG, HEIC supported</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="space-y-4">{renderResults()}</div>
          </div>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Manual Waste Entry</CardTitle>
                <CardDescription>Manually log waste when camera is unavailable</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Dish / Item Name</Label>
                  <Input placeholder="e.g. Pasta Carbonara, Mixed Salad\u2026" value={manualDish} onChange={e => setManualDish(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input type="number" step="0.1" min="0" placeholder="0.5" value={manualWeight} onChange={e => setManualWeight(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={manualCategory} onValueChange={setManualCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="food">Food Waste</SelectItem>
                        <SelectItem value="organic">Organic</SelectItem>
                        <SelectItem value="oil">Oil Waste</SelectItem>
                        <SelectItem value="packaging">Packaging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Station</Label>
                  <Select value={manualStation} onValueChange={setManualStation}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="dining">Dining Area</SelectItem>
                      <SelectItem value="prep">Prep Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input placeholder="Additional details\u2026" value={manualNotes} onChange={e => setManualNotes(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                  <Info className="w-4 h-4 shrink-0" />
                  Manual entries are flagged for manager review
                </div>
                <Button onClick={handleManualLog} className="w-full" size="lg">
                  <CheckCircle className="w-4 h-4 mr-2" /> Log Waste Entry
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Leaf className="w-5 h-5" /> CO\u2082 Reference (IFEU)</CardTitle>
                <CardDescription>Common food CO\u2082 factors from IFEU 2020 study</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y rounded-lg border overflow-hidden text-sm">
                  {[
                    { name: 'Beef, average', co2: 13.6 },
                    { name: 'Butter', co2: 9.0 },
                    { name: 'Cheese, average', co2: 5.7 },
                    { name: 'Chicken, average', co2: 5.5 },
                    { name: 'Fish, aquaculture', co2: 5.1 },
                    { name: 'Cream', co2: 4.2 },
                    { name: 'Chocolate, milk', co2: 4.1 },
                    { name: 'Egg', co2: 3.0 },
                    { name: 'Rice', co2: 1.6 },
                    { name: 'Pasta', co2: 0.7 },
                    { name: 'Bread', co2: 0.6 },
                    { name: 'Potato', co2: 0.2 },
                    { name: 'Apple', co2: 0.3 },
                    { name: 'Broccoli, fresh', co2: 0.3 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-white hover:bg-slate-50">
                      <span className="text-slate-700">{item.name}</span>
                      <span className="font-mono font-semibold text-slate-900">{item.co2.toFixed(1)} <span className="text-xs font-normal text-slate-500">kg CO\u2082e/kg</span></span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Source: IFEU \u2013 Environmental footprints of food products (Germany, 2020)</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
