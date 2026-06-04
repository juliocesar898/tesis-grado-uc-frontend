import React, { useState, useEffect, useRef } from 'react';
import ControlPanel from './components/ControlPanel';

// 1. COMPONENTE VISOR DE SEÑALES (Renderiza los datos reales del WebSocket)
const SignalDisplay = ({ isActive, signalData }) => {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      {/* =========================================================
          TARJETA 1: Analizador de Espectro (PSD) Calibrado y Centrado
      ========================================================= */}
      <div className='bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg min-h-[320px] flex flex-col justify-between'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-gray-400 font-medium text-sm uppercase tracking-wider'>
            Densidad Espectral de Potencia (PSD)
          </h3>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-600'
            }`}></span>
        </div>

        <div className='flex-grow flex items-end justify-center border border-gray-950 rounded-lg bg-black/50 p-4 h-56 gap-[2px] overflow-hidden'>
          {isActive && signalData?.psd?.length > 0 ? (
            (() => {
              const rawPsd = signalData.psd;
              const half = Math.floor(rawPsd.length / 2);

              // 1. Aplicamos el "fftshift" para centrar la portadora en el medio de la gráfica
              const shiftedPsd = [
                ...rawPsd.slice(half),
                ...rawPsd.slice(0, half)
              ];

              // 2. Usamos el valor máximo global que guardamos en el estado
              const currentMax =
                signalData.maxPeak || Math.max(...shiftedPsd, 1);

              return shiftedPsd.map((amplitude, idx) => {
                // Filtramos el ruido base (descartamos el 40% inferior para limpiar el fondo)
                const dynamicFloor = currentMax * 0.4;
                let cleanAmp =
                  amplitude < dynamicFloor ? dynamicFloor : amplitude;

                // Normalización de altura para que se dibuje estéticamente entre 6% y 95%
                const heightPercentage = Math.min(
                  95,
                  Math.max(
                    6,
                    ((cleanAmp - dynamicFloor) / (currentMax - dynamicFloor)) *
                      100
                  )
                );

                return (
                  <div
                    key={idx}
                    className='bg-gradient-to-t from-green-600 via-emerald-400 to-cyan-400 flex-grow rounded-t-sm transition-all duration-75'
                    style={{ height: `${heightPercentage}%` }}
                  />
                );
              });
            })()
          ) : (
            <div className='self-center text-gray-600 font-mono text-sm'>
              {isActive
                ? '[ Recibiendo ráfagas FFT... ]'
                : '[ Grifo Cerrado - Stream Inactivo ]'}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          TARJETA 2: Diagrama de Constelación Espacial I/Q
      ========================================================= */}
      <div className='bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg min-h-[320px] flex flex-col justify-between'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-gray-400 font-medium text-sm uppercase tracking-wider'>
            Espacio de Estado de Constelación (I/Q)
          </h3>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-600'
            }`}></span>
        </div>

        <div className='flex-grow flex items-center justify-center border border-gray-950 rounded-lg bg-black/50 h-56 relative overflow-hidden'>
          {isActive && signalData?.iq?.i?.length > 0 ? (
            <div className='absolute inset-0 flex items-center justify-center'>
              {/* Ejes Cartesianos */}
              <div className='absolute w-full h-[1px] bg-gray-800/60'></div>
              <div className='absolute h-full w-[1px] bg-gray-800/60'></div>

              {/* Etiquetas de los Ejes */}
              <span className='absolute right-2 top-1/2 text-[10px] font-mono text-gray-600 transform -translate-y-1/2'>
                I (Fase)
              </span>
              <span className='absolute top-2 left-1/2 text-[10px] font-mono text-gray-600 transform -translate-x-1/2'>
                Q (Cuad)
              </span>

              {/* Renderizado de la Nube de 128 Puntos simultáneos */}
              {signalData.iq.i.map((valI, idx) => {
                const valQ = signalData.iq.q[idx];
                return (
                  <div
                    key={idx}
                    className='absolute w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-80 shadow-[0_0_4px_#22d3ee]'
                    style={{
                      left: `${50 + valI * 40}%`,
                      top: `${50 - valQ * 40}%`
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <p className='text-gray-600 font-mono text-sm'>
              [ Constelación Vacía ]
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// 2. COMPONENTE DE TARJETAS DE MÉTRICAS GENERALES
const MetricsPanel = ({ isActive, metrics }) => {
  const defaultMetrics = [
    {
      title: 'Frecuencia Central',
      value: isActive ? metrics?.centerFrequency : '---',
      color: 'text-blue-400'
    },
    {
      title: 'Ancho de Banda',
      value: isActive ? metrics?.bandwidth : '---',
      color: 'text-purple-400'
    },
    {
      title: 'Modulación Detectada',
      value: isActive ? metrics?.modulation : '---',
      color: 'text-amber-400'
    },
    {
      title: 'Confianza IA',
      value: isActive ? metrics?.accuracy : '---',
      color: 'text-emerald-400'
    }
  ];

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
      {defaultMetrics.map((metric, idx) => (
        <div
          key={idx}
          className='bg-gray-900 border border-gray-800 p-4 rounded-xl shadow-md'>
          <p className='text-gray-500 text-xs font-medium uppercase tracking-wider mb-1'>
            {metric.title}
          </p>
          <p
            className={`text-xl md:text-2xl font-bold font-mono ${metric.color}`}>
            {metric.value}
          </p>
        </div>
      ))}
    </div>
  );
};

// 3. COMPONENTE MAESTRO (APP)
function App() {
  const [isActive, setIsActive] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [signalData, setSignalData] = useState(null);
  const ws = useRef(null);

  const [config, setConfig] = useState({
    processingType: 'None',
    frequency: '2.440',
    gain: '40'
  });

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'config_update', ...newConfig }));
    }
  };

  useEffect(() => {
    if (isActive) {
      ws.current = new WebSocket('ws://127.0.0.1:8000/api/v1/stream/ws');

      ws.current.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          // Extraemos el array del PSD de forma segura
          const psdArray = payload.psd || [];

          // Calculamos de forma limpia el pico máximo aquí, manteniendo a salvo el flujo de métricas
          const maxPeakValue = psdArray.length > 0 ? Math.max(...psdArray) : 1;

          setMetrics({
            centerFrequency: `${config.frequency} GHz`,
            bandwidth: '20 MHz',
            modulation: payload.classification?.modulation || '---',
            accuracy: payload.classification?.probability
              ? (payload.classification.probability * 100).toFixed(1) + ' %'
              : '---'
          });

          setSignalData({
            psd: psdArray,
            maxPeak: maxPeakValue,
            iq: payload.constellation || null
          });
        } catch (err) {
          console.error('❌ Error parseando datos de señal:', err);
        }
      };

      ws.current.onerror = (error) => {
        console.error('error en WebSocket Core:', error);
      };

      ws.current.onclose = () => {
        console.log('Conexión con el backend cerrada');
        setIsActive(false);
      };
    } else {
      if (ws.current) {
        ws.current.close();
      }
      setSignalData(null);
      setMetrics(null);
    }

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [isActive, config.frequency]);

  return (
    <div className='min-h-screen bg-[#0b0f19] text-gray-100 antialiased font-sans'>
      <header className='border-b border-gray-900 bg-gray-950/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-xl font-bold tracking-tight bg-gradient-to-r pt-1 from-white via-gray-200 to-gray-500 bg-clip-text text-transparent'>
            Reconocimiento y Caracterización Automática de Señales
          </h1>
          <p className='text-xs text-gray-500 mt-0.5 font-medium'>
            Trabajo Especial de Grado — SDR & Inteligencia Artificial
          </p>
        </div>

        <div className='flex items-center gap-2 bg-gray-900/80 px-3 py-1.5 rounded-full border border-gray-800'>
          <span className='relative flex h-2 w-2'>
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isActive ? 'bg-green-400' : 'bg-amber-400'
              }`}></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isActive ? 'bg-green-500' : 'bg-amber-500'
              }`}></span>
          </span>
          <span
            className={`text-xs font-mono ${
              isActive ? 'text-green-400' : 'text-amber-400'
            }`}>
            Core Backend: {isActive ? 'Transmitiendo' : 'Detenido'}
          </span>
        </div>
      </header>

      <main className='max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6'>
        <div className='lg:col-span-1'>
          <ControlPanel
            isActive={isActive}
            onToggleActive={setIsActive}
            config={config}
            onConfigChange={handleConfigChange}
          />
        </div>

        <div className='lg:col-span-3 space-y-6'>
          <MetricsPanel isActive={isActive} metrics={metrics} />
          <SignalDisplay isActive={isActive} signalData={signalData} />
        </div>
      </main>
    </div>
  );
}

export default App;
