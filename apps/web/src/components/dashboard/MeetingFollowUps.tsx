"use client";

import Link from "next/link";
import { AlertCircle, CalendarClock, Check, Clock, X } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMyMeetings, type ScheduledMeeting } from "@/hooks/useDashboard";
import { StatusBadge } from "@/components/leads/StatusBadge";
import type { LeadStatus } from "@lms/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useCompleteMeeting } from "@/hooks/useLeadDetail";

dayjs.extend(relativeTime);

function MeetingRow({
  meeting,
  variant,
  onComplete,
}: {
  meeting: ScheduledMeeting;
  variant: "overdue" | "upcoming";
  onComplete: (meeting: ScheduledMeeting) => void;
}) {
  const date = dayjs(meeting.scheduledAt);
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors hover:bg-surface-50",
        variant === "overdue"
          ? "border-red-200 bg-red-50"
          : "border-amber-100 bg-amber-50",
      )}
    >
      <Link href={`/leads/${meeting.lead.id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {meeting.lead.name ?? meeting.lead.phone}
          </p>
          <StatusBadge status={meeting.lead.status as LeadStatus} size="sm" />
        </div>
        <p
          className={cn(
            "text-xs mt-0.5 font-medium",
            variant === "overdue" ? "text-red-500" : "text-amber-600",
          )}
        >
          {date.format("D MMM YYYY, h:mm A")} ·{" "}
          {variant === "overdue"
            ? `Overdue ${date.fromNow(true)}`
            : `Due ${date.fromNow()}`}
        </p>
      </Link>
      <button
        type="button"
        onClick={() => onComplete(meeting)}
        className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700"
        title="Mark meeting as done"
      >
        <Check size={13} /> Done
      </button>
    </div>
  );
}

export function MeetingFollowUps() {
  const { data, isLoading } = useMyMeetings();
  const completeMeeting = useCompleteMeeting();
  const [selectedMeeting, setSelectedMeeting] =
    useState<ScheduledMeeting | null>(null);
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [note, setNote] = useState("");
  const overdue = data?.overdue ?? [];
  const upcoming = data?.upcoming ?? [];
  const total = overdue.length + upcoming.length;

  function openComplete(meeting: ScheduledMeeting) {
    setSelectedMeeting(meeting);
    setNextFollowUpAt("");
    setNote("");
  }

  async function submitComplete() {
    if (!selectedMeeting) return;
    await completeMeeting.mutateAsync({
      id: selectedMeeting.id,
      ...(nextFollowUpAt && {
        nextFollowUpAt: new Date(nextFollowUpAt).toISOString(),
      }),
      note,
    });
    setSelectedMeeting(null);
  }

  return (
    <div className="bg-white border border-surface-200 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-gray-800">
            Meeting Follow-ups
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {overdue.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
              <AlertCircle size={10} />
              {overdue.length} overdue
            </span>
          )}
          {upcoming.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Clock size={10} />
              {upcoming.length} upcoming
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 h-48 overflow-hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-14 bg-surface-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-green-600 font-medium">
            No meetings scheduled
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Upcoming meeting follow-ups will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4 h-48 overflow-y-auto">
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">
                Upcoming (next 7 days)
              </p>
              <div className="space-y-2">
                {upcoming.map((meeting) => (
                  <MeetingRow
                    key={meeting.id}
                    meeting={meeting}
                    variant="upcoming"
                    onComplete={openComplete}
                  />
                ))}
              </div>
            </div>
          )}
          {overdue.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">
                Overdue
              </p>
              <div className="space-y-2">
                {overdue.map((meeting) => (
                  <MeetingRow
                    key={meeting.id}
                    meeting={meeting}
                    variant="overdue"
                    onComplete={openComplete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">
                  Complete meeting
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedMeeting.lead.name ?? selectedMeeting.lead.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMeeting(null)}
                className="p-1 text-gray-400 hover:text-gray-700"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Meeting outcome or notes"
              className="w-full min-h-20 rounded-lg border border-surface-200 p-2 text-sm outline-none focus:border-primary"
            />
            <div>
              <label className="text-xs font-medium text-gray-600">
                Next follow-up (optional)
              </label>
              <input
                type="datetime-local"
                value={nextFollowUpAt}
                onChange={(event) => setNextFollowUpAt(event.target.value)}
                min={dayjs().format("YYYY-MM-DDTHH:mm")}
                className="mt-1 w-full rounded-lg border border-surface-200 p-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedMeeting(null)}
                className="px-3 py-2 rounded-lg border border-surface-200 text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitComplete()}
                disabled={completeMeeting.isPending}
                className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {completeMeeting.isPending ? "Saving..." : "Mark done"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
