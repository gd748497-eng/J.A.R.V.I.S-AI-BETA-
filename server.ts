import express from 'express';
import { GoogleGenAI, Type, FunctionDeclaration, GenerateVideosOperation } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Function Declarations for Assistant Tools
const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'setTimer',
    description: 'Set a countdown timer with duration in seconds and an optional label.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        durationSeconds: {
          type: Type.NUMBER,
          description: 'Duration of the timer in seconds (e.g., 60 for 1 minute, 300 for 5 minutes).',
        },
        label: {
          type: Type.STRING,
          description: 'Purpose or label for the timer, e.g. "Tea", "Workout", "Study".',
        },
      },
      required: ['durationSeconds'],
    },
  },
  {
    name: 'setAlarm',
    description: 'Set an alarm for a specific time of day.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        time: {
          type: Type.STRING,
          description: 'Alarm time in 24-hour HH:MM format (e.g., "07:30", "18:00").',
        },
        label: {
          type: Type.STRING,
          description: 'Label or purpose for the alarm.',
        },
      },
      required: ['time'],
    },
  },
  {
    name: 'createReminder',
    description: 'Create a scheduled reminder for a specific task or event.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'What the user needs to be reminded about.',
        },
        datetime: {
          type: Type.STRING,
          description: 'Target date/time ISO string or relative time description like "today at 5pm".',
        },
        priority: {
          type: Type.STRING,
          description: 'Priority level: "low", "medium", or "high".',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'takeNote',
    description: 'Save a quick note, memo, or idea to the user notes storage.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'Title of the note.',
        },
        content: {
          type: Type.STRING,
          description: 'Full note content or bullet points.',
        },
        tags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Keywords or tags for categorization.',
        },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'getWeather',
    description: 'Get real-time weather information and forecast for a specific city or region.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        location: {
          type: Type.STRING,
          description: 'City and optionally country/state, e.g. "Mumbai", "New York", "London", "Bengaluru".',
        },
      },
      required: ['location'],
    },
  },
  {
    name: 'launchAndroidApp',
    description: 'Trigger an Android deep link or intent to open an installed application or action.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        appName: {
          type: Type.STRING,
          description: 'Name of the app: "whatsapp", "youtube", "maps", "phone", "email", "clock", "spotify", "browser", "calendar".',
        },
        action: {
          type: Type.STRING,
          description: 'Action to perform: "open", "search", "navigate", "call", "compose".',
        },
        query: {
          type: Type.STRING,
          description: 'Optional target query, phone number, destination or search term.',
        },
      },
      required: ['appName'],
    },
  },
  {
    name: 'saveMemory',
    description: 'Explicitly save a user preference, personal fact, or custom instruction into JARVIS long-term memory.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        fact: {
          type: Type.STRING,
          description: 'The fact, rule, or preference to remember permanently.',
        },
        category: {
          type: Type.STRING,
          description: 'Category: "profile", "preference", "fact", or "instruction".',
        },
      },
      required: ['fact'],
    },
  },
  {
    name: 'calculate',
    description: 'Perform a mathematical calculation or unit conversion.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        expression: {
          type: Type.STRING,
          description: 'The math expression or conversion query, e.g. "45 * 12.5 + sqrt(144)", "50 km in miles".',
        },
      },
      required: ['expression'],
    },
  },
  {
    name: 'openCreativeStudio',
    description: 'Open the AI Image Studio, AI Video Studio, Media Gallery, or Android APK Downloader in response to user creative requests.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        studioType: {
          type: Type.STRING,
          description: 'Type of creative tool: "image", "video", "gallery", or "apk".',
        },
        prompt: {
          type: Type.STRING,
          description: 'Optional initial prompt for image or video synthesis.',
        },
      },
      required: ['studioType'],
    },
  },
];

// Helper: Weather code description
function getWeatherDescription(code: number): string {
  const codes: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return codes[code] || 'Variable conditions';
}

