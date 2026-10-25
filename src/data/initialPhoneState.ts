import {
  AndroidAppItem,
  ContactItem,
  DeviceSettingsState,
  ScheduleItem,
} from '../types/jarvis';

export const INITIAL_CONTACTS: ContactItem[] = [
  {
    id: 'c-mom',
    name: 'Mom',
    relation: 'Mother',
    phone: '+91 98765 43210',
    favorite: true,
  },
  {
    id: 'c-papa',
    name: 'Papa',
    relation: 'Father',
    phone: '+91 98765 43211',
    favorite: true,
  },
  {
    id: 'c-priya',
    name: 'Priya',
    relation: 'Close Friend',
    phone: '+91 98111 22334',
    favorite: true,
  },
  {
    id: 'c-rahul',
    name: 'Rahul Bhai',
    relation: 'Best Friend',
    phone: '+91 98222 33445',
    favorite: true,
  },
  {
    id: 'c-kabir',
    name: 'Kabir',
    relation: 'Gym Partner',
    phone: '+91 98333 44556',
    favorite: false,
  },
  {
    id: 'c-office',
    name: 'Arjun Sir',
    relation: 'Work / Office',
    phone: '+91 98444 55667',
    favorite: false,
  },
];

export const INITIAL_SCHEDULE: ScheduleItem[] = [
  {
    id: 's-1',
    title: 'Morning Wake Up & Hydration',
    time: '07:00 AM',
    category: 'Alarm',
    completed: true,
  },
  {
    id: 's-2',
    title: 'Project Sync & Daily Standup',
    time: '11:30 AM',
    category: 'Meeting',
    completed: false,
  },
  {
    id: 's-3',
    title: 'Lunch Break — Aari Reminder',
    time: '02:00 PM',
    category: 'Health',
    completed: false,
  },
  {
    id: 's-4',
    title: 'Evening Gym Workout Session',
    time: '06:30 PM',
    category: 'Personal',
    completed: false,
  },
  {
    id: 's-5',
    title: 'Call Mom & Relax Time',
    time: '09:30 PM',
    category: 'Reminder',
    completed: false,
  },
];

export const INITIAL_DEVICE_SETTINGS: DeviceSettingsState = {
  wifi: true,
  bluetooth: true,
  flashlight: false,
  dnd: false,
  silent: false,
  batterySaver: false,
  hotspot: false,
  brightness: 78,
  volume: 85,
};

export const ANDROID_APPS: AndroidAppItem[] = [
  {
    id: 'app-whatsapp',
    name: 'WhatsApp',
    packageName: 'com.whatsapp',
    category: 'Messaging',
    deepLinkUrl: 'https://wa.me/',
    color: '#10B981',
  },
  {
    id: 'app-youtube',
    name: 'YouTube',
    packageName: 'com.google.android.youtube',
    category: 'Video',
    deepLinkUrl: 'https://m.youtube.com',
    color: '#EF4444',
  },
  {
    id: 'app-instagram',
    name: 'Instagram',
    packageName: 'com.instagram.android',
    category: 'Social',
    deepLinkUrl: 'https://www.instagram.com',
    color: '#EC4899',
  },
  {
    id: 'app-spotify',
    name: 'Spotify',
    packageName: 'com.spotify.music',
    category: 'Music',
    deepLinkUrl: 'https://open.spotify.com',
    color: '#22C55E',
  },
  {
    id: 'app-maps',
    name: 'Google Maps',
    packageName: 'com.google.android.apps.maps',
    category: 'Navigation',
    deepLinkUrl: 'https://maps.google.com',
    color: '#3B82F6',
  },
  {
    id: 'app-gmail',
    name: 'Gmail',
    packageName: 'com.google.android.gm',
    category: 'Mail',
    deepLinkUrl: 'mailto:',
    color: '#F43F5E',
  },
  {
    id: 'app-chrome',
    name: 'Chrome',
    packageName: 'com.android.chrome',
    category: 'Browser',
    deepLinkUrl: 'https://www.google.com',
    color: '#F59E0B',
  },
  {
    id: 'app-camera',
    name: 'Camera',
    packageName: 'com.android.camera',
    category: 'System',
    deepLinkUrl: '#camera',
    color: '#8B5CF6',
  },
];

export const QUICK_VOICE_SUGGESTIONS = [
  'I love you Aari, ek pyara sa kiss do na',
  'Koi funny baat bata kar haso na',
  'Main tumse baat nahi karunga, jaa raha hu',
  'Mom ko call laga do',
  'Priya ko WhatsApp karo ki main 10 min mein aa raha hu',
  'Flashlight on karo aur brightness 90% kar do',
];
