import React, { useState, useEffect, useRef } from 'react';
import ControlPanel from './components/ControlPanel';

// 1. COMPONENTE VISOR DE SEÑALES (Renderiza datos DSP y RF reales con cotas calibradas)
const SignalDisplay = ({ isActive, signalData, centerFreqStr, spectrumInfo }) => {
  const [activeView, setActiveView] = useState('waterfall'); // 'waterfall' | 'constellation'
  const waterfallCanvasRef = useRef(null);

  // Mapa de color térmico militar (Azul marino -> Cian -> Verde -> Amarillo -> Rojo brillante)
  const getThermalColor = (normVal) => {
    const val = Math.max(0, Math.min(1, (normVal - 5) / 95)); // [0.0, 1.0]
    let r, g, b;
    if (val < 0.25) {
      // Azul a Cian
      const f = val / 0.25;
      r = Math.floor(10 + f * 10);
      g = Math.floor(20 + f * 180);
      b = Math.floor(80 + f * 175);
    } else if (val < 0.5) {
      // Cian a Verde
      const f = (val - 0.25) / 0.25;
      r = Math.floor(20 + f * 40);
      g = Math.floor(200 + f * 40);
      b = Math.floor(255 - f * 200);
    } else if (val < 0.75) {
      // Verde a Amarillo
      const f = (val - 0.5) / 0.25;
      r = Math.floor(60 + f * 195);
      g = Math.floor(240 + f * 15);
      b = Math.floor(55 - f * 55);
    } else {
      // Amarillo a Rojo / Magenta brillante
      const f = (val - 0.75) / 0.25;
      r = 255;
      g = Math.floor(255 - f * 220);
      b = Math.floor(f * 80);
    }
    return [r, g, b];
  };

  // Efecto continuo para pintar la cascada espectral en el canvas GPU
  useEffect(() => {
    if (!isActive || activeView !== 'waterfall' || !waterfallCanvasRef.current) return;
    const canvas = waterfallCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const psd = signalData?.psd;
    if (!psd || psd.length === 0) return;

    const width = canvas.width;
    const height = canvas.height;

    // Desplazar imagen anterior 1 píxel hacia abajo
    ctx.drawImage(canvas, 0, 0, width, height - 1, 0, 1, width, height - 1);

    // Pintar la nueva fila en la parte superior (y = 0)
    const imgData = ctx.createImageData(width, 1);
    const data = imgData.data;

    const numBins = psd.length;
    for (let x = 0; x < width; x++) {
      const binIdx = Math.floor((x / width) * numBins);
      const val = psd[binIdx] ?? 5;
      const [r, g, b] = getThermalColor(val);

      const pIdx = x * 4;
      data[pIdx] = r;
      data[pIdx + 1] = g;
      data[pIdx + 2] = b;
      data[pIdx + 3] = 255; // Opacidad total
    }

    ctx.putImageData(imgData, 0, 0);
  }, [signalData?.psd, isActive, activeView]);

  const hasSignal = spectrumInfo?.has_signal ?? true;
  const peakOffsetKHz = (hasSignal && spectrumInfo?.peak_offset_hz !== undefined)
    ? (spectrumInfo.peak_offset_hz / 1e3).toFixed(1)
    : '0.0';

  const peakFreqGHz = (hasSignal && spectrumInfo?.peak_freq_hz)
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
              128 Bins FFT • Filtro Video IIR • Desplazamiento Centrado
            </p>
          </div>

          {/* Badge del Pico Espectral con Bloqueo de Portadora */}
          <div className='flex flex-col items-end bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-right min-w-[130px]'>
            <span className={`text-[9px] font-mono uppercase tracking-wider font-bold ${
              hasSignal ? 'text-amber-400' : 'text-cyan-400'
            }`}>
              {hasSignal ? '⚡ Ráfaga Capturada' : 'Portadora Central'}
            </span>
            <span className='text-xs font-mono font-bold text-white'>
              {hasSignal
                ? `${peakOffsetKHz >= 0 ? `+${peakOffsetKHz}` : peakOffsetKHz} kHz`
                : `${(parseFloat(centerFreqStr) || 2.480).toFixed(4)} GHz`}
            </span>
            <span className='text-[10px] font-mono text-cyan-300'>
              {hasSignal ? `${peakFreqGHz} GHz` : '[ En Reposo / Sin Ráfaga ]'}
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
          TARJETA 2: Diagrama de Constelación Espacial I/Q / Espectrograma Cascada (Waterfall)
      ========================================================= */}
      <div className='bg-white border border-blue-100 rounded-2xl p-5 shadow-sm min-h-[360px] flex flex-col justify-between'>
        <div className='flex justify-between items-start mb-2'>
          <div>
            <div className='flex items-center gap-2'>
              <h3 className='text-gray-800 font-bold text-sm uppercase tracking-wider'>
                {activeView === 'waterfall' ? 'Cascada Espectral en Tiempo Real (Waterfall)' : 'Espacio de Estado de Constelación (I/Q)'}
              </h3>
              <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded font-semibold ${
                activeView === 'waterfall' ? 'bg-cyan-100 text-cyan-800' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {activeView === 'waterfall' ? 'Barrido Temporal 2D' : 'Normalizado RMS=1.0'}
              </span>
            </div>
            <p className='text-[11px] text-gray-400 font-mono mt-0.5'>
              {activeView === 'waterfall'
                ? 'Historial de Energía • Detección de Ráfagas BLE / Transitorios RF'
                : 'Compensación CFO Activa • Muestreo en Fase y Cuadratura'}
            </p>
          </div>

          {/* Selector de Pestañas: Constelación I/Q vs Waterfall */}
          <div className='flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-mono'>
            <button
              onClick={() => setActiveView('waterfall')}
              className={`px-2.5 py-1 rounded-md transition-all font-semibold flex items-center gap-1 ${
                activeView === 'waterfall'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
              <span>🌊 Waterfall</span>
            </button>
            <button
              onClick={() => setActiveView('constellation')}
              className={`px-2.5 py-1 rounded-md transition-all font-semibold flex items-center gap-1 ${
                activeView === 'constellation'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
              <span>✦ Constelación</span>
            </button>
          </div>
        </div>

        {/* PANTALLA 1: WATERFALL (CANVAS 2D CON PALETA TÉRMICA) */}
        {activeView === 'waterfall' && (
          <div className='flex-grow flex flex-col items-center justify-center border border-slate-800 rounded-xl bg-slate-950 h-56 relative overflow-hidden shadow-inner'>
            <canvas
              ref={waterfallCanvasRef}
              width={256}
              height={140}
              className='w-full h-full object-fill'
            />

            {/* Retícula de frecuencia sobrepuesta en el Waterfall */}
            <div className='absolute inset-0 pointer-events-none flex justify-between px-2 text-[9px] font-mono text-cyan-300/40 items-start pt-1'>
              <span>-1.0 MHz</span>
              <span className='text-amber-400/70 font-semibold'>| fc (2.480 GHz) |</span>
              <span>+1.0 MHz</span>
            </div>

            {/* Línea central guía de portadora */}
            <div className='absolute inset-0 pointer-events-none flex justify-center'>
              <div className='h-full border-r border-amber-400/30 border-dashed'></div>
            </div>

            {!isActive && (
              <div className='absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center pointer-events-none'>
                <p className='text-cyan-500/70 font-mono text-xs tracking-wider'>
                  [ Cascada Espectral en Reposo ]
                </p>
              </div>
            )}
          </div>
        )}

        {/* PANTALLA 2: OSCILOSCOPIO XY DE CONSTELACIÓN */}
        {activeView === 'constellation' && (
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
        )}

        {/* Pie de Referencia Calibrado */}
        <div className='mt-2.5 pt-1.5 border-t border-gray-100 flex justify-between items-center text-[10px] font-mono text-gray-500 px-1'>
          {activeView === 'waterfall' ? (
            <>
              <span className='flex items-center gap-1.5'>
                <span className='inline-block w-2 h-2 rounded-full bg-cyan-500'></span>
                Escala Térmica: Azul (Ruido) → Rojo (Pulso RF)
              </span>
              <span className='text-gray-400 font-semibold'>Eje Y: Tiempo descendente</span>
              <span>128 Bins FFT</span>
            </>
          ) : (
            <>
              <span>Q2: (-I, +Q)</span>
              <span className='text-gray-400 font-semibold'>Círculo Unitario (|s| = 1.0)</span>
              <span>Q1: (+I, +Q)</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// 2. COMPONENTE DE TARJETAS DE MÉTRICAS GENERALES
const MetricsPanel = ({
  isActive,
  metrics,
  modEnabled,
  confEnabled,
  onToggleMod,
  onToggleConf
}) => {
  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
      {/* Tarjeta 1: Modo de Captura */}
      <div className='bg-white border border-blue-100 p-4 rounded-2xl shadow-sm flex flex-col justify-between'>
        <p className='text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1'>
          Modo de Captura
        </p>
        <p className='text-xl md:text-2xl font-bold font-mono text-indigo-600'>
          {isActive ? (metrics?.mode === 'pluto' ? 'Pluto+ SDR' : 'Simulación') : '---'}
        </p>
        <div className='mt-2 flex items-center gap-1.5'>
          <span className='inline-block w-1.5 h-1.5 rounded-full bg-blue-500'></span>
          <span className='text-[10px] font-medium text-gray-400 uppercase tracking-tight'>
            {metrics?.mode === 'pluto' ? 'Hardware OTA' : 'Dataset 1024'}
          </span>
        </div>
      </div>

      {/* Tarjeta 2: Frecuencia Central */}
      <div className='bg-white border border-blue-100 p-4 rounded-2xl shadow-sm flex flex-col justify-between'>
        <p className='text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1'>
          Frecuencia Central
        </p>
        <p className='text-xl md:text-2xl font-bold font-mono text-blue-600'>
          {isActive ? (metrics?.centerFrequency || '2.480 GHz') : '---'}
        </p>
        <div className='mt-2 flex items-center gap-1.5'>
          <span className='inline-block w-1.5 h-1.5 rounded-full bg-blue-500'></span>
          <span className='text-[10px] font-medium text-gray-400 uppercase tracking-tight'>
            {metrics?.bandwidth || '2.0 MSPS'}
          </span>
        </div>
      </div>

      {/* Tarjeta 3: Modulación Detectada (Switch Independiente) */}
      <div className={`bg-white border p-4 rounded-2xl shadow-sm flex flex-col justify-between transition-all ${
        modEnabled ? 'border-amber-200' : 'border-gray-200/80 bg-gray-50/40 opacity-85'
      }`}>
        <div className='flex items-center justify-between mb-1'>
          <p className='text-gray-500 text-[11px] font-semibold uppercase tracking-wider'>
            Modulación Detectada
          </p>
          <button
            onClick={() => onToggleMod(!modEnabled)}
            title={modEnabled ? 'Desactivar Detección de Modulación' : 'Activar Detección de Modulación'}
            className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              modEnabled ? 'bg-amber-500 justify-end' : 'bg-gray-300 justify-start'
            }`}>
            <span className='w-3 h-3 bg-white rounded-full shadow-xs'></span>
          </button>
        </div>

        {modEnabled ? (
          <>
            <p className='text-xl md:text-2xl font-bold font-mono text-amber-600'>
              {isActive ? (metrics?.modulation || '---') : '---'}
            </p>
            <div className='mt-2 flex items-center justify-between'>
              <div className='flex items-center gap-1.5'>
                <span className='inline-block w-1.5 h-1.5 rounded-full bg-amber-500'></span>
                <span className='text-[10px] font-medium text-gray-400 uppercase tracking-tight'>
                  {metrics?.family || '---'}
                </span>
              </div>
              {metrics?.runnerUp && (
                <span className='text-[9px] font-mono text-gray-500 bg-gray-50 border border-gray-150 px-1.5 py-0.5 rounded'>
                  2do: {metrics.runnerUp.mod} ({(metrics.runnerUp.prob * 100).toFixed(0)}%)
                </span>
              )}
            </div>
          </>
        ) : (
          <div className='my-auto py-1'>
            <p className='text-xs font-mono font-semibold text-gray-400'>
              [ Clasificador Apagado ]
            </p>
            <span className='text-[10px] text-gray-400 mt-1 block'>
              Pulsa switch para identificar
            </span>
          </div>
        )}
      </div>

      {/* Tarjeta 4: Confianza IA / SNR (Switch Independiente) */}
      <div className={`bg-white border p-4 rounded-2xl shadow-sm flex flex-col justify-between transition-all ${
        confEnabled ? 'border-emerald-200' : 'border-gray-200/80 bg-gray-50/40 opacity-85'
      }`}>
        <div className='flex items-center justify-between mb-1'>
          <p className='text-gray-500 text-[11px] font-semibold uppercase tracking-wider'>
            Confianza IA / SNR
          </p>
          <button
            onClick={() => onToggleConf(!confEnabled)}
            title={confEnabled ? 'Desactivar Estimador de Certidumbre' : 'Activar Estimador de Certidumbre'}
            className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              confEnabled ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'
            }`}>
            <span className='w-3 h-3 bg-white rounded-full shadow-xs'></span>
          </button>
        </div>

        {confEnabled ? (
          <>
            <p className='text-xl md:text-2xl font-bold font-mono text-emerald-600'>
              {isActive ? (metrics?.accuracy || '---') : '---'}
            </p>
            <div className='mt-2 flex items-center justify-between'>
              <div className='flex items-center gap-1.5'>
                <span className='inline-block w-1.5 h-1.5 rounded-full bg-emerald-500'></span>
                <span className='text-[10px] font-medium text-gray-400 uppercase tracking-tight'>
                  {metrics?.snr ? `SNR: ${metrics.snr}` : '---'}
                </span>
              </div>
              <span className='text-[9px] font-mono text-gray-500 bg-gray-50 border border-gray-150 px-1.5 py-0.5 rounded'>
                Suavizado 5 ráfagas
              </span>
            </div>
          </>
        ) : (
          <div className='my-auto py-1'>
            <p className='text-xs font-mono font-semibold text-gray-400'>
              {isActive && metrics?.snr ? `SNR Canal: ${metrics.snr}` : '[ Certidumbre en Pausa ]'}
            </p>
            <span className='text-[10px] text-gray-400 mt-1 block'>
              Pulsa switch para evaluar
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// 2.2 COMPONENTE DE TELEMETRÍA CIENTÍFICA & EXTRACCIÓN DE PARÁMETROS (SIGINT)
const TelemetryPanel = ({ isActive, telemetry }) => {
  const isBurst = Boolean(telemetry?.burst_detected);
  const isHolding = Boolean(telemetry?.is_holding);

  const cards = [
    {
      label: 'PAPR (Factor de Cresta)',
      value: isActive && telemetry?.papr_db !== null && telemetry?.papr_db !== undefined
        ? `${telemetry.papr_db.toFixed(1)} dB`
        : (isActive ? '--- (En reposo)' : '---'),
      tag: 'Variación Envolvente',
      tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
      hint: isBurst ? 'Pico vs Promedio (|s|²)' : 'Esperando ráfaga RF',
      icon: '⚡'
    },
    {
      label: 'Cumulante Estadístico |C₄₀|',
      value: isActive && telemetry?.c40 !== null && telemetry?.c40 !== undefined
        ? `${telemetry.c40.toFixed(3)}`
        : (isActive ? '--- (En reposo)' : '---'),
      tag: 'Simetría de Fase 4° Ord.',
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
      hint: isBurst ? 'Firma Teórica HOC' : 'Esperando ráfaga RF',
      icon: '📐'
    },
    {
      label: 'Momento Estadístico |C₂₀|',
      value: isActive && telemetry?.c20 !== null && telemetry?.c20 !== undefined
        ? `${telemetry.c20.toFixed(3)}`
        : (isActive ? '--- (En reposo)' : '---'),
      tag: 'Elongación de Eje',
      tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      hint: isBurst ? 'Distorsión de Portadora' : 'Esperando ráfaga RF',
      icon: '📊'
    },
    {
      label: 'Offset Residual (CFO Δf)',
      value: isActive && isBurst && telemetry?.freq_offset_hz !== undefined
        ? `${telemetry.freq_offset_hz > 0 ? '+' : ''}${(telemetry.freq_offset_hz / 1e3).toFixed(1)} kHz`
        : (isActive ? '0.0 kHz (Centrado)' : '---'),
      tag: 'Desvío Doppler / OL',
      tagColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      hint: isBurst ? 'Pico FFT de Banda Base' : 'Sin desvío activo',
      icon: '🎯'
    },
    {
      label: 'Ancho de Banda Ocupado',
      value: isActive && isBurst && telemetry?.occupied_bw_hz !== null && telemetry?.occupied_bw_hz !== undefined
        ? `${(telemetry.occupied_bw_hz / 1e3).toFixed(0)} kHz`
        : (isActive ? '--- (Piso Ruido)' : '---'),
      tag: 'Banda a -10 dB',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      hint: isBurst ? 'Espectro de Potencia' : 'Sin modulación activa',
      icon: '📡'
    }
  ];

  return (
    <div className='bg-white border border-blue-100 rounded-2xl p-4 shadow-sm'>
      <div className='flex items-center justify-between mb-3 border-b border-gray-100 pb-2.5'>
        <div className='flex items-center gap-2'>
          <span className='w-2 h-2 rounded-full bg-blue-600'></span>
          <h3 className='text-xs font-bold uppercase tracking-wider text-gray-700'>
            Telemetría Científica de Señal (SIGINT & Caracterización RF)
          </h3>
          <span className='px-1.5 py-0.5 text-[9px] font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold'>
            Extracción HOC & DSP
          </span>
          {isBurst && (
            <span className='px-2.5 py-0.5 text-[9px] font-mono bg-amber-500 text-white font-bold rounded shadow-xs flex items-center gap-1.5 animate-pulse'>
              <span>⚡</span> RÁFAGA CAPTURADA (+{telemetry.snr_est_db} dB)
              {isHolding && <span className='opacity-85 text-[8px] tracking-tight bg-amber-700/60 px-1 py-0.2 rounded'>HOLD 1.8s</span>}
            </span>
          )}
        </div>
        <span className='text-[10px] font-mono text-gray-400'>
          {isActive ? '● En Análisis Continuo' : '○ Standby'}
        </span>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
        {cards.map((c, i) => (
          <div
            key={i}
            className='bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between hover:border-blue-300 transition-colors'>
            <div className='flex items-center justify-between mb-1'>
              <span className='text-[10px] font-semibold text-gray-500 uppercase tracking-tight'>
                {c.label}
              </span>
              <span className='text-xs'>{c.icon}</span>
            </div>
            <p className='text-lg font-bold font-mono text-slate-800 tracking-tight my-1'>
              {c.value}
            </p>
            <div className='mt-1 pt-1 border-t border-slate-200/60 flex flex-col gap-0.5'>
              <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border inline-block w-fit ${c.tagColor}`}>
                {c.tag}
              </span>
              <span className='text-[9px] font-mono text-gray-400 mt-0.5'>
                {c.hint}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. COMPONENTE MAESTRO (APP)
function App() {
  const [isActive, setIsActive] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
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
    run_amc_inference: false
  });

  // Estados independientes para las tarjetas de Modulación y Confianza IA
  const [modEnabled, setModEnabled] = useState(false);
  const [confEnabled, setConfEnabled] = useState(false);

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

  // Manejo desde el panel maestro lateral (ControlPanel)
  const handleMasterConfigChange = (key, value) => {
    if (key === 'run_amc_inference') {
      setModEnabled(value);
      setConfEnabled(value);
    }
    handleConfigChange(key, value);
  };

  // Conmutador independiente para tarjeta 'Modulación Detectada'
  const handleToggleMod = (nextVal) => {
    setModEnabled(nextVal);
    // Si cualquiera de las dos tarjetas requiere inferencia, mantenemos encendido el motor de IA
    const needsInference = nextVal || confEnabled;
    handleConfigChange('run_amc_inference', needsInference);
  };

  // Conmutador independiente para tarjeta 'Confianza IA / SNR'
  const handleToggleConf = (nextVal) => {
    setConfEnabled(nextVal);
    // Si cualquiera de las dos tarjetas requiere inferencia, mantenemos encendido el motor de IA
    const needsInference = modEnabled || nextVal;
    handleConfigChange('run_amc_inference', needsInference);
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

          // Telemetría Científica / SIGINT
          if (payload.telemetry) {
            setTelemetry(payload.telemetry);
          }

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
            onConfigChange={handleMasterConfigChange}
          />
        </div>

        {/* Panel Derecho: Visualizadores y Métricas */}
        <div className='lg:col-span-3 space-y-5'>
          <MetricsPanel
            isActive={isActive}
            metrics={metrics}
            modEnabled={modEnabled}
            confEnabled={confEnabled}
            onToggleMod={handleToggleMod}
            onToggleConf={handleToggleConf}
          />
          <TelemetryPanel isActive={isActive} telemetry={telemetry} />
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
