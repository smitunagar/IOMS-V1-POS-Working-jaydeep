"use client";

import { AppLayout } from "@/shared/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { 
  ShieldCheck, 
  ArrowLeft, 
  Thermometer,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Clock,
  User,
  MapPin,
  Save,
  X,
  Check,
  FileText,
  Download,
  Lock
} from "lucide-react";
import Link from "next/link";

// Workflow step types
type WorkflowStep = 
  | 'start'
  | 'checklist-selection'
  | 'ccp-step'
  | 'temperature-entry'
  | 'decision'
  | 'corrective-action'
  | 'validation'
  | 'escalation'
  | 'final-approval'
  | 'completion';

interface CCP {
  id: string;
  name: string;
  hazard: string;
  criticalLimit: string;
  frequency: string;
  location: string;
  minTemp?: number;
  maxTemp?: number;
  unit: string;
}

interface Task {
  id: string;
  name: string;
  type: 'temperature' | 'hygiene' | 'ccp';
  shift: string;
  station: string;
  dueTimes: string[];
  status: 'offen' | 'erledigt' | 'überfällig';
  completedAt?: string;
}

interface TemperatureReading {
  id: string;
  ccpId?: string;
  temperature: number;
  foodEquipment: string;
  location: string;
  timestamp: string;
  staffInitials: string;
  notes?: string;
  inRange: boolean;
}

interface CorrectiveAction {
  id: string;
  readingId: string;
  deviation: string;
  actionTaken: string;
  productBatch: string;
  disposition: 'weiterverarbeitet' | 'verworfen' | 'nachgekocht';
  performedBy: string;
  verifiedBy?: string;
  timestamp: string;
}

