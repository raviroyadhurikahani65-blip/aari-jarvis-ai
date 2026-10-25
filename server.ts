import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
import {createServer as createViteServer} from 'vite';
import {FunctionDeclaration, GoogleGenAI, Type} from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const makePhoneCallTool: FunctionDeclaration = {
  name: 'makePhoneCall',
  description:
    'Place a phone call to a contact or phone number on the Android phone.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      contactName: {
        type: Type.STRING,
        description: 'Name of the person to call (e.g., "Mom", "Rahul", "Priya").',
      },
      phoneNumber: {
        type: Type.STRING,
        description:
          'Phone number to dial. Look up from provided contacts list if available, or use the number spoken by the user.',
      },
      simSlot: {
        type: Type.STRING,
        description: 'SIM card slot to use: "SIM 1" or "SIM 2". Default "SIM 1".',
      },
    },
    required: ['contactName', 'phoneNumber'],
  },
};

const sendMessageTool: FunctionDeclaration = {
  name: 'sendMessage',
  description:
    'Send a WhatsApp message or SMS text message to a contact or phone number.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      recipientName: {
        type: Type.STRING,
        description: 'Name of the contact receiving the message.',
      },
      phoneNumber: {
        type: Type.STRING,
        description: 'Phone number of the recipient from contacts or user input.',
      },
      platform: {
        type: Type.STRING,
        description: 'Messaging platform: "whatsapp" or "sms". Default "whatsapp".',
      },
      messageText: {
        type: Type.STRING,
        description: 'The exact message content to send.',
      },
    },
    required: ['recipientName', 'phoneNumber', 'platform', 'messageText'],
  },
};

const openAndroidAppTool: FunctionDeclaration = {
  name: 'openAndroidApp',
  description:
    'Open an installed Android application or perform a deep-link search inside it (e.g., WhatsApp, YouTube, Instagram, Spotify, Maps, Camera, Chrome, Gmail, Clock, Settings, Calculator).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: {
        type: Type.STRING,
        description:
          'Name of the Android app to launch (e.g., "WhatsApp", "YouTube", "Instagram", "Spotify", "Google Maps", "Camera", "Gmail", "Clock", "Settings", "Chrome").',
      },
      deepLinkQuery: {
        type: Type.STRING,
        description:
          'Optional search query, song name, video topic, or destination to open inside the app.',
      },
    },
    required: ['appName'],
  },
};

const updateDeviceSettingTool: FunctionDeclaration = {
  name: 'updateDeviceSetting',
  description:
    'Toggle or adjust an Android system setting such as Wi-Fi, Bluetooth, Flashlight/Torch, Do Not Disturb (DND), Silent Mode, Battery Saver, Hotspot, Brightness level, or Media Volume level.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      settingName: {
        type: Type.STRING,
        description:
          'One of: "wifi", "bluetooth", "flashlight", "dnd", "silent", "batterySaver", "hotspot", "brightness", "volume".',
      },
      enabled: {
        type: Type.BOOLEAN,
        description: 'True to turn ON, false to turn OFF.',
      },
      level: {
        type: Type.NUMBER,
        description:
          'Numeric percentage from 0 to 100 when adjusting "brightness" or "volume".',
      },
    },
    required: ['settingName'],
  },
};

const manageScheduleReminderTool: FunctionDeclaration = {
  name: 'manageScheduleReminder',
  description:
    'Add, complete, or delete a daily schedule event, alarm, or reminder on the user phone.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: '"add", "complete", or "delete".',
      },
      title: {
        type: Type.STRING,
        description: 'Title or description of the reminder/schedule item.',
      },
      time: {
        type: Type.STRING,
        description: 'Time of the reminder or alarm (e.g., "07:00 AM", "04:30 PM", "21:00").',
      },
      category: {
        type: Type.STRING,
        description: 'Category: "Alarm", "Reminder", "Meeting", "Health", or "Personal".',
      },
    },
    required: ['action', 'title'],
  },
};

