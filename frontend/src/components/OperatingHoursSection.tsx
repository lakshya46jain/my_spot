import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Copy,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

export type TimeRange = {
  openHour: string;
  openMinute: string;
  openMeridiem: "AM" | "PM";
  closeHour: string;
  closeMinute: string;
  closeMeridiem: "AM" | "PM";
};

export type DayHours = {
  day: string;
  closed: boolean;
  timeRanges: TimeRange[];
  notes: string;
};

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const HOURS = ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
const MINUTES = ["00", "15", "30", "45"];

function createEmptyTimeRange(): TimeRange {
  return {
    openHour: "9",
    openMinute: "00",
    openMeridiem: "AM",
    closeHour: "5",
    closeMinute: "00",
    closeMeridiem: "PM",
  };
}

export function createDefaultHours(): DayHours[] {
  return DAYS_OF_WEEK.map((day) => ({
    day,
    closed: false,
    timeRanges: [createEmptyTimeRange()],
    notes: "",
  }));
}

/**
 * Convert 12-hour UI values into MySQL TIME format (HH:MM:SS).
 * TODO: convert 12-hour UI values into MySQL TIME format before backend submission
 */
export function toMySQLTime(
  hour: string,
  minute: string,
  meridiem: "AM" | "PM",
): string {
  let h = parseInt(hour, 10);
  if (meridiem === "AM" && h === 12) h = 0;
  if (meridiem === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${minute}:00`;
}

// ─── Validation helpers ─────────────────────────────────────────

function timeToMinutes(
  hour: string,
  minute: string,
  meridiem: "AM" | "PM",
): number {
  let h = parseInt(hour, 10);
  if (meridiem === "AM" && h === 12) h = 0;
  if (meridiem === "PM" && h !== 12) h += 12;
  return h * 60 + parseInt(minute, 10);
}

function validateDayHours(day: DayHours): string | null {
  if (day.closed) return null;

  for (let i = 0; i < day.timeRanges.length; i++) {
    const range = day.timeRanges[i];
    const openMin = timeToMinutes(
      range.openHour,
      range.openMinute,
      range.openMeridiem,
    );
    const closeMin = timeToMinutes(
      range.closeHour,
      range.closeMinute,
      range.closeMeridiem,
    );

    if (closeMin <= openMin) {
      return `Range ${i + 1}: Close time must be after open time.`;
    }
  }

  return null;
}

// ─── Sub-components ─────────────────────────────────────────────

function MeridiemSelect({
  value,
  onChange,
  disabled,
}: {
  value: "AM" | "PM";
  onChange: (v: "AM" | "PM") => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as "AM" | "PM")}
      disabled={disabled}
      className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="AM">AM</option>
      <option value="PM">PM</option>
    </select>
  );
}

function TimeRangeInput({
  range,
  onChange,
  onRemove,
  disabled,
  showRemove,
}: {
  range: TimeRange;
  onChange: (updated: TimeRange) => void;
  onRemove: () => void;
  disabled?: boolean;
  showRemove: boolean;
}) {
  const update = (field: keyof TimeRange, value: string) => {
    onChange({ ...range, [field]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Open time */}
      <div className="flex items-center gap-1">
        <select
          value={range.openHour}
          onChange={(e) => update("openHour", e.target.value)}
          disabled={disabled}
          className="h-9 w-16 rounded-lg border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-muted-foreground">:</span>
        <select
          value={range.openMinute}
          onChange={(e) => update("openMinute", e.target.value)}
          disabled={disabled}
          className="h-9 w-16 rounded-lg border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <MeridiemSelect
          value={range.openMeridiem}
          onChange={(v) => update("openMeridiem", v)}
          disabled={disabled}
        />
      </div>

      <span className="text-sm text-muted-foreground font-medium">to</span>

      {/* Close time */}
      <div className="flex items-center gap-1">
        <select
          value={range.closeHour}
          onChange={(e) => update("closeHour", e.target.value)}
          disabled={disabled}
          className="h-9 w-16 rounded-lg border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-muted-foreground">:</span>
        <select
          value={range.closeMinute}
          onChange={(e) => update("closeMinute", e.target.value)}
          disabled={disabled}
          className="h-9 w-16 rounded-lg border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <MeridiemSelect
          value={range.closeMeridiem}
          onChange={(v) => update("closeMeridiem", v)}
          disabled={disabled}
        />
      </div>

      {showRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="ml-1 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          aria-label="Remove time range"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function DayHoursRow({
  dayHours,
  onChange,
  onCopyToAll,
  validationError,
}: {
  dayHours: DayHours;
  onChange: (updated: DayHours) => void;
  onCopyToAll: () => void;
  validationError: string | null;
}) {
  const updateRange = (index: number, updated: TimeRange) => {
    const newRanges = [...dayHours.timeRanges];
    newRanges[index] = updated;
    onChange({ ...dayHours, timeRanges: newRanges });
  };

  const addRange = () => {
    onChange({
      ...dayHours,
      timeRanges: [...dayHours.timeRanges, createEmptyTimeRange()],
    });
  };

  const removeRange = (index: number) => {
    if (dayHours.timeRanges.length <= 1) return;
    onChange({
      ...dayHours,
      timeRanges: dayHours.timeRanges.filter((_, i) => i !== index),
    });
  };

  const toggleClosed = (checked: boolean) => {
    onChange({ ...dayHours, closed: checked });
  };

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        dayHours.closed
          ? "border-border/60 bg-muted/30"
          : "border-border bg-card"
      }`}
    >
      {/* Day header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-semibold min-w-[90px] ${
              dayHours.closed ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {dayHours.day}
          </span>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`closed-${dayHours.day}`}
              checked={dayHours.closed}
              onCheckedChange={(checked) => toggleClosed(checked === true)}
            />
            <label
              htmlFor={`closed-${dayHours.day}`}
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              Closed
            </label>
          </div>
        </div>
        <button
          type="button"
          onClick={onCopyToAll}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          title={`Copy ${dayHours.day}'s hours to all days`}
        >
          <Copy className="h-3 w-3" />
          <span className="hidden sm:inline">Copy to all</span>
        </button>
      </div>

      {/* Time ranges */}
      {!dayHours.closed && (
        <div className="space-y-2 ml-0 sm:ml-[102px]">
          {dayHours.timeRanges.map((range, i) => (
            <TimeRangeInput
              key={i}
              range={range}
              onChange={(updated) => updateRange(i, updated)}
              onRemove={() => removeRange(i)}
              disabled={dayHours.closed}
              showRemove={dayHours.timeRanges.length > 1}
            />
          ))}

          <button
            type="button"
            onClick={addRange}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-1"
          >
            <Plus className="h-3 w-3" />
            Add another time range
          </button>
        </div>
      )}

      {dayHours.closed && (
        <p className="text-xs text-muted-foreground ml-0 sm:ml-[102px]">
          Closed all day
        </p>
      )}

      {/* Validation error */}
      {validationError && (
        <p className="text-xs text-destructive mt-2 ml-0 sm:ml-[102px]">
          {validationError}
        </p>
      )}

      {/* Notes */}
      <div className="mt-3 ml-0 sm:ml-[102px]">
        <Input
          type="text"
          value={dayHours.notes}
          onChange={(e) => onChange({ ...dayHours, notes: e.target.value })}
          placeholder="Notes (optional) — e.g., Kitchen closes early"
          className="h-8 rounded-lg text-xs"
        />
      </div>
    </div>
  );
}

// ─── Main Section ───────────────────────────────────────────────

interface OperatingHoursSectionProps {
  hours: DayHours[];
  onChange: (hours: DayHours[]) => void;
}

export function OperatingHoursSection({
  hours,
  onChange,
}: OperatingHoursSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const updateDay = (index: number, updated: DayHours) => {
    const newHours = [...hours];
    newHours[index] = updated;
    onChange(newHours);
  };

  const copyToAll = (sourceIndex: number) => {
    const source = hours[sourceIndex];
    onChange(
      hours.map((day) => ({
        ...day,
        closed: source.closed,
        timeRanges: source.timeRanges.map((r) => ({ ...r })),
        notes: day.notes, // preserve individual notes
      })),
    );
  };

  const validationErrors = hours.map(validateDayHours);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-warm-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Operating Hours
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Add hours of operation if known. This is optional.
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-border pt-5 space-y-3">
          {hours.map((dayHours, index) => (
            <DayHoursRow
              key={dayHours.day}
              dayHours={dayHours}
              onChange={(updated) => updateDay(index, updated)}
              onCopyToAll={() => copyToAll(index)}
              validationError={validationErrors[index]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
