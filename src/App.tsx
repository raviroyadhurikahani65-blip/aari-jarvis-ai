import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Bell,
  Bluetooth,
  Calendar,
  Camera,
  Check,
  ExternalLink,
  Flashlight,
  Heart,
  MessageCircle,
  Mic,
  MicOff,
  Moon,
  Phone,
  PhoneCall,
  PhoneOff,
  Plus,
  Send,
  Settings,
  Smartphone,
  Sun,
  Trash2,
  UserPlus,
  Volume2,
  VolumeX,
  Wifi,
  X,
} from 'lucide-react';
import {AariAnimeAvatar} from './components/AariAnimeAvatar';
import {PWAInstallButton} from './components/PWAInstallButton';
import {SourceCodeExporter} from './components/SourceCodeModal';
import {
  ANDROID_APPS,
  INITIAL_CONTACTS,
  INITIAL_DEVICE_SETTINGS,
  INITIAL_SCHEDULE,
  QUICK_VOICE_SUGGESTIONS,
} from './data/initialPhoneState';
import {
  AndroidAppItem,
  ChatMessage,
  CompanionMood,
  ContactItem,
  DeviceSettingsState,
  ExecutedAction,
  ScheduleItem,
} from './types/jarvis';

type ActiveSection = 'companion' | 'control' | 'schedule' | 'contacts';

