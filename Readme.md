# WiFi Metrics Monitor Pro

Herramienta profesional de análisis y diagnóstico de redes WiFi en tiempo real, diseñada para especialistas en RF y administradores de red.


## 🎯 Descripción

WiFi Metrics Monitor Pro es una aplicación web para monitorear y analizar métricas críticas de redes WiFi, proporcionando diagnóstico en tiempo real y recomendaciones de troubleshooting basadas en estándares de la industria.

## ✨ Características

### 📊 Métricas Monitoreadas

#### 1. **RSSI (Received Signal Strength Indicator)**
- Medición de intensidad de señal en dBm
- Clasificación visual: Excelente → Crítico
- Rango: -30 dBm (excelente) a -90 dBm (crítico)
- Indicador de barras de señal

#### 2. **SNR (Signal-to-Noise Ratio)**
- Relación señal/ruido en dB
- Alertas cuando SNR < 20 dB
- Umbral óptimo: >25 dB
- Visualización con barra de progreso

#### 3. **Channel Utilization**
- Ocupación del canal (0-100%)
- Diferenciación tráfico 802.11 y no-802.11
- Detección de CCI (Co-Channel Interference)
- Alertas cuando >60-70%

#### 4. **Data Rate**
- Tasa de transmisión Tx/Rx en Mbps
- Análisis de capacidad del driver
- Monitoreo de negociación de tasas

#### 5. **Retry Rate**
- Porcentaje de retransmisiones
- Correlación con Channel Utilization
- Alertas cuando >10-15%
- Sugerencias de optimización

#### 6. **Association Time**
- Tiempo de asociación al AP en ms
- Detección de problemas de bandsteering
- Análisis de escaneo DFS
- Alertas cuando >300ms

### 🎨 Funcionalidades Adicionales

- **Health Score**: Puntuación general (0-100) del estado de la red
- **Sistema de Alertas**: Notificaciones contextuales automáticas
- **Historial Visual**: Gráficos en tiempo real de RSSI y SNR
- **Troubleshooting Guiado**: Recomendaciones basadas en correlación de métricas
- **Información de Red**: SSID, BSSID, canal, banda, seguridad
- **Editor de SSID**: Configuración manual del nombre de red
- **Actualización en Tiempo Real**: Datos cada 2 segundos

## 🚀 Instalación

### Requisitos Previos
- Node.js 16+ 
- npm o yarn

### Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/wifi-metrics-monitor.git
cd wifi-metrics-monitor

# Instalar dependencias
npm install

# Iniciar en desarrollo
npm start
```

### Despliegue Producción

```bash
# Construir para producción
npm run build

# El build estará en /build
```

## 📦 Dependencias

```json
{
  "react": "^18.2.0",
  "lucide-react": "^0.263.1",
  "recharts": "^2.5.0"
}
```

## 🔧 Configuración

### Editar SSID de Red

1. Haz clic en **"Editar"** junto al nombre del SSID
2. Ingresa el nombre real de tu red WiFi
3. Presiona **"Guardar"**

### Umbrales de Alertas

Los umbrales están configurados según mejores prácticas de RF:

| Métrica | Óptimo | Aceptable | Crítico |
|---------|--------|-----------|---------|
| RSSI | > -60 dBm | -60 a -75 dBm | < -75 dBm |
| SNR | > 25 dB | 20-25 dB | < 20 dB |
| Ch. Util | < 60% | 60-70% | > 70% |
| Retry Rate | < 10% | 10-15% | > 15% |
| Assoc Time | < 200ms | 200-300ms | > 300ms |

## 🎓 Casos de Uso

1. **Diagnóstico Rápido**: Identificación inmediata de problemas de conectividad
2. **Site Survey Pasivo**: Análisis de cobertura y calidad de señal
3. **Validación Post-Instalación**: Verificación de performance de nuevos APs
4. **Monitoreo NOC/Helpdesk**: Dashboard en tiempo real para soporte
5. **Troubleshooting de Roaming**: Análisis de handoffs entre APs

## 📚 Interpretación de Métricas

### RSSI Bajo + SNR Bajo
**Problema**: Señal débil con ruido
**Solución**: Acercar AP, reducir interferencia, cambiar canal

### Retry Rate Alto + Channel Util Alto
**Problema**: Canal saturado con colisiones
**Solución**: Añadir más APs, reducir data rates básicas

### Association Time Alto
**Problema**: Bandsteering agresivo o escaneo DFS
**Solución**: Ajustar timers de bandsteering, deshabilitar DFS si es posible

### SNR Crítico con RSSI Aceptable
**Problema**: Exceso de ruido en el entorno
**Solución**: Identificar fuentes de interferencia (microondas, Bluetooth, otros APs)

## ⚠️ Limitaciones

### Navegador Web
Por restricciones de seguridad del navegador:
- **No puede detectar automáticamente** el SSID real de la red conectada
- **Métricas simuladas** en esta versión demo
- **Requiere entrada manual** del nombre de red

### Para Datos Reales
Se necesita una implementación nativa con:

#### Windows
```bash
netsh wlan show interfaces
```

#### macOS
```bash
/System/Library/PrivateFrameworks/Apple80211.framework
```

#### Linux
```bash
iwconfig
nmcli dev wifi
```

## 🔮 Roadmap

- [ ] Implementación con Electron para acceso a APIs nativas
- [ ] Exportación de reportes PDF/CSV
- [ ] Comparativa multi-AP
- [ ] Heatmap de cobertura con GPS
- [ ] Análisis de espectro RF
- [ ] Detección de rogue APs
- [ ] Integración con controladores WiFi (Cisco, Aruba, Ubiquiti)
- [ ] Modo oscuro/claro
- [ ] Almacenamiento persistente de historial

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📖 Referencias

Basado en mejores prácticas de:
- IEEE 802.11 Standards
- CWNA (Certified Wireless Network Administrator)
- Ekahau Site Survey Guidelines
- Cisco Wireless Design Guide

## 📄 Licencia

MIT License - ver archivo [LICENSE](LICENSE) para detalles

## 👤 Autor

Desarrollado por especialistas en RF para la comunidad de administradores de redes inalámbricas.

## 📞 Soporte

Para preguntas o problemas:
- Abrir un issue en GitHub
- Contactar: support@wifimonitor.pro

---

**Nota**: Esta es una herramienta de diagnóstico. Para despliegues en producción, considere implementar autenticación, rate limiting y auditoría de accesos.
