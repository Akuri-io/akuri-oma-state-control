#!/bin/bash

# Script de instalación y configuración de la librería OMA State Control
# Este script muestra cómo publicar y usar la librería en npm

echo "🚀 AKURI OMA State Control Library - Setup Script"
echo "=================================================="

# 1. Verificar dependencias
echo "📋 Verificando dependencias..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala Node.js y npm."
    exit 1
fi

if ! command -v ng &> /dev/null; then
    echo "⚠️ Angular CLI no está instalado. Instalando..."
    npm install -g @angular/cli
fi

# 2. Instalar dependencias de desarrollo
echo "📦 Instalando dependencias de desarrollo..."
npm install

# 3. Build de la librería
echo "🔨 Construyendo la librería..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build exitoso!"
else
    echo "❌ Error en el build"
    exit 1
fi

# 4. Simular publicación (en un entorno real usarías npm publish)
echo "📤 Preparando para publicación..."
echo "Para publicar en npm, ejecuta:"
echo "npm publish"

# 5. Crear proyecto de ejemplo
echo "📁 Creando proyecto de ejemplo..."
ng new vehicle-management-app --routing --style=scss

# 6. Instalar la librería en el proyecto ejemplo
echo "🔌 Instalando la librería en el proyecto ejemplo..."
cd vehicle-management-app
npm install ../akuri-oma-state-control/dist/*.tgz

# 7. Mostrar instrucciones de uso
echo ""
echo "🎉 ¡Configuración completa!"
echo "=========================="
echo ""
echo "Para usar la librería en tu proyecto:"
echo ""
echo "1. INSTALAR:"
echo "   npm install akuri-oma-state-control"
echo ""
echo "2. CONFIGURAR EN AppModule:"
echo "   import { OMAStateModule } from 'akuri-oma-state-control';"
echo "   @NgModule({"
echo "     imports: [OMAStateModule.forRoot()]"
echo "   })"
echo ""
echo "3. CREAR SERVICIO DE ESTADO:"
echo "   export class VehicleStateService extends OMAStateControlService<VehicleState> {"
echo "     constructor() {"
echo "       super('vehicle', stateFields, persistenceConfig);"
echo "     }"
echo "   }"
echo ""
echo "4. USAR EN COMPONENTE:"
echo "   constructor(private vehicleState: VehicleStateService) {"
echo "     this.vehicleState.init();"
echo "     this.vehicleState.set('selectedVehicle', vehicleData);"
echo "   }"
echo ""
echo "📖 Ver EXAMPLES.md para ejemplos completos de uso"
echo "📚 Ver README.md para documentación detallada"
echo ""
echo "🔗 Archivos creados:"
echo "   - akuri-oma-state-control/ (librería principal)"
echo "   - vehicle-management-app/ (proyecto ejemplo)"
echo ""
echo "¡La librería está lista para ser publicada en npm! 🚀"

# 8. Mostrar estructura final
echo ""
echo "📊 Estructura del proyecto:"
tree -L 3 -I 'node_modules|dist' 2>/dev/null || find . -type d -name node_modules -prune -o -type f -print | head -20

echo ""
echo "✅ Setup completado exitosamente!"