/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Image as ImageIcon, 
  X, 
  Trash2,
  Edit2,
  Plane,
  Utensils,
  Camera,
  Coffee,
  ChevronDown,
  ChevronUp,
  Map,
  ArrowRight,
  Hotel,
  PlaneTakeoff,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  addDays, 
  parse,
  addMinutes,
  differenceInMinutes
} from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Activity, DayPlan, ACTIVITY_TYPES, Participant } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PREDEFINED_PARTICIPANTS: Participant[] = [
  { id: 'p1', name: 'Alice', position: 'Lead Designer', phone: '+1 234 567 890', avatarColor: 'bg-rose-400' },
  { id: 'p2', name: 'Bob', position: 'Tech Lead', phone: '+1 234 567 891', avatarColor: 'bg-indigo-400' },
  { id: 'p3', name: 'Charlie', position: 'Product Manager', phone: '+1 234 567 892', avatarColor: 'bg-emerald-400' },
  { id: 'p4', name: 'Diana', position: 'Marketing Lead', phone: '+1 234 567 893', avatarColor: 'bg-amber-400' },
  { id: 'p5', name: 'Edward', position: 'Operations', phone: '+1 234 567 894', avatarColor: 'bg-zinc-400' },
];

const INITIAL_DAYS: DayPlan[] = [
  {
    id: '1',
    date: new Date(),
    activities: [
      {
        id: 'a1',
        title: 'Arrival at Tokyo Narita',
        description: 'Pick up JR Pass and Pocket WiFi at the airport.',
        startTime: '09:00',
        endTime: '10:00',
        duration: 60,
        type: 'airport',
        location: 'Narita International Airport',
        imageUrls: [],
        participantIds: ['p1', 'p2']
      },
      {
        id: 't1',
        title: 'Airport Express to Shinjuku',
        startTime: '10:00',
        endTime: '11:00',
        duration: 60,
        type: 'travel',
        location: 'Narita Express',
        imageUrls: [],
        participantIds: ['p1', 'p2']
      },
      {
        id: 'a2',
        title: 'Check-in at Hotel',
        description: 'Drop off luggage and freshen up.',
        startTime: '11:00',
        endTime: '11:45',
        duration: 45,
        type: 'hotel',
        location: 'Park Hyatt Tokyo',
        imageUrls: [],
        participantIds: ['p1', 'p2', 'p3', 'p4']
      },
      {
        id: 'a3',
        title: 'Lunch at Shinjuku Gyoen',
        description: 'Picnic under the cherry blossoms.',
        startTime: '12:30',
        endTime: '14:00',
        duration: 90,
        type: 'dining',
        location: 'Shinjuku Gyoen National Garden',
        imageUrls: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop'],
        participantIds: ['p1', 'p3']
      },
      {
        id: 'a4',
        title: 'Shibuya Crossing & Hachiko',
        description: 'Experience the world\'s busiest pedestrian crossing.',
        startTime: '15:00',
        endTime: '17:00',
        duration: 120,
        type: 'activity',
        location: 'Shibuya City',
        imageUrls: ['https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1000&auto=format&fit=crop'],
        participantIds: ['p2', 'p4']
      }
    ]
  }
];

function getEndTime(startTime: string, duration: number) {
  try {
    const date = parse(startTime, 'HH:mm', new Date());
    const endDate = addMinutes(date, duration);
    return format(endDate, 'HH:mm');
  } catch (e) {
    return startTime;
  }
}

function getDuration(startTime: string, endTime: string) {
  try {
    const start = parse(startTime, 'HH:mm', new Date());
    let end = parse(endTime, 'HH:mm', new Date());
    if (end < start) {
      end = addDays(end, 1);
    }
    return differenceInMinutes(end, start);
  } catch (e) {
    return 0;
  }
}

