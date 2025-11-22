import { Injectable } from '@angular/core';
import { signal, Signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SessionStorage, UnwrapSignal } from '../session-storage/session-storage.model';
import { OMAStateField, OMAPersistenceConfig } from '../utils/oma-state.types';

/**
 * Generic OMA State Control Service
 * Provides reactive state management for any feature using Angular Signals and RxJS
 */
@Injectable()
export class OMAStateControlService {
  private stateSubject$: BehaviorSubject<any>;
  public observableState$: Observable<any>;

  // The dynamic state object containing all signals
  state: any;
  prefix: string;
  storage: SessionStorage<any>;

  /**
   * Creates a new OMA State Control Service
   */
  constructor(
    featureName: string, 
    stateFields: OMAStateField[],
    persistenceConfig?: OMAPersistenceConfig
  ) {
    // Generate the state object with signals
    this.state = this.generateStateObject(stateFields);
    
    this.prefix = `${featureName.toUpperCase()}-`;
    this.storage = new SessionStorage(this.prefix, this.state, persistenceConfig);
    
    this.stateSubject$ = new BehaviorSubject<any>(this.state);
    this.observableState$ = this.stateSubject$.asObservable();
  }

  /**
   * Dynamically generate a state object with Angular Signals
   */
  private generateStateObject(stateFields: OMAStateField[]): any {
    const stateObj: any = {};

    stateFields.forEach(field => {
      // Create a signal for each field
      const fieldSignal = signal(field.initialValue);
      
      // Store the signal in the state object
      stateObj[field.name] = fieldSignal;
    });

    return stateObj;
  }

  /**
   * Set a value in the state with automatic persistence
   */
  set(key: string, value: any): void {
    // Set the signal value directly
    if (this.state[key] && typeof this.state[key].set === 'function') {
      this.state[key].set(value);
    } else {
      // Fallback for non-signal properties
      this.state[key] = value;
    }
    
    this.storage.set(key as any, value);
    this.notifyStateChange();
  }

  /**
   * Get a value from the state
   */
  get(key: string, defaultValue?: any): any {
    // Try to get from signal first
    if (this.state[key] && typeof this.state[key] === 'function') {
      return this.state[key]();
    }
    
    // Fallback to storage or default
    return this.storage.get(key as any, defaultValue);
  }

  /**
   * Get signal reference directly
   */
  getSignal(key: string): Signal<any> | null {
    return this.state[key] && typeof this.state[key].set === 'function' 
      ? this.state[key] 
      : null;
  }

  /**
   * Remove a value from the state
   */
  remove(key: string): void {
    this.storage.remove(key as any);
    this.notifyStateChange();
  }

  /**
   * Get the complete current state with signal values unwrapped
   */
  getState(): any {
    const unwrappedState: any = {};
    
    Object.keys(this.state).forEach(key => {
      const prop = this.state[key];
      if (typeof prop === 'function') {
        // It's a signal, unwrap it
        unwrappedState[key] = prop();
      } else {
        // Regular property
        unwrappedState[key] = prop;
      }
    });
    
    return unwrappedState;
  }

  /**
   * Update multiple state properties at once
   */
  updateState(partialState: Record<string, any>): void {
    Object.entries(partialState).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  /**
   * Reset state to initial values
   */
  reset(): void {
    this.storage.removeAll();
    this.notifyStateChange();
  }

  /**
   * Initialize persistence with optional orchestrator
   */
  init(orchestratorStorage?: SessionStorage<any>): void {
    this.storage.init(orchestratorStorage);
  }

  /**
   * Restore persisted data with optional orchestrator
   */
  restore(orchestratorStorage?: SessionStorage<any>): void {
    this.storage.restore(orchestratorStorage);
  }

  /**
   * Exit and clean up with selective persistence
   */
  exit(orchestratorStorage?: SessionStorage<any>): void {
    this.storage.exit(orchestratorStorage);
  }

  /**
   * Get all stored values
   */
  getAll(): Record<string, any> {
    return this.storage.getAll();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: any) => void): any {
    return this.observableState$.subscribe(callback);
  }

  /**
   * Notify subscribers of state change
   */
  private notifyStateChange(): void {
    this.stateSubject$.next(this.state);
  }

  /**
   * Create a feature-specific state service
   */
  static createFeatureService(
    featureName: string,
    stateFields: OMAStateField[],
    persistenceConfig?: OMAPersistenceConfig
  ): OMAStateControlService {
    return new OMAStateControlService(featureName, stateFields, persistenceConfig);
  }
}