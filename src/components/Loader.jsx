import './styles.css';

export default function Loader({ size = "medium" }) {
  const getSize = () => {
    switch(size) {
      case "small": return "w-8 h-8";
      case "large": return "w-16 h-16";
      default: return "w-12 h-12";
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full">
      <svg className={`pl ${getSize()}`} viewBox="0 0 240 240">
        <circle className="pl__ring pl__ring--a" cx="120" cy="120" r="105" fill="none" stroke="#000" strokeWidth="20" strokeDasharray="0 660" strokeDashoffset="-330" strokeLinecap="round"></circle>
        <circle className="pl__ring pl__ring--b" cx="120" cy="120" r="35" fill="none" stroke="#000" strokeWidth="20" strokeDasharray="0 220" strokeDashoffset="-110" strokeLinecap="round"></circle>
        <circle className="pl__ring pl__ring--c" cx="85" cy="120" r="70" fill="none" stroke="#000" strokeWidth="20" strokeDasharray="0 440" strokeLinecap="round"></circle>
        <circle className="pl__ring pl__ring--d" cx="155" cy="120" r="70" fill="none" stroke="#000" strokeWidth="20" strokeDasharray="0 440" strokeLinecap="round"></circle>
      </svg>
    </div>
  );
}