import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Database,
  Network,
  BarChart,
  PieChart,
  Rocket,
  CheckCircle,
  Zap,
  Cpu,
  Shield,
  Cloud,
  Code,
  Lock,
  Server,
  Settings,
  Wifi,
  Box,
  LayoutDashboard,
  User,
  CalendarCheck,
  ClipboardList,
  UserCheck,
  FileBadge
} from 'lucide-react';
import './styles.css';

const allProcessSets = [
  [
    { name: "Authenticating user", icon: <Lock size={18} />, color: "#ef4444" },
    { name: "Fetching profile", icon: <User size={18} />, color: "#8b5cf6" },
    { name: "Checking attendance", icon: <CalendarCheck size={18} />, color: "#10b981" },
    { name: "Marking status", icon: <UserCheck size={18} />, color: "#f59e0b" },
    { name: "System ready", icon: <CheckCircle size={18} />, color: "#10b981" }
  ],
  [
    { name: "Finalizing reports", icon: <FileBadge size={18} />, color: "#8b5cf6" },
    { name: "Logging off users", icon: <UserCheck size={18} />, color: "#f59e0b" },
    { name: "Securing backend", icon: <Shield size={18} />, color: "#ef4444" },
    { name: "Archiving data", icon: <Database size={18} />, color: "#6366f1" },
    { name: "Good night!", icon: <CheckCircle size={18} />, color: "#10b981" }
  ],
  [
    { name: "Connecting microservices", icon: <Network size={18} />, color: "#6366f1" },
    { name: "Optimizing queries", icon: <Cpu size={18} />, color: "#8b5cf6" },
    { name: "Building cache layers", icon: <Server size={18} />, color: "#ec4899" },
    { name: "Finalizing dashboard", icon: <LayoutDashboard size={18} />, color: "#10b981" },
    { name: "Dashboard ready", icon: <CheckCircle size={18} />, color: "#10b981" }
  ],
  [
    { name: "Establishing connections", icon: <Wifi size={18} />, color: "#ef4444" },
    { name: "Analyzing metrics", icon: <BarChart size={18} />, color: "#14b8a6" },
    { name: "Generating reports", icon: <PieChart size={18} />, color: "#8b5cf6" },
    { name: "Ready for launch", icon: <Rocket size={18} />, color: "#ec4899" },
    { name: "Update complete", icon: <CheckCircle size={18} />, color: "#10b981" }
  ]
];

// 🎲 Fisher-Yates shuffle and pick
const getRandomSet = () => {
  const sets = [...allProcessSets];
  for (let i = sets.length - 1; i > 0; i--) {
    const j = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF + 1) * (i + 1));
    [sets[i], sets[j]] = [sets[j], sets[i]];
  }
  return sets[0];
};

export default function ProgressLoader({ active = true }) {
  const [currentProcessSet, setCurrentProcessSet] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const particlesRef = useRef(null);

  useEffect(() => {
    const randomSet = getRandomSet();
    setCurrentProcessSet(randomSet);
  }, []);

  useEffect(() => {
    if (!active || currentProcessSet.length === 0) return;

    const createParticles = () => {
      if (!particlesRef.current) return;
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${2 + Math.random() * 3}s`;
      particle.style.opacity = Math.random() * 0.3 + 0.3;
      particlesRef.current.appendChild(particle);
      setTimeout(() => particle.remove(), 3000);
    };

    const stepTimer = setInterval(() => {
      setCurrentStep(prev => (prev < currentProcessSet.length - 1 ? prev + 1 : prev));
    }, 1800);

    const particleTimer = setInterval(createParticles, 400);

    return () => {
      clearInterval(stepTimer);
      clearInterval(particleTimer);
    };
  }, [active, currentStep, currentProcessSet]);

  if (currentProcessSet.length === 0) return null;

  return (
    <div className="loader-container">
      <div className="particles-container" ref={particlesRef}></div>

      <div className="bg-items">
        {currentProcessSet.map((step, index) => (
          <div
            key={`bg-${index}`}
            className="bg-item"
            style={{
              opacity: 0.08,
              color: step.color,
              animationDelay: `${index * 0.2}s`
            }}
          >
            {step.icon}
          </div>
        ))}
      </div>

      <div className="loader-content">
        <div className="sparkle-header">
          <Sparkles className="sparkle-icon" size={20} />
          <span className="sparkle-text">System Initialization</span>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${(currentStep / (currentProcessSet.length - 1)) * 100}%`,
              background: currentProcessSet[currentStep].color
            }}
          ></div>
        </div>

        <div className="step-display">
          <div
            className="step-icon-wrapper"
            style={{ color: currentProcessSet[currentStep].color }}
          >
            {currentProcessSet[currentStep].icon}
          </div>
          <div className="step-text-wrapper">
            <div className="step-text">{currentProcessSet[currentStep].name}</div>
            <div className="step-progress">
              {currentStep + 1}/{currentProcessSet.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
