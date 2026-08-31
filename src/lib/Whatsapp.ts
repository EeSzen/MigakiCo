import type { BookingFormData, Service } from './Service';

// Replace with your actual business WhatsApp number, in international
// format without '+' or spaces, e.g. Malaysia: 60123456789
const BUSINESS_WHATSAPP_NUMBER = '60102397399';

export function buildWhatsAppLink(
  form: BookingFormData,
  selectedServices: Service[]
): string {
  const serviceNames = selectedServices.map((s) => s.name).join(', ');
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const locationLine =
    form.locationType === 'onsite'
      ? `On-site at: ${form.address}`
      : 'Reservation at Migaki (customer drop-off)';

  const lines = [
    'New booking request \u2014 Migaki',
    '',
    `Name: ${form.customerName}`,
    `Phone: ${form.customerPhone}`,
    `Service(s): ${serviceNames}`,
    `Estimated total: RM ${totalPrice.toFixed(2)}`,
    locationLine,
    `Bike: ${form.bikeModel} (${form.bikeCc}cc)`,
    `Plate: ${form.bikePlate}`,
    `Date: ${form.date}`,
    `Time: ${form.time}`,
  ];

  if (form.remarks.trim()) {
    lines.push(`Remarks: ${form.remarks.trim()}`);
  }

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${text}`;
}