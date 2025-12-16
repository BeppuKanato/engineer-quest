type FormProps = React.FormHTMLAttributes<HTMLFormElement>;

export const Form = ({ children, ...props }: FormProps) => {
  return <form {...props}>{children}</form>;
};

type FormItemProps = React.HTMLAttributes<HTMLDivElement>;

export const FormItem = ({ children, ...props }: FormItemProps) => {
  return <div className="mb-4" {...props}>{children}</div>;
};

type FormLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const FormLabel = ({ children, ...props }: FormLabelProps) => {
  return (
    <label className="block text-base text-gray-700 mb-2" {...props}>
      {children}
    </label>
  );
};

type FormControlProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

export const FormControl = ({ children, ...props }: FormControlProps) => {
  return <div className="mb-4" {...props}>{children}</div>;
};

type FormMessageProps = { children?: React.ReactNode };

export const FormMessage = ({ children }: FormMessageProps) => {
  return <p className="text-red-500 text-sm mt-1">{children}</p>;
};

type FormDescriptionProps = { children?: React.ReactNode };
export const FormDescription = ({ children }: FormDescriptionProps) => {
  return <p className="text-gray-600 text-sm mt-1">{children}</p>;
};