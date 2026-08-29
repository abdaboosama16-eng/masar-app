import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export const ExpenseFlowchart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#fef2f2',
        primaryTextColor: '#991b1b',
        primaryBorderColor: '#fca5a5',
        lineColor: '#cbd5e1',
        secondaryColor: '#f0fdf4',
        tertiaryColor: '#f8fafc'
      }
    });

    const renderChart = async () => {
      if (containerRef.current) {
        try {
          const chartDefinition = `
            graph TD
              A[المصروفات الكلية] --> B(رواتب)
              A --> C(تشغيلية)
              A --> D(صيانة)
              B --> B1[معلمين]
              B --> B2[إدارة]
              C --> C1[كهرباء]
              C --> C2[إنترنت]
              C --> C3[مطبوعات]
              D --> D1[مباني]
              D --> D2[أجهزة]
          `;
          const { svg } = await mermaid.render('expense-flowchart-svg', chartDefinition);
          containerRef.current.innerHTML = svg;
          setIsRendered(true);
        } catch (error) {
          console.error("Mermaid rendering failed", error);
        }
      }
    };

    renderChart();
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm overflow-hidden flex flex-col relative group h-[400px]">
      <div className="flex justify-between items-center mb-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-xl">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">شجرة المصروفات التفاعلية</h2>
          <p className="text-xs text-slate-500">مخطط هيكلي لتصنيفات المصروفات</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setScale(s => Math.min(s + 0.2, 3))} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">
            <ZoomIn size={16} />
          </button>
          <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">
            <ZoomOut size={16} />
          </button>
          <button onClick={() => setScale(1)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100 cursor-move relative">
        <div 
          ref={containerRef} 
          style={{ transform: "scale(" + scale + ")", transition: "transform 0.2s ease-in-out" }}
          className="w-full h-full flex items-center justify-center transform-origin-center"
        />
        {!isRendered && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            جاري رسم المخطط...
          </div>
        )}
      </div>
    </div>
  );
};