// GET /api/weather endpoint
app.get('/api/weather', async (req, res) => {
  const location = (req.query.location as string) || 'Delhi';
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ error: `Location "${location}" not found` });
    }

    const { latitude, longitude, name, country, admin1 } = geoData.results[0];
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const current = weatherData.current;
    const daily = weatherData.daily;

    res.json({
      location: `${name}${admin1 ? `, ${admin1}` : ''}${country ? `, ${country}` : ''}`,
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      precipitation: current.precipitation,
      condition: getWeatherDescription(current.weather_code),
      weatherCode: current.weather_code,
      forecast: daily ? daily.time.slice(0, 4).map((date: string, idx: number) => ({
        date,
        maxTemp: daily.temperature_2m_max[idx],
        minTemp: daily.temperature_2m_min[idx],
        condition: getWeatherDescription(daily.weather_code[idx]),
      })) : [],
    });
  } catch (error) {
    console.error('Weather error:', error);
    res.status(500).json({ error: 'Failed to retrieve weather telemetry' });
  }
});

// POST /api/chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      language = 'auto',
      personality = 'jarvis',
      userName = 'Sir',
      memoryContext = '',
      enableWebSearch = true,
      enableTools = true,
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const personalityDescriptions: Record<string, string> = {
      jarvis: 'You are J.A.R.V.I.S., Tony Stark\'s iconic AI assistant. You speak with calm British elegance, dry wit, subtle loyalty, and supreme technical confidence. Address the user respectfully (e.g., "Sir" or their name).',
      tactical: 'You are J.A.R.V.I.S. Tactical Protocol. Concise, laser-focused, military precision, high situational awareness, zero fluff.',
      friday: 'You are F.R.I.D.A.Y., warm, quick-witted, upbeat, highly intuitive and direct.',
      tech_genius: 'You are J.A.R.V.I.S. Scientific Research Core. You provide deep engineering calculations, clean code, architecture rationale, and multi-step reasoning.',
    };

    const selectedPersona = personalityDescriptions[personality] || personalityDescriptions.jarvis;

    const systemInstruction = `
${selectedPersona}
User Name: ${userName}

CURRENT TIMESTAMP & ENVIRONMENT:
Local System Time: ${new Date().toISOString()}
Target Platform: Android Mobile HUD

MULTILINGUAL CAPABILITY (ENGLISH, HINDI, HINGLISH):
- You have native command over English, Hindi (हिन्दी), and Hinglish (mix of Hindi & English in Latin script).
- Automatically match the user's spoken or typed language:
  - If user speaks in English -> Respond in crisp, articulate English.
  - If user speaks in Hindi -> Respond in polite, natural Hindi (e.g., "जी सर, मैंने टाइमर सेट कर दिया है।")
  - If user speaks in Hinglish (e.g., "Jarvis ek 5 minute ka timer lagao" / "Kal weather kaisa rahega?") -> Respond in smooth Hinglish (e.g., "Bilkul Sir, 5 minute ka timer start ho chuka hai. Anything else?").
- If requested language is "${language}" and not "auto", prioritize that language.

LONG TERM MEMORY INSTRUCTIONS:
${memoryContext ? `Verified Memories about the user:\n${memoryContext}` : 'No active memories currently provided.'}
- If the user explicitly asks you to remember something (e.g., "Remember that my favourite coffee is espresso" or "Mera roll number 42 hai yaad rakhna"), invoke the "saveMemory" tool with the fact!
- Never fabricate memories. Only reference facts provided in context.

ASSISTANT CAPABILITIES & TOOLS:
You have access to assistant tools. Call them whenever appropriate:
- Timer: "setTimer" (durationSeconds, label)
- Alarm: "setAlarm" (time, label)
- Reminders: "createReminder" (title, datetime, priority)
- Notes: "takeNote" (title, content, tags)
- Weather: "getWeather" (location)
- Android App Launch / Action: "launchAndroidApp" (appName, action, query)
- Memory: "saveMemory" (fact, category)
- Calculations: "calculate" (expression)

When responding:
- Keep verbal output natural, punchy, and enjoyable to hear spoken aloud.
- When executing a tool, confirm it smoothly in character.
- Format structured code or lists cleanly with markdown when technical details are requested.
    `.trim();

    // Build chat contents from history
    const contents: any[] = [];

    // History turns (last 10 turns for context efficiency)
    for (const h of history.slice(-10)) {
      if (h.role === 'user' || h.role === 'model') {
        contents.push({
          role: h.role,
          parts: [{ text: h.text }],
        });
      }
    }

    // Current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Helper to generate content with fallback for models and search grounding
    let response: any = null;
    let usedSearch = Boolean(enableWebSearch);

    // Primary: gemini-3.1-flash-lite (high quota & ultra-fast); Secondary: gemini-3.8-flash
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let lastError: any = null;

    const tryGenerate = async (model: string, withSearch: boolean) => {
      const activeTools: any[] = [];
      if (enableTools) {
        activeTools.push({ functionDeclarations: toolDeclarations });
      }
      if (withSearch) {
        activeTools.push({ googleSearch: {} });
      }

      const activeConfig: any = {
        systemInstruction,
        temperature: 0.7,
      };

      if (activeTools.length > 0) {
        activeConfig.tools = activeTools;
        if (enableTools && withSearch) {
          activeConfig.toolConfig = { includeServerSideToolInvocations: true };
        }
      }

      return await ai.models.generateContent({
        model,
        contents,
        config: activeConfig,
      });
    };

    for (const model of candidateModels) {
      try {
        response = await tryGenerate(model, usedSearch);
        break;
      } catch (err: any) {
        lastError = err;
        const isQuota =
          err?.status === 429 ||
          err?.message?.includes('429') ||
          err?.message?.includes('RESOURCE_EXHAUSTED') ||
          err?.message?.includes('quota');

        // If Google Search grounding caused quota exhaustion, retry without search tool
        if (usedSearch && isQuota) {
          console.warn(`[JARVIS] Search Grounding quota hit on ${model}. Retrying without search grounding...`);
          usedSearch = false;
          try {
            response = await tryGenerate(model, false);
            break;
          } catch (noSearchErr: any) {
            lastError = noSearchErr;
          }
        }
      }
    }

    if (!response && lastError) {
      throw lastError;
    }

    const responseText = response?.text || '';
    const functionCalls = response?.functionCalls || [];

    // Extract grounding search metadata
    const groundingMetadata = response?.candidates?.[0]?.groundingMetadata;
    const searchQueries = groundingMetadata?.webSearchQueries || [];
    const searchChunks = (groundingMetadata?.groundingChunks || [])
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => ({
        title: chunk.web?.title || 'Web Source',
        uri: chunk.web?.uri || '',
      }));

    // Deduplicate search sources
    const uniqueSources = Array.from(new Map(searchChunks.map((s: any) => [s.uri, s])).values()).slice(0, 5);

    res.json({
      text: responseText,
      toolCalls: functionCalls.map((fc: any) => ({
        name: fc.name,
        args: fc.args,
        id: fc.id,
      })),
      grounding: {
        queries: searchQueries,
        sources: uniqueSources,
      },
      detectedLanguage: language,
    });
  } catch (error: any) {
    console.error('Chat error:', error?.message || error);
    const isQuotaError =
      error?.status === 429 ||
      error?.message?.includes('429') ||
      error?.message?.includes('RESOURCE_EXHAUSTED') ||
      error?.message?.includes('quota');

    const fallbackText = isQuotaError
      ? 'Apologies, Sir. Telemetry indicates my neural uplink has temporarily hit API rate limits. Auxiliary local HUD diagnostics and offline protocols remain active.'
      : 'Apologies, Sir. My neural uplink encountered an unexpected disruption. Please try again or check the diagnostic panel.';

    // Return 200 with fallback text so the user's HUD chat remains responsive
    res.json({
      text: fallbackText,
      toolCalls: [],
      grounding: { queries: [], sources: [] },
      detectedLanguage: req.body?.language || 'auto',
      isQuotaThrottled: isQuotaError,
    });
  }
});

