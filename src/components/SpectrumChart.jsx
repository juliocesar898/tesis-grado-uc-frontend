import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

export default function SpectrumChart({ psdArray }) {
  const chartData = useMemo(() => {
    return psdArray.map((val, index) => ({
      bin: index,
      magnitude: val
    }));
  }, [psdArray]);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-google-border h-[300px] w-full flex flex-col">
      <h2 className="text-lg font-medium text-google-text mb-4">Espectro (Densidad de Potencia)</h2>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMag" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#1A73E8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E3E3" />
            <XAxis dataKey="bin" tick={{fontSize: 12, fill: '#666'}} tickLine={false} axisLine={false} minTickGap={20} />
            <YAxis tick={{fontSize: 12, fill: '#666'}} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E3E3E3', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} />
            <Area type="monotone" dataKey="magnitude" stroke="#1A73E8" strokeWidth={2} fillOpacity={1} fill="url(#colorMag)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
