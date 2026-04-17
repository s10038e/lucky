import React, { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';

const COLORS = [
  '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', 
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#4f46e5'
];

interface DrawRecord {
  id: string;
  name: string;
  timestamp: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [namesInput, setNamesInput] = useState("王小明, 李大華, 張美麗, 陳志強, 林春嬌, 趙子龍, 孫悟空, 周杰倫, 蔡依林, 劉德華");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [history, setHistory] = useState<DrawRecord[]>(() => {
    try {
      const saved = localStorage.getItem('luckyDrawHistory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // Parse options
  const names = useMemo(() => {
    const parsed = namesInput.split(',').map(n => n.trim()).filter(Boolean);
    return parsed.length > 0 ? parsed : ["請輸入選項"];
  }, [namesInput]);

  const rotationRef = useRef(0);
  const reqRef = useRef<number | null>(null);
  
  // Drawing function
  const drawWheel = (rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (names.length === 0) return;

    const arcSize = (2 * Math.PI) / names.length;

    for (let i = 0; i < names.length; i++) {
      const angle = rotation + i * arcSize;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arcSize);
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.stroke();

      ctx.save();
      
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      const fontSize = Math.max(16, 60 - names.length * 1.5);
      ctx.font = `bold ${fontSize}px Helvetica, Arial, sans-serif`;
      
      const textX = radius - 40;
      
      let textToDraw = names[i];
      if (textToDraw.length > 15) {
        textToDraw = textToDraw.substring(0, 12) + "...";
      }

      ctx.fillText(textToDraw, textX, 0);
      ctx.restore();
    }

    // Inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 60, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  };

  useEffect(() => {
    drawWheel(rotationRef.current);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [names]);

  const startSpin = () => {
    if (isSpinning || names.length < 2 || names[0] === "請輸入選項") return;
    setIsSpinning(true);
    setWinner(null);

    const duration = 5000; // 5 seconds
    const startRotation = rotationRef.current;
    
    // Pick winner
    const targetWinnerIndex = Math.floor(Math.random() * names.length);
    const arcSize = (2 * Math.PI) / names.length;
    
    const randomOffset = (Math.random() * 0.8 + 0.1) * arcSize;
    const landingAngleRelativeToWheel = targetWinnerIndex * arcSize + randomOffset;
    
    // Top is 270 degrees
    const pointerAngle = (3 * Math.PI) / 2; 
    let rotationDiff = pointerAngle - landingAngleRelativeToWheel - (startRotation % (2 * Math.PI));
    if (rotationDiff < 0) rotationDiff += 2 * Math.PI;
    
    const totalSpins = Math.floor(Math.random() * 5) + 5; // 5 to 9 spins
    const targetRotation = startRotation + rotationDiff + totalSpins * 2 * Math.PI;

    let startTime: number | null = null;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      rotationRef.current = startRotation + (targetRotation - startRotation) * easeProgress;
      
      drawWheel(rotationRef.current);
      
      if (progress < 1) {
        reqRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const winName = names[targetWinnerIndex];
        setWinner(winName);
        
        const newRecord = {
          id: Date.now().toString(),
          name: winName,
          timestamp: Date.now(),
        };
        setHistory(prev => {
          const updated = [newRecord, ...prev];
          localStorage.setItem('luckyDrawHistory', JSON.stringify(updated));
          return updated;
        });

        confetti({
          particleCount: 200,
          spread: 80,
          origin: { y: 0.6 },
          colors: COLORS,
          zIndex: 101
        });
      }
    };
    
    reqRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex justify-center items-center text-slate-50 font-sans overflow-hidden">
      <div className="flex w-[960px] h-[640px] gap-8 items-center max-w-full max-h-full p-4 md:p-0 flex-col md:flex-row">
        
        {/* Sidebar */}
        <div className="w-full md:w-[320px] h-full bg-[#1e293b] rounded-[24px] p-8 flex flex-col gap-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/5 shrink-0">
          <div className="flex flex-col mb-1">
            <h1 className="text-[28px] font-extrabold bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent mb-1">
              Lucky Draw Pro
            </h1>
            <p className="text-[14px] text-slate-400">專業動態抽籤系統</p>
          </div>
          
          <div className="text-[12px] font-semibold uppercase tracking-widest text-slate-500">
            參加名單 (以逗號分隔)
          </div>
          
          <textarea 
            value={namesInput}
            onChange={(e) => setNamesInput(e.target.value)}
            disabled={isSpinning}
            className="flex-1 min-h-[60px] bg-[#0f172a] border border-slate-700 rounded-xl p-4 text-slate-50 text-[14px] resize-none outline-none transition-colors focus:border-[#8b5cf6] w-full"
          />
          
          <button 
            onClick={startSpin}
            disabled={isSpinning || names.length < 2}
            className="bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] border-none p-[18px] rounded-2xl text-white font-bold text-[18px] cursor-pointer transition-all shadow-[0_10px_20px_rgba(139,92,246,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[0.98] shrink-0"
          >
            {isSpinning ? '旋轉中...' : '開始抽籤'}
          </button>

          {/* History Section */}
          <div className="flex flex-col gap-2 h-[160px] shrink-0 border-t border-slate-700/50 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-semibold uppercase tracking-widest text-slate-500">
                抽籤紀錄
              </span>
              {history.length > 0 && (
                <button 
                  onClick={() => { setHistory([]); localStorage.removeItem('luckyDrawHistory'); }}
                  className="text-[11px] text-[#ef4444] hover:text-[#fca5a5] cursor-pointer transition-colors outline-none"
                >
                  清除
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 flex flex-col [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {history.map(record => (
                <div key={record.id} className="bg-[#0f172a] p-3 rounded-xl border border-white/5 flex justify-between items-center shrink-0">
                  <span className="text-[14px] font-bold text-[#f8fafc] truncate max-w-[120px]" title={record.name}>{record.name}</span>
                  <span className="text-[11px] text-slate-500">{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-slate-600 text-[12px] text-center my-auto">
                  尚無紀錄
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wheel Area */}
        <div className="flex-grow h-full flex justify-center items-center relative w-full md:w-auto">
          <div className="relative w-[320px] h-[320px] sm:w-[540px] sm:h-[540px] flex shrink-0">
            {/* Indicator */}
            <svg 
              className="absolute -top-[15px] left-1/2 -translate-x-1/2 w-[40px] h-[50px] z-10 fill-[#ef4444] drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" 
              viewBox="0 0 24 30"
            >
                <path d="M12 30L2 10C2 10 2 0 12 0C22 0 22 10 22 10L12 30Z" />
            </svg>
            
            {/* Wheel Canvas */}
            <canvas 
              ref={canvasRef} 
              width={1000} 
              height={1000}
              className="w-full h-full filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            />
          </div>
        </div>

      </div>

      {/* Modal */}
      {winner && !isSpinning && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex justify-center items-center z-[100] p-4">
          <div className="bg-[#1e293b] p-12 rounded-[32px] text-center border-2 border-[#8b5cf6] animate-in zoom-in-50 duration-500 shadow-[0_0_100px_rgba(139,92,246,0.4)] max-w-[90vw]">
            <h2 className="text-[18px] text-slate-400 mb-2">🎉 恭喜中獎人 🎉</h2>
            <div className="text-[64px] font-black mb-6 bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent px-4">
              {winner}
            </div>
            <button 
              onClick={() => setWinner(null)}
              className="bg-slate-700 hover:bg-slate-600 transition-colors border-none py-3 px-8 rounded-xl text-white font-semibold cursor-pointer"
            >
              太棒了！
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
