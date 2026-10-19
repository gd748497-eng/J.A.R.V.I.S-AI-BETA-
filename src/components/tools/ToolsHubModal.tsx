import React, { useState } from 'react';
import {
  X,
  Clock,
  Bell,
  CheckCircle2,
  FileText,
  CloudSun,
  Smartphone,
  Calculator as CalcIcon,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Search,
  ExternalLink,
} from 'lucide-react';
import {
  AssistantTimer,
  AssistantAlarm,
  AssistantReminder,
  AssistantNote,
  WeatherData,
} from '../../types';
import { toolRegistry } from '../../services/toolRegistry';
import { soundEffects } from '../../services/audioSynthesizer';

interface ToolsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

export const ToolsHubModal: React.FC<ToolsHubModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'timers',
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [, setRefreshCount] = useState(0);

  // Tools state from registry
  const timers = toolRegistry.getTimers();
  const alarms = toolRegistry.getAlarms();
  const reminders = toolRegistry.getReminders();
  const notes = toolRegistry.getNotes();
  const androidApps = toolRegistry.getAndroidApps();

  // Form states
  const [customTimerSeconds, setCustomTimerSeconds] = useState('300');
  const [timerLabel, setTimerLabel] = useState('');
  const [alarmTime, setAlarmTime] = useState('08:00');
  const [alarmLabel, setAlarmLabel] = useState('');
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderPriority, setReminderPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [weatherQuery, setWeatherQuery] = useState('Mumbai');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState<string | null>(null);

  React.useEffect(() => {
    toolRegistry.setUpdateListener(() => {
      setRefreshCount((c) => c + 1);
    });
  }, []);

  if (!isOpen) return null;

  const handleCreateTimer = (seconds: number, label?: string) => {
    toolRegistry.createTimer(seconds, label || timerLabel || 'Timer');
    setTimerLabel('');
  };

  const handleCreateAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alarmTime) return;
    toolRegistry.createAlarm(alarmTime, alarmLabel || 'Alarm');
    setAlarmLabel('');
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim()) return;
    toolRegistry.createReminder(reminderTitle.trim(), undefined, reminderPriority);
    setReminderTitle('');
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    toolRegistry.createNote(noteTitle.trim(), noteContent.trim(), ['manual']);
    setNoteTitle('');
    setNoteContent('');
  };

  const handleSearchWeather = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weatherQuery.trim()) return;
    setWeatherLoading(true);
    try {
      const data = await toolRegistry.fetchWeather(weatherQuery.trim());
      setWeatherData(data);
      soundEffects.playConfirm();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calcInput.trim()) return;
    const res = toolRegistry.calculate(calcInput.trim());
    setCalcResult(res.result);
    soundEffects.playConfirm();
  };

  const tabs = [
    { id: 'timers', label: 'Timers', icon: Clock },
    { id: 'alarms', label: 'Alarms', icon: Bell },
    { id: 'reminders', label: 'Reminders', icon: CheckCircle2 },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'weather', label: 'Weather', icon: CloudSun },
    { id: 'android', label: 'Android Apps', icon: Smartphone },
    { id: 'calc', label: 'Calculator', icon: CalcIcon },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-950 border border-cyan-500/40 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_0_30px_rgba(0,240,255,0.2)] hud-bracket overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-black/60">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h2 className="font-hud text-base font-bold text-cyan-300 tracking-wider">
              ASSISTANT TOOLS // SUITE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 px-3 py-2 border-b border-slate-800 bg-slate-900/60 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEffects.playConfirm();
                  setActiveTab(tab.id);
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-hud tracking-wide whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB: TIMERS */}
          {activeTab === 'timers' && (
            <div className="space-y-4">
              {/* Presets */}
              <div>
                <span className="text-xs font-hud text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Countdown Presets
                </span>
                <div className="flex flex-wrap gap-2">
                  {[60, 180, 300, 600, 900, 1800].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => handleCreateTimer(sec, `${sec / 60}m Timer`)}
                      className="px-3 py-1.5 rounded bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950 text-xs font-hud transition-colors"
                    >
                      {sec < 60 ? `${sec}s` : `${sec / 60} min`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom timer creator */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Label (e.g. Pasta, Tea, Workout)"
                  value={timerLabel}
                  onChange={(e) => setTimerLabel(e.target.value)}
                  className="flex-1 bg-black border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="number"
                  placeholder="Seconds"
                  value={customTimerSeconds}
                  onChange={(e) => setCustomTimerSeconds(e.target.value)}
                  className="w-24 bg-black border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => handleCreateTimer(Number(customTimerSeconds) || 60)}
                  className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs transition-colors shrink-0 flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start</span>
                </button>
              </div>

              {/* Active Timers List */}
              <div className="space-y-2">
                <span className="text-xs font-hud text-slate-400 uppercase tracking-wider block">
                  Active Timers ({timers.length})
                </span>
                {timers.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs italic">
                    No timers active. Tell JARVIS "Set a timer for 5 minutes" or click a preset above.
                  </div>
                ) : (
                  timers.map((timer) => {
                    const mins = Math.floor(timer.remainingSeconds / 60);
                    const secs = timer.remainingSeconds % 60;
                    const percent = (timer.remainingSeconds / timer.durationSeconds) * 100;

                    return (
                      <div
                        key={timer.id}
                        className="p-3 rounded-lg bg-slate-900/80 border border-cyan-500/20 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-hud font-bold text-sm text-cyan-200">{timer.label}</div>
                          <div className="text-xl font-mono font-bold text-slate-100">
                            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                          </div>
                          <div className="w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-cyan-400 transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => toolRegistry.toggleTimer(timer.id)}
                            className="p-2 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-400 transition-colors"
                            title={timer.isRunning ? 'Pause' : 'Resume'}
                          >
                            {timer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => toolRegistry.resetTimer(timer.id)}
                            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                            title="Reset"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toolRegistry.deleteTimer(timer.id)}
                            className="p-2 rounded bg-slate-800 hover:bg-red-950 text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB: ALARMS */}
          {activeTab === 'alarms' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateAlarm} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center space-x-2">
                <input
                  type="time"
                  value={alarmTime}
                  onChange={(e) => setAlarmTime(e.target.value)}
                  className="bg-black border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="Alarm label (e.g. Daily Standup)"
                  value={alarmLabel}
                  onChange={(e) => setAlarmLabel(e.target.value)}
                  className="flex-1 bg-black border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs transition-colors shrink-0"
                >
                  Set Alarm
                </button>
              </form>

              <div className="space-y-2">
                {alarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xl font-hud font-bold text-amber-300">{alarm.time}</div>
                      <div className="text-xs text-slate-400">{alarm.label}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toolRegistry.toggleAlarm(alarm.id)}
                        className={`px-3 py-1 rounded text-xs font-hud font-bold transition-colors ${
                          alarm.isEnabled
                            ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {alarm.isEnabled ? 'ARMED' : 'OFF'}
                      </button>
                      <button
                        onClick={() => toolRegistry.deleteAlarm(alarm.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: REMINDERS */}
          {activeTab === 'reminders' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateReminder} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                <input
                  type="text"
                  placeholder="Reminder Title (e.g. Calibrate thruster sensors)"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  className="w-full bg-black border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {(['low', 'medium', 'high'] as const).map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setReminderPriority(p)}
                        className={`px-2 py-1 rounded text-[10px] uppercase font-hud transition-colors ${
                          reminderPriority === p
                            ? 'bg-cyan-500 text-black font-bold'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs transition-colors"
                  >
                    Add Reminder
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                {reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                      rem.isCompleted
                        ? 'bg-slate-950 border-slate-800/80 opacity-60'
                        : 'bg-slate-900/80 border-cyan-500/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toolRegistry.toggleReminder(rem.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          rem.isCompleted
                            ? 'bg-emerald-500 border-emerald-400 text-black'
                            : 'border-slate-600 hover:border-cyan-400'
                        }`}
                      >
                        {rem.isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <div
                          className={`text-xs ${
                            rem.isCompleted ? 'line-through text-slate-500' : 'text-slate-100 font-medium'
                          }`}
                        >
                          {rem.title}
                        </div>
                        <span className="text-[10px] uppercase font-mono text-cyan-400">
                          PRIORITY: {rem.priority}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toolRegistry.deleteReminder(rem.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateNote} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                <input
                  type="text"
                  placeholder="Note Title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-black border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <textarea
                  rows={2}
                  placeholder="Content or memo details..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-black border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs transition-colors"
                >
                  Save Note
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-hud font-bold text-xs text-cyan-300">{note.title}</div>
                      <p className="text-xs text-slate-300 mt-1 whitespace-pre-wrap">{note.content}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800 text-[10px] text-slate-500">
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                      <button
                        onClick={() => toolRegistry.deleteNote(note.id)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: WEATHER */}
          {activeTab === 'weather' && (
            <div className="space-y-4">
              <form onSubmit={handleSearchWeather} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="City or location (e.g. London, Delhi, Tokyo, New York)"
                  value={weatherQuery}
                  onChange={(e) => setWeatherQuery(e.target.value)}
                  className="flex-1 bg-black border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={weatherLoading}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs transition-colors"
                >
                  {weatherLoading ? 'Scanning...' : 'Telemetry'}
                </button>
              </form>

              {weatherData && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-cyan-950/40 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-hud text-lg font-bold text-cyan-200">{weatherData.location}</h3>
                      <p className="text-xs text-slate-300">{weatherData.condition}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-hud text-3xl font-extrabold text-amber-300">
                        {Math.round(weatherData.temperature)}°C
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Feels like {Math.round(weatherData.apparentTemperature)}°C
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-black/40 border border-cyan-500/20 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">HUMIDITY</span>
                      <span className="font-mono text-cyan-300">{weatherData.humidity}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">WIND SPEED</span>
                      <span className="font-mono text-cyan-300">{weatherData.windSpeed} km/h</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">PRECIPITATION</span>
                      <span className="font-mono text-cyan-300">{weatherData.precipitation} mm</span>
                    </div>
                  </div>

                  {/* 4 Day Forecast */}
                  {weatherData.forecast && weatherData.forecast.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] font-hud text-slate-400 uppercase tracking-wider block mb-1.5">
                        Orbital Forecast Telemetry
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {weatherData.forecast.map((fc, idx) => (
                          <div key={idx} className="p-2 rounded bg-black/60 border border-slate-800 text-center">
                            <span className="text-[10px] font-mono text-slate-400 block">{fc.date.slice(5)}</span>
                            <span className="text-xs font-bold text-amber-300 block">{Math.round(fc.maxTemp)}° / {Math.round(fc.minTemp)}°</span>
                            <span className="text-[9px] text-slate-300 truncate block">{fc.condition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: ANDROID APPS & INTENTS */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200">
                <span className="font-hud font-bold block mb-1">ANDROID INTENT ENGINE</span>
                JARVIS uses deep-link URL schemes (`whatsapp://`, `vnd.youtube://`, `geo:`, `tel:`) to execute native Android OS app intents. On Android devices, these open the target application directly.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {androidApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-hud font-bold text-xs text-cyan-200">{app.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{app.description}</div>
                      <div className="text-[9px] font-mono text-slate-500 mt-1">{app.schemeUrl}</div>
                    </div>
                    <button
                      onClick={() => toolRegistry.launchAppIntent(app.id)}
                      className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-hud text-xs font-bold transition-colors shrink-0 flex items-center space-x-1"
                    >
                      <span>Launch</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CALCULATOR */}
          {activeTab === 'calc' && (
            <div className="space-y-4">
              <form onSubmit={handleCalculate} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. 45 * 12.5 + sqrt(144) or 100 * 1.18"
                    value={calcInput}
                    onChange={(e) => setCalcInput(e.target.value)}
                    className="flex-1 bg-black border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs transition-colors"
                  >
                    Compute
                  </button>
                </div>
              </form>

              {calcResult !== null && (
                <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 text-center">
                  <span className="text-xs font-hud text-slate-400 block mb-1">EVALUATED OUTPUT</span>
                  <div className="text-2xl font-mono font-bold text-cyan-300">{calcResult}</div>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {['25 * 40', 'sqrt(1024)', 'sin(Math.PI / 4)', '2 ** 10', '1500 * 0.18'].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => {
                      setCalcInput(sample);
                      const res = toolRegistry.calculate(sample);
                      setCalcResult(res.result);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