export default function HACCPPage() {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('start');
  const [selectedWorkflow, setSelectedWorkflow] = useState<'temperature' | 'hygiene' | 'ccp' | null>(null);
  const [selectedCCP, setSelectedCCP] = useState<CCP | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [temperatureReading, setTemperatureReading] = useState<Partial<TemperatureReading>>({});
  const [correctiveAction, setCorrectiveAction] = useState<Partial<CorrectiveAction>>({});
  const [stepHistory, setStepHistory] = useState<WorkflowStep[]>(['start']);
  const [readings, setReadings] = useState<TemperatureReading[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>([]);
  const [isSupervisor, setIsSupervisor] = useState(false);

  // Mock data - in production, fetch from API
  const [ccps] = useState<CCP[]>([
    {
      id: 'ccp-1',
      name: 'Warmhaltung Suppe',
      hazard: 'Bakterienwachstum',
      criticalLimit: 'Kern ≥ 72 °C für 15 Sek',
      frequency: 'Alle 2 Stunden',
      location: 'Warmhaltebereich Küche 1',
      minTemp: 72,
      unit: '°C'
    },
    {
      id: 'ccp-2',
      name: 'Kühlhaus 1',
      hazard: 'Bakterienwachstum',
      criticalLimit: '0–4 °C',
      frequency: '08:00, 12:00, 16:00',
      location: 'Kühlhaus 1',
      minTemp: 0,
      maxTemp: 4,
      unit: '°C'
    },
    {
      id: 'ccp-3',
      name: 'Tiefkühler',
      hazard: 'Gefrierbrand',
      criticalLimit: '≤ -18 °C',
      frequency: 'Täglich',
      location: 'Tiefkühler Küche 2',
      maxTemp: -18,
      unit: '°C'
    }
  ]);

  const [tasks] = useState<Task[]>([
    {
      id: 'task-1',
      name: 'Kühlhaus 1 Log',
      type: 'temperature',
      shift: 'Frühstück',
      station: 'Kühlhaus 1',
      dueTimes: ['08:00', '12:00', '16:00'],
      status: 'offen'
    },
    {
      id: 'task-2',
      name: 'Hygiene-Checkliste Küche',
      type: 'hygiene',
      shift: 'Frühstück',
      station: 'Küche 1',
      dueTimes: ['08:00'],
      status: 'erledigt',
      completedAt: '2024-01-15T08:15:00'
    },
    {
      id: 'task-3',
      name: 'Warmhaltung Suppe',
      type: 'ccp',
      shift: 'Mittagessen',
      station: 'Warmhaltebereich',
      dueTimes: ['11:00', '13:00', '15:00'],
      status: 'offen'
    }
  ]);

  const currentShift = 'Frühstück'; // In production, determine from time
  const currentStation = 'Küche 1'; // In production, get from user context
  const staffInitials = currentUser?.email?.split('@')[0].substring(0, 2).toUpperCase() || 'ST';

  useEffect(() => {
    // Check if user is supervisor (in production, check from API)
    setIsSupervisor(false); // TODO: Check user role
  }, [currentUser]);

  const getCurrentStepNumber = (): number => {
    const stepOrder: WorkflowStep[] = [
      'start',
      'checklist-selection',
      'ccp-step',
      'temperature-entry',
      'decision',
      'corrective-action',
      'validation',
      'escalation',
      'final-approval',
      'completion'
    ];
    return stepOrder.indexOf(currentStep) + 1;
  };

  const getTotalSteps = (): number => {
    // Dynamic based on workflow path
    if (currentStep === 'start') return 1;
    if (currentStep === 'checklist-selection') return 2;
    if (currentStep === 'ccp-step') return 3;
    if (currentStep === 'temperature-entry') return 4;
    if (currentStep === 'decision') return 5;
    if (currentStep === 'corrective-action') return 6;
    if (currentStep === 'validation') return 7;
    if (currentStep === 'final-approval') return 8;
    if (currentStep === 'completion') return 9;
    return 1;
  };

  const navigateToStep = (step: WorkflowStep) => {
    setStepHistory([...stepHistory, step]);
    setCurrentStep(step);
  };

  const goBack = () => {
    if (stepHistory.length > 1) {
      const newHistory = [...stepHistory];
      newHistory.pop();
      setCurrentStep(newHistory[newHistory.length - 1]);
      setStepHistory(newHistory);
    }
  };

  const handleWorkflowSelect = (workflow: 'temperature' | 'hygiene' | 'ccp') => {
    setSelectedWorkflow(workflow);
    if (workflow === 'temperature' || workflow === 'ccp') {
      navigateToStep('checklist-selection');
    } else {
      navigateToStep('checklist-selection');
    }
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    if (task.type === 'ccp') {
      const ccp = ccps.find(c => c.name === task.name);
      if (ccp) {
        setSelectedCCP(ccp);
        navigateToStep('ccp-step');
      }
    } else if (task.type === 'temperature') {
      navigateToStep('temperature-entry');
    }
  };

  const handleCCPSelect = (ccp: CCP) => {
    setSelectedCCP(ccp);
    navigateToStep('temperature-entry');
  };

  const handleTemperatureSubmit = () => {
    if (!selectedCCP || !temperatureReading.temperature) return;

    const inRange = checkTemperatureInRange(
      temperatureReading.temperature!,
      selectedCCP.minTemp,
      selectedCCP.maxTemp
    );

    const reading: TemperatureReading = {
      id: `reading-${Date.now()}`,
      ccpId: selectedCCP.id,
      temperature: temperatureReading.temperature!,
      foodEquipment: temperatureReading.foodEquipment || '',
      location: temperatureReading.location || selectedCCP.location,
      timestamp: temperatureReading.timestamp || new Date().toISOString(),
      staffInitials: temperatureReading.staffInitials || staffInitials,
      notes: temperatureReading.notes,
      inRange: inRange
    };

    setReadings([...readings, reading]);
    setTemperatureReading({});

    if (inRange) {
      // Move to next CCP or validation
      navigateToStep('validation');
    } else {
      // Trigger corrective action
      setCorrectiveAction({ readingId: reading.id });
      navigateToStep('corrective-action');
    }
  };

  const checkTemperatureInRange = (temp: number, min?: number, max?: number): boolean => {
    if (min !== undefined && temp < min) return false;
    if (max !== undefined && temp > max) return false;
    return true;
  };

  const handleCorrectiveActionSubmit = () => {
    if (!correctiveAction.deviation || !correctiveAction.actionTaken) return;

    const action: CorrectiveAction = {
      id: `action-${Date.now()}`,
      readingId: correctiveAction.readingId || '',
      deviation: correctiveAction.deviation,
      actionTaken: correctiveAction.actionTaken,
      productBatch: correctiveAction.productBatch || '',
      disposition: correctiveAction.disposition || 'weiterverarbeitet',
      performedBy: correctiveAction.performedBy || staffInitials,
      verifiedBy: correctiveAction.verifiedBy,
      timestamp: new Date().toISOString()
    };

    setCorrectiveActions([...correctiveActions, action]);
    setCorrectiveAction({});
    
    // Loop back to temperature entry
    navigateToStep('temperature-entry');
  };

  const handleFinalApproval = () => {
    if (!isSupervisor) return;
    navigateToStep('completion');
  };

  // Calculate today's summary
  const todaySummary = {
    readingsDone: readings.length,
    readingsPlanned: tasks.filter(t => t.type === 'temperature' || t.type === 'ccp').length * 3, // 3 per task
    openCorrectiveActions: correctiveActions.filter(a => !a.verifiedBy).length,
    approvalPending: currentStep !== 'completion' && currentStep !== 'final-approval'
  };

  // Render Start Screen
  const renderStartScreen = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Schicht</p>
            <p className="text-lg font-black text-[#1F2933]">{currentShift}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Station</p>
            <p className="text-lg font-black text-[#1F2933]">{currentStation}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Mitarbeiter</p>
            <p className="text-lg font-black text-[#1F2933]">{staffInitials}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleWorkflowSelect('temperature')}
            className="group p-8 bg-white border-2 border-[#E5E7EB] rounded-xl hover:border-[#2563EB] hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Thermometer className="w-8 h-8 text-[#2563EB]" strokeWidth={2.5} />
              </div>
              <ChevronRight className="w-6 h-6 text-[#6B7280] group-hover:text-[#2563EB] transition-colors" />
            </div>
            <h3 className="text-xl font-black text-[#1F2933] mb-2">Temperaturlog</h3>
            <p className="text-sm text-[#6B7280]">Temperaturmessungen für Kühl- und Warmhaltebereiche</p>
          </button>

          <button
            onClick={() => handleWorkflowSelect('hygiene')}
            className="group p-8 bg-white border-2 border-[#E5E7EB] rounded-xl hover:border-[#2563EB] hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <ClipboardCheck className="w-8 h-8 text-[#16A34A]" strokeWidth={2.5} />
              </div>
              <ChevronRight className="w-6 h-6 text-[#6B7280] group-hover:text-[#2563EB] transition-colors" />
            </div>
            <h3 className="text-xl font-black text-[#1F2933] mb-2">Hygiene-Checkliste</h3>
            <p className="text-sm text-[#6B7280]">Hygiene- und Reinigungsprotokolle</p>
          </button>

          <button
            onClick={() => handleWorkflowSelect('ccp')}
            className="group p-8 bg-white border-2 border-[#E5E7EB] rounded-xl hover:border-[#2563EB] hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <CheckCircle2 className="w-8 h-8 text-[#F59E0B]" strokeWidth={2.5} />
              </div>
              <ChevronRight className="w-6 h-6 text-[#6B7280] group-hover:text-[#2563EB] transition-colors" />
            </div>
            <h3 className="text-xl font-black text-[#1F2933] mb-2">CCP-Prüfung</h3>
            <p className="text-sm text-[#6B7280]">Kritische Kontrollpunkte prüfen</p>
          </button>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
        <h3 className="text-lg font-black text-[#1F2933] mb-4">Heute fertig?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-bold text-[#6B7280] mb-1">Messungen</p>
            <p className="text-2xl font-black text-[#1F2933]">
              {todaySummary.readingsDone} / {todaySummary.readingsPlanned}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-bold text-[#6B7280] mb-1">Offene Korrekturmaßnahmen</p>
            <p className="text-2xl font-black text-[#1F2933]">{todaySummary.openCorrectiveActions}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-bold text-[#6B7280] mb-1">Genehmigung</p>
            <p className={`text-2xl font-black ${todaySummary.approvalPending ? 'text-[#F59E0B]' : 'text-[#16A34A]'}`}>
              {todaySummary.approvalPending ? 'Ausstehend' : 'Abgeschlossen'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Checklist Selection Screen
  const renderChecklistSelection = () => {
    const todayTasks = tasks.filter(t => t.shift === currentShift);
    
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <h3 className="text-lg font-black text-[#1F2933] mb-4">Heutige Aufgaben - {currentShift}</h3>
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => handleTaskSelect(task)}
                className="w-full p-4 bg-gray-50 border border-[#E5E7EB] rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-black text-[#1F2933]">{task.name}</h4>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        task.status === 'erledigt' 
                          ? 'bg-[#DCFCE7] text-[#166534]'
                          : task.status === 'überfällig'
                          ? 'bg-[#FEE2E2] text-[#7F1D1D]'
                          : 'bg-[#FEF3C7] text-[#92400E]'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {task.station}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {task.dueTimes.join(', ')}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#6B7280]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render CCP Step Screen
  const renderCCPStep = () => {
    if (!selectedCCP) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <h3 className="text-lg font-black text-[#1F2933] mb-6">{selectedCCP.name}</h3>
          
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs font-bold text-[#7F1D1D] uppercase tracking-wider mb-1">Gefahr</p>
              <p className="text-sm font-black text-[#1F2933]">{selectedCCP.hazard}</p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider mb-1">Kritisches Limit</p>
              <p className="text-sm font-black text-[#1F2933]">{selectedCCP.criticalLimit}</p>
            </div>
            
            <div className="p-4 bg-gray-50 border border-[#E5E7EB] rounded-lg">
              <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Häufigkeit</p>
              <p className="text-sm font-black text-[#1F2933]">{selectedCCP.frequency}</p>
            </div>
            
            <div className="p-4 bg-gray-50 border border-[#E5E7EB] rounded-lg">
              <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Standort</p>
              <p className="text-sm font-black text-[#1F2933]">{selectedCCP.location}</p>
            </div>
          </div>

          <button
            onClick={() => navigateToStep('temperature-entry')}
            className="w-full py-4 bg-[#2563EB] hover:bg-blue-700 text-white font-black rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Thermometer className="w-5 h-5" />
            Start Messung
          </button>
        </div>
      </div>
    );
  };

  // Render Temperature Entry Screen
  const renderTemperatureEntry = () => {
    if (!selectedCCP) return null;

    const currentTime = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const isInRange = temperatureReading.temperature 
      ? checkTemperatureInRange(temperatureReading.temperature, selectedCCP.minTemp, selectedCCP.maxTemp)
      : null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <h3 className="text-lg font-black text-[#1F2933] mb-6">Temperaturmessung - {selectedCCP.name}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#1F2933] mb-2">
                Temperatur * {selectedCCP.unit}
              </label>
              <input
                type="number"
                step="0.1"
                value={temperatureReading.temperature || ''}
                onChange={(e) => setTemperatureReading({
                  ...temperatureReading,
                  temperature: parseFloat(e.target.value)
                })}
                className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl text-2xl font-black text-[#1F2933] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                placeholder="0.0"
                required
              />
              <div className="mt-2">
                <p className="text-xs font-bold text-[#6B7280]">
                  Soll: {selectedCCP.minTemp !== undefined ? `${selectedCCP.minTemp}` : '≤'} {selectedCCP.unit}
                  {selectedCCP.maxTemp !== undefined && selectedCCP.minTemp !== undefined 
                    ? ` - ${selectedCCP.maxTemp} ${selectedCCP.unit}`
                    : selectedCCP.maxTemp !== undefined 
                    ? ` ≥ ${selectedCCP.maxTemp} ${selectedCCP.unit}`
                    : ''}
                </p>
                {isInRange !== null && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mt-2 ${
                    isInRange 
                      ? 'bg-[#DCFCE7] text-[#166534]'
                      : 'bg-[#FEE2E2] text-[#7F1D1D]'
                  }`}>
                    {isInRange ? '✓ In Range' : '✗ Außerhalb Bereich'}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F2933] mb-2">
                Lebensmittel / Gerät *
              </label>
              <input
                type="text"
                value={temperatureReading.foodEquipment || ''}
                onChange={(e) => setTemperatureReading({
                  ...temperatureReading,
                  foodEquipment: e.target.value
                })}
                className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl font-bold text-[#1F2933] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                placeholder="z.B. Suppe, Kühlhaus 1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F2933] mb-2">
                Standort *
              </label>
              <input
                type="text"
                value={temperatureReading.location || selectedCCP.location}
                onChange={(e) => setTemperatureReading({
                  ...temperatureReading,
                  location: e.target.value
                })}
                className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl font-bold text-[#1F2933] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F2933] mb-2">
                Zeit
              </label>
              <input
                type="time"
                value={temperatureReading.timestamp 
                  ? new Date(temperatureReading.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                  : currentTime
                }
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':');
                  const date = new Date();
                  date.setHours(parseInt(hours), parseInt(minutes));
                  setTemperatureReading({
                    ...temperatureReading,
                    timestamp: date.toISOString()
                  });
                }}
                className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl font-bold text-[#1F2933] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F2933] mb-2">
                Mitarbeiter-Initialen *
              </label>
              <input
                type="text"
                value={temperatureReading.staffInitials || staffInitials}
                onChange={(e) => setTemperatureReading({
                  ...temperatureReading,
                  staffInitials: e.target.value.toUpperCase()
                })}
                maxLength={3}
                className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl font-black text-[#1F2933] uppercase focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F2933] mb-2">
                Notizen (optional)
              </label>
              <textarea
                value={temperatureReading.notes || ''}
                onChange={(e) => setTemperatureReading({
                  ...temperatureReading,
                  notes: e.target.value
                })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl font-medium text-[#1F2933] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                placeholder="Zusätzliche Informationen..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={goBack}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-[#1F2933] font-black rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Zurück
              </button>
              <button
                onClick={handleTemperatureSubmit}
                disabled={!temperatureReading.temperature || !temperatureReading.foodEquipment}
                className="flex-1 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-black rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                Speichern
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Corrective Action Screen
  const renderCorrectiveAction = () => {
    const reading = readings.find(r => r.id === correctiveAction.readingId);
    
    return (
      <div className="space-y-6">
        <div className="bg-[#FEE2E2] border-2 border-[#DC2626] rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
            <h3 className="text-lg font-black text-[#7F1D1D]">Korrekurmaßnahme erforderlich</h3>
          </div>
          {reading && (
            <p className="text-sm text-[#7F1D1D]">
              Messung: {reading.temperature} {selectedCCP?.unit} außerhalb des kritischen Bereichs
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <h3 className="text-lg font-black text-[#1F2933] mb-6">Korrekurmaßnahme dokumentieren</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#1F2933] mb-2">
                Abweichung beschreiben *
              </label>
              <textarea
                value={correctiveAction.deviation || ''}
                onChange={(e) => setCorrectiveAction({
                  ...correctiveAction,
                  deviation: e.target.value
                })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl font-medium text-[#1F2933] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                placeholder="Beschreiben Sie die festgestellte Abweichung..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F2933] mb-2">
                Durchgeführte Maßnahme *
              </label>
              <textarea
                value={correctiveAction.actionTaken || ''}
                onChange={(e) => setCorrectiveAction({
                  ...correctiveAction,
                  actionTaken: e.target.value
                })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl font-medium text-[#1F2933] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                placeholder="Was wurde unternommen?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F2933] mb-2">
                Produkt / Charge
              </label>
              <input
                type="text"
                value={correctiveAction.productBatch || ''}
                onChange={(e) => setCorrectiveAction({
                  ...correctiveAction,
                  productBatch: e.target.value
                })}
                className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl font-bold text-[#1F2933] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                placeholder="z.B. Charge #12345"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F2933] mb-2">
                Verbleib *
              </label>
              <select
                value={correctiveAction.disposition || ''}
                onChange={(e) => setCorrectiveAction({
                  ...correctiveAction,
                  disposition: e.target.value as 'weiterverarbeitet' | 'verworfen' | 'nachgekocht'
                })}
                className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl font-bold text-[#1F2933] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="">Bitte wählen...</option>
                <option value="weiterverarbeitet">Weiterverarbeitet</option>
                <option value="verworfen">Verworfen</option>
                <option value="nachgekocht">Nachgekocht</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F2933] mb-2">
                Durchgeführt von *
              </label>
              <input
                type="text"
                value={correctiveAction.performedBy || staffInitials}
                onChange={(e) => setCorrectiveAction({
                  ...correctiveAction,
                  performedBy: e.target.value.toUpperCase()
                })}
                maxLength={3}
                className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl font-black text-[#1F2933] uppercase focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F2933] mb-2">
                Verifiziert von (optional)
              </label>
              <input
                type="text"
                value={correctiveAction.verifiedBy || ''}
                onChange={(e) => setCorrectiveAction({
                  ...correctiveAction,
                  verifiedBy: e.target.value.toUpperCase()
                })}
                maxLength={3}
                className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl font-black text-[#1F2933] uppercase focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={goBack}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-[#1F2933] font-black rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Zurück
              </button>
              <button
                onClick={handleCorrectiveActionSubmit}
                disabled={!correctiveAction.deviation || !correctiveAction.actionTaken || !correctiveAction.disposition}
                className="flex-1 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-black rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                Speichern & Zurück zur Messung
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Validation Screen
  const renderValidation = () => {
    const allTasksComplete = tasks.every(t => t.status === 'erledigt');
    const allReadingsInRange = readings.every(r => r.inRange);
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <h3 className="text-lg font-black text-[#1F2933] mb-6">Validierung - Schicht {currentShift}</h3>
          
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[#1F2933]">CCP-Prüfungen</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                  allReadingsInRange 
                    ? 'bg-[#DCFCE7] text-[#166534]'
                    : 'bg-[#FEE2E2] text-[#7F1D1D]'
                }`}>
                  {allReadingsInRange ? 'Abgeschlossen' : 'Offen'}
                </span>
              </div>
              <p className="text-sm text-[#6B7280]">
                {readings.filter(r => r.inRange).length} / {readings.length} Messungen im Bereich
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[#1F2933]">Korrekurmaßnahmen</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                  correctiveActions.length === 0 || correctiveActions.every(a => a.verifiedBy)
                    ? 'bg-[#DCFCE7] text-[#166534]'
                    : 'bg-[#FEF3C7] text-[#92400E]'
                }`}>
                  {correctiveActions.filter(a => !a.verifiedBy).length === 0 ? 'Abgeschlossen' : 'Offen'}
                </span>
              </div>
              <p className="text-sm text-[#6B7280]">
                {correctiveActions.filter(a => a.verifiedBy).length} / {correctiveActions.length} verifiziert
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[#1F2933]">Alle Aufgaben</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                  allTasksComplete
                    ? 'bg-[#DCFCE7] text-[#166534]'
                    : 'bg-[#FEF3C7] text-[#92400E]'
                }`}>
                  {allTasksComplete ? 'Abgeschlossen' : 'Offen'}
                </span>
              </div>
              <p className="text-sm text-[#6B7280]">
                {tasks.filter(t => t.status === 'erledigt').length} / {tasks.length} erledigt
              </p>
            </div>
          </div>

          {allTasksComplete && allReadingsInRange && (
            <button
              onClick={() => navigateToStep('final-approval')}
              className="w-full py-4 bg-[#2563EB] hover:bg-blue-700 text-white font-black rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Zur Genehmigung
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render Final Approval Screen
  const renderFinalApproval = () => {
    const [pin, setPin] = useState('');
    
    if (!isSupervisor) {
      return (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <div className="text-center py-8">
            <AlertTriangle className="w-16 h-16 text-[#F59E0B] mx-auto mb-4" />
            <h3 className="text-xl font-black text-[#1F2933] mb-2">Zugriff verweigert</h3>
            <p className="text-sm text-[#6B7280]">
              Nur Supervisor können die finale Genehmigung durchführen.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <h3 className="text-lg font-black text-[#1F2933] mb-6">Finale Genehmigung</h3>
          
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider mb-1">Schicht</p>
              <p className="text-sm font-black text-[#1F2933]">{currentShift}</p>
            </div>
            
            <div className="p-4 bg-gray-50 border border-[#E5E7EB] rounded-lg">
              <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Messungen</p>
              <p className="text-sm font-black text-[#1F2933]">{readings.length} durchgeführt</p>
            </div>
            
            <div className="p-4 bg-gray-50 border border-[#E5E7EB] rounded-lg">
              <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Korrekurmaßnahmen</p>
              <p className="text-sm font-black text-[#1F2933]">{correctiveActions.length} dokumentiert</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-[#1F2933] mb-2">
              PIN / Passwort zur Bestätigung *
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl font-black text-[#1F2933] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              placeholder="PIN eingeben"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={goBack}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-[#1F2933] font-black rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Zurück
            </button>
            <button
              onClick={handleFinalApproval}
              disabled={!pin}
              className="flex-1 py-3 bg-[#16A34A] hover:bg-green-700 text-white font-black rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-5 h-5" />
              Genehmigen
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Completion Screen
  const renderCompletion = () => {
    const handleExport = (format: 'pdf' | 'csv') => {
      // TODO: Implement export functionality
      console.log(`Exporting to ${format}`);
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border-2 border-[#16A34A] shadow-sm p-6">
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-[#16A34A]" />
            </div>
            <h3 className="text-2xl font-black text-[#1F2933] mb-2">Schicht abgeschlossen</h3>
            <p className="text-sm text-[#6B7280] mb-6">
              Alle Einträge sind gesperrt und für die Aufbewahrungsfrist verfügbar.
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm text-[#6B7280] mb-6">
              <Lock className="w-4 h-4" />
              <span>Einträge gesperrt am {new Date().toLocaleString('de-DE')}</span>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleExport('pdf')}
                className="px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-black rounded-xl transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                PDF Export
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-[#1F2933] font-black rounded-xl transition-colors flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                CSV Export
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <h3 className="text-lg font-black text-[#1F2933] mb-4">Zusammenfassung</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-bold text-[#1F2933]">Messungen</span>
              <span className="font-black text-[#1F2933]">{readings.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-bold text-[#1F2933]">Korrekurmaßnahmen</span>
              <span className="font-black text-[#1F2933]">{correctiveActions.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-bold text-[#1F2933]">Genehmigt von</span>
              <span className="font-black text-[#1F2933]">{staffInitials}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentScreen = () => {
    switch (currentStep) {
      case 'start':
        return renderStartScreen();
      case 'checklist-selection':
        return renderChecklistSelection();
      case 'ccp-step':
        return renderCCPStep();
      case 'temperature-entry':
        return renderTemperatureEntry();
      case 'corrective-action':
        return renderCorrectiveAction();
      case 'validation':
        return renderValidation();
      case 'final-approval':
        return renderFinalApproval();
      case 'completion':
        return renderCompletion();
      default:
        return renderStartScreen();
    }
  };

  return (
    <AppLayout pageTitle="HACCP Module">
      <div className="min-h-screen bg-[#F5F5F7] p-6">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/mensa-ioms/dashboard"
            className="inline-flex items-center gap-2 text-[#6B7280] hover:text-[#2563EB] mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-4xl font-headline font-black text-[#1F2933] tracking-tight">
                  HACCP Module
                </h1>
                <p className="text-[#6B7280] mt-1 font-sans">
                  Hazard Analysis and Critical Control Points compliance system
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        {currentStep !== 'start' && currentStep !== 'completion' && (
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-[#2563EB]">
                  Schritt {getCurrentStepNumber()} von {getTotalSteps()}
                </span>
                {selectedCCP && (
                  <span className="text-sm font-bold text-[#6B7280]">
                    – CCP: {selectedCCP.name}
                  </span>
                )}
              </div>
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#1F2933] font-bold rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Zurück
              </button>
            </div>
          </div>
        )}

        {/* Current Screen */}
        {renderCurrentScreen()}
      </div>
    </AppLayout>
  );
}
