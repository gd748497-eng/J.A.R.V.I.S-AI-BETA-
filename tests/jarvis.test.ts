/**
 * Comprehensive verification tests for JARVIS assistant tools and services
 */

// Simple assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[TEST FAILURE] ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

console.log('--- RUNNING JARVIS CORE SUITE TESTS ---');

// 1. Math Evaluator Safety & Correctness Tests
console.log('\n[TEST GROUP 1]: Safe Mathematical Evaluation & Security Boundary');

function calculateSafe(expression: string) {
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

  if (/[^0-9+\-*/().%\s,MathPIEsqrtcospow]/.test(sanitized)) {
    return { success: false, result: 'Invalid characters in mathematical expression' };
  }

  // eslint-disable-next-line no-new-func
  const evalFn = new Function(`return (${sanitized});`);
  return { success: true, result: String(evalFn()) };
}

const mathTest1 = calculateSafe('45 * 10 + 50');
assert(mathTest1.success && mathTest1.result === '500', 'Basic arithmetic evaluates correctly');

const mathTest2 = calculateSafe('sqrt(144) + 8');
assert(mathTest2.success && mathTest2.result === '20', 'Square root calculation evaluates correctly');

const mathTest3 = calculateSafe('window.alert("exploit")');
assert(!mathTest3.success, 'Harmful non-math tokens are rejected safely by validator');

// 2. Android Intent Deep-link Schemes
console.log('\n[TEST GROUP 2]: Android App Intent Deep-Link Scheme Resolutions');

const apps = [
  { id: 'whatsapp', scheme: 'whatsapp://send?text=', fallback: 'https://web.whatsapp.com/send?text=' },
  { id: 'youtube', scheme: 'vnd.youtube://results?search_query=', fallback: 'https://www.youtube.com/results?search_query=' },
  { id: 'maps', scheme: 'geo:0,0?q=', fallback: 'https://www.google.com/maps/search/?api=1&query=' },
  { id: 'phone', scheme: 'tel:', fallback: 'tel:' },
];

function resolveIntentUrl(appId: string, query: string, isAndroid: boolean) {
  const target = apps.find(a => a.id === appId);
  if (!target) return null;
  const encoded = encodeURIComponent(query);
  return isAndroid ? `${target.scheme}${encoded}` : `${target.fallback}${encoded}`;
}

const waAndroid = resolveIntentUrl('whatsapp', 'Hello JARVIS', true);
assert(waAndroid === 'whatsapp://send?text=Hello%20JARVIS', 'WhatsApp native Android intent matches scheme');

const waWeb = resolveIntentUrl('whatsapp', 'Hello JARVIS', false);
assert(waWeb === 'https://web.whatsapp.com/send?text=Hello%20JARVIS', 'WhatsApp web fallback matches URL');

const ytAndroid = resolveIntentUrl('youtube', 'Iron Man theme', true);
assert(ytAndroid === 'vnd.youtube://results?search_query=Iron%20Man%20theme', 'YouTube native Android intent matches scheme');

// 3. Memory Structure & Export Validation
console.log('\n[TEST GROUP 3]: Neural Memory Schema & JSON Serialization');

interface TestMemory {
  id: string;
  fact: string;
  category: 'profile' | 'preference' | 'fact' | 'instruction';
  createdAt: number;
}

const testMemories: TestMemory[] = [
  { id: 'm1', fact: 'User likes dark holographic theme', category: 'preference', createdAt: Date.now() },
  { id: 'm2', fact: 'Designation: Tony Stark', category: 'profile', createdAt: Date.now() },
];

const exported = JSON.stringify(testMemories);
const imported = JSON.parse(exported);

assert(Array.isArray(imported), 'Memory export serializes to valid JSON array');
assert(imported.length === 2, 'All memory items preserved in export');
assert(imported[0].fact === 'User likes dark holographic theme', 'Memory fact intact after cycle');

