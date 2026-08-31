import { supabase } from './supabase';

export interface AvailableSlot {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
}

export interface SlotComputationResult {
  date: string;
  slots: AvailableSlot[];
  error?: string;
}

/**
 * Computes available time slots for a given date and service duration.
 * 
 * Logic:
 * 1. Check date_overrides for that specific date first
 *    - If override exists and is_available = false, return empty slots
 *    - If override exists and is_available = true, use override times
 * 2. Fall back to weekly availability pattern if no override
 * 3. Check existing pending/confirmed bookings that day
 * 4. Generate slots based on service duration, excluding booked times
 * 5. Return array of available start times
 */
export async function computeAvailableSlots(
  date: string, // YYYY-MM-DD
  durationMinutes: number
): Promise<SlotComputationResult> {
  try {
    // Parse the date to get day of week
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

    // Step 1: Check date_overrides
    const { data: override, error: overrideError } = await supabase
      .from('date_overrides')
      .select('is_available, start_time, end_time')
      .eq('date', date)
      .maybeSingle();

    if (overrideError && overrideError.code !== 'PGRST116') {
      throw overrideError;
    }

    // If override says unavailable, return empty
    if (override && !override.is_available) {
      return { date, slots: [] };
    }

    // Determine working hours for this date
    let startHour = 9;
    let endHour = 17;
    let startMinute = 0;
    let endMinute = 0;

    if (override && override.is_available) {
      // Use override times
      const [startH, startM] = override.start_time.split(':').map(Number);
      const [endH, endM] = override.end_time.split(':').map(Number);
      startHour = startH;
      startMinute = startM;
      endHour = endH;
      endMinute = endM;
    } else {
      // Step 2: Fall back to weekly availability pattern
      const { data: availability, error: availError } = await supabase
        .from('availability')
        .select('start_time, end_time')
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle();

      if (availError && availError.code !== 'PGRST116') {
        throw availError;
      }

      if (!availability) {
        // No availability for this day of week
        return { date, slots: [] };
      }

      const [startH, startM] = availability.start_time.split(':').map(Number);
      const [endH, endM] = availability.end_time.split(':').map(Number);
      startHour = startH;
      startMinute = startM;
      endHour = endH;
      endMinute = endM;
    }

    // Step 3: Fetch existing bookings for this date
    const dateStart = new Date(date + 'T00:00:00').toISOString();
    const dateEnd = new Date(date + 'T23:59:59').toISOString();

    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('scheduled_at, id')
      .gte('scheduled_at', dateStart)
      .lte('scheduled_at', dateEnd)
      .in('status', ['pending', 'confirmed']);

    if (bookingError) {
      throw bookingError;
    }

    // Extract booked time ranges
    const bookedRanges: Array<{ start: Date; end: Date }> = (bookings || []).map((b) => {
      // For simplicity, assume each booking is 2 hours (you can adjust or fetch service duration)
      const startDate = new Date(b.scheduled_at);
      const endDate = new Date(startDate.getTime() + 120 * 60 * 1000); // 2 hours default
      return { start: startDate, end: endDate };
    });

    // Step 4: Generate available slots
    const slots: AvailableSlot[] = [];
    const slotDuration = durationMinutes;

    // Convert working hours to minutes from midnight
    const dayStartMinutes = startHour * 60 + startMinute;
    const dayEndMinutes = endHour * 60 + endMinute;

    for (let currentMinutes = dayStartMinutes; currentMinutes + slotDuration <= dayEndMinutes; currentMinutes += slotDuration) {
      const slotStartHours = Math.floor(currentMinutes / 60);
      const slotStartMins = currentMinutes % 60;
      const slotStart = new Date(date + `T${String(slotStartHours).padStart(2, '0')}:${String(slotStartMins).padStart(2, '0')}:00`);
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);

      // Check if this slot overlaps with any booking
      const isBooked = bookedRanges.some((range) => {
        return !(slotEnd <= range.start || slotStart >= range.end);
      });

      if (!isBooked) {
        slots.push({
          startTime: `${String(slotStartHours).padStart(2, '0')}:${String(slotStartMins).padStart(2, '0')}`,
          endTime: `${String(Math.floor(slotEnd.getHours())).padStart(2, '0')}:${String(slotEnd.getMinutes()).padStart(2, '0')}`,
          isAvailable: true,
        });
      }
    }

    return { date, slots };
  } catch (error) {
    console.error('Error computing slots:', error);
    return {
      date,
      slots: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get available dates for the next N days
 */
export async function getAvailableDates(daysAhead: number = 30): Promise<string[]> {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 0; i < daysAhead; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() + i);

    const dateStr = checkDate.toISOString().split('T')[0];
    const result = await computeAvailableSlots(dateStr, 60); // 60 min default

    if (result.slots.length > 0) {
      dates.push(dateStr);
    }
  }

  return dates;
}
