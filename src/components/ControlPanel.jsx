import React from 'react';

export default function ControlPanel({
  isActive,
  onToggleActive,
  config,
  onConfigChange
}) {
  return (
    <div className='bg-white rounded-3xl p-6 shadow-sm border border-blue-100 flex flex-col gap-6'>
      {/* 1. Switch Principal de Transmisión */}
      <div className='flex items-center justify-between'>
        <div className='flex flex-col'>
          <span className='text-lg font-bold text-gray-800'>
            Recepción SDR
          </span>
          <span className='text-xs text-gray-500'>
            {isActive ? 'Captura en curso' : 'Transmisión detenida'}
          </span>
        </div>
        <button
          onClick={() => onToggleActive(!isActive)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
            isActive ? 'bg-blue-600' : 'bg-gray-300'
          }`}>
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className='h-px bg-gray-100 w-full'></div>

      {/* 2. Selector de Procedencia de Datos (Modo) */}
      <div className='flex flex-col gap-2'>
        <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
          Fuente de Señal (Modo)
        </label>
        <div className='grid grid-cols-2 gap-2 bg-blue-50/60 p-1 rounded-xl border border-blue-100'>
          <button
            type='button'
            onClick={() => onConfigChange('mode', 'simulation')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
              config.mode === 'simulation'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-blue-600'
            }`}>
            📁 Simulación
          </button>
          <button
            type='button'
            onClick={() => onConfigChange('mode', 'pluto')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
              config.mode === 'pluto'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-emerald-600'
            }`}>
            📡 Pluto+ SDR
          </button>
        </div>
        <span className='text-[11px] text-gray-400 mt-0.5'>
          {config.mode === 'simulation'
            ? 'Ráfagas sintéticas del dataset RadioML 2018 (HDF5)'
            : 'Recepción física Over-The-Air por puerto RX1'}
        </span>
      </div>

      <div className='h-px bg-gray-100 w-full'></div>

      {/* 3. Parámetros de Radiofrecuencia (Pluto+) */}
      <div className='flex flex-col gap-3'>
        <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
          Parámetros RF (Hardware)
        </label>

        <div className='flex flex-col gap-1'>
          <div className='flex justify-between text-xs font-medium text-gray-700'>
            <span>Frecuencia Central:</span>
            <span className='font-mono font-bold text-blue-600'>
              {config.frequency} GHz
            </span>
          </div>
          <select
            value={config.frequency}
            onChange={(e) => onConfigChange('frequency', e.target.value)}
            className='w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-700 focus:outline-none focus:border-blue-500'>
            <option value='2.480'>2.480 GHz (BLE Ch 39 - Limpio)</option>
            <option value='0.915'>915.0 MHz (Banda ISM)</option>
            <option value='2.440'>2.440 GHz (Wi-Fi Ch 7)</option>
            <option value='0.433'>433.9 MHz (ISM UHF)</option>
          </select>
        </div>

        <div className='flex flex-col gap-1'>
          <div className='flex justify-between text-xs font-medium text-gray-700'>
            <span>Ganancia Rx:</span>
            <span className='font-mono font-bold text-blue-600'>
              {config.gain} dB
            </span>
          </div>
          <input
            type='range'
            min='0'
            max='60'
            step='1'
            value={config.gain}
            onChange={(e) => onConfigChange('gain', e.target.value)}
            className='w-full accent-blue-600 cursor-pointer'
          />
        </div>
      </div>

      <div className='h-px bg-gray-100 w-full'></div>

      {/* 4. Módulos de Procesamiento DSP & IA */}
      <div className='flex flex-col gap-3'>
        <h3 className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
          Módulos de Procesamiento
        </h3>

        <label className='flex items-center gap-3 cursor-pointer text-sm text-gray-700 hover:text-gray-900'>
          <input
            type='checkbox'
            className='w-4 h-4 accent-blue-600 rounded'
            checked={config.process_psd ?? true}
            onChange={(e) => onConfigChange('process_psd', e.target.checked)}
          />
          <span>Densidad Espectral (PSD)</span>
        </label>

        <label className='flex items-center gap-3 cursor-pointer text-sm text-gray-700 hover:text-gray-900'>
          <input
            type='checkbox'
            className='w-4 h-4 accent-blue-600 rounded'
            checked={config.process_constellation ?? true}
            onChange={(e) =>
              onConfigChange('process_constellation', e.target.checked)
            }
          />
          <span>Constelación I/Q (Estado)</span>
        </label>

        <label className='flex items-center gap-3 cursor-pointer text-sm text-gray-700 hover:text-gray-900'>
          <input
            type='checkbox'
            className='w-4 h-4 accent-blue-600 rounded'
            checked={config.run_amc_inference ?? true}
            onChange={(e) =>
              onConfigChange('run_amc_inference', e.target.checked)
            }
          />
          <span className='font-medium text-blue-700'>
            Inferencia IA (AMC DeepSignal)
          </span>
        </label>
      </div>
    </div>
  );
}