export default function App() {
  const [days, setDays] = useState<DayPlan[]>(() => {
    const saved = localStorage.getItem('voyage_days');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((d: any) => ({ 
          ...d, 
          date: new Date(d.date),
          activities: d.activities.map((a: any) => ({
            ...a,
            endTime: a.endTime || '10:00' // Migration for old data
          }))
        }));
      } catch (e) {
        console.error('Failed to parse saved days', e);
        return INITIAL_DAYS;
      }
    }
    return INITIAL_DAYS;
  });

  const [selectedDayId, setSelectedDayId] = useState<string>(() => {
    const saved = localStorage.getItem('voyage_selected_day_id');
    if (saved) return saved;
    return days[0]?.id || INITIAL_DAYS[0].id;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem('voyage_participants');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved participants', e);
        return PREDEFINED_PARTICIPANTS;
      }
    }
    return PREDEFINED_PARTICIPANTS;
  });

  const [viewingMember, setViewingMember] = useState<Participant | null>(null);
  const [editingMember, setEditingMember] = useState<Participant | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // Auto-save
  useEffect(() => {
    localStorage.setItem('voyage_days', JSON.stringify(days));
  }, [days]);

  useEffect(() => {
    localStorage.setItem('voyage_participants', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('voyage_selected_day_id', selectedDayId);
  }, [selectedDayId]);

  const selectedDay = useMemo(() => 
    days.find(d => d.id === selectedDayId) || days[0], 
  [days, selectedDayId]);

  const toggleCollapse = (id: string) => {
    const newSet = new Set(collapsedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setCollapsedIds(newSet);
  };

  const addDay = () => {
    const lastDay = days[days.length - 1];
    const newDate = addDays(lastDay.date, 1);
    const newDay: DayPlan = {
      id: Math.random().toString(36).substr(2, 9),
      date: newDate,
      activities: []
    };
    setDays([...days, newDay]);
    setSelectedDayId(newDay.id);
  };

  const updateDayDate = (dayId: string, newDate: Date) => {
    setDays(days.map(day => day.id === dayId ? { ...day, date: newDate } : day));
  };

  const saveActivity = (activityData: Partial<Activity>) => {
    const updatedDays = days.map(day => {
      if (day.id === selectedDayId) {
        if (editingActivity) {
          return {
            ...day,
            activities: day.activities.map(a => a.id === editingActivity.id ? { ...a, ...activityData } as Activity : a)
          };
        } else {
          const newActivity: Activity = {
            ...activityData,
            id: Math.random().toString(36).substr(2, 9),
            title: activityData.title || 'New Entry',
            startTime: activityData.startTime || '09:00',
            duration: activityData.duration || 60,
            type: activityData.type || 'activity',
            imageUrls: activityData.imageUrls || [],
            participantIds: activityData.participantIds || []
          } as Activity;
          return {
            ...day,
            activities: [...day.activities, newActivity]
          };
        }
      }
      return day;
    });
    setDays(updatedDays);
    setIsModalOpen(false);
    setEditingActivity(null);
  };

  const deleteActivity = (id: string) => {
    setDays(days.map(day => ({
      ...day,
      activities: day.activities.filter(a => a.id !== id)
    })));
  };

  const deleteDay = (dayId: string) => {
    if (days.length <= 1) return;
    const newDays = days.filter(d => d.id !== dayId);
    setDays(newDays);
    if (selectedDayId === dayId) {
      setSelectedDayId(newDays[0].id);
    }
  };

  const addParticipant = () => {
    setEditingMember(null);
    setIsMemberModalOpen(true);
  };

  const saveMember = (memberData: Partial<Participant>) => {
    if (editingMember) {
      setParticipants(participants.map(p => p.id === editingMember.id ? { ...p, ...memberData } as Participant : p));
    } else {
      const colors = ['bg-rose-400', 'bg-indigo-400', 'bg-emerald-400', 'bg-amber-400', 'bg-zinc-400', 'bg-cyan-400', 'bg-violet-400'];
      const newParticipant: Participant = {
        id: Math.random().toString(36).substr(2, 9),
        name: memberData.name || 'New Member',
        position: memberData.position,
        phone: memberData.phone,
        avatarColor: colors[participants.length % colors.length]
      };
      setParticipants([...participants, newParticipant]);
    }
    setIsMemberModalOpen(false);
    setEditingMember(null);
  };

  const deleteMember = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
    setViewingMember(null);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-zinc-50">
      {/* Sidebar / Day Selector */}
      <aside className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-zinc-200 p-5 flex flex-col h-auto lg:h-screen lg:sticky lg:top-0">
        <div className="mb-10 px-1">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-900 leading-none mb-2">AgendaPlanner</h1>
          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] leading-none">Minimalist Planner</p>
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {days.map((day, index) => (
            <div key={day.id} className="group/day relative">
              <button
                onClick={() => setSelectedDayId(day.id)}
                className={cn(
                  "w-full text-left p-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                  selectedDayId === day.id 
                    ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" 
                    : "hover:bg-zinc-100 text-zinc-600"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold opacity-40 block mb-0.5 uppercase tracking-wider">DAY 0{index + 1}</span>
                    <span className="text-sm font-medium">{format(day.date, 'EEEE, MMM d')}</span>
                  </div>
                  {selectedDayId === day.id && (
                    <motion.div layoutId="active-indicator" className="w-1 h-1 rounded-full bg-white" />
                  )}
                </div>
              </button>
              
              {/* Day Actions */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/day:opacity-100 transition-opacity">
                <div className="relative">
                  <input 
                    type="date" 
                    value={format(day.date, 'yyyy-MM-dd')}
                    onChange={(e) => updateDayDate(day.id, new Date(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-6 h-6"
                  />
                  <button className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    selectedDayId === day.id ? "text-white/40 hover:text-white" : "text-zinc-400 hover:text-zinc-900"
                  )}>
                    <CalendarIcon size={12} />
                  </button>
                </div>
                {days.length > 1 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDay(day.id);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      selectedDayId === day.id ? "text-white/40 hover:text-red-400" : "text-zinc-400 hover:text-red-500"
                    )}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <button 
            onClick={addDay}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-zinc-100 text-zinc-300 hover:border-zinc-300 hover:text-zinc-500 transition-all text-sm"
          >
            <Plus size={16} />
            <span className="font-medium">Add Day</span>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-100">
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Trip Members</p>
              <div className="flex flex-wrap gap-1.5">
                {participants.map(p => (
                  <button 
                    key={p.id}
                    title={p.name}
                    onClick={() => {
                      setEditingMember(p);
                      setIsMemberModalOpen(true);
                    }}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm ring-2 ring-white hover:scale-110 transition-transform",
                      p.avatarColor
                    )}
                  >
                    {p.name.charAt(0)}
                  </button>
                ))}
                <button 
                  onClick={addParticipant}
                  className="w-6 h-6 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:bg-zinc-50 transition-colors"
                >
                  <Plus size={10} />
                </button>
              </div>
            </div>
            
            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Total Trip</p>
              <div className="flex items-center gap-2 text-zinc-900 font-semibold text-xs">
                <CalendarIcon size={14} className="text-zinc-400" />
                <span>{days.length} Days</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto p-6 lg:p-10">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="relative group/date">
                <input 
                  type="date" 
                  value={format(selectedDay.date, 'yyyy-MM-dd')}
                  onChange={(e) => updateDayDate(selectedDay.id, new Date(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="bg-white p-2 rounded-xl shadow-sm border border-zinc-100 flex flex-col items-center justify-center min-w-[56px] group-hover/date:border-zinc-300 transition-all group-hover/date:shadow-md">
                  <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">{format(selectedDay.date, 'MMM')}</span>
                  <span className="text-lg font-bold text-zinc-900 leading-none">{format(selectedDay.date, 'dd')}</span>
                  <div className="absolute -right-1 -top-1 w-4 h-4 bg-zinc-900 rounded-full flex items-center justify-center text-white scale-0 group-hover/date:scale-100 transition-transform">
                    <Edit2 size={8} />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-2xl font-bold text-zinc-900 mb-0.5">
                    {format(selectedDay.date, 'MMMM do')}
                  </h2>
                </div>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{format(selectedDay.date, 'EEEE')}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setEditingActivity(null);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-5 py-3 rounded-full text-xs font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 active:scale-95"
            >
              <Plus size={16} />
              <span>Add Activity</span>
            </button>
          </header>

          {/* Timeline View */}
          <div className="relative pl-8 lg:pl-16">
            {/* Vertical Line */}
            <div className="absolute left-0 lg:left-8 top-0 bottom-0 w-px bg-zinc-200" />

            <div className="space-y-6">
              {selectedDay.activities.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-300">
                    <Clock size={24} />
                  </div>
                  <p className="text-zinc-400 text-sm font-medium">No activities planned for this day yet.</p>
                </div>
              ) : (
                selectedDay.activities
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((activity, idx, arr) => (
                    <div key={activity.id}>
                      <ActivityCard 
                        activity={activity} 
                        isCollapsed={collapsedIds.has(activity.id)}
                        onToggleCollapse={() => toggleCollapse(activity.id)}
                        onEdit={() => {
                          setEditingActivity(activity);
                          setIsModalOpen(true);
                        }}
                        onDelete={() => deleteActivity(activity.id)}
                        participants={participants}
                      />
                    </div>
                  ))
              )}

              {selectedDay.activities.length > 0 && (
                <div className="pt-4">
                  <button 
                    onClick={() => {
                      setEditingActivity(null);
                      setIsModalOpen(true);
                    }}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-zinc-100 text-zinc-300 hover:border-zinc-200 hover:text-zinc-500 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest"
                  >
                    <Plus size={14} />
                    <span>Add Entry</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isModalOpen && (
          <ActivityModal 
            activity={editingActivity} 
            onClose={() => setIsModalOpen(false)} 
            onSave={saveActivity} 
            participants={participants}
          />
        )}
        {isMemberModalOpen && (
          <MemberEditModal 
            member={editingMember} 
            onClose={() => setIsMemberModalOpen(false)} 
            onSave={saveMember} 
            onDelete={editingMember ? () => deleteMember(editingMember.id) : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MemberEditModal({ 
  member, 
  onClose, 
  onSave,
  onDelete
}: { 
  member: Participant | null; 
  onClose: () => void; 
  onSave: (data: Partial<Participant>) => void; 
  onDelete?: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Participant>>(
    member || { name: '' }
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-xl font-bold text-zinc-900">
              {member ? 'Edit Member' : 'New Member'}
            </h3>
            <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Name</label>
              <input 
                type="text" 
                autoFocus
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full Name"
                className="w-full bg-zinc-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-zinc-900 transition-all outline-none font-medium text-sm"
              />
            </div>

            <div className="pt-4 flex gap-2">
              <button 
                onClick={() => onSave(formData)}
                className="flex-1 bg-zinc-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200"
              >
                Save
              </button>
              {onDelete && (
                <button 
                  onClick={onDelete}
                  className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ActivityCard({ 
  activity, 
  isCollapsed,
  onToggleCollapse,
  onEdit, 
  onDelete,
  participants: allParticipants
}: { 
  activity: Activity; 
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onEdit: () => void; 
  onDelete: () => void;
  participants: Participant[];
}) {
  const typeConfig = ACTIVITY_TYPES[activity.type];
  
  // Calculate relative height based on duration
  const minHeight = isCollapsed ? 64 : 100;
  const pixelsPerMinute = 0.6;
  const calculatedHeight = isCollapsed ? 64 : Math.max(minHeight, activity.duration * pixelsPerMinute);

  const Icon = activity.type === 'hotel' ? Hotel :
               activity.type === 'dining' ? Utensils :
               activity.type === 'airport' ? PlaneTakeoff :
               activity.type === 'travel' ? Navigation : Camera;

  const participants = allParticipants.filter(p => activity.participantIds.includes(p.id));

  if (activity.type === 'travel') {
    return (
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="relative ml-4 pl-8 lg:pl-10 py-2"
      >
        <div className="absolute left-[-2px] lg:left-[-2px] top-0 bottom-0 w-[4px] bg-zinc-100 rounded-full" />
        <div 
          onClick={onToggleCollapse}
          className={cn(
            "flex flex-col bg-white rounded-2xl p-3 border border-zinc-100 w-fit min-w-[200px] cursor-pointer group transition-all shadow-sm hover:border-zinc-200",
            isCollapsed ? "opacity-60 hover:opacity-100" : "opacity-100"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400">
              <Navigation size={12} />
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Travel</span>
                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  <button onClick={onEdit} className="text-zinc-300 hover:text-zinc-900 transition-colors"><Edit2 size={10} /></button>
                  <button onClick={onDelete} className="text-zinc-300 hover:text-red-500 transition-colors"><Trash2 size={10} /></button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-zinc-900">{activity.duration}m</span>
                <span className="text-[10px] text-zinc-500 italic truncate max-w-[150px]">
                  {activity.title}
                </span>
              </div>
            </div>
          </div>

          {!isCollapsed && participants.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-50 flex flex-col gap-1">
              <p className="text-[7px] font-bold text-zinc-300 uppercase tracking-widest mb-1">Participants</p>
              <div className="flex flex-wrap gap-1">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center gap-1 bg-zinc-50 px-1.5 py-0.5 rounded-md">
                    <div className={cn("w-1.5 h-1.5 rounded-full", p.avatarColor)} />
                    <span className="text-[8px] font-medium text-zinc-500">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative group"
    >
      {/* Timeline Dot */}
      <div className="absolute -left-8 lg:-left-8 top-6 w-2.5 h-2.5 rounded-full bg-zinc-900 border-[3px] border-zinc-50 z-10" />
      
      <div 
        style={{ minHeight: `${calculatedHeight}px` }}
        className={cn(
          "bg-white rounded-[24px] border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col md:flex-row cursor-pointer",
          isCollapsed ? "hover:translate-x-1" : "hover:-translate-y-1"
        )}
        onClick={onToggleCollapse}
      >
        {!isCollapsed && activity.imageUrls && activity.imageUrls.length > 0 && (
          <div className="w-full md:w-48 h-40 md:h-auto relative overflow-hidden shrink-0 flex">
            {activity.imageUrls.map((url, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "h-full relative overflow-hidden transition-all duration-500",
                  activity.imageUrls.length === 1 ? "w-full" : "w-1/2 hover:w-full"
                )}
              >
                <img 
                  src={url} 
                  alt={`${activity.title} ${idx + 1}`} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/5" />
              </div>
            ))}
          </div>
        )}
        
        <div className={cn("flex-1 flex flex-col", isCollapsed ? "p-3 px-5" : "p-6")}>
          <div className="flex items-start justify-between">
            <div className={cn("space-y-1.5", isCollapsed && "flex items-center gap-4 space-y-0 flex-1")}>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md">
                  <span>{activity.startTime}</span>
                  <ArrowRight size={8} className="text-zinc-400" />
                  <span>{activity.endTime}</span>
                  <span className="ml-1 text-zinc-400 font-medium">({activity.duration}m)</span>
                </div>
                {!isCollapsed && (
                  <span className={cn("text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md border", typeConfig.color)}>
                    {typeConfig.label}
                  </span>
                )}
              </div>
              <h3 className={cn(
                "font-bold text-zinc-900 leading-tight line-clamp-2",
                isCollapsed ? "text-[13px] flex-1" : "text-lg"
              )}>
                {activity.title}
              </h3>
              {isCollapsed && (
                <div className="flex items-center gap-3 shrink-0 ml-auto mr-2">
                  {activity.location && (
                    <div className="flex items-center gap-1 text-zinc-400 text-[9px]">
                      <MapPin size={10} />
                      <span className="truncate max-w-[80px]">{activity.location}</span>
                    </div>
                  )}
                  <div className="flex flex-col items-end gap-0.5">
                    {participants.map(p => (
                      <div key={p.id} className="flex items-center gap-1">
                        <span className="text-[8px] font-medium text-zinc-400">{p.name}</span>
                        <div className={cn("w-1 h-1 rounded-full", p.avatarColor)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
              <button 
                onClick={onEdit}
                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-300 hover:text-zinc-900 transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={onDelete}
                className="p-2 hover:bg-red-50 rounded-full text-zinc-300 hover:text-red-600 transition-colors"
              >
                <Trash2 size={14} />
              </button>
              <button 
                onClick={onToggleCollapse}
                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors ml-1"
              >
                {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>
          </div>

          {!isCollapsed && (
            <>
              <div className="flex-1 mt-3">
                {activity.description && (
                  <p className="text-zinc-500 text-xs leading-relaxed mb-4 line-clamp-3">
                    {activity.description}
                  </p>
                )}
              </div>

                <div className="flex items-end justify-between mt-auto pt-4 border-t border-zinc-50">
                  <div className="flex items-center gap-4 pb-1">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[9px] font-bold">
                      <Clock size={12} className="text-zinc-300" />
                      <span>{activity.duration} mins</span>
                    </div>
                    {activity.location && (
                      <div className="flex items-center gap-1.5 text-zinc-400 text-[9px] font-bold">
                        <MapPin size={12} className="text-zinc-300" />
                        <span className="truncate max-w-[150px]">{activity.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-end gap-3">
                    {participants.length > 0 && (
                      <div className="flex flex-col items-end gap-0.5">
                        {participants.map(p => (
                          <div key={p.id} className="flex items-center gap-1.5">
                            <span className="text-[9px] font-medium text-zinc-400">{p.name}</span>
                            <div className={cn("w-1.5 h-1.5 rounded-full", p.avatarColor)} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-zinc-200 pb-0.5">
                      <Icon size={14} />
                    </div>
                  </div>
                </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ActivityModal({ 
  activity, 
  onClose, 
  onSave,
  participants
}: { 
  activity: Activity | null; 
  onClose: () => void; 
  onSave: (data: Partial<Activity>) => void;
  participants: Participant[];
}) {
  const [formData, setFormData] = useState<Partial<Activity>>(
    activity || {
      title: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      type: 'activity',
      location: '',
      imageUrls: [],
      participantIds: []
    }
  );

  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const duration = getDuration(formData.startTime, formData.endTime);
      setFormData(prev => ({ ...prev, duration }));
    }
  }, [formData.startTime, formData.endTime]);

  const [newImageUrl, setNewImageUrl] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({
          ...formData,
          imageUrls: [...(formData.imageUrls || []), base64String]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      setFormData({
        ...formData,
        imageUrls: [...(formData.imageUrls || []), newImageUrl.trim()]
      });
      setNewImageUrl('');
    }
  };

  const removeImageUrl = (index: number) => {
    setFormData({
      ...formData,
      imageUrls: (formData.imageUrls || []).filter((_, i) => i !== index)
    });
  };

  const toggleParticipant = (id: string) => {
    const currentIds = formData.participantIds || [];
    if (currentIds.includes(id)) {
      setFormData({ ...formData, participantIds: currentIds.filter(pid => pid !== id) });
    } else {
      setFormData({ ...formData, participantIds: [...currentIds, id] });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-xl font-bold text-zinc-900">
              {activity ? 'Edit Entry' : 'New Entry'}
            </h3>
            <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Title / Description</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Flight to Tokyo"
                  className="w-full bg-zinc-50 border-none rounded-xl p-3.5 focus:ring-2 focus:ring-zinc-900 transition-all outline-none font-medium text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Start Time</label>
                <input 
                  type="time" 
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full bg-zinc-50 border-none rounded-xl p-3.5 focus:ring-2 focus:ring-zinc-900 transition-all outline-none font-medium text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest ml-1">End Time</label>
                <input 
                  type="time" 
                  value={formData.endTime}
                  onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full bg-zinc-50 border-none rounded-xl p-3.5 focus:ring-2 focus:ring-zinc-900 transition-all outline-none font-medium text-xs"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(ACTIVITY_TYPES) as Array<keyof typeof ACTIVITY_TYPES>).map(type => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, type })}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-[9px] font-bold transition-all border",
                        formData.type === type 
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-md" 
                          : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
                      )}
                    >
                      {ACTIVITY_TYPES[type].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Participants</label>
                <div className="flex flex-wrap gap-1.5">
                  {participants.map(p => (
                    <button
                      key={p.id}
                      onClick={() => toggleParticipant(p.id)}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-1 rounded-full border transition-all",
                        formData.participantIds?.includes(p.id)
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
                      )}
                    >
                      <div className={cn("w-2.5 h-2.5 rounded-full", p.avatarColor)} />
                      <span className="text-[9px] font-bold">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Location</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Search for a place..."
                    className="w-full bg-zinc-50 border-none rounded-xl p-3.5 pl-10 focus:ring-2 focus:ring-zinc-900 transition-all outline-none font-medium text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Images</label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newImageUrl}
                      onChange={e => setNewImageUrl(e.target.value)}
                      placeholder="Paste image URL..."
                      className="flex-1 bg-zinc-50 border-none rounded-xl p-3.5 focus:ring-2 focus:ring-zinc-900 transition-all outline-none font-medium text-xs"
                    />
                    <button 
                      onClick={addImageUrl}
                      className="bg-zinc-900 text-white px-4 rounded-xl font-bold text-[10px] hover:bg-zinc-800 transition-all"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="w-full border-2 border-dashed border-zinc-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-zinc-200 transition-colors">
                      <ImageIcon size={20} className="text-zinc-300" />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Upload Local Image</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {formData.imageUrls?.map((url, idx) => (
                    <div key={idx} className="relative w-10 h-10 rounded-lg overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImageUrl(idx)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Notes</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add some details..."
                  rows={2}
                  className="w-full bg-zinc-50 border-none rounded-xl p-3.5 focus:ring-2 focus:ring-zinc-900 transition-all outline-none font-medium resize-none text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => onSave(formData)}
                className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 active:scale-[0.98]"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