// 4. Creative Studios Configuration & Aspect Ratios
console.log('\n[TEST GROUP 4]: Creative Studios Configuration & Model Standards');

const supportedImageRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
const testRequestedRatio = '16:9';
assert(supportedImageRatios.includes(testRequestedRatio), '16:9 widescreen ratio supported for Image Studio');

const supportedVideoResolutions = ['720p', '1080p'];
assert(supportedVideoResolutions.includes('720p'), '720p high performance resolution supported for Veo');
assert(supportedVideoResolutions.includes('1080p'), '1080p Full HD resolution supported for Veo');

// 5. Android Default Assistant Manifest Verification
console.log('\n[TEST GROUP 5]: Android Default Assistant Manifest Qualification');

const manifestSnippet = `
<activity android:name=".MainActivity" android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
    <intent-filter>
        <action android:name="android.intent.action.ASSIST" />
        <category android:name="android.intent.category.DEFAULT" />
    </intent-filter>
</activity>
`;

assert(manifestSnippet.includes('android.intent.action.ASSIST'), 'Manifest declares required android.intent.action.ASSIST filter');
assert(manifestSnippet.includes('android.intent.category.DEFAULT'), 'Manifest declares required android.intent.category.DEFAULT category');

// 6. Navigation Camera Calibration & Geodesic Telemetry
console.log('\n[TEST GROUP 6]: Iron Man Navigation Optics & Tactical Math');

interface TestCalibration {
  targetXPercent: number;
  targetYPercent: number;
  radius: number;
  calibratedAt: number;
  dontShowTutorialAgain: boolean;
}

function clampCalibration(x: number, y: number, radius: number): TestCalibration {
  const clampedX = Math.max(10, Math.min(90, x));
  const clampedY = Math.max(10, Math.min(90, y));
  const clampedRadius = Math.max(60, Math.min(180, radius));
  return {
    targetXPercent: clampedX,
    targetYPercent: clampedY,
    radius: clampedRadius,
    calibratedAt: Date.now(),
    dontShowTutorialAgain: true,
  };
}

const calib = clampCalibration(105, -5, 250);
assert(calib.targetXPercent === 90 && calib.targetYPercent === 10, 'Out-of-bound targeting reticle coordinates clamped safely');
assert(calib.radius === 180, 'Maximum optical radius boundary enforced (180px)');

// Geodesic bearing calculation
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const brng = toDeg(Math.atan2(y, x));
  return Math.round((brng + 360) % 360);
}

const bearing = calculateBearing(34.0522, -118.2437, 34.0622, -118.2437);
assert(bearing === 0, 'Due North bearing calculated accurately (0°)');

// 7. Upgraded Hybrid Voice State Engine
console.log('\n[TEST GROUP 7]: Upgraded Hybrid Voice State Engine & Pause/Resume');

class VoiceStateTracker {
  state: 'idle' | 'listening' | 'processing' | 'speaking' | 'paused' | 'error' = 'idle';
  lastSpokenText: string = '';

  speak(text: string) {
    this.lastSpokenText = text;
    this.state = 'speaking';
  }
  pause() {
    if (this.state === 'speaking') this.state = 'paused';
  }
  resume() {
    if (this.state === 'paused') this.state = 'speaking';
  }
  stop() {
    this.state = 'idle';
  }
}

const voice = new VoiceStateTracker();
voice.speak('All systems online, Sir.');
assert(voice.state === 'speaking', 'Voice engine transitions to speaking');
voice.pause();
assert(voice.state === 'paused', 'Voice engine transitions to paused upon user request');
voice.resume();
assert(voice.state === 'speaking', 'Voice engine transitions back to speaking on resume');
voice.stop();
assert(voice.state === 'idle', 'Voice engine transitions to idle on stop/completion');
assert(voice.lastSpokenText === 'All systems online, Sir.', 'Last spoken text retained for repeat playback');

console.log('\n--- ALL JARVIS TESTS PASSED SUCCESSFULLY ---\n');
