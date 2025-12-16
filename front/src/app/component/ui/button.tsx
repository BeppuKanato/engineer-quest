import React from "react";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  text?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children?: React.ReactNode;
};

export const Button = ({
  text,
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) => {
  const baseStyle =
    "rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyle: Record<Variant, string> = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    outline: "border border-gray-300 bg-white text-gray-800 hover:bg-gray-100",
    danger: "bg-red-500 text-white hover:bg-red-600",
    ghost:
      "bg-transparent text-gray-800 hover:bg-gray-100 hover:border hover:border-gray-300",
  };

  const sizeStyle: Record<Size, string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-base",
    lg: "h-12 px-6 text-lg",
  };

  return (
    <button
      className={`${baseStyle} ${variantStyle[variant]} ${sizeStyle[size]} ${className}`}
      {...props}
    >
      {text || children}
    </button>
  );
};
