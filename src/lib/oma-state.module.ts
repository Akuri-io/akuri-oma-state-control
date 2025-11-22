import { NgModule, ModuleWithProviders } from '@angular/core';
import { OMAStateControlService } from './state-control/state-control.service';

/**
 * OMA State Module
 * 
 * Provides reactive state management using Angular Signals and RxJS
 * with intelligent persistence and cross-feature data sharing.
 * 
 * @example
 * ```typescript
 * // In your app.module.ts
 * import { OMAStateModule } from 'akuri-oma-state-control';
 * 
 * @NgModule({
 *   imports: [
 *     // ... other imports
 *     OMAStateModule.forRoot()
 *   ]
 * })
 * export class AppModule { }
 * 
 * // In your feature component
 * import { OMAStateControlService } from 'akuri-oma-state-control';
 * 
 * @Component({
 *   // ...
 * })
 * export class VehicleComponent {
 *   constructor(private vehicleState: OMAStateControlService<any>) {
 *     // Use the service
 *   }
 * }
 * ```
 */
@NgModule({
  providers: [
    OMAStateControlService
  ]
})
export class OMAStateModule {
  
  /**
   * Configure the module for root application
   */
  static forRoot(): ModuleWithProviders<OMAStateModule> {
    return {
      ngModule: OMAStateModule,
      providers: [
        OMAStateControlService
      ]
    };
  }

  /**
   * Configure the module for feature modules
   */
  static forFeature(): ModuleWithProviders<OMAStateModule> {
    return {
      ngModule: OMAStateModule,
      providers: [
        OMAStateControlService
      ]
    };
  }
}