/**
 * Integration tests for PermanentConfig dual-compatibility
 * Tests that both interface and class patterns work interchangeably
 */

import { SessionStorage, PermanentConfig, PermanentConfigClass, IPermanentConfig } from './session-storage.model';

interface TestStore {
  user: any;
  profile: any;
  login: any;
}

describe('PermanentConfig Dual-Compatibility', () => {
  
  beforeEach(() => {
    // Clear localStorage and sessionStorage before each test
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any mock orchestrator data
    (window as any).__ORCHESTRATOR_DATA__ = {};
  });

  describe('Type Compatibility', () => {
    
    it('should accept PermanentConfig type as IPermanentConfig', () => {
      // Test that PermanentConfig (type alias) works with IPermanentConfig
      const config: IPermanentConfig = {
        localStorage: ['login'],
        sessionStorage: ['profile'],
        ido: { user: 'user' }
      };
      
      expect(config.localStorage).toEqual(['login']);
      expect(config.sessionStorage).toEqual(['profile']);
      expect(config.ido).toEqual({ user: 'user' });
    });

    it('should accept PermanentConfigClass as PermanentConfig', () => {
      // Test that PermanentConfigClass can be used as PermanentConfig
      const classConfig = new PermanentConfigClass({
        localStorage: ['login'],
        sessionStorage: ['profile']
      });
      
      const interfaceConfig: PermanentConfig = classConfig;
      
      expect(interfaceConfig.localStorage).toEqual(['login']);
      expect(interfaceConfig.sessionStorage).toEqual(['profile']);
    });

    it('should work with SessionStorage constructor using interface pattern', () => {
      const store = { user: null, profile: null, login: null };
      const config: IPermanentConfig = {
        localStorage: ['login'],
        sessionStorage: ['profile']
      };
      
      const storage = new SessionStorage('test:', store, config);
      
      expect(storage.permanent).toEqual(config);
    });

    it('should work with SessionStorage constructor using class pattern', () => {
      const store = { user: null, profile: null, login: null };
      const config = new PermanentConfigClass({
        localStorage: ['login'],
        sessionStorage: ['profile']
      });
      
      const storage = new SessionStorage('test:', store, config);
      
      expect(storage.permanent).toBe(config);
      expect(storage.permanent!.localStorage).toEqual(['login']);
      expect(storage.permanent!.sessionStorage).toEqual(['profile']);
    });

    it('should handle blueprint-style static class extension', () => {
      // Simulate blueprint pattern: class extending PermanentConfig
      class MyBlueprintConfig extends PermanentConfigClass {
        static localStorage = ['login'];
        static sessionStorage = ['profile', 'user'];
        static ido = { user: 'user' };
      }
      
      // Create instance with static properties
      const instanceConfig = new MyBlueprintConfig({
        localStorage: (MyBlueprintConfig as any).localStorage,
        sessionStorage: (MyBlueprintConfig as any).sessionStorage,
        ido: (MyBlueprintConfig as any).ido
      });
      
      expect(instanceConfig.localStorage).toEqual(['login']);
      expect(instanceConfig.sessionStorage).toEqual(['profile', 'user']);
      expect(instanceConfig.ido).toEqual({ user: 'user' });
    });

    it('should support mixed usage patterns in same application', () => {
      const store = { user: null, profile: null, login: null };
      
      // Library pattern using interface
      const interfaceConfig: IPermanentConfig = {
        localStorage: ['login'],
        sessionStorage: ['profile']
      };
      
      const libraryStorage = new SessionStorage('lib:', store, interfaceConfig);
      
      // Blueprint pattern using class
      class BlueprintConfig extends PermanentConfigClass {
        static sessionStorage = ['user'];
        static ido = { profile: 'profile' };
      }
      
      const blueprintConfig = new BlueprintConfig({
        sessionStorage: (BlueprintConfig as any).sessionStorage,
        ido: (BlueprintConfig as any).ido
      });
      
      const blueprintStorage = new SessionStorage('bp:', store, blueprintConfig);
      
      // Both should work correctly
      expect(libraryStorage.permanent?.localStorage).toEqual(['login']);
      expect(blueprintStorage.permanent?.sessionStorage).toEqual(['user']);
      expect(blueprintStorage.permanent?.ido).toEqual({ profile: 'profile' });
    });
  });

  describe('Runtime Compatibility', () => {
    
    it('should persist data correctly with interface pattern', () => {
      const store = { 
        user: { name: 'John', id: 1 }, 
        profile: { avatar: 'avatar.jpg' }, 
        login: { token: 'abc123' } 
      };
      
      const config: IPermanentConfig = {
        localStorage: ['login'],
        sessionStorage: ['profile']
      };
      
      const storage = new SessionStorage('test:', store, config);
      
      // Set values
      storage.set('user', { name: 'Jane', id: 2 });
      storage.set('profile', { avatar: 'new-avatar.jpg' });
      storage.set('login', { token: 'xyz789' });
      
      // Verify storage
      expect(localStorage.getItem('test:login')).toBe('{"token":"xyz789"}');
      expect(sessionStorage.getItem('test:profile')).toBe('{"avatar":"new-avatar.jpg"');
      expect(sessionStorage.getItem('test:user')).toBe('{"name":"Jane","id":2}');
    });

    it('should persist data correctly with class pattern', () => {
      const store = { 
        user: { name: 'John', id: 1 }, 
        profile: { avatar: 'avatar.jpg' }, 
        login: { token: 'abc123' } 
      };
      
      const config = new PermanentConfigClass({
        localStorage: ['login'],
        sessionStorage: ['profile']
      });
      
      const storage = new SessionStorage('test:', store, config);
      
      // Set values
      storage.set('user', { name: 'Jane', id: 2 });
      storage.set('profile', { avatar: 'new-avatar.jpg' });
      storage.set('login', { token: 'xyz789' });
      
      // Verify storage
      expect(localStorage.getItem('test:login')).toBe('{"token":"xyz789"}');
      expect(sessionStorage.getItem('test:profile')).toBe('{"avatar":"new-avatar.jpg"');
    });

    it('should restore data correctly with both patterns', () => {
      const store = { 
        user: null, 
        profile: null, 
        login: null 
      };
      
      // Pre-populate storage
      localStorage.setItem('test:login', '{"token":"restored-token"}');
      sessionStorage.setItem('test:profile', '{"avatar":"restored-avatar.jpg"}');
      sessionStorage.setItem('test:user', '{"name":"Restored User","id":999}');
      
      const config: IPermanentConfig = {
        localStorage: ['login'],
        sessionStorage: ['profile']
      };
      
      const storage = new SessionStorage('test:', store, config);
      storage.restore();
      
      // Verify restoration worked
      expect(store.profile).toEqual({ avatar: 'restored-avatar.jpg' });
      expect(store.login).toEqual({ token: 'restored-token' });
    });
  });

  describe('Backward Compatibility', () => {
    
    it('should work with existing code expecting PermanentConfig interface', () => {
      function processConfig(config: PermanentConfig) {
        return {
          hasLocal: !!(config.localStorage && config.localStorage.length > 0),
          hasSession: !!(config.sessionStorage && config.sessionStorage.length > 0),
          hasIdo: !!(config.ido && Object.keys(config.ido).length > 0)
        };
      }
      
      // Test with interface pattern
      const interfaceConfig: PermanentConfig = {
        localStorage: ['user'],
        sessionStorage: ['session'],
        ido: { data: 'value' }
      };
      
      const result1 = processConfig(interfaceConfig);
      expect(result1.hasLocal).toBe(true);
      expect(result1.hasSession).toBe(true);
      expect(result1.hasIdo).toBe(true);
      
      // Test with class pattern
      const classConfig = new PermanentConfigClass({
        localStorage: ['user'],
        sessionStorage: ['session'],
        ido: { data: 'value' }
      });
      
      const result2 = processConfig(classConfig);
      expect(result2.hasLocal).toBe(true);
      expect(result2.hasSession).toBe(true);
      expect(result2.hasIdo).toBe(true);
    });
  });
});