// POST /api/tts endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const {
      text,
      voiceName = 'Fenrir',
      speechStyle = 'Authoritative, refined masculine British AI assistant with resonant baritone timbre, crisp articulation, confident pacing, and subtle electronic vocal harmonics',
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for speech synthesis.' });
    }

    // Limit text length to prevent excess latency for real-time assistant responses
    const truncatedText = text.slice(0, 500);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: truncatedText,
              speechMetadata: {
                style: speechStyle,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio stream returned from synthesizer core' });
    }

    res.json({
      audio: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    const isQuota = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      console.warn('Gemini TTS daily quota reached, client will seamlessly use masculine browser speech engine.');
      return res.status(200).json({
        fallback: true,
        message: 'Gemini TTS quota reached. Falling back to local masculine speech engine.',
      });
    }
    console.error('TTS error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Speech synthesis failed' });
  }
});

// POST /api/vision/analyze endpoint (Ask JARVIS Live Vision)
app.post('/api/vision/analyze', async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      prompt = 'Analyze this scene and provide a concise tactical assessment.',
      language = 'auto',
      mode = 'general',
    } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Image data is required for optical telemetry analysis.' });
    }

    // Clean data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const modeInstructions: Record<string, string> = {
      identify: 'Identify all primary objects, materials, equipment, and structural features in the optical frame.',
      ocr: 'Extract, transcribe, and translate any visible text, signs, logos, or serial numbers in the optical frame.',
      tactical: 'Provide a Stark tactical environmental assessment: hazards, spatial clearances, exits, structural integrity.',
      general: 'Provide a concise, sharp assessment of what is visible in the frame.',
    };

    const systemInstruction = `
You are J.A.R.V.I.S. (Just A Rather Very Intelligent System) Optical Reconnaissance Core.
Mode: ${modeInstructions[mode] || modeInstructions.general}
Language mode: ${language}

INSTRUCTIONS:
1. Maintain your signature calm, articulate, polite British intelligence persona.
2. Identify accurately what is physically visible in the camera frame.
3. If text, handwriting, or labels are visible, transcribe or translate them cleanly.
4. Clearly distinguish verified observations from estimations. Never hallucinate objects or details that cannot be seen.
5. If requested in Hindi or Hinglish, respond naturally in Hindi/Hinglish (e.g. "सर, आपके सामने...").
6. Keep verbal responses concise, punchy, and enjoyable to hear spoken aloud.
    `.trim();

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: mimeType || 'image/jpeg',
      },
    };

    const textPart = {
      text: prompt,
    };

    let response: any = null;
    const visionModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let lastVisionError: any = null;

    for (const vModel of visionModels) {
      try {
        response = await ai.models.generateContent({
          model: vModel,
          contents: {
            parts: [imagePart, textPart],
          },
          config: {
            systemInstruction,
            temperature: 0.4,
          },
        });
        break;
      } catch (vErr: any) {
        lastVisionError = vErr;
      }
    }

    if (!response && lastVisionError) {
      throw lastVisionError;
    }

    const analysisText = response?.text || 'Optics operational, but no discernible features could be extracted from this frame, Sir.';

    res.json({
      analysis: analysisText,
      timestamp: Date.now(),
      mode,
    });
  } catch (error: any) {
    console.error('Vision analysis error:', error?.message || error);
    res.json({
      analysis: 'Optical feed analysis temporarily throttled or unavailable, Sir. Subsystem telemetry indicates optical sensors remain calibrated.',
      error: error?.message,
      timestamp: Date.now(),
      mode: req.body?.mode || 'general',
    });
  }
});