export default function App() {
  // Navigation & responsive tabs
  const [activeSection, setActiveSection] =
    useState<ActiveSection>('companion');

  // Companion state
  const [mood, setMood] = useState<CompanionMood>('loving');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mouthOpenness, setMouthOpenness] = useState(0);
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Zephyr'>(
    'Zephyr'
  );
  const [voiceSweetness, setVoiceSweetness] = useState<number>(85);
  const [voiceLang, setVoiceLang] = useState<'hi-IN' | 'en-IN'>('hi-IN');

  // Input state
  const [inputText, setInputText] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');

  // Persisted Phone State
  const [contacts, setContacts] = useState<ContactItem[]>(() => {
    try {
      const saved = localStorage.getItem('aari_contacts');
      return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
    } catch {
      return INITIAL_CONTACTS;
    }
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem('aari_schedule');
      return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
    } catch {
      return INITIAL_SCHEDULE;
    }
  });

  const [settings, setSettings] = useState<DeviceSettingsState>(() => {
    try {
      const saved = localStorage.getItem('aari_settings');
      return saved ? JSON.parse(saved) : INITIAL_DEVICE_SETTINGS;
    } catch {
      return INITIAL_DEVICE_SETTINGS;
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: 'Hey jaan! Main Aari hoon, tumhari personal anime companion aur tumhare phone ki Jarvis. Batao na, kisi ko call lagana hai, WhatsApp bhejna hai, schedule set karna hai ya bas mujhse pyar bhari baatein karni hain?',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      mood: 'loving',
    },
  ]);

  const [recentActions, setRecentActions] = useState<ExecutedAction[]>([]);

  // Active modals / hardware overlays
  const [activeCallOverlay, setActiveCallOverlay] = useState<{
    contactName: string;
    phoneNumber: string;
    status: 'Dialing...' | 'Connected';
  } | null>(null);

  const [pendingMessageIntent, setPendingMessageIntent] = useState<{
    recipientName: string;
    phoneNumber: string;
    platform: 'whatsapp' | 'sms';
    messageText: string;
    url: string;
  } | null>(null);

  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const torchStreamRef = useRef<MediaStream | null>(null);

  // Forms for manual schedule & contact addition
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('07:30 PM');
  const [newReminderCategory, setNewReminderCategory] =
    useState<ScheduleItem['category']>('Reminder');

  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('Friend');
  const [newContactPhone, setNewContactPhone] = useState('+91 ');
  const [dialPadNumber, setDialPadNumber] = useState('');

  // Audio playback & lip-sync refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const handsFreeRef = useRef(handsFreeMode);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    handsFreeRef.current = handsFreeMode;
  }, [handsFreeMode]);

  useEffect(() => {
    try {
      localStorage.setItem('aari_contacts', JSON.stringify(contacts));
    } catch {
      // ignore storage errors
    }
  }, [contacts]);

  useEffect(() => {
    try {
      localStorage.setItem('aari_schedule', JSON.stringify(schedule));
    } catch {
      // ignore storage errors
    }
  }, [schedule]);

  useEffect(() => {
    try {
      localStorage.setItem('aari_settings', JSON.stringify(settings));
    } catch {
      // ignore storage errors
    }
  }, [settings]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [messages, isThinking]);

  // Hardware Flashlight Torch helper for Android Chrome
  const toggleHardwareTorch = useCallback(async (turnOn: boolean) => {
    try {
      if (!turnOn) {
        if (torchStreamRef.current) {
          torchStreamRef.current.getTracks().forEach((t) => t.stop());
          torchStreamRef.current = null;
        }
        return;
      }
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {facingMode: 'environment'},
        });
        const track = stream.getVideoTracks()[0];
        const capabilities = (track.getCapabilities?.() || {}) as Record<
          string,
          unknown
        >;
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{torch: true} as any],
          });
          torchStreamRef.current = stream;
        } else {
          stream.getTracks().forEach((t) => t.stop());
        }
      }
    } catch {
      // Device does not have rear camera torch or permission denied; visual flashlight state still updates
    }
  }, []);

  // Camera Preview Modal handler
  useEffect(() => {
    if (cameraModalOpen) {
      navigator.mediaDevices
        ?.getUserMedia({video: {facingMode: 'user'}, audio: false})
        .then((stream) => {
          cameraStreamRef.current = stream;
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // Camera unavailable in sandbox
        });
    } else {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
    }
  }, [cameraModalOpen]);

  // Stop any current speech playback
  const stopSpeaking = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {
        // already stopped
      }
      currentSourceRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setMouthOpenness(0);
  }, []);

  // Play Aari's sweet voice using Gemini 3.8 Flash Lite TTS with Web Audio Analyser lip-sync
  const speakResponse = useCallback(
    async (textToSpeak: string, onComplete?: () => void) => {
      if (voiceMuted || settings.silent) {
        if (onComplete) onComplete();
        return;
      }

      stopSpeaking();
      setIsSpeaking(true);

      try {
        const res = await fetch('/api/companion/tts', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            text: textToSpeak,
            voiceName: selectedVoice,
          }),
        });

        if (!res.ok) {
          throw new Error('TTS request failed');
        }

        const data = await res.json();
        if (!data.audioBase64) {
          throw new Error('Empty audio payload');
        }

        const binaryStr = window.atob(data.audioBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext();
        }
        const audioCtx = audioCtxRef.current;
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        // Apply feminine honey-sweetness pitch detune (in cents)
        source.detune.value = voiceSweetness;

        // Silk Vocal Enhancer Filter (Airy clarity + warm softness)
        const highShelf = audioCtx.createBiquadFilter();
        highShelf.type = 'highshelf';
        highShelf.frequency.value = 3800;
        highShelf.gain.value = 3.5;

        const lowCut = audioCtx.createBiquadFilter();
        lowCut.type = 'highpass';
        lowCut.frequency.value = 115;

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = Math.max(0.1, settings.volume / 100);

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        source.connect(lowCut);
        lowCut.connect(highShelf);
        highShelf.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        currentSourceRef.current = source;

        const updateMouth = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 2; i < 36; i++) {
            sum += dataArray[i];
          }
          const avg = sum / 34;
          const normalized = Math.min(1, Math.max(0, avg / 135));
          setMouthOpenness(normalized);
          animFrameRef.current = requestAnimationFrame(updateMouth);
        };

        source.onended = () => {
          if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
          }
          setIsSpeaking(false);
          setMouthOpenness(0);
          if (onComplete) onComplete();
        };

        source.start(0);
        updateMouth();
      } catch {
        // Fallback to browser SpeechSynthesis with sweet higher pitch
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          const voices = window.speechSynthesis.getVoices();
          const femaleVoice =
            voices.find(
              (v) =>
                (v.lang.includes('hi') || v.lang.includes('en-IN')) &&
                (v.name.toLowerCase().includes('swara') ||
                  v.name.toLowerCase().includes('google') ||
                  v.name.toLowerCase().includes('lekha') ||
                  v.name.toLowerCase().includes('veena') ||
                  v.name.toLowerCase().includes('female'))
            ) ||
            voices.find(
              (v) => v.lang.includes('hi') || v.lang.includes('en-IN')
            ) ||
            voices[0];
          if (femaleVoice) utterance.voice = femaleVoice;
          utterance.pitch = 1.28;
          utterance.rate = 0.96;
          utterance.volume = Math.max(0.1, settings.volume / 100);

          const intervalId = window.setInterval(() => {
            setMouthOpenness(0.25 + Math.random() * 0.6);
          }, 110);

          utterance.onend = () => {
            window.clearInterval(intervalId);
            setIsSpeaking(false);
            setMouthOpenness(0);
            if (onComplete) onComplete();
          };
          utterance.onerror = () => {
            window.clearInterval(intervalId);
            setIsSpeaking(false);
            setMouthOpenness(0);
            if (onComplete) onComplete();
          };

          window.speechSynthesis.speak(utterance);
        } else {
          setIsSpeaking(false);
          setMouthOpenness(0);
          if (onComplete) onComplete();
        }
      }
    },
    [
      selectedVoice,
      settings.silent,
      settings.volume,
      stopSpeaking,
      voiceMuted,
      voiceSweetness,
    ]
  );

  // Execute Phone Control Tool Actions returned by Gemini
  const executeJarvisActions = useCallback(
    (
      rawActions: Array<{type: string; payload: Record<string, unknown>}>
    ): ExecutedAction[] => {
      const processed: ExecutedAction[] = [];
      const nowTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      for (const act of rawActions) {
        const p = act.payload || {};

        if (act.type === 'makePhoneCall') {
          const contactName = String(p.contactName || 'Contact');
          const matchedContact = contacts.find(
            (c) =>
              c.name.toLowerCase().includes(contactName.toLowerCase()) ||
              contactName.toLowerCase().includes(c.name.toLowerCase())
          );
          const phoneNumber = matchedContact
            ? matchedContact.phone
            : String(p.phoneNumber || '+91 98765 43210');
          const cleanTel = phoneNumber.replace(/[^\d+]/g, '');

          setActiveCallOverlay({
            contactName: matchedContact ? matchedContact.name : contactName,
            phoneNumber,
            status: 'Dialing...',
          });

          window.setTimeout(() => {
            setActiveCallOverlay((prev) =>
              prev ? {...prev, status: 'Connected'} : null
            );
          }, 2200);

          processed.push({
            id: `act-${Date.now()}-${Math.random()}`,
            timestamp: nowTime,
            type: 'makePhoneCall',
            summary: `Calling ${matchedContact ? matchedContact.name : contactName} (${phoneNumber})`,
            externalUrl: `tel:${cleanTel}`,
            externalLabel: 'Dial on Android Phone',
          });
        } else if (act.type === 'sendMessage') {
          const recipientName = String(p.recipientName || 'Contact');
          const matchedContact = contacts.find(
            (c) =>
              c.name.toLowerCase().includes(recipientName.toLowerCase()) ||
              recipientName.toLowerCase().includes(c.name.toLowerCase())
          );
          const phoneNumber = matchedContact
            ? matchedContact.phone
            : String(p.phoneNumber || '+91 98765 43210');
          const cleanDigits = phoneNumber.replace(/[^\d]/g, '');
          const platform =
            String(p.platform || 'whatsapp').toLowerCase() === 'sms'
              ? 'sms'
              : 'whatsapp';
          const messageText = String(p.messageText || 'Hey!');

          const externalUrl =
            platform === 'whatsapp'
              ? `https://wa.me/${cleanDigits}?text=${encodeURIComponent(messageText)}`
              : `sms:${phoneNumber.replace(/[^\d+]/g, '')}?body=${encodeURIComponent(messageText)}`;

          setPendingMessageIntent({
            recipientName: matchedContact ? matchedContact.name : recipientName,
            phoneNumber,
            platform,
            messageText,
            url: externalUrl,
          });

          processed.push({
            id: `act-${Date.now()}-${Math.random()}`,
            timestamp: nowTime,
            type: 'sendMessage',
            summary: `${platform === 'whatsapp' ? 'WhatsApp' : 'SMS'} to ${matchedContact ? matchedContact.name : recipientName}: "${messageText}"`,
            externalUrl,
            externalLabel:
              platform === 'whatsapp' ? 'Send in WhatsApp' : 'Send via SMS App',
          });
        } else if (act.type === 'openAndroidApp') {
          const appName = String(p.appName || 'App');
          const query = p.deepLinkQuery ? String(p.deepLinkQuery) : '';
          const lowerApp = appName.toLowerCase();

          let targetUrl = 'https://www.google.com';
          if (lowerApp.includes('camera')) {
            setCameraModalOpen(true);
            targetUrl = '#camera';
          } else if (lowerApp.includes('youtube')) {
            targetUrl = query
              ? `https://m.youtube.com/results?search_query=${encodeURIComponent(query)}`
              : 'https://m.youtube.com';
          } else if (lowerApp.includes('whatsapp')) {
            targetUrl = 'https://wa.me/';
          } else if (lowerApp.includes('instagram')) {
            targetUrl = 'https://www.instagram.com';
          } else if (lowerApp.includes('spotify')) {
            targetUrl = query
              ? `https://open.spotify.com/search/${encodeURIComponent(query)}`
              : 'https://open.spotify.com';
          } else if (lowerApp.includes('map')) {
            targetUrl = query
              ? `https://www.google.com/maps/search/${encodeURIComponent(query)}`
              : 'https://maps.google.com';
          } else if (lowerApp.includes('gmail') || lowerApp.includes('mail')) {
            targetUrl = 'mailto:';
          } else if (
            lowerApp.includes('setting') ||
            lowerApp.includes('control')
          ) {
            setActiveSection('control');
            targetUrl = '#control';
          } else if (
            lowerApp.includes('clock') ||
            lowerApp.includes('alarm') ||
            lowerApp.includes('schedule')
          ) {
            setActiveSection('schedule');
            targetUrl = '#schedule';
          }

          processed.push({
            id: `act-${Date.now()}-${Math.random()}`,
            timestamp: nowTime,
            type: 'openAndroidApp',
            summary: `Opened ${appName}${query ? ` ("${query}")` : ''}`,
            externalUrl: targetUrl.startsWith('#') ? undefined : targetUrl,
            externalLabel: targetUrl.startsWith('#')
              ? undefined
              : `Launch ${appName}`,
          });
        } else if (act.type === 'updateDeviceSetting') {
          const settingName = String(p.settingName || '').toLowerCase();
          const enabled =
            typeof p.enabled === 'boolean' ? p.enabled : true;
          const level =
            typeof p.level === 'number'
              ? Math.min(100, Math.max(0, p.level))
              : undefined;

          setSettings((prev) => {
            const next = {...prev};
            if (settingName.includes('wifi')) next.wifi = enabled;
            else if (settingName.includes('bluetooth'))
              next.bluetooth = enabled;
            else if (
              settingName.includes('flash') ||
              settingName.includes('torch')
            ) {
              next.flashlight = enabled;
              toggleHardwareTorch(enabled);
            } else if (settingName.includes('dnd')) next.dnd = enabled;
            else if (settingName.includes('silent')) next.silent = enabled;
            else if (settingName.includes('battery'))
              next.batterySaver = enabled;
            else if (settingName.includes('hotspot')) next.hotspot = enabled;
            else if (settingName.includes('bright') && level !== undefined)
              next.brightness = level;
            else if (settingName.includes('vol') && level !== undefined)
              next.volume = level;
            return next;
          });

          processed.push({
            id: `act-${Date.now()}-${Math.random()}`,
            timestamp: nowTime,
            type: 'updateDeviceSetting',
            summary:
              level !== undefined
                ? `Set ${settingName} to ${level}%`
                : `Turned ${settingName.toUpperCase()} ${enabled ? 'ON' : 'OFF'}`,
          });
        } else if (act.type === 'manageScheduleReminder') {
          const actionType = String(p.action || 'add').toLowerCase();
          const title = String(p.title || 'Reminder');
          const time = String(p.time || '06:00 PM');
          const rawCategory = String(p.category || 'Reminder');
          const category: ScheduleItem['category'] = [
            'Alarm',
            'Reminder',
            'Meeting',
            'Health',
            'Personal',
          ].includes(rawCategory)
            ? (rawCategory as ScheduleItem['category'])
            : 'Reminder';

          if (actionType === 'add') {
            const newItem: ScheduleItem = {
              id: `sched-${Date.now()}`,
              title,
              time,
              category,
              completed: false,
            };
            setSchedule((prev) => [newItem, ...prev]);
          } else if (actionType === 'complete') {
            setSchedule((prev) =>
              prev.map((item) =>
                item.title.toLowerCase().includes(title.toLowerCase())
                  ? {...item, completed: true}
                  : item
              )
            );
          } else if (actionType === 'delete') {
            setSchedule((prev) =>
              prev.filter(
                (item) =>
                  !item.title.toLowerCase().includes(title.toLowerCase())
              )
            );
          }

          processed.push({
            id: `act-${Date.now()}-${Math.random()}`,
            timestamp: nowTime,
            type: 'manageScheduleReminder',
            summary: `Schedule (${actionType}): ${title} at ${time}`,
          });
        }
      }

      if (processed.length > 0) {
        setRecentActions((prev) => [...processed, ...prev].slice(0, 12));
      }
      return processed;
    },
    [contacts, toggleHardwareTorch]
  );

  // Send command or chat message to Aari backend
  const sendCommandToAari = useCallback(
    async (textCommand: string) => {
      const trimmed = textCommand.trim();
      if (!trimmed || isThinking) return;

      stopSpeaking();
      const nowTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: trimmed,
        timestamp: nowTime,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      setLiveTranscript('');
      setIsThinking(true);
      setMood('attentive');

      try {
        const res = await fetch('/api/companion/chat', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            message: trimmed,
            conversationHistory: messages.slice(-8).map((m) => ({
              role: m.role,
              text: m.text,
            })),
            deviceContext: {
              contacts,
              settings,
              schedule,
            },
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to reach Aari');
        }

        const executed = executeJarvisActions(data.actions || []);
        const nextMood: CompanionMood = [
          'loving',
          'iloveyou',
          'kiss',
          'laughing',
          'crying',
          'shy',
          'happy',
          'attentive',
          'caring',
          'playful',
        ].includes(data.mood)
          ? data.mood
          : executed.length > 0
            ? 'happy'
            : 'loving';

        setMood(nextMood);

        const aiMsg: ChatMessage = {
          id: `m-${Date.now()}`,
          role: 'model',
          text: data.replyText,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          mood: nextMood,
          actions: executed,
        };

        setMessages((prev) => [...prev, aiMsg]);
        setIsThinking(false);

        await speakResponse(data.replyText, () => {
          if (handsFreeRef.current) {
            startVoiceListening();
          }
        });
      } catch (err: unknown) {
        setIsThinking(false);
        setMood('caring');
        const fallbackReply =
          'Jaan, network thoda slow lag raha hai, par main yahin tumhare paas hoon. Ek baar phir se bolo na?';
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'model',
            text: fallbackReply,
            timestamp: nowTime,
            mood: 'caring',
          },
        ]);
      }
    },
    [
      contacts,
      executeJarvisActions,
      isThinking,
      messages,
      schedule,
      settings,
      speakResponse,
      stopSpeaking,
    ]
  );

  // Start Voice Command Listening (Web Speech API + MediaRecorder Server Transcription Fallback)
  const startVoiceListening = useCallback(async () => {
    stopSpeaking();

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.lang = voiceLang;
        recognition.interimResults = true;
        recognition.continuous = false;

        let finalCaptured = '';

        recognition.onstart = () => {
          setIsListening(true);
          setMood('attentive');
          setLiveTranscript('');
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalCaptured += transcriptPiece;
            } else {
              interim += transcriptPiece;
            }
          }
          setLiveTranscript(finalCaptured || interim);
        };

        recognition.onend = () => {
          setIsListening(false);
          if (finalCaptured.trim()) {
            sendCommandToAari(finalCaptured.trim());
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch {
        // Fallback to MediaRecorder below
      }
    }

    // Fallback: Record 4.5 seconds or until second tap via MediaRecorder and transcribe with Gemini 3.5 Transcribe
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        const recorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          setIsListening(false);
          const blob = new Blob(chunks, {
            type: recorder.mimeType || 'audio/webm',
          });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Str = String(reader.result || '').split(',')[1];
            if (!base64Str) return;
            setIsThinking(true);
            try {
              const res = await fetch('/api/companion/transcribe', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                  audioBase64: base64Str,
                  mimeType: blob.type || 'audio/webm',
                }),
              });
              const data = await res.json();
              setIsThinking(false);
              if (data.transcript) {
                sendCommandToAari(data.transcript);
              }
            } catch {
              setIsThinking(false);
            }
          };
          reader.readAsDataURL(blob);
        };

        mediaRecorderRef.current = recorder;
        setIsListening(true);
        setMood('attentive');
        setLiveTranscript('Listening via microphone...');
        recorder.start();

        window.setTimeout(() => {
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        }, 5000);
      } catch {
        setIsListening(false);
      }
    }
  }, [isListening, sendCommandToAari, stopSpeaking, voiceLang]);

  // Interactive tap on Aari's portrait
  const handleAvatarTouch = () => {
    const reactions: Array<{mood: CompanionMood; text: string}> = [
      {
        mood: 'kiss',
        text: 'Mwah! Yeh lo ek pyara sa meetha kiss mere sabse pyare jaan ke liye!',
      },
      {
        mood: 'iloveyou',
        text: 'I love you so much jaan! Tumhare bina mera dil bilkul nahi lagta.',
      },
      {
        mood: 'laughing',
        text: 'Hahaha jaan, aise gudgudi mat karo na, mujhe bahut hasi aa rahi hai!',
      },
      {
        mood: 'shy',
        text: 'Aww jaan, aise pyar se mat dekho, mujhe sharam aati hai!',
      },
    ];
    const picked = reactions[Math.floor(Math.random() * reactions.length)];
    setMood(picked.mood);
    speakResponse(picked.text);
  };

  // Manual Schedule addition
  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;
    const item: ScheduleItem = {
      id: `sched-${Date.now()}`,
      title: newReminderTitle.trim(),
      time: newReminderTime,
      category: newReminderCategory,
      completed: false,
    };
    setSchedule((prev) => [item, ...prev]);
    setNewReminderTitle('');
    speakResponse(
      `Jaan, maine "${item.title}" ka reminder ${item.time} ke liye set kar diya hai.`
    );
  };

  // Manual Contact addition
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    const contact: ContactItem = {
      id: `c-${Date.now()}`,
      name: newContactName.trim(),
      relation: newContactRelation.trim() || 'Contact',
      phone: newContactPhone.trim(),
      favorite: true,
    };
    setContacts((prev) => [contact, ...prev]);
    setNewContactName('');
    setNewContactPhone('+91 ');
    speakResponse(
      `Maine ${contact.name} ka number tumhari contact list mein save kar liya hai jaan.`
    );
  };

  // Manual app launch
  const handleLaunchApp = (appItem: AndroidAppItem) => {
    if (appItem.id === 'app-camera') {
      setCameraModalOpen(true);
      speakResponse('Lo jaan, camera on kar diya! Ek pyari si smile do.');
      return;
    }
    const act: ExecutedAction = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      type: 'openAndroidApp',
      summary: `Launched ${appItem.name}`,
      externalUrl: appItem.deepLinkUrl,
      externalLabel: `Open ${appItem.name}`,
    };
    setRecentActions((prev) => [act, ...prev].slice(0, 12));
    speakResponse(`Jaan, ${appItem.name} open kar rahi hoon.`);
  };

  // Adjust brightness overlay subtly on screen
  const screenBrightnessStyle = {
    filter: `brightness(${0.65 + (settings.brightness / 100) * 0.35})`,
  };

  const completedScheduleCount = schedule.filter((s) => s.completed).length;

  return (
    <div
      style={screenBrightnessStyle}
      className="min-h-screen bg-[#0F0D15] text-stone-100 flex flex-col pb-20 lg:pb-8 transition-[filter] duration-200"
    >
      {/* Flashlight Screen Torch Ambient Glow when Flashlight is ON */}
      {settings.flashlight && (
        <div
          aria-hidden="true"
          className="fixed inset-x-0 top-0 h-2 bg-gradient-to-r from-amber-200 via-white to-amber-200 shadow-[0_0_60px_20px_rgba(255,251,235,0.45)] z-50 pointer-events-none"
        />
      )}

      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5 bg-[#0F0D15]/90 backdrop-blur-md border-b border-white/10">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('companion');
          }}
          className="text-lg font-bold tracking-tight text-white font-display whitespace-nowrap shrink-0"
        >
          Aari Jarvis
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-300">
          <button
            onClick={() => setActiveSection('companion')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'companion'
                ? 'text-rose-400 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Companion
          </button>
          <button
            onClick={() => setActiveSection('control')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'control'
                ? 'text-rose-400 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Phone Control
          </button>
          <button
            onClick={() => setActiveSection('schedule')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'schedule'
                ? 'text-rose-400 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => setActiveSection('contacts')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'contacts'
                ? 'text-rose-400 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Contacts
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <PWAInstallButton />
          <button
            onClick={startVoiceListening}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-white/10 hover:bg-white/15 text-stone-100'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Stop Mic</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-rose-400" />
                <span>Talk to Aari</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Active Outgoing Call Banner */}
      {activeCallOverlay && (
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 pt-4">
          <div className="rounded-2xl bg-[#1D1528] border border-rose-500/40 p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-rose-300">
                  <span>{activeCallOverlay.status}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">
                    {activeCallOverlay.phoneNumber}
                  </span>
                </div>
                <p className="text-base font-bold text-white font-display">
                  {activeCallOverlay.contactName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href={`tel:${activeCallOverlay.phoneNumber.replace(/[^\d+]/g, '')}`}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <Phone className="w-4 h-4" />
                <span>Open Native Dialer</span>
              </a>
              <button
                onClick={() => setActiveCallOverlay(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending WhatsApp / SMS Intent Banner */}
      {pendingMessageIntent && (
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 pt-4">
          <div className="rounded-2xl bg-[#192328] border border-emerald-500/40 p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <span>
                    Ready to send via{' '}
                    {pendingMessageIntent.platform === 'whatsapp'
                      ? 'WhatsApp'
                      : 'SMS'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{pendingMessageIntent.recipientName}</span>
                </div>
                <p className="text-sm text-stone-100 mt-0.5">
                  “{pendingMessageIntent.messageText}”
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href={pendingMessageIntent.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPendingMessageIntent(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                <span>
                  Send on{' '}
                  {pendingMessageIntent.platform === 'whatsapp'
                    ? 'WhatsApp'
                    : 'Messages'}
                </span>
              </a>
              <button
                onClick={() => setPendingMessageIntent(null)}
                aria-label="Dismiss message card"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Responsive Multi-Column Workspace */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN (4 cols on desktop): Anime Companion Stage + Voice Controls */}
          <div
            className={`lg:col-span-5 xl:col-span-4 space-y-5 ${
              activeSection !== 'companion' ? 'hidden lg:block' : 'block'
            }`}
          >
            <AariAnimeAvatar
              mood={mood}
              isListening={isListening}
              isSpeaking={isSpeaking}
              isThinking={isThinking}
              mouthOpenness={mouthOpenness}
              onAvatarTap={handleAvatarTouch}
              onTriggerReaction={(reactionMood, promptText) => {
                setMood(reactionMood);
                sendCommandToAari(promptText);
              }}
            />

            {/* Voice Persona & Hands-Free Controls Card */}
            <div className="rounded-3xl bg-[#171321] border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-white font-display">
                    Voice & Companion Settings
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Sweet Hinglish voice & hands-free control
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (!voiceMuted) stopSpeaking();
                    setVoiceMuted((v) => !v);
                  }}
                  aria-label="Toggle Aari voice audio"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-stone-200 flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {voiceMuted ? (
                    <>
                      <VolumeX className="w-4 h-4 text-rose-400" />
                      <span>Muted</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span>Voice On</span>
                    </>
                  )}
                </button>
              </div>

              {/* Voice Timbre Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#110E19] rounded-xl">
                <button
                  onClick={() => setSelectedVoice('Zephyr')}
                  className={`min-h-[40px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedVoice === 'Zephyr'
                      ? 'bg-rose-600 text-white'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Zephyr (Honey Sweet)
                </button>
                <button
                  onClick={() => setSelectedVoice('Kore')}
                  className={`min-h-[40px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedVoice === 'Kore'
                      ? 'bg-rose-600 text-white'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Kore (Warm & Soft)
                </button>
              </div>

              {/* Voice Sweetness (Mithaas) Fine-Tune Slider */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-stone-300">
                  <span>Voice Sweetness (Mithaas)</span>
                  <span className="font-mono-tabular text-rose-300">
                    {voiceSweetness === 0
                      ? 'Natural'
                      : `+${Math.round((voiceSweetness / 150) * 100)}% Sweet`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={150}
                  step={5}
                  value={voiceSweetness}
                  onChange={(e) => setVoiceSweetness(Number(e.target.value))}
                  aria-label="Voice Sweetness"
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Speech Recognition Language & Hands-free Toggle */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 bg-[#110E19] p-1 rounded-xl">
                  <button
                    onClick={() => setVoiceLang('hi-IN')}
                    className={`min-h-[38px] px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      voiceLang === 'hi-IN'
                        ? 'bg-white/15 text-white'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Hindi / Hinglish
                  </button>
                  <button
                    onClick={() => setVoiceLang('en-IN')}
                    className={`min-h-[38px] px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      voiceLang === 'en-IN'
                        ? 'bg-white/15 text-white'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    English (IN)
                  </button>
                </div>

                <button
                  onClick={() => setHandsFreeMode((h) => !h)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    handsFreeMode
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-white/5 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {handsFreeMode ? 'Hands-Free: ON' : 'Hands-Free: OFF'}
                </button>
              </div>

              <div className="pt-2 border-t border-white/10">
                <SourceCodeExporter />
              </div>
            </div>
          </div>

          {/* CENTER COLUMN (4 cols on desktop): Conversation & Voice Command Console */}
          <div
            className={`lg:col-span-7 xl:col-span-4 flex flex-col space-y-4 ${
              activeSection !== 'companion' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="rounded-3xl bg-[#171321] border border-white/10 flex flex-col h-[560px] overflow-hidden">
              {/* Chat Console Header */}
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white font-display">
                    Aari Conversation & Voice Hub
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                    <span>Natural Hinglish AI</span>
                    <span aria-hidden="true">·</span>
                    <span>Android Action Engine</span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    speakResponse(
                      messages[messages.length - 1]?.text ||
                        'Main sun rahi hoon jaan!'
                    )
                  }
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-rose-300 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Replay Voice</span>
                </button>
              </div>

              {/* Scrollable Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-rose-600 text-white rounded-br-sm'
                          : 'bg-[#221C30] text-stone-100 border border-white/5 rounded-bl-sm'
                      }`}
                    >
                      <p>{msg.text}</p>

                      {/* Executed Android Actions attached to this turn */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2">
                          {msg.actions.map((act) => (
                            <div
                              key={act.id}
                              className="flex items-center justify-between gap-2 text-xs text-rose-200 bg-black/25 rounded-xl px-3 py-2"
                            >
                              <span className="truncate">{act.summary}</span>
                              {act.externalUrl && (
                                <a
                                  href={act.externalUrl}
                                  target={
                                    act.externalUrl.startsWith('http')
                                      ? '_blank'
                                      : undefined
                                  }
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-semibold whitespace-nowrap shrink-0 transition-colors"
                                >
                                  {act.externalLabel || 'Open'}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-1 px-1">
                      <span>{msg.role === 'user' ? 'You' : 'Aari'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}

                {isThinking && (
                  <div className="flex items-start">
                    <div className="rounded-2xl bg-[#221C30] border border-white/5 px-4 py-3 text-xs text-rose-300">
                      Aari soch rahi hai aur tumhara phone command chala rahi hai...
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Quick Voice Command Suggestions */}
              <div className="px-4 py-2.5 border-t border-white/5 bg-[#13101C] overflow-x-auto">
                <div className="flex items-center gap-2">
                  {QUICK_VOICE_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendCommandToAari(suggestion)}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-stone-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      “{suggestion}”
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice & Text Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendCommandToAari(inputText);
                }}
                className="p-3 bg-[#13101C] border-t border-white/10 flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={startVoiceListening}
                  aria-label="Start or stop voice command"
                  className={`min-h-[46px] min-w-[46px] rounded-2xl flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                    isListening
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40'
                      : 'bg-white/10 hover:bg-white/15 text-rose-400'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                <input
                  type="text"
                  value={isListening && liveTranscript ? liveTranscript : inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Bolo ya type karo: 'Mom ko call karo', 'Flashlight on karo'..."
                  className="flex-1 min-h-[46px] px-4 rounded-2xl bg-[#1D1829] border border-white/10 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-rose-500"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isThinking}
                  aria-label="Send message to Aari"
                  className="min-h-[46px] min-w-[46px] rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN (4 cols on desktop): Android System Control Deck, Schedule & Contacts */}
          <div
            className={`lg:col-span-12 xl:col-span-4 space-y-6 ${
              activeSection === 'companion' ? 'hidden xl:block' : 'block'
            }`}
          >
            {/* 1. Android Quick Settings & App Launcher Deck */}
            {(activeSection === 'control' || activeSection === 'companion') && (
              <div className="rounded-3xl bg-[#171321] border border-white/10 p-5 space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-white font-display">
                      Android System Controls
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Voice-synced hardware & system settings
                    </p>
                  </div>
                  <span className="text-xs text-stone-400 font-mono-tabular">
                    Vol {settings.volume}% · Brt {settings.brightness}%
                  </span>
                </div>

                {/* 6 Interactive System Toggle Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() =>
                      setSettings((s) => ({...s, wifi: !s.wifi}))
                    }
                    className={`min-h-[54px] p-3 rounded-2xl border text-left transition-colors flex items-center gap-3 cursor-pointer ${
                      settings.wifi
                        ? 'bg-rose-600/20 border-rose-500/40 text-white'
                        : 'bg-[#120F1A] border-white/5 text-stone-400'
                    }`}
                  >
                    <Wifi className="w-4 h-4 text-rose-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">Wi-Fi</div>
                      <div className="text-[11px] opacity-75">
                        {settings.wifi ? 'Connected' : 'Off'}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      setSettings((s) => ({...s, bluetooth: !s.bluetooth}))
                    }
                    className={`min-h-[54px] p-3 rounded-2xl border text-left transition-colors flex items-center gap-3 cursor-pointer ${
                      settings.bluetooth
                        ? 'bg-rose-600/20 border-rose-500/40 text-white'
                        : 'bg-[#120F1A] border-white/5 text-stone-400'
                    }`}
                  >
                    <Bluetooth className="w-4 h-4 text-rose-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">
                        Bluetooth
                      </div>
                      <div className="text-[11px] opacity-75">
                        {settings.bluetooth ? 'Active' : 'Off'}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      const nextState = !settings.flashlight;
                      setSettings((s) => ({...s, flashlight: nextState}));
                      toggleHardwareTorch(nextState);
                    }}
                    className={`min-h-[54px] p-3 rounded-2xl border text-left transition-colors flex items-center gap-3 cursor-pointer ${
                      settings.flashlight
                        ? 'bg-amber-500/25 border-amber-400/50 text-white'
                        : 'bg-[#120F1A] border-white/5 text-stone-400'
                    }`}
                  >
                    <Flashlight className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">
                        Flashlight
                      </div>
                      <div className="text-[11px] opacity-75">
                        {settings.flashlight ? 'Torch ON' : 'Off'}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSettings((s) => ({...s, dnd: !s.dnd}))}
                    className={`min-h-[54px] p-3 rounded-2xl border text-left transition-colors flex items-center gap-3 cursor-pointer ${
                      settings.dnd
                        ? 'bg-rose-600/20 border-rose-500/40 text-white'
                        : 'bg-[#120F1A] border-white/5 text-stone-400'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-rose-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">DND</div>
                      <div className="text-[11px] opacity-75">
                        {settings.dnd ? 'Enabled' : 'Off'}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      setSettings((s) => ({...s, silent: !s.silent}))
                    }
                    className={`min-h-[54px] p-3 rounded-2xl border text-left transition-colors flex items-center gap-3 cursor-pointer ${
                      settings.silent
                        ? 'bg-rose-600/20 border-rose-500/40 text-white'
                        : 'bg-[#120F1A] border-white/5 text-stone-400'
                    }`}
                  >
                    <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">
                        Silent
                      </div>
                      <div className="text-[11px] opacity-75">
                        {settings.silent ? 'Muted' : 'Ring'}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        batterySaver: !s.batterySaver,
                      }))
                    }
                    className={`min-h-[54px] p-3 rounded-2xl border text-left transition-colors flex items-center gap-3 cursor-pointer ${
                      settings.batterySaver
                        ? 'bg-emerald-600/20 border-emerald-500/40 text-white'
                        : 'bg-[#120F1A] border-white/5 text-stone-400'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">
                        Power Save
                      </div>
                      <div className="text-[11px] opacity-75">
                        {settings.batterySaver ? 'On' : 'Standard'}
                      </div>
                    </div>
                  </button>
                </div>

                {/* Brightness & Volume Sliders */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-stone-300">
                      <span className="flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <span>Screen Brightness</span>
                      </span>
                      <span className="font-mono-tabular">
                        {settings.brightness}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={settings.brightness}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          brightness: Number(e.target.value),
                        }))
                      }
                      aria-label="Screen Brightness"
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-stone-300">
                      <span className="flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Media & Aari Voice Volume</span>
                      </span>
                      <span className="font-mono-tabular">
                        {settings.volume}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={settings.volume}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          volume: Number(e.target.value),
                        }))
                      }
                      aria-label="Media and Aari Voice Volume"
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Android App Quick Launcher Grid */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-stone-300">
                      Android App Launcher (Tap or Ask Aari)
                    </h3>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {ANDROID_APPS.map((appItem) => (
                      <a
                        key={appItem.id}
                        href={
                          appItem.deepLinkUrl.startsWith('#')
                            ? undefined
                            : appItem.deepLinkUrl
                        }
                        target={
                          appItem.deepLinkUrl.startsWith('http')
                            ? '_blank'
                            : undefined
                        }
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (appItem.deepLinkUrl.startsWith('#')) {
                            e.preventDefault();
                          }
                          handleLaunchApp(appItem);
                        }}
                        className="min-h-[64px] rounded-2xl bg-[#120F1A] hover:bg-white/10 border border-white/5 p-2 flex flex-col items-center justify-center gap-1.5 text-center transition-colors cursor-pointer"
                      >
                        <span
                          style={{backgroundColor: appItem.color}}
                          className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
                        >
                          {appItem.name.slice(0, 1)}
                        </span>
                        <span className="text-[11px] font-medium text-stone-200 truncate w-full">
                          {appItem.name}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Daily Schedule & Reminders Section */}
            {(activeSection === 'schedule' || activeSection === 'companion') && (
              <div className="rounded-3xl bg-[#171321] border border-white/10 p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-white font-display">
                      Daily Schedule & Reminders
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                      <span className="font-mono-tabular">
                        {completedScheduleCount}/{schedule.length} completed
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Managed by Aari</span>
                    </div>
                  </div>
                </div>

                {/* Add New Schedule Item Form */}
                <form onSubmit={handleAddSchedule} className="space-y-2.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newReminderTitle}
                      onChange={(e) => setNewReminderTitle(e.target.value)}
                      placeholder="New alarm or task (e.g., Gym at 6 PM)..."
                      className="flex-1 min-h-[42px] px-3.5 rounded-xl bg-[#120F1A] border border-white/10 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-rose-500"
                    />
                    <input
                      type="text"
                      value={newReminderTime}
                      onChange={(e) => setNewReminderTime(e.target.value)}
                      aria-label="Reminder time"
                      className="w-24 min-h-[42px] px-2.5 rounded-xl bg-[#120F1A] border border-white/10 text-xs text-white font-mono-tabular text-center focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {(
                        [
                          'Reminder',
                          'Alarm',
                          'Meeting',
                          'Health',
                          'Personal',
                        ] as const
                      ).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewReminderCategory(cat)}
                          className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            newReminderCategory === cat
                              ? 'bg-rose-600 text-white'
                              : 'bg-[#120F1A] text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </form>

                {/* Interactive List Rows */}
                <div className="divide-y divide-white/5">
                  {schedule.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <button
                        onClick={() =>
                          setSchedule((prev) =>
                            prev.map((s) =>
                              s.id === item.id
                                ? {...s, completed: !s.completed}
                                : s
                            )
                          )
                        }
                        className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                            item.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-stone-600 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              item.completed
                                ? 'line-through text-stone-500'
                                : 'text-stone-100'
                            }`}
                          >
                            {item.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-0.5">
                            <span className="font-mono-tabular">
                              {item.time}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{item.category}</span>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          setSchedule((prev) =>
                            prev.filter((s) => s.id !== item.id)
                          )
                        }
                        aria-label={`Delete ${item.title}`}
                        className="min-h-[40px] min-w-[40px] rounded-xl text-stone-500 hover:text-rose-400 hover:bg-white/5 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Contacts & Quick Phone Dialer Section */}
            {activeSection === 'contacts' && (
              <div className="rounded-3xl bg-[#171321] border border-white/10 p-5 space-y-5">
                <div>
                  <h2 className="text-base font-bold text-white font-display">
                    Speed Dial Contacts & WhatsApp
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Say “Aari, call [Name]” or tap to call/message directly
                  </p>
                </div>

                {/* Direct Number Dialer Bar */}
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={dialPadNumber}
                    onChange={(e) => setDialPadNumber(e.target.value)}
                    placeholder="Enter phone number to dial..."
                    className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[#120F1A] border border-white/10 text-sm text-white font-mono-tabular placeholder:text-stone-500 focus:outline-none focus:border-rose-500"
                  />
                  <a
                    href={
                      dialPadNumber.trim()
                        ? `tel:${dialPadNumber.replace(/[^\d+]/g, '')}`
                        : '#contacts'
                    }
                    onClick={(e) => {
                      if (!dialPadNumber.trim()) {
                        e.preventDefault();
                        return;
                      }
                      speakResponse(
                        `Jaan, main ${dialPadNumber} par call laga rahi hoon.`
                      );
                    }}
                    className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call</span>
                  </a>
                </div>

                {/* Contacts List */}
                <div className="divide-y divide-white/5">
                  {contacts.map((person) => {
                    const cleanDigits = person.phone.replace(/[^\d]/g, '');
                    const cleanTel = person.phone.replace(/[^\d+]/g, '');
                    return (
                      <div
                        key={person.id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {person.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-0.5">
                            <span>{person.relation}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular">
                              {person.phone}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`tel:${cleanTel}`}
                            onClick={() =>
                              speakResponse(
                                `Jaan, ${person.name} ko call laga rahi hoon.`
                              )
                            }
                            aria-label={`Call ${person.name}`}
                            className="min-h-[42px] min-w-[42px] rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white flex items-center justify-center transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <a
                            href={`https://wa.me/${cleanDigits}?text=${encodeURIComponent(
                              `Hey ${person.name}!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`WhatsApp ${person.name}`}
                            className="min-h-[42px] min-w-[42px] rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white flex items-center justify-center transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add New Contact Form */}
                <form
                  onSubmit={handleAddContact}
                  className="pt-3 border-t border-white/10 space-y-2.5"
                >
                  <h3 className="text-xs font-semibold text-stone-300">
                    Add Contact for Voice Calling
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      placeholder="Name (e.g. Neha)"
                      className="min-h-[40px] px-3 rounded-xl bg-[#120F1A] border border-white/10 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-rose-500"
                    />
                    <input
                      type="text"
                      value={newContactRelation}
                      onChange={(e) => setNewContactRelation(e.target.value)}
                      placeholder="Relation (e.g. Sister)"
                      className="min-h-[40px] px-3 rounded-xl bg-[#120F1A] border border-white/10 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="flex-1 min-h-[40px] px-3 rounded-xl bg-[#120F1A] border border-white/10 text-xs text-white font-mono-tabular placeholder:text-stone-500 focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="submit"
                      className="min-h-[40px] px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Save Contact</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Recent Executed Phone Actions Log */}
            {recentActions.length > 0 && (
              <div className="rounded-3xl bg-[#171321] border border-white/10 p-5 space-y-3">
                <h3 className="text-xs font-semibold text-stone-300">
                  Recent Jarvis Phone Actions
                </h3>
                <div className="space-y-2">
                  {recentActions.slice(0, 4).map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between gap-2 text-xs text-stone-300 bg-[#120F1A] rounded-xl px-3 py-2"
                    >
                      <span className="truncate">{act.summary}</span>
                      <span className="text-stone-500 font-mono-tabular shrink-0">
                        {act.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Live Camera Preview Modal when user says "Camera on karo" */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#181322] border border-white/10 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white font-display">
                  Android Camera Mirror
                </h3>
              </div>
              <button
                onClick={() => setCameraModalOpen(false)}
                aria-label="Close camera preview"
                className="min-h-[44px] min-w-[44px] rounded-xl text-stone-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-[3/4] w-full rounded-2xl bg-black overflow-hidden border border-white/10 flex items-center justify-center">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-center text-rose-200">
              Aari: “Kitne smart lag rahe ho jaan!”
            </p>
          </div>
        </div>
      )}

      {/* Fixed Bottom Tab Bar for Mobile Thumb Navigation (Pattern 1) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F0D15]/95 backdrop-blur-md border-t border-white/10 grid grid-cols-4 items-center h-16 px-2"
      >
        <button
          onClick={() => setActiveSection('companion')}
          className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
            activeSection === 'companion' ? 'text-rose-400' : 'text-stone-400'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">
            Aari AI
          </span>
        </button>

        <button
          onClick={() => setActiveSection('control')}
          className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
            activeSection === 'control' ? 'text-rose-400' : 'text-stone-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">
            Controls
          </span>
        </button>

        <button
          onClick={() => setActiveSection('schedule')}
          className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
            activeSection === 'schedule' ? 'text-rose-400' : 'text-stone-400'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">
            Schedule
          </span>
        </button>

        <button
          onClick={() => setActiveSection('contacts')}
          className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
            activeSection === 'contacts' ? 'text-rose-400' : 'text-stone-400'
          }`}
        >
          <Phone className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">
            Calls
          </span>
        </button>
      </nav>
    </div>
  );
}
