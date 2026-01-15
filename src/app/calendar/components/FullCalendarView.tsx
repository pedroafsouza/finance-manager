'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarEvent } from '../types';

import '../fullcalendar-dark.css';

interface FullCalendarViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export default function FullCalendarView({ events, onEventClick }: FullCalendarViewProps) {
  const handleEventClick = (info: any) => {
    const event = events.find(e => e.id === info.event.id);
    if (event) {
      onEventClick(event);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridYear'
        }}
        height="auto"
        events={events}
        eventClick={handleEventClick}
        eventClassNames="cursor-pointer"
        dayMaxEvents={3}
        moreLinkClick="popover"
      />
    </div>
  );
}
