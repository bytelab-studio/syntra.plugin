export interface Serializable {
    serialize(data: Record<string, any>): void;

    deserialize(): object;
}