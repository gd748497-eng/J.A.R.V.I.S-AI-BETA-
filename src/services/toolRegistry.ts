import {
  AssistantTimer,
  AssistantAlarm,
  AssistantReminder,
  AssistantNote,
  WeatherData,
  AndroidAppIntent,
} from '../types';
import { soundEffects } from './audioSynthesizer';
import { memoryService } from './memoryService';

class ToolRegistry {
  private timers: AssistantTimer[] = [];
  private alarms: AssistantAlarm[] = [];
  private reminders: AssistantReminder[] = [];
  private notes: AssistantNote[] = [];
  private tickerInterval: any = null;
  private onStateUpdate: (() => void) | null = null;

  constructor() {
    this.loadState();
    this.startTicker();
  }

  private loadState() {
    try {
      const storedTimers = localStorage.getItem('jarvis_timers');
      if (storedTimers) this.timers = JSON.parse(storedTimers);

      const storedAlarms = localStorage.getItem('jarvis_alarms');
      if (storedAlarms) this.alarms = JSON.parse(storedAlarms);
      else {
        this.alarms = [
          { id: 'alarm-1', time: '07:00', label: 'Morning Briefing', isEnabled: true },
          { id: 'alarm-2', time: '22:30', label: 'Systems Diagnostics', isEnabled: false },
        ];
      }

      const storedReminders = localStorage.getItem('jarvis_reminders');
      if (storedReminders) this.reminders = JSON.parse(storedReminders);
      else {
        this.reminders = [
          {
            id: 'rem-1',
            title: 'Review Blaze Revenant Arc Reactor schematics',
            priority: 'high',
            isCompleted: false,
            createdAt: Date.now() - 86400000,
          },
          {
            id: 'rem-2',
            title: 'Synchronize Android holographic telemetry',
            priority: 'medium',
            isCompleted: true,
            createdAt: Date.now() - 172800000,
          },
        ];
      }

      const storedNotes = localStorage.getItem('jarvis_notes');
      if (storedNotes) this.notes = JSON.parse(storedNotes);
      else {
        this.notes = [
          {
            id: 'note-1',
            title: 'Flight Stabilization Algorithm',
            content: 'Maintain thruster equilibrium at 45% throttle under supersonic atmospheric drag.',
            tags: ['propulsion', 'mark85', 'hud'],
            createdAt: Date.now() - 3600000,
            updatedAt: Date.now() - 3600000,
          },
        ];
      }
    } catch (e) {
      console.warn('ToolRegistry loadState error:', e);
    }
  }

  private saveState() {
    try {
      localStorage.setItem('jarvis_timers', JSON.stringify(this.timers));
      localStorage.setItem('jarvis_alarms', JSON.stringify(this.alarms));
      localStorage.setItem('jarvis_reminders', JSON.stringify(this.reminders));
      localStorage.setItem('jarvis_notes', JSON.stringify(this.notes));
    } catch (e) {
      console.warn('ToolRegistry saveState error:', e);
    }
    this.onStateUpdate?.();
  }

  public setUpdateListener(listener: () => void) {
    this.onStateUpdate = listener;
  }

  private startTicker() {
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    this.tickerInterval = setInterval(() => {
      let stateChanged = false;

      // Update timers
      for (const t of this.timers) {
        if (t.isRunning && t.remainingSeconds > 0) {
          t.remainingSeconds -= 1;
          stateChanged = true;
          if (t.remainingSeconds === 0) {
            t.isRunning = false;
            soundEffects.playAlert();
            // Trigger web notification if available
            this.sendNotification(`JARVIS Timer Alert: ${t.label}`, `Your ${t.durationSeconds}s timer has completed.`);
          }
        }
      }

      // Check alarms (compare HH:MM)
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const currentSeconds = now.getSeconds();

      if (currentSeconds === 0) {
        for (const a of this.alarms) {
          if (a.isEnabled && a.time === currentTimeStr) {
            soundEffects.playAlert();
            this.sendNotification(`JARVIS Alarm: ${a.label}`, `Target time ${a.time} reached.`);
          }
        }
      }

      if (stateChanged) {
        this.saveState();
      }
    }, 1000);
  }

