# AKURI OMA State Control Library

> Orchestrated Model Architecture (OMA) state management library for Angular with Signals and RxJS support

A complete reactive state management library based on the OMA methodology, designed for Angular with native support for Signals and RxJS.

## 🚀 Features

- **Reactive State Management**: Uses Angular Signals for maximum performance
- **Smart Persistence**: localStorage, sessionStorage and IDO patterns
- **Complete TypeScript**: Type-safe development with full typing
- **Zoneless Architecture**: Compatible with Angular zoneless architecture
- **Observable Bridge**: Perfect integration with RxJS
- **Multi-Feature**: Support for coordination between features
- **Lazy Loading**: On-demand loading to optimize bundle

## 📦 Installation

```bash
npm install akuri-oma-state-control
# or
yarn add akuri-oma-state-control
```

## 🔧 Configuration

### In AppModule (Traditional Angular)

```typescript
import { OMAStateModule } from 'akuri-oma-state-control';

@NgModule({
  imports: [
    // ... other imports
    OMAStateModule.forRoot()
  ]
})
export class AppModule { }
```

### In app.config.ts (Angular standalone)

```typescript
import { importProvidersFrom } from '@angular/core';
import { OMAStateModule } from 'akuri-oma-state-control';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(OMAStateModule.forRoot())
  ]
};
```

## 💡 Basic Usage

### 1. Create a State Service

Here's the complete configuration example for a vehicle state service:

```typescript
import { Injectable } from '@angular/core';
import {
  OMAStateControlService,
  OMAStateField,
  OMAPersistenceConfig,
} from 'akuri-oma-state-control';

// State interface definition
interface VehicleState {
  vehicleData: any;
  vehicleList: any[];
  isLoading: boolean;
  selectedVehicle: any;
  fuelLevel: number;
  mileage: number;
  maintenanceSchedule: any[];
  availableVehicles: any[];
  bookingHistory: any[];
}

@Injectable({
  providedIn: 'root',
})
export class VehicleStateService extends OMAStateControlService {
  constructor() {
    const stateFields: OMAStateField[] = [
      { name: 'vehicleData', type: 'any', initialValue: null },
      { name: 'vehicleList', type: 'any[]', initialValue: [] },
      { name: 'isLoading', type: 'boolean', initialValue: false },
      { name: 'selectedVehicle', type: 'any', initialValue: null },
      { name: 'fuelLevel', type: 'number', initialValue: 75 },
      { name: 'mileage', type: 'number', initialValue: 25000 },
      { name: 'maintenanceSchedule', type: 'any[]', initialValue: [] },
      { name: 'availableVehicles', type: 'any[]', initialValue: [] },
      { name: 'bookingHistory', type: 'any[]', initialValue: [] },
    ];

    const persistenceConfig: OMAPersistenceConfig = {
      localStorage: ['vehicleData'],
      sessionStorage: ['fuelLevel', 'mileage'],
    };

    super('vehicle', stateFields, persistenceConfig);
  }
}
```

### 2. Use in Components

Simple component usage example:

```typescript
import { Component, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { VehicleStateService } from './vehicle.state.service';

@Component({
  selector: 'vehicle-data',
  imports: [JsonPipe],
  templateUrl: './vehicle.data.html',
  styleUrl: './vehicle.data.css',
})
export class VehicleData {
  _vehicleState = inject(VehicleStateService);
}
```

### 3. State Modification and Reset Examples

Here are practical examples of state modification and management:

```typescript
// Example component with state management
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { VehicleStateService } from './vehicle.state.service';

@Component({
  selector: 'app-oma-demo',
  standalone: true,
  templateUrl: './oma.demo.html',
})
export class OmaDemoComponent implements OnInit, OnDestroy {
  _vehicleState = inject(VehicleStateService);
  private subscription?: Subscription;

  ngOnInit() {
    console.log('🚀 OMA Demo initialized');
    this.loadVehicles();
    this._vehicleState.init();
    
    // Subscribe to state changes (Observable bridge)
    this.subscription = this._vehicleState.observableState$.subscribe((state) => {
      console.log('📡 State updated:', state);
    });
  }

  ngOnDestroy() {
    console.log('🔄 Cleaning OMA Demo');
    this._vehicleState.exit();
    this.subscription?.unsubscribe();
  }

  // Load vehicles example
  loadVehicles() {
    const mockVehicles = [
      { id: 1, name: 'Toyota Corolla 2024', fuelLevel: 85, available: true, type: 'Sedán' },
      { id: 2, name: 'Honda Civic 2024', fuelLevel: 60, available: true, type: 'Sedán' },
      { id: 3, name: 'Ford Focus 2024', fuelLevel: 30, available: false, type: 'Hatchback' },
      { id: 4, name: 'BMW X3 2024', fuelLevel: 90, available: true, type: 'SUV' },
      { id: 5, name: 'Tesla Model 3', fuelLevel: 100, available: true, type: 'Eléctrico' },
    ];

    this._vehicleState.set('vehicleList', mockVehicles);
    this._vehicleState.set(
      'availableVehicles',
      mockVehicles.filter((v) => v.available)
    );
    this._vehicleState.set('isLoading', false);
  }

  // Select vehicle example
  selectVehicle(vehicleId: number) {
    this._vehicleState.set('selectedVehicle', {
      id: 3,
      name: 'Ford Focus 2024',
      fuelLevel: 30,
      available: false,
      type: 'Hatchback',
    });
    console.log('🚗 Vehicle selected:', this._vehicleState.get('selectedVehicle'));
  }

  // Reset state example
  clearState() {
    this._vehicleState.reset();
    console.log('🗑️ State cleared');
  }
}
```

