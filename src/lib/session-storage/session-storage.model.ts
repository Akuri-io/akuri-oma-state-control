/**
 * Permanent configuration interface for selective state persistence
 * Used to define which properties should persist in localStorage, sessionStorage, or orchestrator
 */
export interface PermanentConfig {
  localStorage?: string[];  // Properties to persist in localStorage
  sessionStorage?: string[]; // Properties to persist in sessionStorage (not removed on exit)
  ido?: Record<string, string>; // Properties to transfer to orchestrator IDO
}

/**
 * Type helper to unwrap signal types
 * If T is a WritableSignal<V>, returns V, otherwise returns T
 */
export type UnwrapSignal<T> = T extends { (): infer V } ? V : T;

/**
 * SessionStorage service for OMA state management
 * Provides intelligent persistence for Angular Signals with selective storage
 */
export class SessionStorage<T extends object> {
  KEY_PREFIX = '';
  store: T;
  permanent?: PermanentConfig;

  constructor(prefix: string, store: T, permanent?: PermanentConfig) {
    this.KEY_PREFIX = prefix;
    this.store = store;
    this.permanent = permanent;
  }

  /**
   * Enhanced set method that handles both signals and regular values
   * For signals: extracts the value using () and updates the signal with .set()
   * For regular values: stores directly
   */
  set<K extends keyof T>(key: K, value: UnwrapSignal<T[K]>): void {
    const storeProperty = this.store[key];

    // Check if the property is a signal (has a 'set' method)
    if (storeProperty && typeof storeProperty === 'object' && 'set' in storeProperty && typeof (storeProperty as any).set === 'function') {
      // It's a signal - update the signal and store its value
      (storeProperty as any).set(value);
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(this.KEY_PREFIX + String(key), serializedValue);
    } else {
      // Regular property - store directly
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(this.KEY_PREFIX + String(key), serializedValue);
      this.store[key] = value as T[K];
    }
  }

  /**
   * Enhanced get method that handles both signals and regular values
   * For signals: returns the unwrapped value from the signal
   * For regular values: returns the value directly
   */
  get<K extends keyof T>(key: K, defaultValue?: UnwrapSignal<T[K]>): UnwrapSignal<T[K]> | null {
    const item = sessionStorage.getItem(this.KEY_PREFIX + String(key));
    if (item === null || item === undefined || item === 'undefined') {
      return defaultValue ?? null;
    }

    try {
      const parsedValue = JSON.parse(item);
      const storeProperty = this.store[key];

      // Check if the property is a signal
      if (storeProperty && typeof storeProperty === 'object' && 'set' in storeProperty && typeof (storeProperty as any).set === 'function') {
        // It's a signal - update the signal and return the value
        (storeProperty as any).set(parsedValue);
        return parsedValue;
      } else {
        // Regular property - store and return directly
        this.store[key] = parsedValue;
        return parsedValue;
      }
    } catch (error) {
      console.error('Error parsing stored data:', error);
      return defaultValue ?? null;
    }
  }

  remove<K extends keyof T>(key: K): void {
    sessionStorage.removeItem(this.KEY_PREFIX + String(key));
    delete this.store[key];
  }

  /**
   * Get all stored values
   * For signals: returns unwrapped values
   * For regular properties: returns values directly
   */
  getAll(): Partial<Record<keyof T, any>> {
    const result: Partial<Record<keyof T, any>> = {};
    const keys = Object.keys(this.store) as Array<keyof T>;
    keys.forEach((key) => {
      const value = this.get(key);
      if (value !== null) {
        result[key] = value;
      }
    });
    return result;
  }

  /**
   * Set all values from the store
   * For signals: extracts current values and stores them
   * For regular properties: stores directly
   */
  setAll(): void {
    const keys = Object.keys(this.store) as Array<keyof T>;
    keys.forEach((key) => {
      const storeProperty = this.store[key];

      // Check if it's a signal
      if (storeProperty && typeof storeProperty === 'object' && 'set' in storeProperty && typeof (storeProperty as any).set === 'function') {
        // It's a signal - get the current value
        const currentValue = (storeProperty as any)();
        this.set(key, currentValue);
      } else {
        // Regular property
        this.set(key, storeProperty as any);
      }
    });
  }

  removeAll(): void {
    // Clear all items with the prefix from sessionStorage
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.KEY_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
    // Clear the local store
    const storeKeys = Object.keys(this.store) as Array<keyof T>;
    storeKeys.forEach((key) => {
      delete this.store[key];
    });
  }

