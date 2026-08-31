export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
}

export type LocationType = 'home' | 'onsite';

export interface BookingFormData {
  customerName: string;
  customerPhone: string;
  locationType: LocationType;
  address: string; // required only when locationType === 'onsite'
  bikeCc: string;
  bikePlate: string;
  bikeModel: string;
  remarks: string;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
}

export const emptyBookingForm: BookingFormData = {
  customerName: '',
  customerPhone: '',
  locationType: 'home',
  address: '',
  bikeCc: '',
  bikePlate: '',
  bikeModel: '',
  remarks: '',
  date: '',
  time: '',
};