### 4. HTML Template Examples

You can access state directly in templates and call service methods:

```html
<!-- Direct state access with automatic reactivity -->
<section class="vehicle-container">
  {{ _vehicleState.get('vehicleList') | json }}
</section>

<section class="vehicle-container">
  {{ _vehicleState.get('selectedVehicle') | json }}
</section>

<!-- Method calls from templates -->
<section>
  <button (click)="selectVehicle(3)">Select Vehicle 3</button>
  <button (click)="selectVehicle(5)">Select Vehicle 5</button>
</section>

<section>
  <button (click)="_vehicleState.reset()">Reset State</button>
</section>

<section>
  <button (click)="_vehicleState.init()">Initialize State</button>
</section>
```

## 🔄 Complete API

### OMAStateControlService

#### Main Methods

| Method | Description |
|--------|-------------|
| `set<K extends keyof T>(key: K, value: any)` | Sets a value in state |
| `get<K extends keyof T>(key: K, defaultValue?: any)` | Gets a value from state |
| `updateState(partialState: Partial<T>)` | Updates multiple properties |
| `getState(): T` | Gets the complete state |
| `reset(): void` | Resets state to initial values |
| `subscribe(callback: (state: T) => void)` | Subscribes to state changes |

#### Persistence Methods

| Method | Description |
|--------|-------------|
| `init(orchestratorStorage?)` | Initializes persistence |
| `restore(orchestratorStorage?)` | Restores persisted data |
| `exit(orchestratorStorage?)` | Clears state with selective persistence |

#### Static Methods

```typescript
// Create dynamic service
const vehicleState = OMAStateControlService.createFeatureService('vehicle', stateFields);

// Create typed service
const typedVehicleState = OMAStateControlService.createTyped<VehicleState>('vehicle', stateFields);
```

## 🎯 Advanced Persistence

### Persistence Configuration

The `OMAPersistenceConfig` allows you to control how state properties are persisted:

```typescript
const persistenceConfig: OMAPersistenceConfig = {
  // Persist in localStorage (survives browser restart)
  localStorage: [
    'selectedVehicle',    // Selected vehicle
    'userPreferences',    // User preferences
    'lastSearchFilters'   // Last search filters
  ],
  
  // Persist in sessionStorage (survives page navigation)
  sessionStorage: [
    'vehicleData',        // Current vehicle data
    'vehicleList',        // Vehicle list in memory
    'temporaryFilters'    // Temporary filters
  ],
  
  // Transfer to orchestrator (share between features)
  ido: {
    'vehicleList': 'cachedVehicleInventory',     // Shared list with inventory
    'selectedVehicle': 'activeVehicleContext',   // Shared active context
    'bookingHistory': 'userVehicleHistory'      // Shared history with user
  }
};
```

### Persistence Behavior

**localStorage Properties:**
- Persisted permanently until explicitly removed
- Survives browser restarts and page refreshes
- Ideal for user preferences and long-term data

**sessionStorage Properties:**
- Persisted until `reset()` is called or window is closed
- Survives page navigation within the same tab
- Ideal for temporary data and current session state

**Example from the vehicle service:**
```typescript
const persistenceConfig: OMAPersistenceConfig = {
  localStorage: ['vehicleData'],        // Permanent storage
  sessionStorage: ['fuelLevel', 'mileage'], // Temporary storage
};
```

In this example:
- `vehicleData` remains in localStorage even after calling `reset()` or closing the browser
- `fuelLevel` and `mileage` are stored in sessionStorage and will be cleared when `reset()` is called or the browser tab is closed

### Example with Orchestrator

