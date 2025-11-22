/**
 * Ejemplo completo de uso de AKURI OMA State Control Library
 * Este archivo muestra cómo integrar la librería en un proyecto Angular
 */

// ========================================
// 1. CONFIGURACIÓN DEL MÓDULO PRINCIPAL
// ========================================

// app.module.ts (Angular tradicional)
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { OMAStateModule } from 'akuri-oma-state-control';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    OMAStateModule.forRoot()  // ← Configuración principal
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

// app.config.ts (Angular standalone)
import { ApplicationConfig } from '@angular/core';
import { importProvidersFrom } from '@angular/core';
import { OMAStateModule } from 'akuri-oma-state-control';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(OMAStateModule.forRoot())
  ]
};

// ========================================
// 2. CREAR SERVICIOS DE ESTADO ESPECÍFICOS
// ========================================

// vehicle.state.service.ts
import { Injectable } from '@angular/core';
import { 
  OMAStateControlService, 
  OMAStateField, 
  OMAPersistenceConfig,
  VehicleState 
} from 'akuri-oma-state-control';

@Injectable({ providedIn: 'root' })
export class VehicleStateService extends OMAStateControlService<VehicleState> {
  constructor() {
    const stateFields: OMAStateField[] = [
      { name: 'vehicleData', type: 'any', initialValue: null },
      { name: 'vehicleList', type: 'any[]', initialValue: [] },
      { name: 'isLoading', type: 'boolean', initialValue: false },
      { name: 'selectedVehicle', type: 'any', initialValue: null },
      { name: 'fuelLevel', type: 'number', initialValue: 0 },
      { name: 'mileage', type: 'number', initialValue: 0 },
      { name: 'maintenanceSchedule', type: 'any[]', initialValue: [] },
      { name: 'availableVehicles', type: 'any[]', initialValue: [] },
      { name: 'bookingHistory', type: 'any[]', initialValue: [] }
    ];

    const persistenceConfig: OMAPersistenceConfig = {
      localStorage: ['selectedVehicle', 'fuelLevel', 'mileage'],
      sessionStorage: ['vehicleData', 'vehicleList'],
      ido: { 
        'vehicleList': 'cachedVehicles',
        'bookingHistory': 'userBookingHistory'
      }
    };

    super('vehicle', stateFields, persistenceConfig);
  }

  // Métodos específicos del dominio de vehículos
  loadVehicles() {
    this.set('isLoading', true);
    // Simular llamada API
    setTimeout(() => {
      const mockVehicles = [
        { id: 1, name: 'Toyota Corolla', fuelLevel: 85, available: true },
        { id: 2, name: 'Honda Civic', fuelLevel: 60, available: true },
        { id: 3, name: 'Ford Focus', fuelLevel: 30, available: false }
      ];
      this.set('vehicleList', mockVehicles);
      this.set('isLoading', false);
    }, 1000);
  }

  selectVehicle(vehicleId: number) {
    const vehicle = this.get('vehicleList').find(v => v.id === vehicleId);
    if (vehicle) {
      this.set('selectedVehicle', vehicle);
    }
  }

  updateFuelLevel(level: number) {
    this.set('fuelLevel', Math.max(0, Math.min(100, level)));
  }

  bookVehicle(vehicleId: number, userId: string) {
    const vehicle = this.get('vehicleList').find(v => v.id === vehicleId);
    if (vehicle) {
      const booking = {
        vehicleId,
        userId,
        timestamp: new Date().toISOString(),
        status: 'confirmed'
      };
      
      const currentHistory = this.get('bookingHistory') || [];
      this.set('bookingHistory', [...currentHistory, booking]);
    }
  }
}

// property.state.service.ts
import { Injectable } from '@angular/core';
import { 
  OMAStateControlService, 
  OMAStateField, 
  OMAPersistenceConfig,
  PropertyState 
} from 'akuri-oma-state-control';

