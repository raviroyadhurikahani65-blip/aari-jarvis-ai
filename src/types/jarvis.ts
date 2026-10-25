export type CompanionMood =
  | 'loving'
  | 'iloveyou'
  | 'kiss'
  | 'laughing'
  | 'crying'
  | 'shy'
  | 'happy'
  | 'attentive'
  | 'caring'
  | 'playful';

export interface ContactItem {
  id: string;
  name: string;
  relation: string;
  phone: string;
  favorite?: boolean;
}

export interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  category: 'Alarm' | 'Reminder' | 'Meeting' | 'Health' | 'Personal';
  completed: boolean;
}

export interface DeviceSettingsState {
  wifi: boolean;
  bluetooth: boolean;
  flashlight: boolean;
  dnd: boolean;
  silent: boolean;
  batterySaver: boolean;
  hotspot: boolean;
  brightness: number;
  volume: number;
}

export interface AndroidAppItem {
  id: string;
  name: string;
  packageName: string;
  category: string;
  deepLinkUrl: string;
  color: string;
}

export interface ExecutedAction {
  id: string;
  timestamp: string;
  type:
    | 'makePhoneCall'
    | 'sendMessage'
    | 'openAndroidApp'
    | 'updateDeviceSetting'
    | 'manageScheduleReminder';
  summary: string;
  externalUrl?: string;
  externalLabel?: string;
  details?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  mood?: CompanionMood;
  actions?: ExecutedAction[];
}