  /**
   * Enhanced exit method with selective persistence
   * Called when feature is destroyed (ngOnDestroy of entry component)
   * 
   * Behavior:
   * - If no permanent config: calls removeAll() (backward compatible)
   * - If permanent config exists:
   *   - localStorage properties: moved from sessionStorage to localStorage
   *   - sessionStorage properties: kept in sessionStorage (not removed)
   *   - ido properties: transferred to orchestrator and stored in localStorage
   *   - Other properties: removed as usual
   * 
   * @param orchestratorStorage - Optional orchestrator SessionStorage for IDO transfer
   */
  exit(orchestratorStorage?: SessionStorage<any>): void {
    // Backward compatibility: if no permanent config, use removeAll
    if (!this.permanent) {
      this.removeAll();
      return;
    }

    const { localStorage: localStorageKeys = [], sessionStorage: sessionStorageKeys = [], ido = {} } = this.permanent;

    // Get all current keys in sessionStorage with this prefix
    const allKeys = Object.keys(sessionStorage).filter(key => key.startsWith(this.KEY_PREFIX));

    allKeys.forEach((fullKey) => {
      const propertyKey = fullKey.replace(this.KEY_PREFIX, '');

      // Check if this property should be persisted in localStorage
      if (localStorageKeys.includes(propertyKey)) {
        const value = sessionStorage.getItem(fullKey);
        if (value !== null) {
          localStorage.setItem(fullKey, value);
        }
        sessionStorage.removeItem(fullKey);
      }
      // Check if this property should remain in sessionStorage
      else if (sessionStorageKeys.includes(propertyKey)) {
        console.warn(`${this.KEY_PREFIX}exit: Keeping '${propertyKey}' in sessionStorage`);
        // Do nothing - keep it in sessionStorage
      }
      // Otherwise, remove it
      else {
        sessionStorage.removeItem(fullKey);
        console.warn(`${this.KEY_PREFIX}exit: Removed '${propertyKey}' from sessionStorage`);
      }
    });

    // Process IDO properties - transfer to orchestrator
    if (Object.keys(ido).length > 0 && orchestratorStorage) {
      const idoData: Record<string, any> = {};

      Object.entries(ido).forEach(([stateProperty, idoProperty]) => {
        const value = this.get(stateProperty as keyof T);
        if (value !== null && value !== undefined) {
          idoData[idoProperty] = value;
          console.warn(`${this.KEY_PREFIX}exit: Prepared IDO property '${idoProperty}' from state '${stateProperty}'`);
        }
      });

      // Store IDO in orchestrator's localStorage
      if (Object.keys(idoData).length > 0) {
        const featureName = this.KEY_PREFIX.replace(/-$/, '').toLowerCase();
        const orchestratorIdoKey = `${orchestratorStorage.KEY_PREFIX}${featureName}Ido`;

        try {
          localStorage.setItem(orchestratorIdoKey, JSON.stringify(idoData));
        } catch (error) {
          console.error(`${this.KEY_PREFIX}exit: Error storing IDO in orchestrator:`, error);
        }
      }
    }

    // Clear the local store for non-persistent properties
    const storeKeys = Object.keys(this.store) as Array<keyof T>;
    storeKeys.forEach((key) => {
      const keyStr = String(key);
      if (!localStorageKeys.includes(keyStr) && !sessionStorageKeys.includes(keyStr)) {
        delete this.store[key];
      }
    });
  }