@Injectable({ providedIn: 'root' })
export class PropertyStateService extends OMAStateControlService<PropertyState> {
  constructor() {
    const stateFields: OMAStateField[] = [
      { name: 'propertyData', type: 'any', initialValue: null },
      { name: 'propertyList', type: 'any[]', initialValue: [] },
      { name: 'isLoading', type: 'boolean', initialValue: false },
      { name: 'selectedProperty', type: 'any', initialValue: null },
      { name: 'searchFilters', type: 'any', initialValue: {} }
    ];

    const persistenceConfig: OMAPersistenceConfig = {
      localStorage: ['selectedProperty', 'searchFilters'],
      sessionStorage: ['propertyList']
    };

    super('property', stateFields, persistenceConfig);
  }

  searchProperties(filters: any) {
    this.set('searchFilters', filters);
    this.set('isLoading', true);
    
    // Simular búsqueda
    setTimeout(() => {
      const mockProperties = [
        { id: 1, address: '123 Main St', price: 250000 },
        { id: 2, address: '456 Oak Ave', price: 180000 }
      ];
      this.set('propertyList', mockProperties);
      this.set('isLoading', false);
    }, 800);
  }

  selectProperty(propertyId: number) {
    const property = this.get('propertyList').find(p => p.id === propertyId);
    if (property) {
      this.set('selectedProperty', property);
    }
  }
}

// ========================================
// 3. USAR EN COMPONENTES
// ========================================

// vehicle-list.component.ts (Angular tradicional)
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { VehicleStateService } from './vehicle.state.service';

@Component({
  selector: 'app-vehicle-list',
  template: `
    <div class="vehicle-list-container">
      <h2>Lista de Vehículos</h2>
      
      <div *ngIf="vehicleState.get('isLoading')" class="loading">
        Cargando vehículos...
      </div>
      
      <div *ngFor="let vehicle of vehicleState.get('vehicleList')" 
           class="vehicle-card"
           (click)="selectVehicle(vehicle.id)">
        <h3>{{ vehicle.name }}</h3>
        <p>Combustible: {{ vehicle.fuelLevel }}%</p>
        <p>Estado: {{ vehicle.available ? 'Disponible' : 'No disponible' }}</p>
      </div>

      <div *ngIf="vehicleState.get('selectedVehicle')" class="selected-vehicle">
        <h3>Vehículo Seleccionado:</h3>
        <p>{{ vehicleState.get('selectedVehicle').name }}</p>
      </div>

      <button (click)="refreshVehicles()">Actualizar Lista</button>
    </div>
  `,
  styles: [`
    .vehicle-list-container { padding: 20px; }
    .vehicle-card { 
      border: 1px solid #ccc; 
      padding: 10px; 
      margin: 10px 0; 
      cursor: pointer; 
    }
    .vehicle-card:hover { background-color: #f5f5f5; }
    .selected-vehicle { 
      background-color: #e8f5e8; 
      padding: 15px; 
      border-radius: 5px; 
    }
    .loading { color: #666; font-style: italic; }
  `]
})
export class VehicleListComponent implements OnInit, OnDestroy {
  private subscription: Subscription;

  constructor(public vehicleState: VehicleStateService) {}

  ngOnInit() {
    // Inicializar persistencia
    this.vehicleState.init();
    
    // Suscribirse a cambios de estado
    this.subscription = this.vehicleState.observableState$.subscribe(state => {
      console.log('Estado del vehículo actualizado:', state);
    });

    // Cargar vehículos iniciales
    this.refreshVehicles();
  }

  ngOnDestroy() {
    // Limpiar estado al destruir componente
    this.vehicleState.exit();
    this.subscription?.unsubscribe();
  }

  refreshVehicles() {
    this.vehicleState.loadVehicles();
  }

  selectVehicle(vehicleId: number) {
    this.vehicleState.selectVehicle(vehicleId);
  }
}

