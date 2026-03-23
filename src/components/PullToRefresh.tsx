import { useState, useRef, ReactNode } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

export function PullToRefresh({ children, onRefresh }: { children: ReactNode, onRefresh: () => Promise<void> }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      startY.current = clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (startY.current > 0 && !isRefreshing) {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const distance = clientY - startY.current;
      if (distance > 0) {
        setPullDistance(Math.min(distance * 0.4, 80)); // Add resistance
      } else {
        setPullDistance(0);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 50 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(50); // Hold at 50px while refreshing
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    startY.current = 0;
  };

  const handleMouseLeave = () => {
    if (startY.current > 0) {
      handleTouchEnd();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto relative flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div 
        animate={{ height: isRefreshing ? 50 : pullDistance }}
        className="flex items-center justify-center overflow-hidden text-blue-500 shrink-0 w-full"
      >
        <Loader2 className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 3}deg)` }} />
      </motion.div>
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
