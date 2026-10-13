import React, { useState, useEffect, useRef } from 'react';
import ControlPanel from './components/ControlPanel';

// 1. COMPONENTE VISOR DE SEÑALES (Renderiza datos DSP y RF reales con cotas calibradas)
const SignalDisplay = ({ isActive, signalData, centerFreqStr, spectrumInfo }) => {
  const peakOffsetKHz = spectrumInfo?.peak_offset_hz
    ? (spectrumInfo.peak_offset_hz / 1e3).toFixed(1)
    : '0.0';

  const peakFreqGHz = spectrumInfo?.peak_freq_hz
    ? (spectrumInfo.peak_freq_hz / 1e9).toFixed(6)
    : (parseFloat(centerFreqStr) || 2.480).toFixed(6);

  const peakPowerDb = spectrumInfo?.peak_power_db !== undefined
    ? `${spectrumInfo.peak_power_db} dB`
    : '---';

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      {/* =========================================================
          TARJETA 1: Analizador de Espectro (PSD) Calibrado con Regla de Frecuencia
      ========================================================= */}
      <div className='bg-white border border-blue-100 rounded-2xl p-5 shadow-sm min-h-[360px] flex flex-col justify-between'>
        <div className='flex justify-between items-start mb-2'>
          <div>
            <div className='flex items-center gap-2'>
              <h3 className='text-gray-800 font-bold text-sm uppercase tracking-wider'>
                Densidad Espectral de Potencia (PSD)
              </h3>
              <span className='px-1.5 py-0.5 text-[10px] font-mono bg-blue-100 text-blue-700 rounded font-semibold'>
                BW: 2.0 MSPS
              </span>
            </div>
            <p className='text-[11px] text-gray-400 font-mono mt-0.5'>
              128 Bins FFT • Ventana Blackman • Desplazamiento Centrado
            </p>
          </div>

          {/* Badge del Pico Espectral Detectado en Tiempo Real */}
          <div className='flex flex-col items-end bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-right'>
            <span className='text-[9px] font-mono uppercase tracking-wider text-cyan-400 font-bold'>
              Pico Detectado
            </span>
            <span className='text-xs font-mono font-bold text-white'>
              {peakOffsetKHz >= 0 ? `+${peakOffsetKHz}` : peakOffsetKHz} kHz
            </span>
            <span className='text-[10px] font-mono text-cyan-300'>
              {peakFreqGHz} GHz
            </span>
          </div>
        </div>

        {/* Pantalla del Analizador de Espectro con Cuadrícula y Cotas en dB */}
        <div className='flex-grow flex items-end justify-center border border-slate-800 rounded-xl bg-slate-950 p-3 h-56 gap-[1.5px] overflow-hidden relative shadow-inner'>
          {/* Líneas de cota horizontales (Niveles en dB) */}
          <div className='absolute inset-0 flex flex-col justify-between p-2 pointer-events-none'>
            <div className='w-full border-b border-cyan-500/20 flex justify-between'>
              <span className='text-[9px] font-mono text-cyan-500/40 -mt-2'>0 dB (Máx)</span>
            </div>
            <div className='w-full border-b border-cyan-500/15 flex justify-between'>
              <span className='text-[9px] font-mono text-cyan-500/40 -mt-2'>-15 dB</span>
            </div>
            <div className='w-full border-b border-cyan-500/15 flex justify-between'>
              <span className='text-[9px] font-mono text-cyan-500/40 -mt-2'>-30 dB</span>
            </div>
            <div className='w-full border-b border-cyan-500/10 flex justify-between'>
              <span className='text-[9px] font-mono text-cyan-500/40 -mt-2'>Piso Ruido</span>
            </div>
          </div>

          {/* Línea de cota vertical central (Portadora Central fc) */}
          <div className='absolute inset-0 flex justify-center pointer-events-none'>
            <div className='h-full border-r border-amber-400/50 border-dashed z-0'></div>
          </div>

          {/* Barras de Espectro */}
          {isActive && signalData?.psd?.length > 0 ? (
            signalData.psd.map((val, idx) => {
              const heightPct = Math.min(98, Math.max(5, val));
              const isPeak = idx === (signalData.peakBin ?? -1);

              return (
                <div
                  key={idx}
                  className={`flex-grow rounded-t-sm transition-all duration-75 z-10 ${
                    isPeak
                      ? 'bg-gradient-to-t from-amber-500 via-yellow-400 to-white shadow-[0_0_8px_#facc15]'
                      : 'bg-gradient-to-t from-blue-700 via-sky-400 to-cyan-300'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              );
            })
          ) : (
            <div className='self-center text-cyan-500/70 font-mono text-xs tracking-wider z-10'>
              {isActive
                ? '[ Sincronizando ráfagas DSP... ]'
                : '[ Espectrómetro en Reposo - Inicia Recepción ]'}
            </div>
          )}
        </div>

        {/* Regla de Escala de Frecuencia con Líneas de Cota */}
        <div className='mt-2.5 pt-1.5 border-t border-gray-100 flex flex-col gap-1'>
          <div className='flex justify-between items-center text-[10px] font-mono font-semibold text-gray-600 px-0.5'>
            <span className='text-left'>-1.0 MHz</span>
            <span className='text-left'>-500 kHz</span>
            <span className='text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded'>
              0 Hz (fc = {centerFreqStr})
            </span>
            <span className='text-right'>+500 kHz</span>
            <span className='text-right'>+1.0 MHz</span>
          </div>
          <div className='flex justify-between text-[9px] font-mono text-gray-400 px-1'>
            <span>2.4790 GHz</span>
            <span>2.4795 GHz</span>
            <span className='text-blue-500 font-semibold'>Portadora Sintonizada</span>
            <span>2.4805 GHz</span>
            <span>2.4810 GHz</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          TARJETA 2: Diagrama de Constelación Espacial I/Q
      ========================================================= */}
      <div className='bg-white border border-blue-100 rounded-2xl p-5 shadow-sm min-h-[360px] flex flex-col justify-between'>
        <div className='flex justify-between items-start mb-2'>
          <div>
            <div className='flex items-center gap-2'>
              <h3 className='text-gray-800 font-bold text-sm uppercase tracking-wider'>
                Espacio de Estado de Constelación (I/Q)
              </h3>
              <span className='px-1.5 py-0.5 text-[10px] font-mono bg-emerald-100 text-emerald-700 rounded font-semibold'>
                Normalizado RMS=1.0
              </span>
            </div>
            <p className='text-[11px] text-gray-400 font-mono mt-0.5'>
              Compensación CFO Activa • Muestreo en Fase y Cuadratura
            </p>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
            }`}></span>
        </div>

        {/* Pantalla del Osciloscopio XY / Constelación */}
        <div className='flex-grow flex items-center justify-center border border-slate-800 rounded-xl bg-slate-950 h-56 relative overflow-hidden shadow-inner'>
          {/* Ejes Cartesianos I y Q */}
          <div className='absolute w-full h-[1px] bg-cyan-800/40'></div>
          <div className='absolute h-full w-[1px] bg-cyan-800/40'></div>

          {/* Anillos concéntricos de referencia de energía unitaria */}
          <div className='absolute w-24 h-24 rounded-full border border-cyan-800/25 pointer-events-none'></div>
          <div className='absolute w-40 h-40 rounded-full border border-cyan-500/30 border-dashed pointer-events-none'></div>
          <div className='absolute w-52 h-52 rounded-full border border-cyan-800/20 pointer-events-none'></div>

          {/* Etiquetas de los Ejes */}
          <span className='absolute right-2 top-1/2 text-[10px] font-mono text-cyan-400/80 transform -translate-y-1/2 font-bold'>
            +I (Fase)
          </span>
          <span className='absolute left-2 top-1/2 text-[10px] font-mono text-cyan-400/40 transform -translate-y-1/2'>
            -I
          </span>
          <span className='absolute top-2 left-1/2 text-[10px] font-mono text-cyan-400/80 transform -translate-x-1/2 font-bold'>
            +Q (Cuadratura)
          </span>
          <span className='absolute bottom-2 left-1/2 text-[10px] font-mono text-cyan-400/40 transform -translate-x-1/2'>
            -Q
          </span>

          {/* Renderizado de Nube de Puntos IQ Normalizados */}
          {isActive && signalData?.iq?.i?.length > 0 ? (
            <div className='absolute inset-0'>
              {signalData.iq.i.map((valI, idx) => {
                const valQ = signalData.iq.q[idx] ?? 0;
                // Como los puntos ahora están normalizados a RMS=1.0 (rango típico [-1.5, +1.5]):
                // 50% centro + val * 24% ubica el círculo unitario en el 74% de la pantalla
                const leftPos = Math.min(94, Math.max(6, 50 + valI * 24));
                const topPos = Math.min(94, Math.max(6, 50 - valQ * 24));

                return (
                  <div
                    key={idx}
                    className='absolute w-2 h-2 bg-cyan-400 rounded-full opacity-80 shadow-[0_0_6px_#22d3ee] transform -translate-x-1/2 -translate-y-1/2'
                    style={{
                      left: `${leftPos}%`,
                      top: `${topPos}%`
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <p className='text-cyan-500/70 font-mono text-xs tracking-wider z-10'>
              [ Constelación Vacía ]
            </p>
          )}
        </div>

        {/* Cuadrantes de Referencia */}
        <div className='mt-2.5 pt-1.5 border-t border-gray-100 flex justify-between items-center text-[10px] font-mono text-gray-500 px-1'>
          <span>Q2: (-I, +Q)</span>
          <span className='text-gray-400 font-semibold'>Círculo Unitario (|s| = 1.0)</span>
          <span>Q1: (+I, +Q)</span>
        </div>
      </div>
    </div>
  );
};

// 2. COMPONENTE DE TARJETAS DE MÉTRICAS GENERALES
const MetricsPanel = ({ isActive, metrics }) => {
  const defaultMetrics = [
    {
      title: 'Modo de Captura',
      value: isActive ? (metrics?.mode === 'pluto' ? 'Pluto+ SDR' : 'Simulación') : '---',
      badge: metrics?.mode === 'pluto' ? 'Hardware OTA' : 'Dataset 1024',
      color: 'text-indigo-600'
    },
    {
      title: 'Frecuencia Central',
      value: isActive ? (metrics?.centerFrequency || '2.480 GHz') : '---',
      badge: metrics?.bandwidth || '2.0 MSPS',
      color: 'text-blue-600'
    },
    {
      title: 'Modulación Detectada',
      value: isActive ? (metrics?.modulation || '---') : '---',
      badge: metrics?.family || '---',
      color: 'text-amber-600',
      subtitle: metrics?.runnerUp ? `2do: ${metrics.runnerUp.mod} (${(metrics.runnerUp.prob * 100).toFixed(0)}%)` : null
    },
    {
      title: 'Confianza IA / SNR',
      value: isActive ? (metrics?.accuracy || '---') : '---',
      badge: metrics?.snr ? `SNR: ${metrics.snr}` : '---',
      color: 'text-emerald-600',
      subtitle: metrics?.candidatesCount ? 'Suavizado temporal (5 ráfagas)' : null
    }
  ];

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
      {defaultMetrics.map((metric, idx) => (
        <div
          key={idx}
          className='bg-white border border-blue-100 p-4 rounded-2xl shadow-sm flex flex-col justify-between'>
          <p className='text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1'>
            {metric.title}
          </p>
          <p className={`text-xl md:text-2xl font-bold font-mono ${metric.color}`}>
            {metric.value}
          </p>
          <div className='mt-2 flex items-center justify-between'>
            <div className='flex items-center gap-1.5'>
              <span className='inline-block w-1.5 h-1.5 rounded-full bg-blue-500'></span>
              <span className='text-[10px] font-medium text-gray-400 uppercase tracking-tight'>
                {metric.badge}
              </span>
            </div>
            {metric.subtitle && (
              <span className='text-[9px] font-mono text-gray-500 bg-gray-50 border border-gray-150 px-1.5 py-0.5 rounded'>
                {metric.subtitle}
              </span>
            )}
          </div>
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
  const [spectrumInfo, setSpectrumInfo] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const ws = useRef(null);

  const [config, setConfig] = useState({
    mode: 'simulation',
    frequency: '2.480',
    gain: '30',
    process_psd: true,
    process_constellation: true,
    run_amc_inference: true
  });

  // Verificar salud del backend en arranque
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/control/status');
        if (res.ok) {
          const data = await res.json();
          setBackendOnline(true);
          if (data.is_running && !isActive) {
            setIsActive(true);
          }
        }
      } catch (err) {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Enviar comando HTTP al backend para iniciar/detener el escaneo
  const handleToggleActive = async (desiredState) => {
    try {
      const freqHz = Math.round(parseFloat(config.frequency) * 1e9) || 2480000000;
      const gainDb = parseFloat(config.gain) || 30.0;

      const res = await fetch('http://127.0.0.1:8000/api/v1/control/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active: desiredState,
          config: {
            mode: config.mode,
            pluto_freq_hz: freqHz,
            pluto_sample_rate: 2000000,
            pluto_gain_db: gainDb,
            process_constellation: config.process_constellation,
            process_psd: config.process_psd,
            run_amc_inference: config.run_amc_inference
          }
        })
      });

      if (res.ok) {
        setIsActive(desiredState);
        setBackendOnline(true);
      } else {
        console.error('El backend retornó error al cambiar estado:', res.status);
      }
    } catch (err) {
      console.error('No se pudo conectar con el backend HTTP:', err);
      alert('Error de enlace con http://127.0.0.1:8000. Verifica que el servidor FastAPI esté corriendo.');
    }
  };

  // Manejador reactivo de configuración
  const handleConfigChange = (key, value) => {
    setConfig((prev) => {
      const updated = { ...prev, [key]: value };

      // Si el streaming ya está activo, enviar la actualización inmediatamente al backend
      if (isActive) {
        const freqHz = Math.round(parseFloat(updated.frequency) * 1e9) || 2480000000;
        const gainDb = parseFloat(updated.gain) || 30.0;

        fetch('http://127.0.0.1:8000/api/v1/control/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            active: true,
            config: {
              mode: updated.mode,
              pluto_freq_hz: freqHz,
              pluto_sample_rate: 2000000,
              pluto_gain_db: gainDb,
              process_constellation: updated.process_constellation,
              process_psd: updated.process_psd,
              run_amc_inference: updated.run_amc_inference
            }
          })
        }).catch((err) => console.error('Error sincronizando configuración:', err));
      }

      return updated;
    });
  };

  // Manejo de Ciclo de Vida del WebSocket
  useEffect(() => {
    if (isActive) {
      const socket = new WebSocket('ws://127.0.0.1:8000/api/v1/stream/ws');
      ws.current = socket;

      socket.onopen = () => {
        console.log('✅ WebSocket conectado con DeepSignal Core');
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          const psdArray = payload.psd || [];
          const iqData = payload.constellation || payload.data || null;

          const modName = payload.classification?.modulation || payload.predicted_class || '---';
          const prob = payload.classification?.probability !== undefined
            ? payload.classification.probability
            : (payload.confidence || 0);

          const family = payload.classification?.family || '---';
          const snrVal = payload.snr !== undefined ? `${Number(payload.snr).toFixed(1)} dB` : '---';

          const centerFreqStr = payload.center_freq_hz
            ? `${(payload.center_freq_hz / 1e9).toFixed(3)} GHz`
            : `${config.frequency} GHz`;

          const topCandidates = payload.classification?.top_candidates || [];
          const runnerUp = topCandidates.length > 1
            ? { mod: topCandidates[1].modulation, prob: topCandidates[1].probability }
            : null;

          setMetrics({
            centerFrequency: centerFreqStr,
            bandwidth: '2.0 MSPS',
            modulation: modName,
            family: family,
            accuracy: prob > 0 ? `${(prob * 100).toFixed(1)} %` : '---',
            snr: snrVal,
            mode: payload.mode || config.mode,
            runnerUp: runnerUp,
            candidatesCount: topCandidates.length
          });

          // Pico espectral
          if (payload.spectrum) {
            setSpectrumInfo(payload.spectrum);
          }

          setSignalData({
            psd: psdArray,
            peakBin: payload.spectrum?.peak_bin,
            iq: iqData
          });
        } catch (err) {
          console.error('❌ Error parseando payload de señal:', err);
        }
      };

      socket.onerror = (error) => {
        console.error('❌ Error en WebSocket Stream:', error);
      };

      socket.onclose = () => {
        console.log('🔌 Conexión WebSocket cerrada');
      };
    } else {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      setSignalData(null);
      setMetrics(null);
      setSpectrumInfo(null);
    }

    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [isActive, config.frequency]);

  return (
    <div className='min-h-screen bg-slate-50 text-gray-900 antialiased font-sans'>
      {/* Barra de Encabezado */}
      <header className='border-b border-blue-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <div className='flex items-center gap-2.5'>
            <span className='px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-100 text-blue-700 tracking-wide'>
              DEEPSIGNAL RFML
            </span>
            <h1 className='text-lg font-bold tracking-tight text-gray-800'>
              Reconocimiento de Modulaciones Digitales (AMC)
            </h1>
          </div>
          <p className='text-xs text-gray-500 mt-0.5 font-medium'>
            Trabajo Especial de Grado — SDR Pluto+ & Redes Neuronales • Universidad de Carabobo
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-mono'>
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline ? 'bg-emerald-500' : 'bg-red-400'
              }`}></span>
            <span className='text-gray-600'>
              Backend: {backendOnline ? 'En Línea' : 'Desconectado'}
            </span>
          </div>

          <div className='flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200 text-xs font-mono font-medium text-blue-700'>
            <span
              className={`w-2 h-2 rounded-full ${
                isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></span>
            <span>Stream: {isActive ? 'Activo' : 'Pausado'}</span>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className='max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Panel Izquierdo: Controles */}
        <div className='lg:col-span-1'>
          <ControlPanel
            isActive={isActive}
            onToggleActive={handleToggleActive}
            config={config}
            onConfigChange={handleConfigChange}
          />
        </div>

        {/* Panel Derecho: Visualizadores y Métricas */}
        <div className='lg:col-span-3 space-y-6'>
          <MetricsPanel isActive={isActive} metrics={metrics} />
          <SignalDisplay
            isActive={isActive}
            signalData={signalData}
            centerFreqStr={`${config.frequency} GHz`}
            spectrumInfo={spectrumInfo}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