// vehicle-dashboard.component.ts (Angular Standalone)
import { Component, signal, computed, OnInit } from '@angular/core';
import { VehicleStateService } from './vehicle.state.service';

@Component({
  selector: 'app-vehicle-dashboard',
  standalone: true,
  template: `
    <div class="dashboard">
      <h2>Dashboard de Vehículos</h2>
      
      <!-- Indicador de combustible reactivo -->
      <div class="fuel-section">
        <h3>Nivel de Combustible</h3>
        <div class="fuel-indicator">
          <div class="fuel-bar" 
               [style.width.%]="fuelLevel()" 
               [class.low]="fuelLevel() < 30"
               [class.medium]="fuelLevel() >= 30 && fuelLevel() < 70"
               [class.high]="fuelLevel() >= 70">
          </div>
        </div>
        <p>{{ fuelLevel() }}%</p>
        <button (click)="decreaseFuel()">-</button>
        <button (click)="increaseFuel()">+</button>
      </div>

      <!-- Lista de vehículos disponibles -->
      <div class="vehicles-section">
        <h3>Vehículos Disponibles ({{ availableVehiclesCount() }})</h3>
        <div *ngFor="let vehicle of availableVehicles()" class="vehicle-item">
          <span>{{ vehicle.name }}</span>
          <span [class.available]="vehicle.available" 
                [class.unavailable]="!vehicle.available">
            {{ vehicle.available ? '✓ Disponible' : '✗ No disponible' }}
          </span>
        </div>
      </div>

      <!-- Historial de reservas -->
      <div class="history-section">
        <h3>Historial de Reservas ({{ bookingHistoryCount() }})</h3>
        <div *ngFor="let booking of bookingHistory()" class="booking-item">
          Vehículo ID: {{ booking.vehicleId }} - 
          {{ booking.timestamp | date:'short' }}
        </div>
      </div>

      <div class="actions">
        <button (click)="refreshVehicles()">🔄 Actualizar</button>
        <button (click)="bookRandomVehicle()">📅 Reservar Aleatorio</button>
        <button (click)="clearHistory()">🗑️ Limpiar Historial</button>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding: 20px; max-width: 800px; margin: 0 auto; }
    .fuel-indicator { 
      width: 300px; 
      height: 20px; 
      background-color: #f0f0f0; 
      border-radius: 10px; 
      overflow: hidden; 
      margin: 10px 0; 
    }
    .fuel-bar { 
      height: 100%; 
      transition: width 0.3s ease; 
    }
    .fuel-bar.low { background-color: #ff4444; }
    .fuel-bar.medium { background-color: #ffaa00; }
    .fuel-bar.high { background-color: #44ff44; }
    .vehicle-item, .booking-item { 
      display: flex; 
      justify-content: space-between; 
      padding: 8px; 
      border-bottom: 1px solid #eee; 
    }
    .available { color: green; }
    .unavailable { color: red; }
    .actions { margin-top: 20px; }
    .actions button { margin: 0 5px; padding: 10px 15px; }
  `]
})
export class VehicleDashboardComponent implements OnInit {
  // Computed values para optimización automática
  fuelLevel = computed(() => this.vehicleState.get('fuelLevel') || 0);
  availableVehicles = computed(() => 
    (this.vehicleState.get('vehicleList') || []).filter(v => v.available)
  );
  availableVehiclesCount = computed(() => this.availableVehicles().length);
  bookingHistory = computed(() => this.vehicleState.get('bookingHistory') || []);
  bookingHistoryCount = computed(() => this.bookingHistory().length);

  constructor(private vehicleState: VehicleStateService) {}

  ngOnInit() {
    // Inicializar persistencia
    this.vehicleState.init();
    
    // Cargar datos iniciales
    this.vehicleState.loadVehicles();
  }

  // Métodos de acción
  increaseFuel() {
    this.vehicleState.updateFuelLevel(this.fuelLevel() + 10);
  }

  decreaseFuel() {
    this.vehicleState.updateFuelLevel(this.fuelLevel() - 10);
  }

