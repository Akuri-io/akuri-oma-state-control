/**
 * Permanent configuration interface for selective state persistence
 * Used to define which properties should persist in localStorage, sessionStorage, or orchestrator
 * 
 * DUAL-COMPATIBILITY DESIGN:
 * This interface supports both interface-based and class-based usage patterns
 * for full compatibility between blueprint and library implementations.
 */
export interface IPermanentConfig {
  localStorage?: string[];  // Properties to persist in localStorage
  sessionStorage?: string[]; // Properties to persist in sessionStorage (not removed on exit)
  ido?: Record<string, string>; // Properties to transfer to orchestrator IDO
}

/**
 * Dual-compatibility PermanentConfig class implementation
 * 
 * This class implements the PermanentConfig interface and provides
 * both interface-based usage (constructor with options) and
 * class-based usage (static/class properties) for complete compatibility
 * with blueprint implementations that use static class properties.
 * 
 * USAGE PATTERNS:
 * 
 * 1. Interface Pattern (Library Style):
 *    new PermanentConfig({ localStorage: ['user'], sessionStorage: ['profile'] })
 * 
 * 2. Class Pattern (Blueprint Style):
 *    class MyConfig extends PermanentConfig {
 *      static localStorage = ['user'];
 *      static sessionStorage = ['profile'];
 *    }
 */
export class PermanentConfigImpl implements IPermanentConfig {
  localStorage?: string[];
  sessionStorage?: string[];
  ido?: Record<string, string>;
  
  /**
   * Constructor for interface-style usage
   * @param config Optional configuration object
   */
  constructor(config?: IPermanentConfig) {
    if (config) {
      this.localStorage = config.localStorage;
      this.sessionStorage = config.sessionStorage;
      this.ido = config.ido;
    }
  }
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
  permanent?: IPermanentConfig;

  constructor(prefix: string, store: T, permanent?: IPermanentConfig) {
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

    // Handle permanent storage configuration
    this.handlePermanentStorage(key, value);
  }

  /**
   * Restore all stored data from sessionStorage and orchestrator
   */
  restore(): void {
    // Restore sessionStorage properties
    for (const key of Object.keys(this.store)) {
      const storageKey = this.KEY_PREFIX + key;
      const storedValue = sessionStorage.getItem(storageKey);
      
      if (storedValue !== null) {
        try {
          const parsedValue = JSON.parse(storedValue);
          
          // Check if the property is a signal (has a 'set' method)
          const storeProperty = this.store[key as keyof T];
          if (storeProperty && typeof storeProperty === 'object' && 'set' in storeProperty && typeof (storeProperty as any).set === 'function') {
            // It's a signal - update the signal with the restored value
            (storeProperty as any).set(parsedValue);
          } else {
            // Regular property - restore directly
            this.store[key as keyof T] = parsedValue as T[keyof T];
          }
        } catch (error) {
          console.error(`Failed to restore ${key} from sessionStorage:`, error);
        }
      }
    }
    
    // **CRITICAL FIX: Restore sessionStorage properties defined in permanent config**
    if (this.permanent?.sessionStorage) {
      for (const key of this.permanent.sessionStorage) {
        const storageKey = this.KEY_PREFIX + key;
        const storedValue = sessionStorage.getItem(storageKey);
        
        if (storedValue !== null) {
          try {
            const parsedValue = JSON.parse(storedValue);
            
            // Check if the property is a signal (has a 'set' method)
            const storeProperty = this.store[key as keyof T];
            if (storeProperty && typeof storeProperty === 'object' && 'set' in storeProperty && typeof (storeProperty as any).set === 'function') {
              // It's a signal - update the signal with the restored value
              (storeProperty as any).set(parsedValue);
            } else {
              // Regular property - restore directly
              this.store[key as keyof T] = parsedValue as T[keyof T];
            }
            
            console.log(`✅ Restored sessionStorage['${key}']`);
          } catch (error) {
            console.error(`Failed to restore ${key} from sessionStorage:`, error);
          }
        }
      }
    }

    // Restore localStorage properties
    if (this.permanent?.localStorage) {
      for (const key of this.permanent.localStorage) {
        const storageKey = this.KEY_PREFIX + key;
        const storedValue = localStorage.getItem(storageKey);
        
        if (storedValue !== null) {
          try {
            const parsedValue = JSON.parse(storedValue);
            
            // Check if the property is a signal (has a 'set' method)
            const storeProperty = this.store[key as keyof T];
            if (storeProperty && typeof storeProperty === 'object' && 'set' in storeProperty && typeof (storeProperty as any).set === 'function') {
              // It's a signal - update the signal with the restored value
              (storeProperty as any).set(parsedValue);
            } else {
              // Regular property - restore directly
              this.store[key as keyof T] = parsedValue as T[keyof T];
            }
            
            console.log(`✅ Restored localStorage['${key}']`);
          } catch (error) {
            console.error(`Failed to restore ${key} from localStorage:`, error);
          }
        }
      }
    }

    // Restore orchestrator IDO properties
    if (this.permanent?.ido) {
      for (const [propertyKey, iddKey] of Object.entries(this.permanent.ido)) {
        try {
          // Simulate orchestrator IDO access - in real implementation, this would access the orchestrator
          const orchestratorData = this.getOrchestratorData();
          const iddValue = orchestratorData[iddKey];
          
          if (iddValue !== undefined) {
            // Check if the property is a signal (has a 'set' method)
            const storeProperty = this.store[propertyKey as keyof T];
            if (storeProperty && typeof storeProperty === 'object' && 'set' in storeProperty && typeof (storeProperty as any).set === 'function') {
              // It's a signal - update the signal with the restored value
              (storeProperty as any).set(iddValue);
            } else {
              // Regular property - restore directly
              this.store[propertyKey as keyof T] = iddValue as T[keyof T];
            }
            
            console.log(`✅ Restored IDO['${iddKey}']`);
          }
        } catch (error) {
          console.error(`Failed to restore ${propertyKey} from orchestrator:`, error);
        }
      }
    }
  }

