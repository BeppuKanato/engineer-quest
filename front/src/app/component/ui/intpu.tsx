type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...props }: InputProps) => {
  return (
    <input
      className={`border h-7 border-gray-500 rounded-md bg-gray-100 ${className ?? ""}`}
      {...props}
    />
  );
};
