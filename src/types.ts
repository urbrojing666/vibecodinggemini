import { format } from 'date-fns';

export interface Participant {
  id: string;
  name: string;
  avatarColor: string;
  position?: string;
  phone?: string;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO string or "HH:mm"
  duration: number; // in minutes
  imageUrls: string[];
  location?: string;
  type: 'hotel' | 'activity' | 'dining' | 'airport' | 'travel';
  participantIds: string[];
}

export interface DayPlan {
  id: string;
  date: Date;
  activities: Activity[];
}

export const ACTIVITY_TYPES = {
  hotel: { label: 'Hotel', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  activity: { label: 'Activity', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  dining: { label: 'Dining', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  airport: { label: 'Airport', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  travel: { label: 'Travel', color: 'bg-zinc-50 text-zinc-700 border-zinc-100' },
};
