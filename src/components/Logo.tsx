import taskiveLogo from "@/assets/taskive-logo.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "light" | "dark";
}

const Logo = ({ className = "", showText = true, variant = "dark" }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={taskiveLogo} 
        alt="Taskive" 
        className={`h-8 w-auto object-contain ${variant === "light" ? "brightness-0 invert" : ""}`}
      />
    </div>
  );
};

export default Logo;
