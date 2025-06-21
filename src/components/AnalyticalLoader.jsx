import { useState, useEffect } from 'react';
import './styles.css';

export default function ProgressLoader({ active = true }) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { name: "Loading user data", color: "#FF6B6B" },
    { name: "Fetching club information", color: "#4ECDC4" },
    { name: "Building analytics", color: "#45B7D1" },
    { name: "Creating visualizations", color: "#FFBE0B" },
    { name: "Finalizing dashboard", color: "#FB5607" },
    { name: "Ready to go!", color: "#8338EC" }
  ];

  useEffect(() => {
    if (!active) return;

    const timer = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);

    return () => clearInterval(timer);
  }, [active, steps.length]);

  return (
    <div className="progress-loader-container dark:bg-slate-800">
      <div className="progress-steps">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`progress-step  ${index <= currentStep ? 'active' : ''}`}
          >
            <div 
              className="step-bubble" 
              style={{ 
                backgroundColor: step.color,
                borderColor: step.color
              }}
            >
              {index + 1}
            </div>
            <div className="step-name dark:text-white">{step.name}</div>
            {index < steps.length - 1 && (
              <div 
                className="step-connector" 
                style={{ 
                  backgroundColor: index < currentStep ? step.color : '#e0e0e0'
                }}
              ></div>
            )}
          </div>
        ))}
      </div>
      
      <div className="progress-bar-container">
        <div 
          className="progress-bar" 
          style={{ 
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
            background: `linear-gradient(90deg, ${steps.map(s => s.color).join(', ')})`
          }}
        ></div>
      </div>
      
      <div className="current-status dark:text-white">
        {steps[currentStep].name}...
      </div>
    </div>
  );
}