  private sendNotification(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.ico' });
      } catch {
        // ignore
      }
    }
  }

  // --- Timers ---
  public getTimers(): AssistantTimer[] {
    return [...this.timers];
  }

  public createTimer(durationSeconds: number, label: string = 'Countdown'): AssistantTimer {
    const newTimer: AssistantTimer = {
      id: 'timer-' + Date.now(),
      label: label || 'Timer',
      durationSeconds,
      remainingSeconds: durationSeconds,
      isRunning: true,
      createdAt: Date.now(),
    };
    this.timers.unshift(newTimer);
    this.saveState();
    soundEffects.playConfirm();
    return newTimer;
  }

  public toggleTimer(id: string) {
    const timer = this.timers.find((t) => t.id === id);
    if (timer) {
      timer.isRunning = !timer.isRunning;
      this.saveState();
    }
  }

  public resetTimer(id: string) {
    const timer = this.timers.find((t) => t.id === id);
    if (timer) {
      timer.remainingSeconds = timer.durationSeconds;
      timer.isRunning = false;
      this.saveState();
    }
  }

  public deleteTimer(id: string) {
    this.timers = this.timers.filter((t) => t.id !== id);
    this.saveState();
  }

  // --- Alarms ---
  public getAlarms(): AssistantAlarm[] {
    return [...this.alarms];
  }

  public createAlarm(time: string, label: string = 'Alarm'): AssistantAlarm {
    const newAlarm: AssistantAlarm = {
      id: 'alarm-' + Date.now(),
      time,
      label: label || 'Alarm',
      isEnabled: true,
    };
    this.alarms.push(newAlarm);
    this.saveState();
    soundEffects.playConfirm();
    return newAlarm;
  }

  public toggleAlarm(id: string) {
    const alarm = this.alarms.find((a) => a.id === id);
    if (alarm) {
      alarm.isEnabled = !alarm.isEnabled;
      this.saveState();
    }
  }

  public deleteAlarm(id: string) {
    this.alarms = this.alarms.filter((a) => a.id !== id);
    this.saveState();
  }

  // --- Reminders ---
  public getReminders(): AssistantReminder[] {
    return [...this.reminders];
  }

  public createReminder(
    title: string,
    datetime?: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): AssistantReminder {
    const newReminder: AssistantReminder = {
      id: 'rem-' + Date.now(),
      title,
      datetime,
      priority,
      isCompleted: false,
      createdAt: Date.now(),
    };
    this.reminders.unshift(newReminder);
    this.saveState();
    soundEffects.playConfirm();
    return newReminder;
  }

  public toggleReminder(id: string) {
    const rem = this.reminders.find((r) => r.id === id);
    if (rem) {
      rem.isCompleted = !rem.isCompleted;
      this.saveState();
    }
  }

  public deleteReminder(id: string) {
    this.reminders = this.reminders.filter((r) => r.id !== id);
    this.saveState();
  }

  // --- Notes ---
  public getNotes(): AssistantNote[] {
    return [...this.notes];
  }

  public createNote(title: string, content: string, tags: string[] = []): AssistantNote {
    const newNote: AssistantNote = {
      id: 'note-' + Date.now(),
      title,
      content,
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.notes.unshift(newNote);
    this.saveState();
    soundEffects.playConfirm();
    return newNote;
  }

  public deleteNote(id: string) {
    this.notes = this.notes.filter((n) => n.id !== id);
    this.saveState();
  }

  // --- Calculator ---
  public calculate(expression: string): { expression: string; result: string; success: boolean } {
    try {
      // Safe arithmetic evaluator
      const sanitized = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/pi/gi, 'Math.PI')
        .replace(/e/gi, 'Math.E')
        .replace(/sqrt\(/gi, 'Math.sqrt(')
        .replace(/sin\(/gi, 'Math.sin(')
        .replace(/cos\(/gi, 'Math.cos(')
        .replace(/tan\(/gi, 'Math.tan(')
        .replace(/pow\(/gi, 'Math.pow(')
        .replace(/\^/g, '**');

      // Verify sanitized only contains safe math characters
      if (/[^0-9+\-*/().%\s,MathPIEsqrtcospow]/.test(sanitized)) {
        return {
          expression,
          result: 'Invalid characters in mathematical expression',
          success: false,
        };
      }

      // eslint-disable-next-line no-new-func
      const evalFn = new Function(`return (${sanitized});`);
      const val = evalFn();
      return {
        expression,
        result: String(val),
        success: true,
      };
    } catch (e: any) {
      return {
        expression,
        result: 'Computation syntax error: ' + e.message,
        success: false,
      };
    }
  }

  // --- Weather ---
  public async fetchWeather(location: string = 'Delhi'): Promise<WeatherData> {
    const res = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
    if (!res.ok) {
      throw new Error(`Weather telemetry unavailable for ${location}`);
    }
    return await res.json();
  }

  // --- Android App Intents ---
  public getAndroidApps(): AndroidAppIntent[] {
    return [
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        iconName: 'MessageSquare',
        schemeUrl: 'whatsapp://send?text=',
        webFallbackUrl: 'https://web.whatsapp.com/send?text=',
        description: 'Send instant messages or share notes to WhatsApp contacts',
        category: 'communication',
      },
      {
        id: 'youtube',
        name: 'YouTube',
        iconName: 'Play',
        schemeUrl: 'vnd.youtube://results?search_query=',
        webFallbackUrl: 'https://www.youtube.com/results?search_query=',
        description: 'Play videos, soundtracks, and search media feeds',
        category: 'media',
      },
      {
        id: 'maps',
        name: 'Google Maps / GPS',
        iconName: 'MapPin',
        schemeUrl: 'geo:0,0?q=',
        webFallbackUrl: 'https://www.google.com/maps/search/?api=1&query=',
        description: 'Launch Android satellite GPS navigation and search locations',
        category: 'navigation',
      },
      {
        id: 'phone',
        name: 'Phone Dialer',
        iconName: 'Phone',
        schemeUrl: 'tel:',
        webFallbackUrl: 'tel:',
        description: 'Open Android phone dialer with phone number pre-filled',
        category: 'communication',
      },
      {
        id: 'email',
        name: 'Gmail / Email',
        iconName: 'Mail',
        schemeUrl: 'mailto:',
        webFallbackUrl: 'https://mail.google.com/mail/?view=cm&fs=1&to=',
        description: 'Draft and dispatch emails through Android email client',
        category: 'communication',
      },
      {
        id: 'spotify',
        name: 'Spotify',
        iconName: 'Music',
        schemeUrl: 'spotify:search:',
        webFallbackUrl: 'https://open.spotify.com/search/',
        description: 'Stream music, playlists, and audio frequencies',
        category: 'media',
      },
      {
        id: 'calendar',
        name: 'Google Calendar',
        iconName: 'Calendar',
        schemeUrl: 'content://com.android.calendar/time/',
        webFallbackUrl: 'https://calendar.google.com/',
        description: 'Check schedule and create calendar appointments',
        category: 'productivity',
      },
      {
        id: 'clock',
        name: 'Android Clock',
        iconName: 'Clock',
        schemeUrl: 'intent:#Intent;action=android.intent.action.SHOW_TIMERS;end',
        webFallbackUrl: '#timers',
        description: 'Direct intent for native Android system clock & alarms',
        category: 'system',
      },
    ];
  }

  public launchAppIntent(appId: string, query: string = ''): { dispatchedUrl: string; isAndroidNative: boolean } {
    const apps = this.getAndroidApps();
    const app = apps.find((a) => a.id === appId);
    if (!app) {
      return { dispatchedUrl: '', isAndroidNative: false };
    }

    const isAndroid = /Android/i.test(navigator.userAgent);
    const encoded = encodeURIComponent(query);
    const targetUrl = isAndroid && app.schemeUrl ? `${app.schemeUrl}${encoded}` : `${app.webFallbackUrl}${encoded}`;

    // Open target
    try {
      window.open(targetUrl, '_blank');
    } catch (e) {
      console.warn('Failed to open intent URL:', e);
    }

    return {
      dispatchedUrl: targetUrl,
      isAndroidNative: isAndroid,
    };
  }

  // --- Dynamic Function Execution ---
  public async executeToolCall(name: string, args: Record<string, any>): Promise<any> {
    soundEffects.playConfirm();

    switch (name) {
      case 'setTimer': {
        const duration = Number(args.durationSeconds) || 60;
        const timer = this.createTimer(duration, args.label || 'Countdown');
        return {
          status: 'success',
          message: `Timer set for ${duration} seconds (${args.label || 'Timer'}).`,
          timer,
        };
      }
      case 'setAlarm': {
        const time = args.time || '08:00';
        const alarm = this.createAlarm(time, args.label || 'Alarm');
        return {
          status: 'success',
          message: `Alarm scheduled for ${time}.`,
          alarm,
        };
      }
      case 'createReminder': {
        const reminder = this.createReminder(args.title, args.datetime, args.priority || 'medium');
        return {
          status: 'success',
          message: `Reminder added: "${args.title}".`,
          reminder,
        };
      }
      case 'takeNote': {
        const note = this.createNote(args.title, args.content, args.tags || []);
        return {
          status: 'success',
          message: `Note "${args.title}" safely committed to storage.`,
          note,
        };
      }
      case 'getWeather': {
        try {
          const weather = await this.fetchWeather(args.location);
          return {
            status: 'success',
            weather,
          };
        } catch (e: any) {
          return { status: 'error', message: e.message };
        }
      }
      case 'launchAndroidApp': {
        const res = this.launchAppIntent(args.appName, args.query || '');
        return {
          status: 'success',
          app: args.appName,
          dispatchedUrl: res.dispatchedUrl,
          isAndroidNative: res.isAndroidNative,
        };
      }
      case 'saveMemory': {
        const mem = memoryService.addMemory(args.fact, args.category || 'fact');
        return {
          status: 'success',
          message: `Fact committed to permanent neural memory: "${args.fact}"`,
          memory: mem,
        };
      }
      case 'calculate': {
        return this.calculate(args.expression);
      }
      case 'openCreativeStudio': {
        return {
          status: 'success',
          studioType: args.studioType || 'image',
          prompt: args.prompt || '',
          message: `Opening ${args.studioType === 'video' ? 'AI Video Studio' : args.studioType === 'gallery' ? 'Media Gallery' : args.studioType === 'apk' ? 'Android APK & Assistant Hub' : 'AI Image Studio'}...`,
        };
      }
      default:
        return { status: 'unsupported', message: `Unknown tool: ${name}` };
    }
  }
}

export const toolRegistry = new ToolRegistry();