  /**
   * Get all stored keys for this session
   */
  getStoredKeys(): string[] {
    const keys: string[] = [];
    const prefixLength = this.KEY_PREFIX.length;
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.KEY_PREFIX)) {
        keys.push(key.substring(prefixLength));
      }
    }
    
    return keys;
  }

  /**
   * Clear all stored data for this session
   */
  clear(): void {
    const storedKeys = this.getStoredKeys();
    
    for (const key of storedKeys) {
      const storageKey = this.KEY_PREFIX + key;
      sessionStorage.removeItem(storageKey);
    }
    
    console.log(`🗑️ Cleared ${storedKeys.length} stored keys`);
  }

  /**
   * Private method to handle permanent storage based on configuration
   */
  private handlePermanentStorage<K extends keyof T>(key: K, value: UnwrapSignal<T[K]>): void {
    if (!this.permanent) return;

    // Handle localStorage
    if (this.permanent.localStorage && this.permanent.localStorage.includes(String(key))) {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.KEY_PREFIX + String(key), serializedValue);
      console.log(`💾 Persisted ${String(key)} to localStorage`);
    }

    // Handle sessionStorage - already handled in set method
    
    // Handle orchestrator IDO
    if (this.permanent.ido && this.permanent.ido[String(key)]) {
      const orchestratorKey = this.permanent.ido[String(key)];
      this.setOrchestratorData(orchestratorKey, value);
      console.log(`🔄 Transferred ${String(key)} to orchestrator IDO as '${String(orchestratorKey)}'`);
    }
  }

  /**
   * Get a value from sessionStorage by key
   * @param key The key to retrieve
   * @param defaultValue Default value if key not found
   */
  get<K extends keyof T>(key: K, defaultValue?: UnwrapSignal<T[K]>): UnwrapSignal<T[K]> | undefined {
    const storageKey = this.KEY_PREFIX + String(key);
    const storedValue = sessionStorage.getItem(storageKey);
    
    if (storedValue === null) {
      return defaultValue;
    }
    
    try {
      return JSON.parse(storedValue) as UnwrapSignal<T[K]>;
    } catch (error) {
      console.error(`Failed to parse stored value for ${String(key)}:`, error);
      return defaultValue;
    }
  }

  /**
   * Remove a value from sessionStorage by key
   * @param key The key to remove
   */
  remove<K extends keyof T>(key: K): void {
    const storageKey = this.KEY_PREFIX + String(key);
    sessionStorage.removeItem(storageKey);
  }

  /**
   * Remove all values for this session
   */
  removeAll(): void {
    this.clear();
  }

  /**
   * Get all stored values
   */
  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const key of Object.keys(this.store)) {
      const value = this.get(key as keyof T);
      if (value !== undefined) {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Initialize storage (for backward compatibility)
   * @param orchestratorStorage Orchestrator storage data (ignored in this implementation)
   */
  init(orchestratorStorage?: any): void {
    // Restore data on initialization
    this.restore();
  }

  /**
   * Exit/cleanup storage (for backward compatibility)
   * @param orchestratorStorage Orchestrator storage data (ignored in this implementation)
   */
  exit(orchestratorStorage?: any): void {
    // Cleanup if needed
    this.clear();
  }

  /**
   * Simulate setting orchestrator data
   * In real implementation, this would interface with the orchestrator
   */
  private setOrchestratorData(key: string, value: any): void {
    // Simulate orchestrator storage
    (window as any).__ORCHESTRATOR_DATA__ = (window as any).__ORCHESTRATOR_DATA__ || {};
    (window as any).__ORCHESTRATOR_DATA__[key] = value;
  }

  /**
   * Simulate getting orchestrator data
   * In real implementation, this would interface with the orchestrator
   */
  private getOrchestratorData(): Record<string, any> {
    return (window as any).__ORCHESTRATOR_DATA__ || {};
  }
}

// COMPATIBILITY EXPORTS
// These exports enable both interface and class usage patterns for seamless interoperability

// Type alias for backward compatibility with existing code
export type { IPermanentConfig as PermanentConfig };

// Class alias for blueprint compatibility
export { PermanentConfigImpl as PermanentConfigClass };

// Constants for static usage (blueprint compatibility)
export const PERMANENT_CONFIG_DEFAULTS = {
  localStorage: [] as string[],
  sessionStorage: [] as string[],
  ido: {} as Record<string, string>
};