  /**
   * Initialize method that stores data based on the permanent configuration
   * Should be called when setting up the SessionStorage instance with persistence needs
   */
  init(orchestratorStorage?: SessionStorage<any>): void {
    if (!this.permanent) {
      console.warn(`${this.KEY_PREFIX}init: No permanent config defined, skipping initialization`);
      return;
    }

    const { localStorage: localStorageKeys = [], sessionStorage: sessionStorageKeys = [], ido = {} } = this.permanent;

    // Process localStorage properties
    localStorageKeys.forEach((key) => {
      const storeProperty = (this.store as any)[key];
      if (storeProperty !== undefined && storeProperty !== null) {
        const fullKey = this.KEY_PREFIX + key;

        // Check if it's a signal
        let valueToStore;
        if (storeProperty && typeof storeProperty === 'object' && 'set' in storeProperty && typeof (storeProperty as any).set === 'function') {
          // It's a signal - get the current value
          valueToStore = (storeProperty as any)();
        } else {
          // Regular property
          valueToStore = storeProperty;
        }

        try {
          const serializedValue = JSON.stringify(valueToStore);
          localStorage.setItem(fullKey, serializedValue);
        } catch (error) {
          console.error(`${this.KEY_PREFIX}init: Error storing '${key}' in localStorage:`, error);
        }
      }
    });

    // Process sessionStorage properties
    sessionStorageKeys.forEach((key) => {
      const storeProperty = (this.store as any)[key];

      if (storeProperty !== undefined && storeProperty !== null) {
        const fullKey = this.KEY_PREFIX + key;

        // Check if it's a signal
        let valueToStore;
        if (storeProperty && typeof storeProperty === 'object' && 'set' in storeProperty && typeof (storeProperty as any).set === 'function') {
          // It's a signal - get the current value
          valueToStore = (storeProperty as any)();
        } else {
          // Regular property
          valueToStore = storeProperty;
        }

        // Store even if the unwrapped value is null (but not if the property itself doesn't exist)
        try {
          const serializedValue = JSON.stringify(valueToStore);
          sessionStorage.setItem(fullKey, serializedValue);
        } catch (error) {
          console.error(`${this.KEY_PREFIX}init: Error storing '${key}' in sessionStorage:`, error);
        }
      } else {
        console.warn(`${this.KEY_PREFIX}init: Skipping '${key}' - property is undefined or null`);
      }
    });

    // Process IDO properties if orchestrator storage is provided
    if (Object.keys(ido).length > 0 && orchestratorStorage) {
      const idoData: Record<string, any> = {};

      Object.entries(ido).forEach(([stateProperty, idoProperty]) => {
        const storeProperty = (this.store as any)[stateProperty];
        if (storeProperty !== undefined && storeProperty !== null) {
          // Check if it's a signal
          let valueToStore;
          if (storeProperty && typeof storeProperty === 'object' && 'set' in storeProperty && typeof (storeProperty as any).set === 'function') {
            // It's a signal - get the current value
            valueToStore = (storeProperty as any)();
          } else {
            // Regular property
            valueToStore = storeProperty;
          }

          idoData[idoProperty] = valueToStore;
        }
      });

      // Store IDO in orchestrator's localStorage
      if (Object.keys(idoData).length > 0) {
        const featureName = this.KEY_PREFIX.replace(/-$/, '').toLowerCase();
        const orchestratorIdoKey = `${orchestratorStorage.KEY_PREFIX}${featureName}Ido`;

        try {
          localStorage.setItem(orchestratorIdoKey, JSON.stringify(idoData));
        } catch (error) {
          console.error(`${this.KEY_PREFIX}init: Error storing IDO in orchestrator:`, error);
        }
      }
    }
  }

  /**
   * Restore method to load persisted data on feature initialization
   * Should be called in entry component's ngOnInit
   * 
   * Loads data from:
   * - localStorage (for localStorage properties)
   * - sessionStorage (for sessionStorage properties)
   * - orchestrator localStorage (for IDO properties)
   */
  restore(orchestratorStorage?: SessionStorage<any>): void {
    if (!this.permanent) {
      console.warn(`${this.KEY_PREFIX}restore: No permanent config, skipping restore`);
      return;
    }
    const { localStorage: localStorageKeys = [], sessionStorage: sessionStorageKeys = [], ido = {} } = this.permanent;

    // Restore from localStorage
    localStorageKeys.forEach((key) => {
      const fullKey = this.KEY_PREFIX + key;
      const value = localStorage.getItem(fullKey);
      if (value !== null && value !== 'undefined') {
        try {
          sessionStorage.setItem(fullKey, value);
          const parsedValue = JSON.parse(value);
          (this.store as any)[key] = parsedValue;
        } catch (error) {
          console.error(`${this.KEY_PREFIX}restore: Error parsing localStorage value for '${key}':`, error);
        }
      }
    });

    // Restore from sessionStorage
    sessionStorageKeys.forEach((key) => {
      const fullKey = this.KEY_PREFIX + key;
      const value = sessionStorage.getItem(fullKey);
      if (value !== null && value !== 'undefined') {
        try {
          const parsedValue = JSON.parse(value);
          (this.store as any)[key] = parsedValue;
        } catch (error) {
          console.error(`${this.KEY_PREFIX}restore: Error parsing sessionStorage value for '${key}':`, error);
        }
      }
    });

    // Restore from orchestrator IDO
    if (Object.keys(ido).length > 0 && orchestratorStorage) {
      const featureName = this.KEY_PREFIX.replace(/-$/, '').toLowerCase();
      const orchestratorIdoKey = `${orchestratorStorage.KEY_PREFIX}${featureName}Ido`;

      try {
        const idoDataStr = localStorage.getItem(orchestratorIdoKey);
        if (idoDataStr && idoDataStr !== 'undefined') {
          const idoData = JSON.parse(idoDataStr);

          // Map IDO properties back to state properties
          Object.entries(ido).forEach(([stateProperty, idoProperty]) => {
            if (idoData[idoProperty] !== undefined) {
              (this.store as any)[stateProperty] = idoData[idoProperty];
              // Also store in sessionStorage
              const fullKey = this.KEY_PREFIX + stateProperty;
              sessionStorage.setItem(fullKey, JSON.stringify(idoData[idoProperty]));
            }
          });
        }
      } catch (error) {
        console.error(`${this.KEY_PREFIX}restore: Error restoring from orchestrator IDO:`, error);
      }
    }
  }
}