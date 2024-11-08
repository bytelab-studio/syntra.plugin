export interface Serializable {
    serialize(data: Map<string, unknown>): any;

    deserialize(): any;
}