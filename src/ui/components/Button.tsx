import type { LucideIcon } from "lucide-react";
import type { PropsWithChildren } from "react";

interface ButtonProps {
  color?: string;
  size?: "small" | "medium" | "large";
  onClick?: () => void;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  label?: string;
}

const Button = (props: PropsWithChildren<ButtonProps>) => {
  const {
    color = "primary",
    size = "medium",
    onClick,
    icon: Icon = null,
    iconPosition = "left",
    disabled = false,
    children,
  } = props;

  const colorMap: Record<string, string> = {
    primary: "bg-emerald-400 hover:bg-emerald-500 text-white",
    secondary: "bg-slate-200 hover:bg-slate-300 text-black",
  };

  const sizeMap: Record<string, string> = {
    small: "text-xs px-6 drop-shadow h-10",
    medium: "text-sm px-8 drop-shadow-md h-12",
    large: "text-md px-10 drop-shadow-xl h-16",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-full font-bold uppercase tracking-wider transition duration-300 ${colorMap[color]} ${sizeMap[size]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && (
        <span
          className={
            iconPosition === "left" ? `order-first mr-2` : "order-last ml-2"
          }
        >
          <Icon />
        </span>
      )}
      {children}
    </button>
  );
};

export default Button;
