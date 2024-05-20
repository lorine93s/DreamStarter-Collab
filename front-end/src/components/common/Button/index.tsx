import { ButtonHTMLAttributes, FC, ReactNode } from "react";
import { ButtonLoader } from "../Loaders";

interface IButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  _isSubmitting?: boolean;
}

const Button: FC<IButton> = ({
  variant,
  className,
  size = "md",
  children,
  _isSubmitting,
  ...rest
}) => {
  const variants: Record<string, unknown> = {
    primary: "bg-blue-500 hover:bg-blue-400 text-white",
    secondary: "border border-grey-5 text-gray-5",
    tertiary: "",
    destructive: "bg-red-500",
  };

  const sizes: Record<string, unknown> = {
    lg: "rounded-lg text-base px-6 py-3",
    md: "rounded-lg text-sm px-6 py-3",
    sm: "rounded-md text-sm px-3 py-1 text-sm ",
  };

  return (
    <button
      className={`  ${className} ${sizes[size]}  ${variants[variant]}`}
      {...rest}
    >
      {_isSubmitting ? <ButtonLoader /> : children}
    </button>
  );
};

export default Button;
