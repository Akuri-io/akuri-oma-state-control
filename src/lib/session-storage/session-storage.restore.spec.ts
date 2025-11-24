/**
 * Test suite for SessionStorage restore functionality
 * Tests the fixed sessionStorageKeys restoration logic
 */

import { SessionStorage, PermanentConfig, PermanentConfigClass, IPermanentConfig } from './session-storage.model';

describe('SessionStorage Restore Functionality', () => {
  let sessionStorageMock: Map<string, string>;
  let localStorageMock: Map<string, string>;
  let store: any;
  let storage: SessionStorage<any>;

  beforeEach(() => {
    // Mock browser storage
    sessionStorageMock = new Map();
    localStorageMock = new Map();

    // Mock global storage objects
    (global as any).sessionStorage = {
      getItem: (key: string) => sessionStorageMock.get(key) || null,
      setItem: (key: string, value: string) => sessionStorageMock.set(key, value),
      removeItem: (key: string) => sessionStorageMock.delete(key)
    };

    (global as any).localStorage = {
      getItem: (key: string) => localStorageMock.get(key) || null,
      setItem: (key: string, value: string) => localStorageMock.set(key, value),
      removeItem: (key: string) => localStorageMock.delete(key)
    };

    // Create test store with signals
    store = {
      profile: {
        set: jest.fn(),
        subscribe: jest.fn()
      },
      phone: {
        set: jest.fn(),
        subscribe: jest.fn()
      },
      login: {
        set: jest.fn(),
        subscribe: jest.fn()
      }
    };
  });

  describe('restore() method with complete persistence config', () => {
    it('should restore sessionStorage properties correctly', () => {
      // Arrange
      const config: PermanentConfig = {
        sessionStorage: ['profile', 'phone'],
        localStorage: ['login']
      };

      storage = new SessionStorage('AUTH-', store, config);

      // Pre-populate sessionStorage with test data
      const testProfile = { id: 1, name: 'Test User' };
      const testPhone = { number: '+1234567890' };
      
      sessionStorageMock.set('AUTH-profile', JSON.stringify(testProfile));
      sessionStorageMock.set('AUTH-phone', JSON.stringify(testPhone));

      // Act
      storage.restore();

      // Assert - verify sessionStorage properties were restored
      expect(store.profile.set).toHaveBeenCalledWith(testProfile);
      expect(store.phone.set).toHaveBeenCalledWith(testPhone);
    });

    it('should restore localStorage properties correctly', () => {
      // Arrange
      const config: PermanentConfig = {
        sessionStorage: ['profile'],
        localStorage: ['login']
      };

      storage = new SessionStorage('AUTH-', store, config);

      // Pre-populate localStorage with test data
      const testLogin = { token: 'abc123', expires: Date.now() + 3600000 };
      
      localStorageMock.set('AUTH-login', JSON.stringify(testLogin));

      // Act
      storage.restore();

      // Assert - verify localStorage property was restored to sessionStorage and store
      expect(sessionStorageMock.get('AUTH-login')).toBe(JSON.stringify(testLogin));
      expect(store.login.set).toHaveBeenCalledWith(testLogin);
    });

    it('should restore IDO properties with orchestrator', () => {
      // Arrange
      const config: PermanentConfig = {
        sessionStorage: ['profile'],
        ido: { login: 'userTokens' }
      };

      storage = new SessionStorage('AUTH-', store, config);
      
      // Mock orchestrator storage
      const orchestratorStorage = {
        KEY_PREFIX: 'ORCH-',
        get: jest.fn(),
        set: jest.fn()
      } as any;

      // Pre-populate orchestrator IDO data
      const testTokens = { accessToken: 'xyz789', refreshToken: 'refresh123' };
      localStorageMock.set('ORCH-authIdo', JSON.stringify(testTokens));

      // Act
      storage.restore();

      // Assert - verify IDO properties were restored
      expect(store.login.set).toHaveBeenCalledWith(testTokens);
      expect(sessionStorageMock.get('AUTH-login')).toBe(JSON.stringify(testTokens));
    });

    it('should handle all storage types in correct order', () => {
      // Arrange
      const config: PermanentConfig = {
        localStorage: ['login'],
        sessionStorage: ['profile', 'phone'],
        ido: { phone: 'userPhones' }
      };

      storage = new SessionStorage('AUTH-', store, config);

      // Mock orchestrator
      const orchestratorStorage = {
        KEY_PREFIX: 'ORCH-',
        get: jest.fn(),
        set: jest.fn()
      } as any;

      // Pre-populate all storage types
      const testLogin = { token: 'local123' };
      const testProfile = { id: 2, name: 'Local User' };
      const testPhone = { number: '+9876543210' };
      const testPhones = { main: '+1111111111', work: '+2222222222' };

      localStorageMock.set('AUTH-login', JSON.stringify(testLogin));
      sessionStorageMock.set('AUTH-profile', JSON.stringify(testProfile));
      sessionStorageMock.set('AUTH-phone', JSON.stringify(testPhone));
      localStorageMock.set('ORCH-authIdo', JSON.stringify(testPhones));

      // Clear mock calls
      jest.clearAllMocks();

      // Act
      storage.restore();

      // Assert - verify all properties restored in correct order
      expect(store.login.set).toHaveBeenCalledWith(testLogin);
      expect(store.profile.set).toHaveBeenCalledWith(testProfile);
      
      // IDO should override sessionStorage value
      expect(store.phone.set).toHaveBeenCalledWith(testPhones);
    });
  });

  describe('restore() error handling', () => {
    it('should handle JSON parsing errors gracefully', () => {
      // Arrange
      const config: PermanentConfig = {
        sessionStorage: ['profile']
      };

      storage = new SessionStorage('AUTH-', store, config);

      // Pre-populate with invalid JSON
      sessionStorageMock.set('AUTH-profile', '{invalid json}');

      // Spy on console.error to verify error handling
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      storage.restore();

      // Assert - should handle error gracefully
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error parsing sessionStorage value for \'profile\'')
      );
      expect(store.profile.set).not.toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should skip undefined/null values', () => {
      // Arrange
      const config: PermanentConfig = {
        sessionStorage: ['profile']
      };

      storage = new SessionStorage('AUTH-', store, config);

      // Pre-populate with undefined/null values
      sessionStorageMock.set('AUTH-profile', 'undefined');
      sessionStorageMock.set('AUTH-phone', 'null');

      // Act
      storage.restore();

      // Assert - should skip these values
      expect(store.profile.set).not.toHaveBeenCalled();
      expect(store.phone.set).not.toHaveBeenCalled();
    });
  });

  describe('restore() without permanent config', () => {
    it('should skip restoration when no permanent config', () => {
      // Arrange
      storage = new SessionStorage('AUTH-', store);

      // Act
      storage.restore();

      // Assert - should do nothing and warn
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No permanent config, skipping restore')
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Data Loss Prevention', () => {
    it('should prevent data loss for sessionStorage properties', () => {
      // Arrange
      const config: PermanentConfig = {
        sessionStorage: ['profile', 'phone', 'login']
      };

      storage = new SessionStorage('AUTH-', store, config);

      // Pre-populate with substantial test data
      const complexProfile = {
        id: 123,
        name: 'John Doe',
        email: 'john@example.com',
        preferences: {
          theme: 'dark',
          notifications: true,
          language: 'en'
        },
        createdAt: new Date(),
        lastLogin: new Date()
      };

      const complexPhone = {
        primary: '+1234567890',
        secondary: '+0987654321',
        verified: true,
        verificationDate: new Date()
      };

      const complexLogin = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'refresh_token_abc123',
        expires: Date.now() + 3600000,
        scopes: ['read', 'write', 'admin']
      };

      sessionStorageMock.set('AUTH-profile', JSON.stringify(complexProfile));
      sessionStorageMock.set('AUTH-phone', JSON.stringify(complexPhone));
      sessionStorageMock.set('AUTH-login', JSON.stringify(complexLogin));

      // Clear mock calls
      jest.clearAllMocks();

      // Act - simulate application reload
      storage.restore();

      // Assert - all complex data should be restored without loss
      expect(store.profile.set).toHaveBeenCalledWith(complexProfile);
      expect(store.phone.set).toHaveBeenCalledWith(complexPhone);
      expect(store.login.set).toHaveBeenCalledWith(complexLogin);

      // Verify all nested properties preserved
      const restoredProfile = store.profile.set.mock.calls[0][0];
      expect(restoredProfile.preferences.theme).toBe('dark');
      expect(restoredProfile.preferences.notifications).toBe(true);

      const restoredPhone = store.phone.set.mock.calls[0][0];
      expect(restoredPhone.primary).toBe('+1234567890');
      expect(restoredPhone.verified).toBe(true);

      const restoredLogin = store.login.set.mock.calls[0][0];
      expect(restoredLogin.scopes).toContain('read');
      expect(restoredLogin.scopes).toContain('write');
      expect(restoredLogin.scopes).toContain('admin');
    });
  });
});