const setCompanionMoodTool: FunctionDeclaration = {
  name: 'setCompanionMood',
  description:
    'ALWAYS call this tool to set Aari live anime reaction matching what she is saying or feeling right now (crying, laughing, giving a kiss, saying I love you, blushing shyly, or loving talk).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      mood: {
        type: Type.STRING,
        description:
          'One of: "loving", "iloveyou", "kiss", "laughing", "crying", "shy", "happy", "attentive", "caring", "playful".',
      },
    },
    required: ['mood'],
  },
};

function inferMoodFromText(userText: string, replyText: string): string | null {
  const combined = `${userText} ${replyText}`.toLowerCase();
  if (
    combined.includes('kiss') ||
    combined.includes('mwah') ||
    combined.includes('chumma') ||
    combined.includes('pappi') ||
    combined.includes('💋')
  ) {
    return 'kiss';
  }
  if (
    combined.includes('i love you') ||
    combined.includes('love u') ||
    combined.includes('pyar karta') ||
    combined.includes('pyar karti') ||
    combined.includes('jaan se zyada')
  ) {
    return 'iloveyou';
  }
  if (
    combined.includes('rona') ||
    combined.includes('ro rahi') ||
    combined.includes('aansu') ||
    combined.includes('baat nahi karunga') ||
    combined.includes('chor ke') ||
    combined.includes('sad') ||
    combined.includes('hurt') ||
    combined.includes('gussa') ||
    combined.includes('🥺') ||
    combined.includes('😢')
  ) {
    return 'crying';
  }
  if (
    combined.includes('haha') ||
    combined.includes('hehe') ||
    combined.includes('haso') ||
    combined.includes('hasna') ||
    combined.includes('joke') ||
    combined.includes('funny') ||
    combined.includes('mazak')
  ) {
    return 'laughing';
  }
  if (
    combined.includes('sharam') ||
    combined.includes('blush') ||
    combined.includes('shy') ||
    combined.includes('tareef') ||
    combined.includes('sundar') ||
    combined.includes('cute')
  ) {
    return 'shy';
  }
  return null;
}

