export type MissionComponentProps = {
    highlight?: string; 
    componentType?: string;
}

export const isComponentType = (name: string, propsComponentType?: string) => (
    propsComponentType === name
);

export const isHighlight = (name: string, propsHighlight?: string) => (
    propsHighlight === name
)