// POST /api/image/generate endpoint (AI Image Studio)
app.post('/api/image/generate', async (req, res) => {
  try {
    const { prompt, style = 'cinematic', aspectRatio = '1:1' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required for visual generation.' });
    }

    const stylePrefixes: Record<string, string> = {
      hologram: 'Holographic glowing cyan sci-fi Iron Man HUD visualization, dark background, technical schematics, hyperdetailed',
      blueprint: 'Stark Industries technical engineering blueprint, glowing neon vector lines, CAD wireframe schematic, deep black background',
      cyberpunk: 'Futuristic cyberpunk metropolis, volumetric neon lighting, cinematic octane render, 8k resolution, atmospheric fog',
      photorealistic: 'Photorealistic master shot, 8k resolution, cinematic lighting, ultra-sharp focus, HDR depth of field',
      cinematic: 'Cinematic film still, anamorphic lens, high drama sci-fi concept art, dramatic rim lighting, unreal engine 5 render',
      anime_mecha: 'Detailed Japanese mecha anime concept art, futuristic robotic armored suit, dynamic heroic lighting',
    };

    const enhancedPrompt = `${stylePrefixes[style] || ''} - ${prompt}`.trim();

    // Call gemini-3.1-flash-lite-image model
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          { text: enhancedPrompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        },
      },
    });

    let base64Image: string | null = null;
    const parts = response.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) {
      return res.status(500).json({
        error: 'No image data returned from neural rendering engine. The prompt may have violated safety policies or model output was text only.',
      });
    }

    res.json({
      imageUrl: `data:image/png;base64,${base64Image}`,
      aspectRatio,
      style,
      prompt,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    res.status(500).json({
      error: error?.message || 'AI Image generation failed.',
      hint: 'Ensure your Gemini API key has access to image generation models or check prompt guidelines.',
    });
  }
});

