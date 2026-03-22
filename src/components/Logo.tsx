interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "light" | "dark";
}

const Logo = ({ className = "", showText = true, variant = "dark" }: LogoProps) => {
  const logoPath = variant === "light" ? "/images/logoinverted.png" : "/images/mainlogo.png";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logoPath} 
        alt="OPSlyHR" 
        className="h-32 w-auto object-contain"
      />
    </div>
  );
};

export default Logo;
