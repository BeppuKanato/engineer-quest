export type MissionComponentProps = {
    highlight?: string; 
    componentType?: string;
}

export const isComponentType = (name: string, propsComponentType?: string) => (
    console.log("isComponentType check:", name, propsComponentType),
    propsComponentType === name
);

export const isHighlight = (name: string, propsHighlight?: string) => (
    propsHighlight === name
)