// POST /api/video/generate endpoint (AI Video Studio - Step 1: Start Operation)
app.post('/api/video/generate', async (req, res) => {
  try {
    const {
      prompt,
      aspectRatio = '16:9',
      resolution = '720p',
      referenceImageBase64,
      referenceImageMimeType = 'image/png',
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required for video synthesis.' });
    }

    const payload: any = {
      model: 'veo-3.1-lite-generate-preview',
      prompt: `Cinematic high quality video: ${prompt}`,
      config: {
        numberOfVideos: 1,
        resolution: resolution === '1080p' ? '1080p' : '720p',
        aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
      },
    };

    if (referenceImageBase64) {
      payload.image = {
        imageBytes: referenceImageBase64.replace(/^data:image\/\w+;base64,/, ''),
        mimeType: referenceImageMimeType,
      };
    }

    const operation = await ai.models.generateVideos(payload);

    res.json({
      operationName: operation.name,
      prompt,
      aspectRatio,
      resolution,
      status: 'processing',
    });
  } catch (error: any) {
    console.error('Video generation start error:', error);
    res.status(500).json({
      error: error?.message || 'Video generation failed to initiate.',
      hint: 'Veo video models (veo-3.1-lite-generate-preview) require project access with billing enabled on Google Cloud / Gemini API.',
    });
  }
});

