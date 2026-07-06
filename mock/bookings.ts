import { Booking } from '../types';

export const mockBookings: Booking[] = [
  {
    id: "booking_1",
    shopName: "Vanguardia Barbería",
    service: "Corte de Cabello Premium",
    date: "2026-07-02",
    time: "10:15",
    userId: "mock-user-owner",
    createdAt: "2026-06-30T09:00:00Z"
  },
  {
    id: "booking_2",
    shopName: "Vanguardia Barbería",
    service: "Barba & Toalla Caliente",
    date: "2026-07-03",
    time: "14:00",
    userId: "mock-user-owner",
    createdAt: "2026-06-30T09:15:00Z"
  }
];
