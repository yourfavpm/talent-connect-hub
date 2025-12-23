import taskiveLogo from "@/assets/taskive-logo.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo = ({ className = "", showText = true }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={taskiveLogo} 
        alt="Taskive" 
        className="h-8 w-auto object-contain"
      />
    </div>
  );
};

export default Logo;
