/**
 * Test file to verify UnwrapSignal type accessibility from multiple export locations
 * Tests that the UnwrapSignal type can be imported and used from both:
 * 1. session-storage.model.ts (original location)
 * 2. oma-state.types.ts (convenience re-export)
 */

import { UnwrapSignal as UnwrapSignalFromSessionStorage } from '../session-storage/session-storage.model';
import { UnwrapSignal as UnwrapSignalFromTypes } from '../utils/oma-state.types';

describe('UnwrapSignal Type Accessibility', () => {
  
  describe('Import from session-storage.model.ts', () => {
    
    it('should import UnwrapSignal type from session-storage.model.ts', () => {
      // This test verifies the import works by using it in a type context
      type SignalType = () => string;
      type UnwrappedType = UnwrapSignalFromSessionStorage<SignalType>;
      
      // Should resolve to 'string'
      const testValue: UnwrappedType = 'test string';
      expect(testValue).toBe('test string');
    });

    it('should leave non-signal types unchanged from session-storage.model.ts', () => {
      // Test non-signal type preservation
      type RegularType = { name: string; age: number };
      type UnwrappedType = UnwrapSignalFromSessionStorage<RegularType>;
      
      // This should remain the same object type
      const testUnwrap: UnwrappedType = { name: 'John', age: 30 };
      expect(testUnwrap.name).toBe('John');
      expect(testUnwrap.age).toBe(30);
    });
  });

  describe('Import from oma-state.types.ts', () => {
    
    it('should import UnwrapSignal type from oma-state.types.ts', () => {
      // This test verifies the import works by using it in a type context
      type SignalType = () => number;
      type UnwrappedType = UnwrapSignalFromTypes<SignalType>;
      
      // Should resolve to 'number'
      const testValue: UnwrappedType = 42;
      expect(testValue).toBe(42);
    });

    it('should leave non-signal types unchanged from oma-state.types.ts', () => {
      // Test non-signal type preservation
      type RegularType = string[];
      type UnwrappedType = UnwrapSignalFromTypes<RegularType>;
      
      // This should remain the same array type
      const testUnwrap: UnwrappedType = ['a', 'b', 'c'];
      expect(testUnwrap.length).toBe(3);
    });
  });

  describe('Type Equivalence', () => {
    
    it('should produce equivalent types from both import locations', () => {
      // Test that both imports produce the same unwrapped type
      type TestSignal = () => { id: number; name: string };
      type FromSessionStorage = UnwrapSignalFromSessionStorage<TestSignal>;
      type FromTypes = UnwrapSignalFromTypes<TestSignal>;
      
      // These should be equivalent types
      const sessionStorageResult: FromSessionStorage = { id: 1, name: 'Test' };
      const typesResult: FromTypes = { id: 2, name: 'Test2' };
      
      expect(sessionStorageResult.id).toBe(1);
      expect(typesResult.id).toBe(2);
      expect(typeof sessionStorageResult).toBe(typeof typesResult);
    });
  });

  describe('External Library Usage', () => {
    
    it('should be accessible for external library consumers', () => {
      // Simulate external usage pattern
      interface MyState {
        user: () => { id: string; profile: string };
        settings: { theme: string; language: string };
        counter: number;
      }
      
      // External code should be able to use UnwrapSignal to work with state types
      type UserType = UnwrapSignalFromTypes<MyState['user']>;
      type SettingsType = UnwrapSignalFromTypes<MyState['settings']>;
      
      const mockUser: UserType = { id: 'user123', profile: 'developer' };
      const mockSettings: SettingsType = { theme: 'dark', language: 'en' };
      
      expect(mockUser.id).toBe('user123');
      expect(mockSettings.theme).toBe('dark');
    });

    it('should support complex nested signal scenarios', () => {
      // Test more complex usage scenarios
      interface ComplexState {
        nested: () => () => string;
        array: string[];
        optional?: number;
      }
      
      type NestedSignal = UnwrapSignalFromSessionStorage<ComplexState['nested']>;
      type ArrayType = UnwrapSignalFromTypes<ComplexState['array']>;
      type OptionalType = UnwrapSignalFromTypes<ComplexState['optional']>;
      
      // Nested signal should unwrap to function that returns string
      const nestedFunc: NestedSignal = () => 'nested value';
      const arrayValue: ArrayType = ['item1', 'item2'];
      const optionalValue: OptionalType = 42;
      
      expect(nestedFunc()).toBe('nested value');
      expect(arrayValue.length).toBe(2);
      expect(optionalValue).toBe(42);
    });
  });

  describe('Blueprint Compatibility', () => {
    
    it('should match blueprint UnwrapSignal behavior', () => {
      // Verify our implementation matches the blueprint pattern
      type BlueprintStyleSignal = () => boolean;
      type LibraryUnwrapped = UnwrapSignalFromTypes<BlueprintStyleSignal>;
      
      // This should behave the same as the blueprint implementation
      const testValue: LibraryUnwrapped = true;
      expect(testValue).toBe(true);
      expect(typeof testValue).toBe('boolean');
    });

    it('should work with both signal and non-signal patterns', () => {
      // Test mixed usage like in real applications
      interface MixedState {
        signalProp: () => string;
        regularProp: number;
        optionalSignal?: () => boolean;
      }
      
      type SignalResult = UnwrapSignalFromSessionStorage<MixedState['signalProp']>;
      type RegularResult = UnwrapSignalFromTypes<MixedState['regularProp']>;
      type OptionalResult = UnwrapSignalFromTypes<MixedState['optionalSignal']>;
      
      const signalValue: SignalResult = 'signal value';
      const regularValue: RegularResult = 100;
      const optionalValue: OptionalResult = true;
      
      expect(signalValue).toBe('signal value');
      expect(regularValue).toBe(100);
      expect(optionalValue).toBe(true);
    });
  });

  describe('Type Safety Tests', () => {
    
    it('should maintain type safety across both import sources', () => {
      // Test that type safety is maintained
      type StringSignal = () => string;
      type NumberSignal = () => number;
      type BooleanSignal = () => boolean;
      
      type UnwrappedString = UnwrapSignalFromSessionStorage<StringSignal>;
      type UnwrappedNumber = UnwrapSignalFromTypes<NumberSignal>;
      type UnwrappedBoolean = UnwrapSignalFromSessionStorage<BooleanSignal>;
      
      // These should be different types and not assignable to each other
      const stringValue: UnwrappedString = 'hello';
      const numberValue: UnwrappedNumber = 123;
      const booleanValue: UnwrappedBoolean = false;
      
      expect(typeof stringValue).toBe('string');
      expect(typeof numberValue).toBe('number');
      expect(typeof booleanValue).toBe('boolean');
      
      // Type safety check - these should be different types
      expect(stringValue).not.toBe(numberValue);
      expect(numberValue).not.toBe(booleanValue);
    });
  });
});