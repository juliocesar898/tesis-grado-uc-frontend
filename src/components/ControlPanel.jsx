import React from 'react';

export default function ControlPanel({
  isActive,
  onToggleActive,
  config,
  onConfigChange
}) {
  return (
    <div className='bg-white rounded-3xl p-6 shadow-sm border border-google-border flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <span className='text-lg font-medium text-google-text'>
          Transmisión de Señal (SDR)
        </span>
        <button
          onClick={() => onToggleActive(!isActive)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
            isActive ? 'bg-google-blue' : 'bg-gray-300'
          }`}>
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className='h-px bg-google-border w-full'></div>

      <div className='flex flex-col gap-3'>
        <h3 className='text-sm font-medium text-gray-500 uppercase tracking-wider'>
          Módulos de Procesamiento
        </h3>

        <label className='flex items-center gap-3 cursor-pointer'>
          <input
            type='checkbox'
            className='w-5 h-5 accent-google-blue rounded-md'
            checked={config.process_psd}
            onChange={(e) => onConfigChange('process_psd', e.target.checked)}
          />
          <span className='text-google-text'>
            Procesar Densidad Espectral (PSD)
          </span>
        </label>

        <label className='flex items-center gap-3 cursor-pointer'>
          <input
            type='checkbox'
            className='w-5 h-5 accent-google-blue rounded-md'
            checked={config.process_constellation}
            onChange={(e) =>
              onConfigChange('process_constellation', e.target.checked)
            }
          />
          <span className='text-google-text'>Renderizar Constelación IQ</span>
        </label>

        <label className='flex items-center gap-3 cursor-pointer'>
          <input
            type='checkbox'
            className='w-5 h-5 accent-google-blue rounded-md'
            checked={config.run_amc_inference}
            onChange={(e) =>
              onConfigChange('run_amc_inference', e.target.checked)
            }
          />
          <span className='text-google-text'>Inferencia IA (AMC)</span>
        </label>
      </div>
    </div>
  );
}
