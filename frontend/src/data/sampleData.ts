import type { LocationRequest, VehicleRequest, DeliveryRequest } from '../types/optimization';

export const BHUBANESWAR_DEMO_DEPOT: LocationRequest = {
  id: 'DEPOT-1',
  latitude: 20.2961,
  longitude: 85.8245,
};

export const BHUBANESWAR_DEMO_VEHICLES: VehicleRequest[] = [
  { id: 'V1', capacity: 50 },
  { id: 'V2', capacity: 50 },
  { id: 'V3', capacity: 50 },
];

export const BHUBANESWAR_DEMO_JOBS: DeliveryRequest[] = [
  { id: 'D1', latitude: 20.3050, longitude: 85.8170, demand: 18, serviceDuration: 240, priority: 2 },
  { id: 'D2', latitude: 20.3160, longitude: 85.8260, demand: 16, serviceDuration: 300, priority: 2 },
  { id: 'D3', latitude: 20.2870, longitude: 85.8430, demand: 20, serviceDuration: 180, priority: 1 },
  { id: 'D4', latitude: 20.2700, longitude: 85.8330, demand: 14, serviceDuration: 300, priority: 3 },
  { id: 'D5', latitude: 20.3030, longitude: 85.8540, demand: 12, serviceDuration: 240, priority: 2 },
  { id: 'D6', latitude: 20.3290, longitude: 85.8070, demand: 17, serviceDuration: 360, priority: 2 },
  { id: 'D7', latitude: 20.2770, longitude: 85.8070, demand: 15, serviceDuration: 180, priority: 1 },
  { id: 'D8', latitude: 20.3220, longitude: 85.8480, demand: 10, serviceDuration: 240, priority: 3 },
  { id: 'D9', latitude: 20.2910, longitude: 85.7900, demand: 13, serviceDuration: 300, priority: 2 },
];
