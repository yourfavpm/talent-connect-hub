interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "light" | "dark";
}

const Logo = ({ className = "", showText = true, variant = "dark" }: LogoProps) => {
  const logoPath = variant === "light" ? "/images/logocolored.png" : "/images/logoplain.png";
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src={logoPath} 
        alt="OPSlyHR" 
        className="h-32 w-auto object-contain drop-shadow-xl shadow-lg"
      />
      {showText && (
        <span className="text-lg font-black text-slate-900 tracking-tight hidden sm:inline">OPSlyHR</span>
      )}
    </div>
  );
};

export default Logo;
