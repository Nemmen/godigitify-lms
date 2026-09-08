"use client";

import Link from "next/link";
import { AlertCircle, CalendarClock, Clock } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMyMeetings, type ScheduledMeeting } from "@/hooks/useDashboard";
import { StatusBadge } from "@/components/leads/StatusBadge";
import type { LeadStatus } from "@lms/types";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

function MeetingRow({
  meeting,
  variant,
}: {
  meeting: ScheduledMeeting;
  variant: "overdue" | "upcoming";
}) {
  const date = dayjs(meeting.scheduledAt);
  return (
    <Link
      href={`/leads/${meeting.lead.id}`}
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-surface-50",
        variant === "overdue"
          ? "border-red-200 bg-red-50"
          : "border-amber-100 bg-amber-50",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {meeting.lead.name ?? meeting.lead.phone}
          </p>
          <StatusBadge status={meeting.lead.status as LeadStatus} size="sm" />
        </div>
        <p className={cn("text-xs mt-0.5 font-medium", variant === "overdue" ? "text-red-500" : "text-amber-600")}>
          {date.format("D MMM YYYY, h:mm A")} · {variant === "overdue" ? `Overdue ${date.fromNow(true)}` : `Due ${date.fromNow()}`}
        </p>
      </div>
    </Link>
  );
}

export function MeetingFollowUps() {
  const { data, isLoading } = useMyMeetings();
  const overdue = data?.overdue ?? [];
  const upcoming = data?.upcoming ?? [];
  const total = overdue.length + upcoming.length;

  return (
    <div className="bg-white border border-surface-200 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-gray-800">Meeting Follow-ups</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {overdue.length > 0 && <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200"><AlertCircle size={10} />{overdue.length} overdue</span>}
          {upcoming.length > 0 && <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"><Clock size={10} />{upcoming.length} upcoming</span>}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 h-48 overflow-hidden">
          {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-14 bg-surface-100 rounded-lg animate-pulse" />)}
        </div>
      ) : total === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-green-600 font-medium">No meetings scheduled</p>
          <p className="text-xs text-gray-400 mt-1">Upcoming meeting follow-ups will appear here</p>
        </div>
      ) : (
        <div className="space-y-4 h-48 overflow-y-auto">
          {upcoming.length > 0 && <div><p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Upcoming (next 7 days)</p><div className="space-y-2">{upcoming.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} variant="upcoming" />)}</div></div>}
          {overdue.length > 0 && <div><p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">Overdue</p><div className="space-y-2">{overdue.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} variant="overdue" />)}</div></div>}
        </div>
      )}
    </div>
  );
}