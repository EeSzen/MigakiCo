import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface DateOverride {
  id: string;
  date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
}

interface AvailabilityRow {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// 07:00 to 20:00 in 30-min steps
const TIME_CHIPS: string[] = [];
for (let h = 7; h <= 20; h++) {
  for (const m of [0, 30]) {
    TIME_CHIPS.push(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    );
  }
}

function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AdminCalendar() {
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [weekly, setWeekly] = useState<AvailabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [isAvailable, setIsAvailable] = useState(true);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [rangeAnchor, setRangeAnchor] = useState<string | null>(null);
  const [repeatMode, setRepeatMode] = useState<"once" | "weekly">("once");
  const [note, setNote] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: overrideData }, { data: weeklyData }] = await Promise.all([
      supabase
        .from("date_overrides")
        .select("*")
        .order("date", { ascending: true }),
      supabase
        .from("availability")
        .select("*")
        .order("day_of_week", { ascending: true }),
    ]);
    setOverrides(overrideData || []);
    setWeekly(weeklyData || []);
    setLoading(false);
  }

  const overrideByDate = useMemo(() => {
    const map = new Map<string, DateOverride>();
    overrides.forEach((o) => map.set(o.date, o));
    return map;
  }, [overrides]);

  const weeklyByDay = useMemo(() => {
    const map = new Map<number, AvailabilityRow>();
    weekly.forEach((w) => map.set(w.day_of_week, w));
    return map;
  }, [weekly]);

  const gridDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);

    const days: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push({ date: d, inMonth: d.getMonth() === month });
    }
    return days;
  }, [viewMonth]);

  function dayStatus(
    dateStr: string,
    dayOfWeek: number,
  ): "override-open" | "override-closed" | "weekly-open" | "closed" {
    const override = overrideByDate.get(dateStr);
    if (override)
      return override.is_available ? "override-open" : "override-closed";
    const weeklyRow = weeklyByDay.get(dayOfWeek);
    if (weeklyRow && weeklyRow.is_active) return "weekly-open";
    return "closed";
  }

  function toggleDate(dateStr: string) {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  }

  function handleChipClick(time: string) {
    if (!rangeAnchor) {
      setRangeAnchor(time);
      setRangeStart(time);
      setRangeEnd(time);
    } else {
      const start = time < rangeAnchor ? time : rangeAnchor;
      const end = time > rangeAnchor ? time : rangeAnchor;
      setRangeStart(start);
      setRangeEnd(end);
      setRangeAnchor(null);
    }
  }

  function clearTimeSelection() {
    setRangeStart(null);
    setRangeEnd(null);
    setRangeAnchor(null);
  }

  function clearAll() {
    setSelectedDates(new Set());
    clearTimeSelection();
    setNote("");
    setIsAvailable(true);
    setRepeatMode("once");
  }

  const selectedWeekdays = useMemo(() => {
    const set = new Set<number>();
    selectedDates.forEach((d) => set.add(new Date(d + "T00:00:00").getDay()));
    return set;
  }, [selectedDates]);

  async function handleSave() {
    if (selectedDates.size === 0) return;
    if (isAvailable && (!rangeStart || !rangeEnd)) {
      alert(
        "Select a time range, or switch this off to mark the date(s) closed.",
      );
      return;
    }

    setSaving(true);

    try {
      if (repeatMode === "once") {
        const rows = Array.from(selectedDates).map((date) => ({
          date,
          is_available: isAvailable,
          start_time: isAvailable ? rangeStart : null,
          end_time: isAvailable ? rangeEnd : null,
          note: note || null,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("date_overrides")
          .upsert(rows, { onConflict: "date" });
        if (error) throw error;
      } else {
        for (const dow of selectedWeekdays) {
          const existing = weeklyByDay.get(dow);

          if (existing) {
            const { error } = await supabase
              .from("availability")
              .update({
                is_active: isAvailable,
                start_time: isAvailable ? rangeStart : existing.start_time,
                end_time: isAvailable ? rangeEnd : existing.end_time,
              })
              .eq("id", existing.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("availability").insert({
              day_of_week: dow,
              start_time: isAvailable ? rangeStart : "09:00",
              end_time: isAvailable ? rangeEnd : "17:00",
              is_active: isAvailable,
            });
            if (error) throw error;
          }
        }
      }

      await fetchAll();
      clearAll();
    } catch (err) {
      console.error("Error saving availability:", err);
      alert("Something went wrong saving. Check the console for details.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteOverride(id: string) {
    if (
      !window.confirm(
        "Remove this date override? It will fall back to the weekly pattern.",
      )
    )
      return;
    const { error } = await supabase
      .from("date_overrides")
      .delete()
      .eq("id", id);
    if (!error) fetchAll();
  }

  async function handleDeleteWeekly(id: string) {
    if (!window.confirm("Remove this weekly availability day entirely?"))
      return;
    const { error } = await supabase.from("availability").delete().eq("id", id);
    if (!error) fetchAll();
  }

  const monthLabel = viewMonth.toLocaleDateString("en-MY", {
    month: "long",
    year: "numeric",
  });
  const todayStr = formatDateLocal(new Date());

  return (
    <div className="space-y-6 text-foreground">
      <div>
        <h2 className="text-2xl font-semibold">Calendar Management</h2>
        <p className="text-sm text-muted-foreground pt-5">
          Click one or more dates below, then set their hours. Use "Repeat
          weekly" to update your standing pattern instead of just those dates.
        </p>
      </div>

      <Card className="h-full border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">{monthLabel}</CardTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() =>
                setViewMonth(
                  (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1),
                )
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() =>
                setViewMonth(
                  (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1),
                )
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-2.5 sm:p-6">
          <div className="mb-3 grid grid-cols-7 gap-1 sm:gap-2">
            {WEEKDAY_SHORT.map((d) => (
              <div
                key={d}
                className="text-center text-xs text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {gridDays.map(({ date, inMonth }) => {
              const dateStr = formatDateLocal(date);
              const status = dayStatus(dateStr, date.getDay());
              const isSelected = selectedDates.has(dateStr);
              const isPast = dateStr < todayStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isPast}
                  onClick={() => toggleDate(dateStr)}
                  className={`
                    relative flex w-full min-w-0
                    aspect-square
                    items-center justify-center
                    rounded-lg border
                    text-xs font-medium
                    transition-all duration-150
                    sm:rounded-xl
                    sm:text-sm

                    ${!inMonth ? "opacity-30" : ""}

                    ${
                      isPast
                        ? "cursor-not-allowed opacity-20"
                        : "cursor-pointer hover:border-primary hover:bg-primary/5 hover:shadow-sm"
                    }

                    ${
                      isSelected
                        ? "z-10 border-2 border-primary bg-primary/15 text-primary shadow-md ring-2 ring-primary/20"
                        : "border-border bg-background"
                    }
                    `}
                >
                  <span>{date.getDate()}</span>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      status === "override-open"
                        ? "bg-emerald-500"
                        : status === "override-closed"
                          ? "bg-red-500"
                          : status === "weekly-open"
                            ? "bg-sky-500"
                            : "bg-transparent"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
            <LegendDot color="bg-sky-500" label="Weekly pattern" />
            <LegendDot color="bg-emerald-500" label="One-off open" />
            <LegendDot color="bg-red-500" label="One-off closed" />
            <LegendDot
              color="bg-transparent border border-border"
              label="Closed (default)"
            />
          </div>
        </CardContent>
      </Card>

      {selectedDates.size > 0 && (
        <Card className="border-primary/50 bg-card shadow-md ring-1 ring-primary/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>
                {selectedDates.size} date{selectedDates.size > 1 ? "s" : ""}{" "}
                selected
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAll}
              >
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-4 sm:p-6">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Selected dates
              </Label>

              <div className="flex min-w-0 flex-wrap gap-2">
                {Array.from(selectedDates)
                  .sort()
                  .map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDate(d)}
                      className="
                        group inline-flex items-center gap-1.5
                        rounded-lg border border-primary/40
                        bg-primary/10
                        max-w-full px-2.5 py-2 sm:px-3
                        text-sm font-medium text-primary
                        transition-all
                        hover:border-destructive/50
                        hover:bg-destructive/10
                        hover:text-destructive
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-primary
                    "
                      title="Remove this date"
                    >
                      {new Date(d + "T00:00:00").toLocaleDateString("en-MY", {
                        day: "numeric",
                        month: "short",
                      })}

                      <X className="h-3.5 w-3.5 opacity-60 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Click a date to remove it from the selection.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Availability
              </Label>

              <div className="grid grid-cols-2 rounded-xl border border-border bg-muted/30 p-1">
                <button
                  type="button"
                  onClick={() => setIsAvailable(true)}
                  className={`
                        min-h-[44px]
                        rounded-lg
                        px-4 py-2
                        text-sm font-medium
                        transition-all duration-150
                        ${
                          isAvailable
                            ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                            : "text-muted-foreground hover:text-foreground"
                        }
                    `}
                >
                  Open
                </button>

                <button
                  type="button"
                  onClick={() => setIsAvailable(false)}
                  className={`
                        min-h-[44px]
                        rounded-lg
                        px-4 py-2
                        text-sm font-medium
                        transition-all duration-150
                        ${
                          !isAvailable
                            ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                            : "text-muted-foreground hover:text-foreground"
                        }
                    `}
                >
                  Closed
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                {isAvailable
                  ? "These dates will be available during the selected hours."
                  : "These dates will be marked as unavailable."}
              </p>
            </div>

            {isAvailable && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Working hours{" "}
                    {rangeStart && rangeEnd
                      ? `— ${rangeStart} to ${rangeEnd}`
                      : "(click a start time, then an end time)"}
                  </Label>
                  {(rangeStart || rangeAnchor) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearTimeSelection}
                      className="h-6 px-2 text-xs"
                    >
                      Reset
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
                  {TIME_CHIPS.map((time) => {
                    const isStart = rangeStart === time;
                    const isEnd = rangeEnd === time;

                    const inRange =
                      rangeStart &&
                      rangeEnd &&
                      time >= rangeStart &&
                      time <= rangeEnd;

                    const isAnchorOnly = rangeAnchor === time;

                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleChipClick(time)}
                        className={`
                            min-h-[44px] rounded-lg border-2 px-3 py-2
                            text-sm font-medium
                            transition-all duration-150
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-primary
                            focus-visible:ring-offset-2

                            ${
                              isAnchorOnly
                                ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                                : inRange
                                  ? "border-primary/70 bg-primary/15 text-primary shadow-sm"
                                  : "border-border bg-background text-foreground hover:border-primary/60 hover:bg-primary/5"
                            }
                        `}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">
                Applies to
              </Label>

              <RadioGroup
                value={repeatMode}
                onValueChange={(v: string) =>
                  setRepeatMode(v as "once" | "weekly")
                }
                className="grid gap-3 sm:grid-cols-2"
              >
                <label
                  htmlFor="repeat-once"
                  className={`
        flex cursor-pointer items-start gap-3
        rounded-xl border-2 p-4
        transition-all duration-150
        ${
          repeatMode === "once"
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
        }
      `}
                >
                  <RadioGroupItem
                    value="once"
                    id="repeat-once"
                    className="mt-0.5"
                  />

                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium">Selected dates only</p>

                    <p className="text-xs leading-5 text-muted-foreground">
                      Apply this availability only to the selected date
                      {selectedDates.size > 1 ? "s" : ""}.
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="repeat-weekly"
                  className={`
        flex cursor-pointer items-start gap-3
        rounded-xl border-2 p-4
        transition-all duration-150
        ${
          repeatMode === "weekly"
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
        }
      `}
                >
                  <RadioGroupItem
                    value="weekly"
                    id="repeat-weekly"
                    className="mt-0.5"
                  />

                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium">Repeat weekly</p>

                    <p className="text-xs leading-5 text-muted-foreground">
                      Repeat every{" "}
                      {Array.from(selectedWeekdays)
                        .sort()
                        .map((d) => WEEKDAY_NAMES[d])
                        .join(", ")}
                      .
                    </p>
                  </div>
                </label>
              </RadioGroup>

              {repeatMode === "weekly" && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                  <p className="text-xs leading-5 text-muted-foreground">
                    This updates your standing weekly pattern going forward, not
                    just the selected date{selectedDates.size > 1 ? "s" : ""}.
                  </p>
                </div>
              )}
            </div>

            {repeatMode === "once" && (
              <div className="space-y-2">
                <Label htmlFor="note" className="text-xs text-muted-foreground">
                  Note (optional)
                </Label>
                <Textarea
                  id="note"
                  placeholder="e.g. Public holiday, extended hours..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </div>
            )}

            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            >
              {saving ? "Saving..." : "Save availability"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="h-full border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Weekly pattern</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="flex min-h-[130px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : weekly.length === 0 ? (
              <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
                <div className="max-w-sm space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    No weekly pattern set yet
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Select a date above and choose "Repeat every..." to create
                    one.
                  </p>
                </div>
              </div>
            ) : (
              weekly
                .slice()
                .sort((a, b) => a.day_of_week - b.day_of_week)
                .map((row) => (
                  <div
                    key={row.id}
                    className="flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
                  >
                    <div>
                      <span className="font-medium">
                        {WEEKDAY_NAMES[row.day_of_week]}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {row.is_active
                          ? `${row.start_time.slice(0, 5)}–${row.end_time.slice(0, 5)}`
                          : "Closed"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWeekly(row.id)}
                      className="h-8 shrink-0 px-2.5 text-xs text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        <Card className="h-full border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">One-off overrides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : overrides.length === 0 ? (
              <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
                <div className="max-w-sm space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    No one-off overrides yet
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Select a date above to create a special opening or closing
                    that differs from your normal weekly schedule.
                  </p>
                </div>
              </div>
            ) : (
              overrides.map((o) => (
                <div
                  key={o.id}
                  className="flex min-h-[64px] items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <div>
                    <span className="font-medium">
                      {new Date(o.date + "T00:00:00").toLocaleDateString(
                        "en-MY",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {o.is_available
                        ? `${o.start_time?.slice(0, 5)}–${o.end_time?.slice(0, 5)}`
                        : "Closed"}
                    </span>
                    {o.note && (
                      <p className="text-xs text-muted-foreground italic">
                        {o.note}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteOverride(o.id)}
                    className="h-8 shrink-0 px-2.5 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}
