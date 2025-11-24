/**
 * Type helper to unwrap signal types
 * If T is a WritableSignal<V>, returns V, otherwise returns T
 * Re-exported from session-storage for convenience and compatibility
 */
export type UnwrapSignal<T> = T extends { (): infer V } ? V : T;

/**
 * Configuration interface for OMA state field
 */
export interface OMAStateField {
  /** Name of the property (camelCase) */
  name: string;
  /** TypeScript type (including null if applicable) */
  type: string;
  /** Initial value that matches the type */
  initialValue: any;
  /** Optional import information for complex types */
  import?: string;
  /** Optional import path for the type */
  importPath?: string;
}

/**
 * Persistence configuration for OMA state management
 */
export interface OMAPersistenceConfig {
  /** Properties to persist in localStorage (survives browser restart) */
  localStorage?: string[];
  /** Properties to persist in sessionStorage (survives page navigation) */
  sessionStorage?: string[];
  /** Properties to transfer to orchestrator (IDO pattern) */
  ido?: Record<string, string>;
}

/**
 * Generic state interface for OMA state management
 */
export interface OMAState<T extends object> {
  /** The state object containing all signals */
  state: T;
  /** Observable for state changes */
  observableState$: any;
  /** Storage service for persistence */
  storage: any;
  /** Storage prefix for namespacing */
  prefix: string;
}

/**
 * OMA State Service interface
 */
export interface OMAStateService<T extends object> {
  /** Get current state */
  getState(): T;
  /** Set a specific state property */
  set<K extends keyof T>(key: K, value: any): void;
  /** Get a specific state property */
  get<K extends keyof T>(key: K, defaultValue?: any): any;
  /** Update multiple state properties */
  updateState(partialState: Partial<T>): void;
  /** Reset state to initial values */
  reset(): void;
  /** Subscribe to state changes */
  subscribe(callback: (state: T) => void): () => void;
}

/**
 * Vehicle-specific state interface example
 */
export interface VehicleState {
  vehicleData: any;
  vehicleList: any[];
  isLoading: boolean;
  selectedVehicle: any;
  validationErrors: any[];
  searchFilters: any;
  vehicleTypes: string[];
  currentLocation: any;
  fuelLevel: number;
  mileage: number;
  maintenanceSchedule: any[];
  availableVehicles: any[];
  bookingHistory: any[];
}

/**
 * Property-specific state interface example
 */
export interface PropertyState {
  propertyData: any;
  propertyList: any[];
  isLoading: boolean;
  selectedProperty: any;
  validationErrors: any[];
  searchFilters: any;
}

/**
 * User-specific state interface example
 */
export interface UserState {
  profile: any;
  phone: any;
  login: any;
  userList: any[];
  profileSync: any;
}

/**
 * Auth-specific state interface example
 */
export interface AuthState {
  profile: any;
  phone: any;
  login: any;
  userList: any[];
  profileSync: any;
}