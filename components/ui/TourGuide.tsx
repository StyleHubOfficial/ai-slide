
import React, { useState, useEffect, useCallback } from 'react';
import Button from './Button';
import GlassCard from './GlassCard';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
}

interface TourGuideProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TourGuide: React.FC<TourGuideProps> = ({ steps, isOpen, onClose, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [isReady, setIsReady] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [isOpen]);

  const updatePosition = useCallback(() => {
    if (!isOpen || !steps[currentStepIndex]) return;

    const targetId = steps[currentStepIndex].targetId;
    
    // --- CENTER MODE ---
    if (targetId === 'center') {
      setTargetRect(null);
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '400px',
        zIndex: 160
      });
      return;
    }

    // --- TARGET MODE ---
    const element = document.getElementById(targetId);
    if (element) {
      // 1. Ensure element is visible
      element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
      
      // 2. Get coordinates
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);

      // 3. Calculate Tooltip Position
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobile = viewportWidth < 1024; 
      const tooltipWidth = 320; 

      let styleObj: React.CSSProperties = {
          position: 'fixed',
          zIndex: 160,
          width: isMobile ? 'calc(100vw - 32px)' : `${tooltipWidth}px`,
          maxWidth: '400px',
      };

      if (isMobile) {
          // Mobile: Always centered horizontally with padding
          styleObj.left = '16px'; 
          styleObj.right = '16px'; 
          
          // Vertical: Top or Bottom based on target Y position
          if (rect.top > viewportHeight / 2) {
              // Target is in bottom half -> Show Tooltip ABOVE target
              // bottom = distance from bottom of screen to top of target + gap
              styleObj.bottom = `${viewportHeight - rect.top + 20}px`;
              styleObj.top = 'auto';
          } else {
              // Target is in top half -> Show Tooltip BELOW target
              styleObj.top = `${rect.bottom + 20}px`;
              styleObj.bottom = 'auto';
          }
      } else {
          // Desktop Logic
          
          // Case A: Left Sidebar (Target is on far left and narrow)
          if (rect.left < 300 && rect.width < 300) {
              // Place to RIGHT of element
              styleObj.left = `${rect.right + 20}px`;
              // Center vertically relative to target
              styleObj.top = `${rect.top + (rect.height/2)}px`;
              styleObj.transform = 'translateY(-50%)';
          } 
          // Case B: Right Side (Target on far right)
          else if (rect.right > viewportWidth - 300) {
               // Place to LEFT of element
               styleObj.left = 'auto';
               styleObj.right = `${viewportWidth - rect.left + 20}px`;
               styleObj.top = `${rect.top + (rect.height/2)}px`;
               styleObj.transform = 'translateY(-50%)';
          }
          // Case C: Default Top/Bottom (e.g. center content)
          else {
              // Horizontal Center relative to target
              let leftPos = rect.left + (rect.width/2) - (tooltipWidth/2);
              // Clamp to viewport
              leftPos = Math.max(20, Math.min(leftPos, viewportWidth - tooltipWidth - 20));
              styleObj.left = `${leftPos}px`;
              
              // Vertical placement
              if (rect.top > viewportHeight / 2) {
                  // Show Above
                  styleObj.bottom = `${viewportHeight - rect.top + 20}px`;
                  styleObj.top = 'auto';
              } else {
                  // Show Below
                  styleObj.top = `${rect.bottom + 20}px`;
                  styleObj.bottom = 'auto';
              }
          }
      }
      setTooltipStyle(styleObj);
    } else {
      // Fallback if target ID not found -> Center it
      setTargetRect(null);
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '400px',
        zIndex: 160
      });
    }
  }, [isOpen, currentStepIndex, steps]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true); // Capture scroll
    
    // Recalculate after a brief delay to ensure layout settling
    const timeout = setTimeout(updatePosition, 100);
    const timeout2 = setTimeout(updatePosition, 500);

    return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
        clearTimeout(timeout);
        clearTimeout(timeout2);
    };
  }, [updatePosition]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (!isOpen || !isReady) return null;

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden font-sans">
      {/* 
         Spotlight Effect Layer
         This creates the dark overlay with the "hole" for the target.
      */}
      <div 
        className="absolute transition-all duration-300 ease-out pointer-events-none"
        style={targetRect ? {
          top: targetRect.top - 10, 
          left: targetRect.left - 10,
          width: targetRect.width + 20,
          height: targetRect.height + 20,
          borderRadius: '12px',
          // Massive box shadow creates the backdrop
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85)', 
          border: '2px solid rgba(56, 189, 248, 0.5)'
        } : {
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)'
        }}
      ></div>

      {/* Tooltip Layer */}
      <div 
        className="pointer-events-auto transition-all duration-300 ease-out flex flex-col"
        style={tooltipStyle}
      >
          <GlassCard className="p-6 border-sky-500/30 shadow-[0_0_50px_rgba(14,165,233,0.3)] bg-slate-900/95 backdrop-blur-xl animate-fade-in-up">
              <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
                      Tour {currentStepIndex + 1} / {steps.length}
                  </span>
                  <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{currentStep.title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">{currentStep.content}</p>
              
              <div className="flex items-center justify-between">
                  <button 
                    onClick={handlePrev} 
                    disabled={currentStepIndex === 0}
                    className="text-sm font-bold text-slate-500 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                  >
                      Back
                  </button>
                  <div className="flex gap-2">
                      <Button onClick={onClose} className="!bg-transparent !text-slate-400 hover:!text-white !px-3 !py-2 !h-auto border border-transparent hover:border-slate-700">
                          Skip
                      </Button>
                      <Button onClick={handleNext} className="!bg-sky-600 hover:!bg-sky-500 !px-4 !py-2 !h-auto !text-sm shadow-lg shadow-sky-500/20">
                          {isLastStep ? 'Finish' : 'Next'}
                      </Button>
                  </div>
              </div>
          </GlassCard>
      </div>
    </div>
  );
};

export default TourGuide;
