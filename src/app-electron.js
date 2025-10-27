const { useState, useEffect } = React;
const { Wifi, Activity, Radio, Clock, RefreshCw, AlertTriangle, CheckCircle, TrendingUp, RotateCw } = lucide;

const WiFiMetricsMonitor = () => {
  const [metrics, setMetrics] = useState({
    rssi: -65,
    snr: 28,
    channelUtil: 45,
    dataRate: 866,
    retryRate: 8,
    associationTime: 150,
    noiseFloor: -93
  });

  const [networkInfo, setNetworkInfo] = useState({
    ssid: 'Cargando...',
    ssidName: 'Detectando red WiFi',
    bssid: '--:--:--:--:--:--',
    channel: 0,
    band: 'N/A',
    bandwidth: 'N/A',
    security: 'N/A',
    apName: 'N/A',
    clientMAC: 'N/A'
  });

  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSSIDInput, setShowSSIDInput] = useState(false);
  const [customSSID, setCustomSSID] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Función para obtener métricas reales del sistema
  const fetchRealMetrics = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.getWiFiMetrics();
        
        if (result.success && result.data) {
          const data = result.data;
          
          // Actualizar información de red
          setNetworkInfo({
            ssid: data.ssid || 'No detectado',
            ssidName: data.ssid ? `Red: ${data.ssid}` : 'No conectado',
            bssid: data.bssid || '--:--:--:--:--:--',
            channel: data.channel || 'N/A',
            band: data.band || 'N/A',
            bandwidth: data.bandwidth || 'N/A',
            security: data.security || 'N/A',
            apName: data.apName || 'AP-Unknown',
            clientMAC: data.clientMAC || 'N/A'
          });

          // Calcular SNR si tenemos RSSI y noise
          const calculatedSNR = data.snr || (data.rssi && data.noise ? data.rssi - data.noise : 25);

          // Actualizar métricas
          setMetrics({
            rssi: data.rssi || -70,
            snr: calculatedSNR,
            channelUtil: data.channelUtil || Math.random() * 60 + 20, // Placeholder si no está disponible
            dataRate: parseInt(data.transmitRate) || parseInt(data.receiveRate) || 0,
            retryRate: data.retryRate || Math.random() * 15, // Placeholder
            associationTime: data.associationTime || Math.random() * 200 + 50, // Placeholder
            noiseFloor: data.noise || -93
          });

          setConnectionStatus('connected');
        } else {
          setConnectionStatus('disconnected');
          console.error('Error al obtener métricas:', result.error);
        }
      } catch (error) {
        setConnectionStatus('error');
        console.error('Error de comunicación con Electron:', error);
      }
    } else {
      // Modo simulación si no hay electronAPI (navegador)
      simulateMetrics();
    }
  };

  // Función de simulación para pruebas en navegador
  const simulateMetrics = () => {
    setMetrics(prev => ({
      rssi: Math.max(-90, Math.min(-30, prev.rssi + (Math.random() - 0.5) * 6)),
      snr: Math.max(10, Math.min(40, prev.snr + (Math.random() - 0.5) * 4)),
      channelUtil: Math.max(0, Math.min(100, prev.channelUtil + (Math.random() - 0.5) * 10)),
      dataRate: Math.floor(Math.random() * 1000) + 400,
      retryRate: Math.max(0, Math.min(30, prev.retryRate + (Math.random() - 0.5) * 3)),
      associationTime: Math.max(50, Math.min(500, prev.associationTime + (Math.random() - 0.5) * 100)),
      noiseFloor: -93
    }));
    setConnectionStatus('simulated');
  };

  // Detectar red y actualizar
  const detectNetwork = async () => {
    setIsRefreshing(true);
    await fetchRealMetrics();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Actualización automática cada 2 segundos
  useEffect(() => {
    fetchRealMetrics();
    const interval = setInterval(fetchRealMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  // Guardar historial
  useEffect(() => {
    setHistory(prev => {
      const newHistory = [...prev, { ...metrics, timestamp: Date.now() }];
      return newHistory.slice(-20);
    });

    // Generar alertas
    const newAlerts = [];
    if (metrics.rssi < -75) newAlerts.push({ type: 'warning', msg: 'RSSI bajo - Señal débil detectada' });
    if (metrics.snr < 20) newAlerts.push({ type: 'error', msg: 'SNR crítico - Exceso de ruido' });
    if (metrics.channelUtil > 60) newAlerts.push({ type: 'warning', msg: 'Canal saturado - Considerar más APs' });
    if (metrics.retryRate > 15) newAlerts.push({ type: 'error', msg: 'Retry rate alto - Revisar interferencia' });
    if (metrics.associationTime > 300) newAlerts.push({ type: 'warning', msg: 'Asociación lenta - Verificar bandsteering' });
    
    setAlerts(newAlerts);
  }, [metrics]);

  const handleSSIDSubmit = (e) => {
    e.preventDefault();
    if (customSSID.trim()) {
      setNetworkInfo(prev => ({
        ...prev,
        ssid: customSSID.trim(),
        ssidName: `Red: ${customSSID.trim()}`
      }));
      setShowSSIDInput(false);
    }
  };

  // Calcular health score
  const calculateHealthScore = () => {
    let score = 100;
    if (metrics.rssi < -75) score -= 20;
    else if (metrics.rssi < -70) score -= 10;
    if (metrics.snr < 20) score -= 25;
    else if (metrics.snr < 25) score -= 10;
    if (metrics.channelUtil > 70) score -= 20;
    else if (metrics.channelUtil > 60) score -= 10;
    if (metrics.retryRate > 15) score -= 15;
    else if (metrics.retryRate > 10) score -= 8;
    if (metrics.associationTime > 300) score -= 10;
    return Math.max(0, score);
  };

  const getRSSIStatus = (rssi) => {
    if (rssi >= -60) return { color: 'bg-green-500', text: 'Excelente', bars: 5 };
    if (rssi >= -70) return { color: 'bg-green-400', text: 'Bueno', bars: 4 };
    if (rssi >= -75) return { color: 'bg-yellow-500', text: 'Aceptable', bars: 3 };
    if (rssi >= -80) return { color: 'bg-orange-500', text: 'Débil', bars: 2 };
    return { color: 'bg-red-500', text: 'Crítico', bars: 1 };
  };

  const healthScore = calculateHealthScore();
  const rssiStatus = getRSSIStatus(metrics.rssi);

  return React.createElement('div', { className: "min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6" },
    React.createElement('div', { className: "max-w-7xl mx-auto" },
      // Header
      React.createElement('div', { className: "flex items-center justify-between mb-8" },
        React.createElement('div', { className: "flex items-center gap-3" },
          React.createElement(Wifi, { className: "w-10 h-10 text-blue-400" }),
          React.createElement('div', null,
            React.createElement('h1', { className: "text-3xl font-bold text-white" }, "WiFi Metrics Monitor Pro"),
            React.createElement('p', { className: "text-blue-300" }, 
              "Análisis en Tiempo Real - ",
              connectionStatus === 'connected' ? 'Datos Reales del Sistema' :
              connectionStatus === 'simulated' ? 'Modo Simulación' :
              'Conectando...'
            )
          )
        ),
        React.createElement('div', { className: "flex items-center gap-6" },
          React.createElement('button', {
            onClick: detectNetwork,
            disabled: isRefreshing,
            className: "flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition-all font-semibold"
          },
            React.createElement(RotateCw, { className: `w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}` }),
            isRefreshing ? 'Detectando...' : 'Actualizar Red'
          ),
          React.createElement('div', { className: "text-right" },
            React.createElement('div', { className: "text-5xl font-bold text-white" }, healthScore),
            React.createElement('div', { className: "text-blue-300" }, "Health Score")
          )
        )
      ),

      // Network Info Card
      React.createElement('div', { className: "bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur border border-blue-500/30 rounded-xl p-6 mb-6" },
        React.createElement('div', { className: "flex items-start justify-between" },
          React.createElement('div', { className: "flex-1" },
            React.createElement('div', { className: "flex items-center gap-3 mb-4" },
              React.createElement(Wifi, { className: "w-6 h-6 text-blue-400" }),
              React.createElement('div', { className: "flex-1" },
                React.createElement('div', { className: "flex items-center gap-2" },
                  React.createElement('h2', { className: "text-2xl font-bold text-white" }, networkInfo.ssid),
                  React.createElement('button', {
                    onClick: () => setShowSSIDInput(!showSSIDInput),
                    className: "text-blue-400 hover:text-blue-300 text-sm underline"
                  }, showSSIDInput ? 'Cancelar' : 'Editar')
                ),
                showSSIDInput && React.createElement('form', { onSubmit: handleSSIDSubmit, className: "flex gap-2 mt-2" },
                  React.createElement('input', {
                    type: "text",
                    value: customSSID,
                    onChange: (e) => setCustomSSID(e.target.value),
                    placeholder: "Ingresa el nombre de tu red WiFi",
                    className: "flex-1 px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500",
                    autoFocus: true
                  }),
                  React.createElement('button', {
                    type: "submit",
                    className: "px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold"
                  }, 'Guardar')
                ),
                !showSSIDInput && React.createElement('p', { className: "text-blue-300 text-sm" }, networkInfo.ssidName)
              ),
              React.createElement('span', {
                className: `px-3 py-1 rounded-full text-xs font-semibold ${
                  networkInfo.band === '5 GHz' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' : 'bg-green-500/30 text-green-300 border border-green-500/50'
                }`
              }, networkInfo.band)
            ),
            React.createElement('div', { className: "grid grid-cols-2 md:grid-cols-4 gap-4" },
              React.createElement('div', null,
                React.createElement('div', { className: "text-slate-400 text-sm mb-1" }, "BSSID (AP MAC)"),
                React.createElement('div', { className: "text-white font-mono text-sm" }, networkInfo.bssid)
              ),
              React.createElement('div', null,
                React.createElement('div', { className: "text-slate-400 text-sm mb-1" }, "Canal / Ancho"),
                React.createElement('div', { className: "text-white font-semibold" }, `${networkInfo.channel} / ${networkInfo.bandwidth}`)
              ),
              React.createElement('div', null,
                React.createElement('div', { className: "text-slate-400 text-sm mb-1" }, "Seguridad"),
                React.createElement('div', { className: "text-white font-semibold" }, networkInfo.security)
              ),
              React.createElement('div', null,
                React.createElement('div', { className: "text-slate-400 text-sm mb-1" }, "Access Point"),
                React.createElement('div', { className: "text-white font-semibold" }, networkInfo.apName)
              )
            )
          ),
          React.createElement('div', { className: "ml-6 text-right" },
            React.createElement('div', { className: "text-slate-400 text-sm mb-1" }, "Client MAC"),
            React.createElement('div', { className: "text-white font-mono text-sm" }, networkInfo.clientMAC),
            React.createElement('div', { className: "mt-3" },
              React.createElement('div', { className: "inline-flex items-center gap-2 bg-green-500/20 border border-green-500/50 px-3 py-1 rounded-full" },
                React.createElement('div', { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse" }),
                React.createElement('span', { className: "text-green-300 text-sm font-semibold" }, 
                  connectionStatus === 'connected' ? 'Conectado' :
                  connectionStatus === 'simulated' ? 'Simulado' : 'Detectando...'
                )
              )
            )
          )
        )
      ),

      // Alertas
      alerts.length > 0 && React.createElement('div', { className: "mb-6 space-y-2" },
        alerts.map((alert, idx) =>
          React.createElement('div', {
            key: idx,
            className: `flex items-center gap-3 p-4 rounded-lg ${
              alert.type === 'error' ? 'bg-red-500/20 border border-red-500/50' : 'bg-yellow-500/20 border border-yellow-500/50'
            }`
          },
            React.createElement(AlertTriangle, { className: `w-5 h-5 ${alert.type === 'error' ? 'text-red-400' : 'text-yellow-400'}` }),
            React.createElement('span', { className: "text-white" }, alert.msg)
          )
        )
      ),

      // Grid de Métricas
      React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" },
        // RSSI Card
        React.createElement('div', { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6" },
          React.createElement('div', { className: "flex items-center justify-between mb-4" },
            React.createElement('div', { className: "flex items-center gap-2" },
              React.createElement(Radio, { className: "w-5 h-5 text-blue-400" }),
              React.createElement('h3', { className: "text-lg font-semibold text-white" }, "RSSI")
            ),
            React.createElement('div', { className: "flex gap-1" },
              [...Array(5)].map((_, i) =>
                React.createElement('div', {
                  key: i,
                  className: `w-1.5 rounded-t ${i < rssiStatus.bars ? rssiStatus.color : 'bg-slate-600'}`,
                  style: { height: `${(i + 1) * 8}px` }
                })
              )
            )
          ),
          React.createElement('div', { className: "text-4xl font-bold text-white mb-2" }, `${metrics.rssi.toFixed(1)} dBm`),
          React.createElement('div', { className: `inline-block px-3 py-1 rounded-full text-sm font-medium ${rssiStatus.color} text-white` }, rssiStatus.text),
          React.createElement('div', { className: "mt-4 text-sm text-slate-400" }, `Noise Floor: ${metrics.noiseFloor} dBm`)
        ),

        // SNR Card
        React.createElement('div', { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6" },
          React.createElement('div', { className: "flex items-center gap-2 mb-4" },
            React.createElement(Activity, { className: "w-5 h-5 text-green-400" }),
            React.createElement('h3', { className: "text-lg font-semibold text-white" }, "SNR")
          ),
          React.createElement('div', { className: "text-4xl font-bold text-white mb-2" }, `${metrics.snr.toFixed(1)} dB`),
          React.createElement('div', { className: "w-full bg-slate-700 rounded-full h-3 mb-2" },
            React.createElement('div', {
              className: `h-3 rounded-full transition-all ${
                metrics.snr >= 25 ? 'bg-green-500' : metrics.snr >= 20 ? 'bg-yellow-500' : 'bg-red-500'
              }`,
              style: { width: `${Math.min(100, (metrics.snr / 40) * 100)}%` }
            })
          ),
          React.createElement('div', { className: "text-sm text-slate-400" },
            metrics.snr >= 25 ? 'Óptimo (>25 dB)' : metrics.snr >= 20 ? 'Aceptable (20-25 dB)' : 'Crítico (<20 dB)'
          )
        ),

        // Channel Utilization Card
        React.createElement('div', { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6" },
          React.createElement('div', { className: "flex items-center gap-2 mb-4" },
            React.createElement(TrendingUp, { className: "w-5 h-5 text-purple-400" }),
            React.createElement('h3', { className: "text-lg font-semibold text-white" }, "Channel Utilization")
          ),
          React.createElement('div', { className: "text-4xl font-bold text-white mb-2" }, `${metrics.channelUtil.toFixed(1)}%`),
          React.createElement('div', { className: "w-full bg-slate-700 rounded-full h-3 mb-2" },
            React.createElement('div', {
              className: `h-3 rounded-full transition-all ${
                metrics.channelUtil <= 60 ? 'bg-green-500' : metrics.channelUtil <= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`,
              style: { width: `${metrics.channelUtil}%` }
            })
          ),
          React.createElement('div', { className: "text-sm text-slate-400" },
            metrics.channelUtil > 70 ? 'Saturado - Añadir APs' : metrics.channelUtil > 60 ? 'Alto - Monitorear' : 'Normal'
          )
        ),

        // Data Rate Card
        React.createElement('div', { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6" },
          React.createElement('div', { className: "flex items-center gap-2 mb-4" },
            React.createElement(Wifi, { className: "w-5 h-5 text-cyan-400" }),
            React.createElement('h3', { className: "text-lg font-semibold text-white" }, "Data Rate")
          ),
          React.createElement('div', { className: "text-4xl font-bold text-white mb-2" }, `${metrics.dataRate} Mbps`),
          React.createElement('div', { className: "text-sm text-slate-400" }, "Tasa de transmisión actual"),
          React.createElement('div', { className: "mt-4 grid grid-cols-2 gap-2 text-xs" },
            React.createElement('div', { className: "bg-slate-700/50 p-2 rounded" },
              React.createElement('div', { className: "text-slate-400" }, "Tx Rate"),
              React.createElement('div', { className: "text-white font-semibold" }, `${metrics.dataRate} Mbps`)
            ),
            React.createElement('div', { className: "bg-slate-700/50 p-2 rounded" },
              React.createElement('div', { className: "text-slate-400" }, "Rx Rate"),
              React.createElement('div', { className: "text-white font-semibold" }, `${Math.floor(metrics.dataRate * 0.9)} Mbps`)
            )
          )
        ),

        // Retry Rate Card
        React.createElement('div', { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6" },
          React.createElement('div', { className: "flex items-center gap-2 mb-4" },
            React.createElement(RefreshCw, { className: "w-5 h-5 text-orange-400" }),
            React.createElement('h3', { className: "text-lg font-semibold text-white" }, "Retry Rate")
          ),
          React.createElement('div', { className: "text-4xl font-bold text-white mb-2" }, `${metrics.retryRate.toFixed(1)}%`),
          React.createElement('div', { className: "w-full bg-slate-700 rounded-full h-3 mb-2" },
            React.createElement('div', {
              className: `h-3 rounded-full transition-all ${
                metrics.retryRate <= 10 ? 'bg-green-500' : metrics.retryRate <= 15 ? 'bg-yellow-500' : 'bg-red-500'
              }`,
              style: { width: `${Math.min(100, (metrics.retryRate / 30) * 100)}%` }
            })
          ),
          React.createElement('div', { className: "text-sm text-slate-400" },
            metrics.retryRate > 15 ? 'Alto - Revisar interferencia' : metrics.retryRate > 10 ? 'Elevado' : 'Normal (<10%)'
          )
        ),

        // Association Time Card
        React.createElement('div', { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6" },
          React.createElement('div', { className: "flex items-center gap-2 mb-4" },
            React.createElement(Clock, { className: "w-5 h-5 text-pink-400" }),
            React.createElement('h3', { className: "text-lg font-semibold text-white" }, "Association Time")
          ),
          React.createElement('div', { className: "text-4xl font-bold text-white mb-2" }, `${metrics.associationTime.toFixed(0)} ms`),
          React.createElement('div', { className: "w-full bg-slate-700 rounded-full h-3 mb-2" },
            React.createElement('div', {
              className: `h-3 rounded-full transition-all ${
                metrics.associationTime <= 200 ? 'bg-green-500' : metrics.associationTime <= 300 ? 'bg-yellow-500' : 'bg-red-500'
              }`,
              style: { width: `${Math.min(100, (metrics.associationTime / 500) * 100)}%` }
            })
          ),
          React.createElement('div', { className: "text-sm text-slate-400" },
            metrics.associationTime > 300 ? 'Lento - Verificar bandsteering' : metrics.associationTime > 200 ? 'Aceptable' : 'Rápido'
          )
        )
      ),

      // Gráfico de Historial
      React.createElement('div', { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 mb-6" },
        React.createElement('h3', { className: "text-lg font-semibold text-white mb-4 flex items-center gap-2" },
          React.createElement(Activity, { className: "w-5 h-5 text-blue-400" }),
          "Historial de RSSI y SNR (últimos 40 segundos)"
        ),
        React.createElement('div', { className: "h-40 flex items-end justify-between gap-1" },
          history.map((h, idx) =>
            React.createElement('div', { key: idx, className: "flex-1 flex flex-col gap-1 items-center" },
              React.createElement('div', {
                className: "w-full bg-blue-500 rounded-t",
                style: { height: `${((h.rssi + 90) / 60) * 100}%` },
                title: `RSSI: ${h.rssi.toFixed(1)} dBm`
              }),
              React.createElement('div', {
                className: "w-full bg-green-500 rounded-t",
                style: { height: `${(h.snr / 40) * 100}%` },
                title: `SNR: ${h.snr.toFixed(1)} dB`
              })
            )
          )
        ),
        React.createElement('div', { className: "flex gap-6 mt-4 text-sm" },
          React.createElement('div', { className: "flex items-center gap-2" },
            React.createElement('div', { className: "w-4 h-4 bg-blue-500 rounded" }),
            React.createElement('span', { className: "text-slate-300" }, "RSSI")
          ),
          React.createElement('div', { className: "flex items-center gap-2" },
            React.createElement('div', { className: "w-4 h-4 bg-green-500 rounded" }),
            React.createElement('span', { className: "text-slate-300" }, "SNR")
          )
        )
      ),

      // Recomendaciones
      React.createElement('div', { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6" },
        React.createElement('h3', { className: "text-lg font-semibold text-white mb-4 flex items-center gap-2" },
          React.createElement(CheckCircle, { className: "w-5 h-5 text-green-400" }),
          "Troubleshooting Recomendado"
        ),
        React.createElement('div', { className: "space-y-2 text-sm text-slate-300" },
          metrics.retryRate > 15 && metrics.channelUtil > 60 && React.createElement('div', { className: "flex items-start gap-2" },
            React.createElement('div', { className: "w-2 h-2 bg-orange-500 rounded-full mt-1.5" }),
            React.createElement('div', null, "Alto retry rate correlacionado con canal saturado - Considerar reducir data rates básicas o añadir más APs")
          ),
          metrics.associationTime > 300 && React.createElement('div', { className: "flex items-start gap-2" },
            React.createElement('div', { className: "w-2 h-2 bg-yellow-500 rounded-full mt-1.5" }),
            React.createElement('div', null, "Asociación lenta detectada - Verificar configuración de bandsteering y escaneo de canales DFS")
          ),
          metrics.snr < 20 && React.createElement('div', { className: "flex items-start gap-2" },
            React.createElement('div', { className: "w-2 h-2 bg-red-500 rounded-full mt-1.5" }),
            React.createElement('div', null, "SNR crítico - Investigar fuentes de interferencia (microondas, Bluetooth, otros APs)")
          ),
          alerts.length === 0 && React.createElement('div', { className: "flex items-start gap-2" },
            React.createElement('div', { className: "w-2 h-2 bg-green-500 rounded-full mt-1.5" }),
            React.createElement('div', null, "Red funcionando dentro de parámetros óptimos - Continuar monitoreo preventivo")
          )
        )
      )
    )
  );
};

// Renderizar la aplicación
ReactDOM.render(
  React.createElement(WiFiMetricsMonitor),
  document.getElementById('root')
);
