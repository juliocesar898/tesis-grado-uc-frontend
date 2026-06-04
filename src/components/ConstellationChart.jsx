import React, { useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

export default function ConstellationChart({ iqData }) {
  const data = useMemo(() => {
    const { i, q } = iqData;
    if (!i || !q) return [];
    return i.map((val, index) => ({ x: val, y: q[index] }));
  }, [iqData]);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-google-border h-[300px] w-full flex flex-col">
      <h2 className="text-lg font-medium text-google-text mb-4">Constelación I/Q</h2>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E3E3E3" />
            <XAxis type="number" dataKey="x" domain={[-2, 2]} tick={{fontSize: 12, fill: '#666'}} tickLine={false} axisLine={false} tickCount={5} />
            <YAxis type="number" dataKey="y" domain={[-2, 2]} tick={{fontSize: 12, fill: '#666'}} tickLine={false} axisLine={false} tickCount={5} />
            <Scatter name="IQ" data={data} fill="#1A73E8" fillOpacity={0.5} line={false} isAnimationActive={false} shape="circle" r={3} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