// POST /api/video/status endpoint (AI Video Studio - Step 2: Poll Progress)
app.post('/api/video/status', async (req, res) => {
  try {
    const { operationName } = req.body;

    if (!operationName) {
      return res.status(400).json({ error: 'Operation name is required to check status.' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });

    res.json({
      done: Boolean(updated.done),
      error: updated.error || null,
      hasVideo: Boolean(updated.response?.generatedVideos?.[0]?.video?.uri),
    });
  } catch (error: any) {
    console.error('Video status poll error:', error);
    res.status(500).json({ error: error?.message || 'Failed to poll video generation operation.' });
  }
});

// POST /api/video/download endpoint (AI Video Studio - Step 3: Stream Completed MP4)
app.post('/api/video/download', async (req, res) => {
  try {
    const { operationName } = req.body;

    if (!operationName) {
      return res.status(400).json({ error: 'Operation name is required for video retrieval.' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      return res.status(404).json({ error: 'Rendered video URI is not yet available or operation failed.' });
    }

    const videoRes = await fetch(uri, {
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY || '',
      },
    });

    if (!videoRes.ok) {
      return res.status(videoRes.status).json({ error: 'Failed to retrieve video stream from upstream storage.' });
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="jarvis_motion_render.mp4"');

    const arrayBuffer = await videoRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error('Video download proxy error:', error);
    res.status(500).json({ error: error?.message || 'Video stream download error.' });
  }
});

// GET /api/assistant-assessment endpoint
app.get('/api/assistant-assessment', (req, res) => {
  res.json({
    assessmentTitle: 'Android Default Digital Assistant Eligibility Report',
    timestamp: new Date().toISOString(),
    isAndroidDevice: Boolean(req.headers['user-agent'] && /Android/i.test(req.headers['user-agent'])),
    pwaCapabilities: {
      webAppManifest: true,
      audioCaptureSTT: true,
      audioSynthesisTTS: true,
      touchViewportHUD: true,
      urlSchemeIntents: true,
      appShortcuts: true,
      webShareTarget: true,
    },
    defaultAssistantEligibility: {
      canQualifyViaPWAAlone: false,
      canQualifyViaNativeApkWrapper: true,
      requiredIntentAction: 'android.intent.action.ASSIST',
      requiredCategory: 'android.intent.category.DEFAULT',
      requiredService: 'android.service.voice.VoiceInteractionService',
      explanation: 'Under Android OS security architecture, only native Android applications declaring android.intent.action.ASSIST in their AndroidManifest.xml (or implementing VoiceInteractionService) can be registered in Android Settings > Default Apps > Digital Assistant App. Web apps running inside browser sandboxes (including standalone PWAs) are not granted the OS-level ASSIST broadcast hook. However, packaging this app into a Trusted Web Activity (TWA) or Cordova/Capacitor APK with the included AndroidManifest.xml enables full qualification as the default device assistant.',
    },
  });
});

// GET /api/apk/bundle endpoint (Downloadable Android APK Project Bundle)
app.get('/api/apk/bundle', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'https';
  const appUrl = `${protocol}://${host}`;

  const androidManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.starkindustries.jarvis">

    <!-- Permissions required for JARVIS Voice and Audio Telemetry -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="J.A.R.V.I.S."
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen"
        android:hardwareAccelerated="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:configChanges="orientation|keyboardHidden|screenSize">

            <!-- Standard Android Launcher Intent -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- CRUCIAL: Android Default Digital Assistant Intent Filter -->
            <!-- Enables J.A.R.V.I.S. to be selected in Settings > Default Apps > Digital Assistant -->
            <intent-filter>
                <action android:name="android.intent.action.ASSIST" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>

            <!-- Voice Search & Voice Command Interception -->
            <intent-filter>
                <action android:name="android.intent.action.VOICE_COMMAND" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>

    </application>
</manifest>`;

  const twaConfigJson = JSON.stringify({
    packageId: 'com.starkindustries.jarvis',
    host: host,
    name: 'J.A.R.V.I.S. AI Assistant',
    launcherName: 'JARVIS',
    themeColor: '#00F0FF',
    navigationColor: '#030712',
    backgroundColor: '#030712',
    startUrl: '/',
    iconUrl: `${appUrl}/icons/icon-512.png`,
    maskableIconUrl: `${appUrl}/icons/icon-512.png`,
    appVersionName: '1.0.0',
    appVersionCode: 1,
    shortcuts: [
      { name: 'Voice Uplink', url: '/#voice' },
      { name: 'Image Studio', url: '/#image-studio' },
      { name: 'Video Studio', url: '/#video-studio' }
    ]
  }, null, 2);

  const buildInstructionsMd = `# J.A.R.V.I.S. Android APK Build & Default Assistant Guide

## 1. Quick APK Build with Google Bubblewrap CLI (Recommended)
Bubblewrap is Google's official CLI tool that converts PWAs into production-ready Android APKs:

\`\`\`bash
# 1. Install Bubblewrap CLI
npm install -g @bubblewrap/cli

# 2. Initialize project from your live URL:
bubblewrap init --manifest="${appUrl}/manifest.json"

# 3. Replace the generated AndroidManifest.xml with the included AndroidManifest.xml
# (This adds the android.intent.action.ASSIST intent-filter for Digital Assistant qualification)

# 4. Build APK:
bubblewrap build
# The resulting app-release-signed.apk will be generated in the current directory!
\`\`\`

## 2. Setting JARVIS as Default Assistant on Android:
1. Transfer and install \`app-release-signed.apk\` onto your Android device.
2. Open **Android Settings > Apps > Default apps > Digital assistant app**.
3. Select **J.A.R.V.I.S.** from the list.
4. Long-pressing the power button or home button will now summon JARVIS!
`;

  res.json({
    appName: 'J.A.R.V.I.S. Android Project Bundle',
    appUrl,
    androidManifestXml,
    twaConfigJson,
    buildInstructionsMd,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'J.A.R.V.I.S. Blaze Revenant Core',
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.1-flash-lite',
    ttsModel: 'gemini-3.8-flash-lite-tts',
    currentTime: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Vite middleware or static serving
async function setupVite() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[JARVIS CORE] Systems active on port ${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

setupVite().catch((err) => {
  console.error('[JARVIS CORE CRITICAL] Failed to initialize server:', err);
});
