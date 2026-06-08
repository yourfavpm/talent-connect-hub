interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "light" | "dark";
  imgHeight?: string;
}

const Logo = ({ 
  className = "", 
  showText = true, 
  variant = "dark",
  imgHeight = "h-12" 
}: LogoProps) => {
  const logoPath = variant === "light" ? "/images/logoplain.png" : "/images/logocolored.svg";
  
  return (
    <div className={`flex items-center gap-3 ${className} transition-all duration-300`}>
      <img 
        src={logoPath} 
        alt="OpslyHR" 
        className={`${imgHeight} w-auto object-contain filter drop-shadow-sm brightness-[1.02]`}
      />
      {showText && (
        <span className="text-xl font-black text-slate-900 tracking-tighter hidden sm:inline antialiased">
          OpslyHR
        </span>
      )}
    </div>
  );
};

export default Logo;
