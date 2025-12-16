type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  text: string;
};

export const Label = ({ text, className, ...props }: LabelProps) => {
  return (
    <label className={`text-base ${className}`} {...props}>
      {text}
    </label>
  );
};
