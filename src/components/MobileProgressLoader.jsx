import { useState, useEffect } from 'react';
import './styles.css';

export default function MobileProgressLoader({ active = true }) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { name: "Loading data", color: "#FF6B6B" },
    { name: "Fetching info", color: "#4ECDC4" },
    { name: "Analyzing", color: "#45B7D1" },
    { name: "Visualizing", color: "#FFBE0B" },
    { name: "Finalizing", color: "#FB5607" },
    { name: "Ready!", color: "#8338EC" }
  ];

  useEffect(() => {
    if (!active) return;

    const timer = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);

    return () => clearInterval(timer);
  }, [active, steps.length]);

  return (
    <div className="mobile-progress-loader-container dark:bg-slate-800">
      <div className="progress-bar-container dark:bg-slate-800">
        <div 
          className="progress-bar" 
          style={{ 
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
            background: `linear-gradient(90deg, ${steps.map(s => s.color).join(', ')})`
          }}
        ></div>
      </div>
      
      <div className="mobile-progress-steps ">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`mobile-progress-step ${index <= currentStep ? 'active' : ''}`}
          >
            <div 
              className="mobile-step-bubble " 
              style={{ 
                backgroundColor: index <= currentStep ? step.color : '#e0e0e0',
                borderColor: step.color
              }}
            >
              {index + 1}
            </div>
            <div className="mobile-step-name ml-2 dark:text-white">{step.name}</div>
          </div>
        ))}
      </div>
      
      <div className="mobile-current-status dark:text-white">
        {steps[currentStep].name}...
      </div>
    </div>
  );
}