```typescript
// Create storage orchestrator to coordinate between features
const orchestratorStorage = new SessionStorage('APP-', appState);

// Initialize all features
vehicleState.init(orchestratorStorage);
userState.init(orchestratorStorage);
bookingState.init(orchestratorStorage);

// Restore persisted state
vehicleState.restore(orchestratorStorage);
userState.restore(orchestratorStorage);
```

## 🏗️ Architecture

### Singleton Pattern
Each feature has a single state instance, globally accessible.

### Signal Integration
All properties are Angular Signals for maximum performance.

### Observable Bridge
RxJS BehaviorSubject for compatibility with existing observables.

### Zoneless Ready
Compatible with Angular zoneless architecture for optimal performance.

## 🔧 Advanced Examples

### Multi-State Feature

```typescript
@Injectable({ providedIn: 'root' })
export class PropertyStateService extends OMAStateControlService<PropertyState> {
  constructor() {
    const stateFields: OMAStateField[] = [
      { name: 'propertyData', type: 'any', initialValue: null },
      { name: 'propertyList', type: 'any[]', initialValue: [] },
      { name: 'selectedProperty', type: 'any', initialValue: null },
      { name: 'isLoading', type: 'boolean', initialValue: false },
      { name: 'searchFilters', type: 'any', initialValue: {} }
    ];

    const persistenceConfig: OMAPersistenceConfig = {
      localStorage: ['selectedProperty', 'searchFilters'],
      sessionStorage: ['propertyList']
    };

    super('property', stateFields, persistenceConfig);
  }

  // Domain-specific methods
  searchProperties(filters: any) {
    this.set('searchFilters', filters);
    this.set('isLoading', true);
    
    // Search logic...
    this.propertyApi.search(filters).subscribe({
      next: (results) => {
        this.set('propertyList', results);
        this.set('isLoading', false);
      },
      error: () => {
        this.set('isLoading', false);
      }
    });
  }

  selectProperty(property: any) {
    this.set('selectedProperty', property);
  }
}
```

### Standalone Component

```typescript
import { Component, signal, computed } from '@angular/core';
import { VehicleStateService } from 'akuri-oma-state-control';

@Component({
  selector: 'app-vehicle-dashboard',
  standalone: true,
  template: `
    <div class="dashboard">
      <h2>Vehicle Dashboard</h2>
      
      <!-- Reactive state with signals -->
      <div class="fuel-indicator">
        Fuel Level: {{ fuelLevel() }}%
        <div class="fuel-bar" [style.width.%]="fuelLevel()"></div>
      </div>
      
      <div class="vehicle-list">
        <h3>Available Vehicles ({{ availableVehiclesCount() }})</h3>
        <div *ngFor="let vehicle of availableVehicles()">
          {{ vehicle.name }} - {{ vehicle.status }}
        </div>
      </div>

      <button (click)="refreshVehicles()">
        Refresh List
      </button>
    </div>
  `
})
export class VehicleDashboardComponent {
  // Computed values for optimization
  fuelLevel = computed(() => this.vehicleState.get('fuelLevel') || 0);
  availableVehicles = computed(() => 
    (this.vehicleState.get('vehicleList') || []).filter(v => v.available)
  );
  availableVehiclesCount = computed(() => this.availableVehicles().length);

  constructor(private vehicleState: VehicleStateService) {}

  refreshVehicles() {
    this.vehicleState.set('isLoading', true);
    // Update logic...
  }
}
```

## 📋 Comparison with Other Libraries

| Feature | OMA State Control | NgRx | Akita | BehaviourSubject |
|---------|-------------------|------|-------|------------------|
| Angular Signals | ✅ Native | ❌ No | ❌ No | ❌ No |
| Zoneless | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Persistence | ✅ Advanced | ❌ Manual | ❌ Manual | ❌ No |
| TypeScript | ✅ Complete | ✅ Good | ✅ Good | ⚠️ Basic |
| Bundle Size | ✅ Small | ❌ Large | ⚠️ Medium | ✅ Small |
| Learning Curve | ✅ Easy | ❌ Complex | ⚠️ Medium | ✅ Easy |

## 🐛 Troubleshooting

### Error: Cannot find module '@angular/core'
```bash
npm install @angular/core@^17.0.0 rxjs@^7.8.0
```

### Signals not working
Make sure you have Angular 17+ installed and configured for zoneless architecture if needed.

### Persistence not working
Verify that `init()` is called in `ngOnInit()` and `exit()` in `ngOnDestroy()`.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👥 Authors

- **AKURI Team** - *Initial development* - [AKURI](https://github.com/akuri-team)

---

**AKURI OMA State Control Library** - Reactive state management for modern Angular 🚀