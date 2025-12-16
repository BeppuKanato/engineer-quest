export const Card = ({ className, ...props }: { className?: string; children: React.ReactNode }) => {
    return(
        <div
            data-slot="card" 
            className={`border border-gray-300 rounded-md p-4 shadow-sm bg-white ${className ?? ""}`}
            {...props}
        >
            {props.children}
        </div>
    )
}

export const CardHeader = ({ className = "", ...props }: { className?: string; children: React.ReactNode }) => {
    return (
        <div
            data-slot="card-header"
            className={`border-b border-gray-200 pb-2 mb-4 font-bold text-lg flex items-center text-center ${className}`}
            {...props}
        >
            {props.children}
        </div>
    );
};

export const CardTitle = ({ className = "", ...props }: { className?: string; children: React.ReactNode }) => {
    return (
        <h2
            data-slot="card-title"
            className={`text-xl font-semibold mb-2 ${className}`}
            {...props}
        >
            {props.children}
        </h2>
    );
};

export const CardDescription = ({ className = "", ...props }: { className?: string; children: React.ReactNode }) => {
    return (
        <p
            data-slot="card-description"
            className={`text-base text-gray-600 mb-4 ${className}`}
            {...props}
        >
            {props.children}
        </p>
    );
};

export const CardContent = ({ className = "", ...props }: { className?: string; children: React.ReactNode }) => {
    return (
        <div
            data-slot="card-content"
            className={`mb-4 ${className}`}
            {...props}
        >
            {props.children}
        </div>
    );
};

export const CardFooter = ({ className = "", ...props }: { className?: string; children: React.ReactNode }) => {
    return (
        <div
            data-slot="card-footer"
            className={`border-t border-gray-200 pt-2 mt-4 text-sm text-gray-500 ${className}`}
            {...props}
        >
            {props.children}
        </div>
    );
};


export const CardActions = ({ className = "", ...props }) => {
    return (
        <div
            data-slot="card-actions"
            className={`flex space-x-2 ${className}`}
        >
            {props.children}
        </div>
    )
}
