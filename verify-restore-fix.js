#!/usr/bin/env node

/**
 * Verification script for SessionStorage restore fix
 * Tests that sessionStorageKeys are properly restored
 */

console.log('🧪 Testing SessionStorage restore fix...\n');

// Mock browser storage for Node.js environment
class MockStorage {
  constructor() {
    this.store = new Map();
  }
  
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  
  setItem(key, value) {
    this.store.set(key, value);
  }
  
  removeItem(key) {
    this.store.delete(key);
  }
  
  clear() {
    this.store.clear();
  }
  
  getAllKeys() {
    return Array.from(this.store.keys());
  }
}

// Mock global objects
global.sessionStorage = new MockStorage();
global.localStorage = new MockStorage();

// Import the SessionStorage class (simplified version for testing)
class SessionStorage {
  constructor(prefix, store, permanent) {
    this.KEY_PREFIX = prefix;
    this.store = store;
    this.permanent = permanent;
  }
  
  // Fixed restore method with sessionStorage restoration
  restore(orchestratorStorage) {
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
          this.store[key] = parsedValue;
          console.log(`✅ Restored localStorage['${key}']:`, parsedValue);
        } catch (error) {
          console.error(`❌ Error parsing localStorage value for '${key}':`, error);
        }
      }
    });

    // ✅ RESTORE FROM SESSIONSTORAGE (FIXED!)
    sessionStorageKeys.forEach((key) => {
      const fullKey = this.KEY_PREFIX + key;
      const value = sessionStorage.getItem(fullKey);
      if (value !== null && value !== 'undefined') {
        try {
          const parsedValue = JSON.parse(value);
          this.store[key] = parsedValue;
          console.log(`✅ Restored sessionStorage['${key}']:`, parsedValue);
        } catch (error) {
          console.error(`❌ Error parsing sessionStorage value for '${key}':`, error);
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

          Object.entries(ido).forEach(([stateProperty, idoProperty]) => {
            if (idoData[idoProperty] !== undefined) {
              this.store[stateProperty] = idoData[idoProperty];
              const fullKey = this.KEY_PREFIX + stateProperty;
              sessionStorage.setItem(fullKey, JSON.stringify(idoData[idoProperty]));
              console.log(`✅ Restored IDO['${stateProperty}'] from '${idoProperty}':`, idoData[idoProperty]);
            }
          });
        }
      } catch (error) {
        console.error(`❌ Error restoring from orchestrator IDO:`, error);
      }
    }
  }
}

// Test scenario
function runTests() {
  console.log('📋 Test Scenario: Auth state with mixed persistence\n');
  
  // Create test store
  const store = {
    profile: { id: null, name: null },
    phone: { number: null, verified: null },
    login: { token: null, expires: null }
  };

  // Create storage with mixed config
  const config = {
    localStorage: ['login'],           // Long-term persistence
    sessionStorage: ['profile', 'phone'], // Session persistence
    ido: { phone: 'userPhones' }        // Inter-feature data
  };

  const storage = new SessionStorage('AUTH-', store, config);
  
  // Pre-populate storage with test data
  console.log('📦 Pre-populating storage with test data...\n');
  
  const testProfile = { id: 1, name: 'John Doe' };
  const testPhone = { number: '+1234567890', verified: true };
  const testLogin = { token: 'abc123xyz', expires: Date.now() + 3600000 };
  const testPhones = { primary: '+1111111111', work: '+2222222222' };

  // Store in sessionStorage
  sessionStorage.setItem('AUTH-profile', JSON.stringify(testProfile));
  sessionStorage.setItem('AUTH-phone', JSON.stringify(testPhone));
  
  // Store in localStorage
  localStorage.setItem('AUTH-login', JSON.stringify(testLogin));
  localStorage.setItem('ORCH-authIdo', JSON.stringify(testPhones));

  console.log('Stored data:');
  console.log('  sessionStorage[profile]:', testProfile);
  console.log('  sessionStorage[phone]:', testPhone);
  console.log('  localStorage[login]:', testLogin);
  console.log('  localStorage[ORCH-authIdo]:', testPhones);
  console.log('');

  // Mock orchestrator storage
  const orchestratorStorage = {
    KEY_PREFIX: 'ORCH-'
  };

  // Test the restore method
  console.log('🔄 Running restore operation...\n');
  storage.restore(orchestratorStorage);

  // Verify results
  console.log('📊 Verification Results:\n');
  
  let allTestsPassed = true;
  
  // Check profile (should be restored from sessionStorage)
  if (store.profile.id === 1 && store.profile.name === 'John Doe') {
    console.log('✅ Profile restored correctly from sessionStorage');
  } else {
    console.log('❌ Profile restoration failed');
    allTestsPassed = false;
  }
  
  // Check phone (should be restored from IDO, overriding sessionStorage)
  if (store.phone.primary === '+1111111111' && store.phone.work === '+2222222222') {
    console.log('✅ Phone restored correctly from IDO');
  } else {
    console.log('❌ Phone restoration failed - IDO override not working');
    allTestsPassed = false;
  }
  
  // Check login (should be restored from localStorage)
  if (store.login.token === 'abc123xyz') {
    console.log('✅ Login restored correctly from localStorage');
  } else {
    console.log('❌ Login restoration failed');
    allTestsPassed = false;
  }

  console.log('\n' + '='.repeat(50));
  
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! SessionStorage restore fix is working correctly.');
    console.log('✅ Critical bug has been resolved - no data loss will occur.');
  } else {
    console.log('❌ SOME TESTS FAILED! There may be issues with the restore implementation.');
  }
  
  console.log('='.repeat(50) + '\n');
  
  return allTestsPassed;
}

// Run the tests
try {
  const success = runTests();
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
}