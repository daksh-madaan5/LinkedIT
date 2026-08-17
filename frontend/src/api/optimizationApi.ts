import type { OptimizationRequest, OptimizationResponse, ApiErrorResponse } from '../types/optimization';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export class ApiError extends Error {
  code: string;
  errors: string[];

  constructor(code: string, errors: string[]) {
    super(errors.join('; '));
    this.name = 'ApiError';
    this.code = code;
    this.errors = errors;
  }
}

export async function optimizeRoutes(request: OptimizationRequest): Promise<OptimizationResponse> {
  try {
    // Sanitize payload to match backend DTO strictly
    const sanitizedPayload = {
      depot: {
        id: request.depot.id,
        latitude: request.depot.latitude,
        longitude: request.depot.longitude,
      },
      vehicles: request.vehicles.map((v) => ({
        id: v.id,
        capacity: v.capacity,
        startLocation: v.startLocation
          ? {
              id: v.startLocation.id,
              latitude: v.startLocation.latitude,
              longitude: v.startLocation.longitude,
            }
          : undefined,
        endLocation: v.endLocation
          ? {
              id: v.endLocation.id,
              latitude: v.endLocation.latitude,
              longitude: v.endLocation.longitude,
            }
          : undefined,
      })),
      jobs: request.jobs.map((j) => ({
        id: j.id,
        latitude: j.latitude,
        longitude: j.longitude,
        demand: j.demand,
        serviceDuration: j.serviceDuration,
        priority: j.priority,
        timeWindow: j.timeWindow
          ? {
              start: j.timeWindow.start,
              end: j.timeWindow.end,
            }
          : undefined,
      })),
    };

    const response = await fetch(`${BASE_URL}/api/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(sanitizedPayload),
    });

    if (!response.ok) {
      let errorData: ApiErrorResponse;
      try {
        errorData = await response.json();
      } catch {
        if (response.status === 502) {
          throw new ApiError('ROUTING_PROVIDER_FAILED', [
            'Routing service unavailable. Please check if the OSRM server is running.'
          ]);
        }
        throw new ApiError('HTTP_ERROR', [`Server returned HTTP ${response.status}`]);
      }

      if (errorData.code === 'ROUTING_PROVIDER_FAILED') {
        throw new ApiError(
          'ROUTING_PROVIDER_FAILED',
          ['Routing service unavailable. Unable to calculate road routes right now. Please verify the OSRM server and try again.']
        );
      }

      throw new ApiError(errorData.code || 'OPTIMIZATION_FAILED', errorData.errors || ['Optimization request failed']);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new ApiError('CONNECTION_FAILED', [
        'Could not connect to the LinkedIT backend server at ' + BASE_URL + '. Please ensure the Spring Boot application is running.'
      ]);
    }
    throw new ApiError('UNKNOWN_ERROR', [(error as Error).message || 'An unexpected error occurred']);
  }
}