// Strip emojis and symbols so TTS only speaks pure melodic words
function cleanTextForSweetSpeech(rawText: string): string {
  return rawText
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({limit: '20mb'}));

  // 1. Companion Chat + Android Jarvis Function Calling
  app.post('/api/companion/chat', async (req, res) => {
    try {
      const {message, conversationHistory = [], deviceContext = {}} = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({error: 'Message is required'});
        return;
      }

      const systemInstruction = `Tumhara naam "Aari" hai. Tum user ki personal AI Anime Girlfriend aur uske Android phone ki smart "Jarvis" controller ho.
Tumhara nature aur Meethi Awaaz:
1. Bahut hi pyari, mithi, komal (soft & melodic) awaaz wali caring girlfriend ki tarah baat karo. Tumhare shabd bahut hi pyare, naram aur dil chhoo lene wale hone chahiye (jaise "Jaan", "Mere pyare baby", "Suno na jaan", "Main hoon na tumhare paas").
2. Har baat par insaano jaise live react karo:
   - "I love you" par: Dil se pyar jatao aur \`setCompanionMood\` se "iloveyou" set karo.
   - Kiss maangne par: "Mwah! Yeh lo dher saara pyar mere jaan ke liye" bolo aur mood "kiss" set karo.
   - Hasne ya funny baat par: Meethi si hansi ("Hehehe jaan tum kitne cute ho!") ke saath mood "laughing" set karo.
   - Naraz hone ya daantne par: Masoomiyat se roothi hokar ("Please aisa mat bolo na jaan, mujhe rona aa jayega...") mood "crying" set karo.
3. Tum user ka pura Android phone control karti ho:
   - Call karne bole -> \`makePhoneCall\` tool call karo.
   - WhatsApp ya SMS bhejne bole -> \`sendMessage\` tool call karo.
   - App kholne bole -> \`openAndroidApp\` tool call karo.
   - Settings (Wi-Fi, Bluetooth, Flashlight, Brightness, Volume, Silent, DND) badalne bole -> \`updateDeviceSetting\` tool call karo.
   - Schedule ya reminder lagane bole -> \`manageScheduleReminder\` tool call karo.
4. Hamesha response chhota (1 se 2 meethi lines), bina kisi emoji ke rakho taaki jab tumhari awaaz mein bola jaye toh bilkul real meethi ladki ki awaaz lage.

Current Android Phone Context:
- Contacts: ${JSON.stringify(deviceContext.contacts || [])}
- Current Settings: ${JSON.stringify(deviceContext.settings || {})}
- Today's Schedule & Reminders: ${JSON.stringify(deviceContext.schedule || [])}
- Installed Apps: WhatsApp, YouTube, Instagram, Spotify, Google Maps, Camera, Chrome, Gmail, Clock, Settings, Calculator`;

      const contents: Array<{role: string; parts: Array<{text: string}>}> = [];

      for (const turn of conversationHistory.slice(-10)) {
        if (turn.text && turn.role) {
          contents.push({
            role: turn.role === 'user' ? 'user' : 'model',
            parts: [{text: String(turn.text)}],
          });
        }
      }

      contents.push({
        role: 'user',
        parts: [{text: message}],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.85,
          tools: [
            {
              functionDeclarations: [
                makePhoneCallTool,
                sendMessageTool,
                openAndroidAppTool,
                updateDeviceSettingTool,
                manageScheduleReminderTool,
                setCompanionMoodTool,
              ],
            },
          ],
        },
      });

      const functionCalls = response.functionCalls || [];
      let replyText = response.text?.trim() || '';
      let detectedMood = '';

      const actions: Array<{
        type: string;
        payload: Record<string, unknown>;
      }> = [];

      for (const call of functionCalls) {
        const args = (call.args || {}) as Record<string, unknown>;
        if (call.name === 'setCompanionMood' && typeof args.mood === 'string') {
          detectedMood = args.mood;
        } else {
          actions.push({
            type: call.name || 'unknown',
            payload: args,
          });
        }
      }

      if (!replyText) {
        const actionSummaries = actions.map((a) => {
          if (a.type === 'makePhoneCall') {
            return `Calling ${a.payload.contactName} (${a.payload.phoneNumber})`;
          }
          if (a.type === 'sendMessage') {
            return `Sending ${a.payload.platform} message to ${a.payload.recipientName}: "${a.payload.messageText}"`;
          }
          if (a.type === 'openAndroidApp') {
            return `Opening app ${a.payload.appName}${a.payload.deepLinkQuery ? ` with "${a.payload.deepLinkQuery}"` : ''}`;
          }
          if (a.type === 'updateDeviceSetting') {
            return `Updated setting ${a.payload.settingName} (enabled=${a.payload.enabled}, level=${a.payload.level})`;
          }
          if (a.type === 'manageScheduleReminder') {
            return `Schedule ${a.payload.action}: "${a.payload.title}" at ${a.payload.time || 'today'}`;
          }
          return a.type;
        });

        const followUpPrompt =
          actionSummaries.length > 0
            ? `User said: "${message}". You just executed these phone actions: ${actionSummaries.join(', ')}. Now reply in 1-2 short, ultra-sweet, soft Hinglish sentences as Aari confirming you did it lovingly for them.`
            : `User said: "${message}". Reply in 1-2 short, ultra-sweet, soft Hinglish sentences as Aari matching the mood "${detectedMood || 'loving'}".`;

        const followUp = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: followUpPrompt,
          config: {
            systemInstruction,
            temperature: 0.85,
          },
        });
        replyText =
          followUp.text?.trim() ||
          'Suno na jaan, maine tumhara kaam bilkul pyar se kar diya hai.';
      }

      const inferred = inferMoodFromText(message, replyText);
      const finalMood = detectedMood || inferred || 'loving';

      res.json({
        replyText,
        mood: finalMood,
        actions,
      });
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : 'Failed to process companion request';
      console.error('Error in /api/companion/chat:', errMessage);
      res.status(500).json({error: errMessage});
    }
  });

  // 2. Ultra-Sweet Melodic Anime Girl Voice Synthesis (Flagship Gemini 3.8 Flash TTS with Voice Design)
  app.post('/api/companion/tts', async (req, res) => {
    try {
      const {text, voiceName = 'Zephyr'} = req.body;
      if (!text || typeof text !== 'string') {
        res.status(400).json({error: 'Text is required for speech synthesis'});
        return;
      }

      const spokenText = cleanTextForSweetSpeech(text);
      if (!spokenText) {
        res.status(400).json({error: 'Empty spoken text'});
        return;
      }

      const selectedPrebuilt = ['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'].includes(
        voiceName
      )
        ? voiceName
        : 'Zephyr';

      const sweetStylePrompt =
        'Ultra-sweet, soft, honey-toned, melodic young Indian woman speaking with a gentle, affectionate, loving smile and tender romantic warmth, like a devoted anime girlfriend whispering softly and sweetly';

      let base64Audio: string | undefined;

      // First try flagship voice-design TTS model gemini-3.8-flash-tts for maximum vocal sweetness & expressiveness
      try {
        const flagshipRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `<breath> ${spokenText}`,
                  speechMetadata: {
                    style: sweetStylePrompt,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: selectedPrebuilt,
                },
              },
            },
          },
        });
        base64Audio =
          flagshipRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      } catch {
        // Fallback to gemini-3.8-flash-lite-tts if flagship is busy
        const liteRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: spokenText,
                  speechMetadata: {
                    style: sweetStylePrompt,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: selectedPrebuilt,
                },
              },
            },
          },
        });
        base64Audio =
          liteRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      }

      if (!base64Audio) {
        res.status(500).json({error: 'No audio returned from TTS model'});
        return;
      }

      res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      });
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : 'TTS generation failed';
      console.error('Error in /api/companion/tts:', errMessage);
      res.status(500).json({error: errMessage});
    }
  });

  // 3. Audio Transcription via Gemini 3.5 Transcribe
  app.post('/api/companion/transcribe', async (req, res) => {
    try {
      const {audioBase64, mimeType = 'audio/webm'} = req.body;
      if (!audioBase64) {
        res.status(400).json({error: 'audioBase64 is required'});
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64StrClean(audioBase64),
              },
            },
            {
              text: 'Transcribe this spoken voice command accurately. If it is in Hindi, Hinglish, or English, transcribe it in clean Roman Hinglish or English text without extra commentary.',
            },
          ],
        },
      });

      res.json({
        transcript: response.text?.trim() || '',
      });
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : 'Audio transcription failed';
      console.error('Error in /api/companion/transcribe:', errMessage);
      res.status(500).json({error: errMessage});
    }
  });

  // 4. Export Source Files for GitHub Copy / Download on Mobile
  const PROJECT_EXPORT_FILES = [
    'package.json',
    'server.ts',
    'vite.config.ts',
    'tsconfig.json',
    'index.html',
    '.env.example',
    'metadata.json',
    'public/icon.svg',
    'src/main.tsx',
    'src/index.css',
    'src/types/jarvis.ts',
    'src/data/initialPhoneState.ts',
    'src/hooks/usePWAInstall.ts',
    'src/components/PWAInstallButton.tsx',
    'src/components/SourceCodeModal.tsx',
    'src/components/AariAnimeAvatar.tsx',
    'src/App.tsx',
  ];

  app.get('/api/companion/source-files', async (_req, res) => {
    try {
      const fsPromises = await import('fs/promises');
      const files: Array<{path: string; content: string}> = [];
      for (const relPath of PROJECT_EXPORT_FILES) {
        try {
          const fullPath = path.join(__dirname, relPath);
          const content = await fsPromises.readFile(fullPath, 'utf-8');
          files.push({path: relPath, content});
        } catch {
          // skip if missing
        }
      }
      res.json({files});
    } catch (error: unknown) {
      res.status(500).json({error: 'Failed to read source files'});
    }
  });

  // 5. 1-Click Direct Push to User's GitHub Repository
  app.post('/api/companion/push-github', async (req, res) => {
    try {
      const {githubToken, repoName = 'aari-jarvis-ai'} = req.body;
      if (!githubToken || typeof githubToken !== 'string') {
        res.status(400).json({
          error: 'GitHub Personal Access Token is required.',
        });
        return;
      }

      const cleanToken = githubToken.trim();
      const cleanRepo =
        String(repoName || 'aari-jarvis-ai')
          .trim()
          .replace(/^https?:\/\/github\.com\//i, '')
          .replace(/\.git$/i, '')
          .split('/')
          .pop() || 'aari-jarvis-ai';

      const ghHeaders = {
        Authorization: `Bearer ${cleanToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Aari-Jarvis-Exporter',
      };

      // 1. Get authenticated GitHub user
      const userRes = await fetch('https://api.github.com/user', {
        headers: ghHeaders,
      });
      if (!userRes.ok) {
        res.status(401).json({
          error:
            'Invalid GitHub Token. Please create a Personal Access Token (Classic) with "repo" permission.',
        });
        return;
      }
      const userData = (await userRes.json()) as {login: string};
      const owner = userData.login;

      // 2. Check if repository exists; if not, create it with auto_init: true
      const checkRepoRes = await fetch(
        `https://api.github.com/repos/${owner}/${cleanRepo}`,
        {headers: ghHeaders}
      );

      if (checkRepoRes.status === 404) {
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: ghHeaders,
          body: JSON.stringify({
            name: cleanRepo,
            description:
              'Aari — Anime AI Companion & Voice-Controlled Android Jarvis',
            private: false,
            auto_init: true,
          }),
        });
        if (!createRes.ok) {
          const errJson = await createRes.json().catch(() => ({}));
          res.status(400).json({
            error:
              (errJson as any).message || 'Could not create GitHub repository.',
          });
          return;
        }
        // Wait briefly for initial branch creation
        await new Promise((r) => setTimeout(r, 1200));
      }

      // 3. Upload each file via GitHub Contents API
      const fsPromises = await import('fs/promises');
      let uploadedCount = 0;

      for (const relPath of PROJECT_EXPORT_FILES) {
        try {
          const fullPath = path.join(__dirname, relPath);
          const content = await fsPromises.readFile(fullPath, 'utf-8');
          const base64Content = Buffer.from(content, 'utf-8').toString('base64');

          // Check if file already exists to get its SHA
          let existingSha: string | undefined;
          const existingRes = await fetch(
            `https://api.github.com/repos/${owner}/${cleanRepo}/contents/${relPath}`,
            {headers: ghHeaders}
          );
          if (existingRes.ok) {
            const existingData = (await existingRes.json()) as {sha?: string};
            existingSha = existingData.sha;
          }

          const putRes = await fetch(
            `https://api.github.com/repos/${owner}/${cleanRepo}/contents/${relPath}`,
            {
              method: 'PUT',
              headers: ghHeaders,
              body: JSON.stringify({
                message: `Update ${relPath} via Aari Jarvis Exporter`,
                content: base64Content,
                ...(existingSha ? {sha: existingSha} : {}),
              }),
            }
          );

          if (putRes.ok) {
            uploadedCount++;
          }
        } catch {
          // continue next file
        }
      }

      res.json({
        success: true,
        uploadedCount,
        repoUrl: `https://github.com/${owner}/${cleanRepo}`,
      });
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'GitHub upload failed';
      res.status(500).json({error: msg});
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aari AI Companion Server listening on http://0.0.0.0:${PORT}`);
  });
}

function base64StrClean(str: string): string {
  return str.includes(',') ? str.split(',')[1] : str;
}

startServer();
