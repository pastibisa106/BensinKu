export type FuelType = 'Pertalite' | 'Pertamax' | 'Pertamax Turbo' | 'Dexlite / Solar' | 'Shell / BP' | 'Lainnya';

export interface Vehicle {
  id: string;
  name: string;
  plateNumber?: string;
  kind: 'motor' | 'mobil';
  defaultFuelType: FuelType;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  liters: number;
  totalPrice: number; // IDR
  odometer: number; // km
  fuelType: FuelType;
  isFullTank: boolean;
  note?: string;
  createdAt: number;
}

export interface FuelLogWithMetrics extends FuelLog {
  pricePerLiter: number;
  distanceFromPrevKm: number | null;
  daysFromPrev: number | null;
  dailyCostFromPrev: number | null;
  segmentDistanceKm: number | null;
  segmentLiters: number | null;
  segmentCost: number | null;
  kmPerLiter: number | null;
  literPerKm: number | null;
  literPer100Km: number | null;
  costPerKm: number | null;
  isBaseline: boolean;
}

export interface MonthlyRecap {
  monthKey: string; // YYYY-MM
  monthLabel: string;
  shortLabel: string;
  totalSpent: number;
  totalLiters: number;
  totalDistanceKm: number;
  fillCount: number;
  avgPricePerLiter: number;
  avgKmPerLiter: number | null;
  avgLiterPerKm: number | null;
  avgLiterPer100Km: number | null;
  avgCostPerKm: number | null;
  avgDailyCost: number;
  daysCounted: number;
  daysInMonth: number;
  bestKmPerLiter: number | null;
  worstKmPerLiter: number | null;
  minOdometer: number | null;
  maxOdometer: number | null;
}

export interface DailyChartPoint {
  day: number;
  date: string;
  label: string;
  spentOnDay: number;
  litersOnDay: number;
  fillCountOnDay: number;
  runningDailyAvg: number;
  amortizedDailyCost: number;
}
