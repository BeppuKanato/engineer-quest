import * as React from "react";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={`border h-7 border-gray-500 rounded-md bg-gray-100 ${className ?? ""}`}
      {...props}
    />
  );
}

export { Textarea };