  refreshVehicles() {
    this.vehicleState.loadVehicles();
  }

  bookRandomVehicle() {
    const availableVehicles = this.availableVehicles();
    if (availableVehicles.length > 0) {
      const randomVehicle = availableVehicles[Math.floor(Math.random() * availableVehicles.length)];
      this.vehicleState.bookVehicle(randomVehicle.id, 'user123');
    }
  }

  clearHistory() {
    this.vehicleState.set('bookingHistory', []);
  }
}

// ========================================
// 4. USO CON ORCHESTRATOR
// ========================================

// app-orchestrator.service.ts
import { Injectable } from '@angular/core';
import { SessionStorage } from 'akuri-oma-state-control';

@Injectable({ providedIn: 'root' })
export class AppOrchestratorService {
  private orchestratorStorage: SessionStorage<any>;

  constructor() {
    // Crear storage orchestrator para coordinar entre features
    const appState = {
      globalUser: null,
      appSettings: {},
      featureContexts: {}
    };
    
    this.orchestratorStorage = new SessionStorage('APP-', appState);
  }

  getOrchestratorStorage(): SessionStorage<any> {
    return this.orchestratorStorage;
  }

  // Métodos para compartir datos entre features
  shareData(featureName: string, data: any) {
    this.orchestratorStorage.set(`${featureName}Context`, data);
  }

  getSharedData(featureName: string): any {
    return this.orchestratorStorage.get(`${featureName}Context`);
  }
}

// usage-in-component.ts
import { Component, OnInit } from '@angular/core';
import { VehicleStateService } from './vehicle.state.service';
import { AppOrchestratorService } from './app-orchestrator.service';

@Component({
  selector: 'app-vehicle-manager',
  template: `
    <div>
      <!-- Componente que usa orchestrator -->
    </div>
  `
})
export class VehicleManagerComponent implements OnInit {
  constructor(
    private vehicleState: VehicleStateService,
    private orchestrator: AppOrchestratorService
  ) {}

  ngOnInit() {
    // Inicializar con orchestrator
    const orchestratorStorage = this.orchestrator.getOrchestratorStorage();
    this.vehicleState.init(orchestratorStorage);
    this.vehicleState.restore(orchestratorStorage);
  }

  onVehicleSelected(vehicle: any) {
    // Compartir selección con otros features
    this.orchestrator.shareData('vehicle', { selectedVehicle: vehicle });
  }
}

// ========================================
// 5. RESUMEN DE BENEFICIOS
// ========================================

/**
 * BENEFICIOS DE USAR LA LIBRERÍA:
 * 
 * ✅ Reutilización: Un solo lugar para toda la lógica de estado
 * ✅ Type Safety: TypeScript completo para desarrollo seguro
 * ✅ Performance: Angular Signals para máximo rendimiento
 * ✅ Persistencia: localStorage, sessionStorage automático
 * ✅ Modular: Cada feature tiene su propio estado aislado
 * ✅ Observable: Integración perfecta con RxJS
 * ✅ Zoneless: Compatible con Angular moderno
 * ✅ Cross-feature: IDO pattern para compartir datos
 * ✅ Lifecycle: Métodos init/restore/exit automáticos
 * ✅ Debugging: Console warnings para troubleshooting
 */

// ========================================
// INSTALACIÓN Y USO RÁPIDO
// ========================================

/**
 * 1. INSTALAR:
 * npm install akuri-oma-state-control
 * 
 * 2. CONFIGURAR:
 * import { OMAStateModule } from 'akuri-oma-state-control';
 * OMAStateModule.forRoot()
 * 
 * 3. USAR:
 * extends OMAStateControlService<YourStateType>
 * super('feature', stateFields, persistenceConfig)
 * 
 * 4. INTEGRAR:
 * vehicleState.init() // en ngOnInit
 * vehicleState.exit() // en ngOnDestroy
 */