import React from "react";

export default function PredictionWidget({ classification }) {
  const { modulation, probability } = classification;
  const percentage = (probability * 100).toFixed(1);
  
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-google-border flex flex-col justify-center items-center gap-4">
      <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Clasificación IA (AMC)</span>
      <h1 className="text-5xl font-bold text-google-text">{modulation || "---"}</h1>
      
      <div className="w-full flex flex-col gap-2 mt-2">
        <div className="flex justify-between text-sm text-google-text font-medium">
          <span>Confianza</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-google-blue h-2 rounded-full transition-all duration-300" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
