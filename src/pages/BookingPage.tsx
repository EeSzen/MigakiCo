import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '../lib/supabase';
import { buildWhatsAppLink } from '../lib/Whatsapp';
import { emptyBookingForm } from '../lib/Service';
import { computeAvailableSlots } from '../lib/slotComputation';
import type { BookingFormData, LocationType, Service } from '../lib/Service';

type TabKey = 'onsite' | 'reservation';

const TAB_TO_LOCATION_TYPE: Record<TabKey, LocationType> = {
  onsite: 'onsite',
  reservation: 'home',
};

export default function BookingPage() {
  const routeLocation = useLocation();
  const preselectedService = routeLocation.state?.selectedService as
    | Service
    | undefined;

  const [selectedServices, setSelectedServices] = useState<Service[]>(
    preselectedService ? [preselectedService] : []
  );
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('reservation');
  const [form, setForm] = useState<BookingFormData>(emptyBookingForm);
  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (preselectedService) return;

    async function fetchServices() {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, price, duration_minutes')
        .eq('is_active', true);

      if (!error && data) {
        setAllServices(data);
      }
    }

    fetchServices();
  }, [preselectedService]);

  useEffect(() => {
    async function loadAvailableDates() {
      const dates: string[] = [];
      const today = new Date();

      for (let i = 0; i < 60; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() + i);
        const dateStr = checkDate.toISOString().split('T')[0];

        const result = await computeAvailableSlots(dateStr, 60);
        if (result.slots.length > 0) {
          dates.push(dateStr);
        }
      }

      setAvailableDates(dates);
    }

    loadAvailableDates();
  }, []);

  function updateField<K extends keyof BookingFormData>(
    key: K,
    value: BookingFormData[K]
  ) {
    setForm((prev: any) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));

    if (key === 'date' && selectedServices.length > 0) {
      loadSlotsForDate(value as string, selectedServices[0].duration_minutes);
    }
  }

  async function loadSlotsForDate(date: string, duration: number) {
    if (!date) return;

    setLoadingSlots(true);
    const result = await computeAvailableSlots(date, duration);
    setAvailableSlots(result.slots.map((s) => s.startTime));
    setLoadingSlots(false);
  }

  function toggleService(service: Service) {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    );
  }

  function removeSelectedService(serviceId: string) {
    setSelectedServices((prev) => prev.filter((s) => s.id !== serviceId));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof BookingFormData, string>> = {};

    if (selectedServices.length === 0) {
      setSubmitError('Select at least one service before booking.');
      return false;
    }
    setSubmitError(null);

    if (!form.customerName.trim()) next.customerName = 'Enter your name.';
    if (!form.customerPhone.trim()) next.customerPhone = 'Enter your phone number.';
    if (!form.bikePlate.trim()) next.bikePlate = 'Enter your numberplate.';
    if (!form.bikeCc.trim()) next.bikeCc = 'Enter your bike’s CC.';
    if (!form.bikeModel.trim()) next.bikeModel = 'Enter your bike model.';
    if (!form.date) next.date = 'Choose a date.';
    if (!form.time) next.time = 'Choose a time.';
    if (activeTab === 'onsite' && !form.address.trim()) {
      next.address = 'Enter the address you’d like us to come to.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    const locationType = TAB_TO_LOCATION_TYPE[activeTab];
    const scheduledAt = new Date(`${form.date}T${form.time}:00`).toISOString();

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        customer_name: form.customerName,
        customer_phone: form.customerPhone,
        location_type: locationType,
        address: locationType === 'onsite' ? form.address : null,
        bike_cc: Number(form.bikeCc),
        bike_plate: form.bikePlate,
        bike_model: form.bikeModel,
        remarks: form.remarks || null,
        scheduled_at: scheduledAt,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      if (bookingError?.code === '23505') {
        setSubmitError('That time slot was just booked by someone else. Please pick another.');
      } else {
        setSubmitError('Something went wrong submitting your booking. Please try again.');
      }
      setSubmitting(false);
      return;
    }

    const junctionRows = selectedServices.map((s) => ({
      booking_id: booking.id,
      service_id: s.id,
    }));

    const { error: junctionError } = await supabase
      .from('booking_services')
      .insert(junctionRows);

    if (junctionError) {
      setSubmitError('Your booking was created but services couldn’t be attached. Contact us directly.');
      setSubmitting(false);
      return;
    }

    const whatsappUrl = buildWhatsAppLink(form, selectedServices);
    window.location.href = whatsappUrl;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 flex justify-center text-foreground">
      <Card className="w-full max-w-md border-0 bg-transparent shadow-none">
        <CardContent className="p-0">
          <h1 className="font-serif text-3xl mb-6">Book your detail</h1>

          {selectedServices.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Selected service{selectedServices.length > 1 ? 's' : ''}
              </p>
              {selectedServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="text-sm">{service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      RM {service.price.toFixed(2)} &middot; {service.duration_minutes} min
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSelectedService(service.id)}
                    className="text-muted-foreground hover:text-foreground h-8 w-8"
                    aria-label={`Remove ${service.name}`}
                  >
                    &times;
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!preselectedService && allServices.length > 0 && (
            <div className="mb-6 space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Choose service(s)
              </p>
              {allServices.map((service) => {
                const isSelected = selectedServices.some((s) => s.id === service.id);
                return (
                  <Button
                    key={service.id}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => toggleService(service)}
                    className={`w-full flex items-center justify-between rounded-xl px-4 py-3 h-auto text-left ${
                      isSelected ? 'bg-primary border-primary' : 'bg-card border-border'
                    }`}
                  >
                    <span className="text-sm">{service.name}</span>
                    <span className="text-xs text-muted-foreground">
                      RM {service.price.toFixed(2)}
                    </span>
                  </Button>
                );
              })}
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabKey)}
            className="w-full mb-6"
          >
            <TabsList className="grid w-full grid-cols-2 bg-transparent border border-border p-1 rounded-lg h-auto gap-1">
              {(['onsite', 'reservation'] as TabKey[]).map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="flex-1 py-2.5 rounded-lg border border-transparent capitalize data-[state=active]:bg-primary data-[state=active]:border-primary data-[state=active]:text-primary-foreground text-muted-foreground"
                >
                  {tab === 'onsite' ? 'On-site' : 'Reservation'}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="space-y-3">
            <Field
              placeholder="Full name"
              value={form.customerName}
              onChange={(v) => updateField('customerName', v)}
              error={errors.customerName}
            />
            <Field
              placeholder="Phone number"
              value={form.customerPhone}
              onChange={(v) => updateField('customerPhone', v)}
              error={errors.customerPhone}
            />

            {activeTab === 'onsite' && (
              <Field
                placeholder="Address"
                value={form.address}
                onChange={(v) => updateField('address', v)}
                error={errors.address}
              />
            )}

            <div className="flex gap-3">
              <Field
                placeholder="Numberplate"
                value={form.bikePlate}
                onChange={(v) => updateField('bikePlate', v)}
                error={errors.bikePlate}
                className="flex-1"
              />
              <Field
                placeholder="CC"
                value={form.bikeCc}
                onChange={(v) => updateField('bikeCc', v)}
                error={errors.bikeCc}
                className="w-24"
              />
            </div>

            <Field
              placeholder="Bike model"
              value={form.bikeModel}
              onChange={(v) => updateField('bikeModel', v)}
              error={errors.bikeModel}
            />

            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="mb-1 block text-xs text-muted-foreground">Date</Label>
                <Select
                  value={form.date || undefined}
                  onValueChange={(value) => updateField('date', value)}
                >
                  <SelectTrigger className="w-full bg-card border border-border rounded-lg text-sm">
                    <SelectValue placeholder="Select a date" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-MY')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.date && <p className="text-xs text-[#D85A30] mt-1">{errors.date}</p>}
              </div>
              <div className="flex-1">
                <Label className="mb-1 block text-xs text-muted-foreground">Time</Label>
                <Select
                  value={form.time || undefined}
                  onValueChange={(value) => updateField('time', value)}
                  disabled={!form.date || loadingSlots}
                >
                  <SelectTrigger className="w-full bg-card border border-border rounded-lg text-sm disabled:opacity-60">
                    <SelectValue
                      placeholder={loadingSlots ? 'Loading...' : 'Select a time'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.time && <p className="text-xs text-[#D85A30] mt-1">{errors.time}</p>}
              </div>
            </div>

            <Textarea
              placeholder="Remarks (optional)"
              value={form.remarks}
              onChange={(e) => updateField('remarks', e.target.value)}
              rows={2}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm resize-none"
            />
          </div>

          {submitError && <p className="text-sm text-[#D85A30] mt-4">{submitError}</p>}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full mt-6 py-3.5 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-60"
          >
            {submitting ? 'Booking...' : 'Book now'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  placeholder,
  value,
  onChange,
  error,
  className = '',
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-card border border-border rounded-lg px-3 py-2.5 text-sm"
      />
      {error && <p className="text-xs text-[#D85A30] mt-1">{error}</p>}
    </div>
  );
}