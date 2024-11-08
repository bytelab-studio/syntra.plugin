import {ContentType} from "./routeManager";
import {SQLType} from "./SQLType";
import {Table, TableRef} from "./table";

interface ParamSchema {
    type: "query" | "path";
    sql_type: string;
    description: string;
}

interface ValueSchema {
    sql_type: string;
    json_type: string;
    nullable: boolean;
    optional: boolean;
}

interface BaseObjectSchema {
    json_type: "object" | "array";
    nullable: boolean;
    optional: boolean;
}

interface RefSchema extends BaseObjectSchema {
    ref: `/schema/models/${string}`;
}

interface ObjectSchema extends BaseObjectSchema {
    definition: Record<string, DataSchema>
}

type DataSchema = ValueSchema | RefSchema | ObjectSchema;

interface ResponseSchema {
    content_type: ContentType;
    body: "buffer" | DataSchema;
}

export class SchemaBuilder {
    protected readonly method: "GET" | "POST" | "PUT" | "DELETE";
    protected readonly path: string;
    protected readonly params: Record<string, ParamSchema>;
    protected readonly responses: Record<number | "default", ResponseSchema>

    public constructor(method: "GET" | "POST" | "PUT" | "DELETE", path: string) {
        this.method = method;
        this.path = path;
        this.params = {};
        this.responses = {
            default: {
                content_type: "application/json",
                body: {
                    json_type: "object",
                    nullable: false,
                    optional: false,
                    definition: {
                        status: {
                            json_type: "number",
                            sql_type: "INT",
                            nullable: false,
                            optional: false
                        },
                        message: {
                            json_type: "string",
                            sql_type: "TEXT",
                            nullable: false,
                            optional: false
                        },
                        details: {
                            json_type: "string",
                            sql_type: "TEXT",
                            nullable: false,
                            optional: false
                        }
                    }
                }
            }
        };
    }

    public param(kind: "query" | "path", name: string, type: SQLType, description: string): this {
        this.params[name] = {
            type: kind,
            sql_type: type.sqlName,
            description: description
        }
        return this;
    }

    public response(status: number | "default", cb: (builder: ResponseBuilder) => void): this {
        const _: ResponseBuilder = new ResponseBuilder();
        cb(_);
        this.responses[status] = _.toJSON();
        return this;
    }

    public toJSON(): object {
        return {
            method: this.method,
            path: this.path,
            params: this.params,
            responses: this.responses
        }
    }
}

export class SchemaBodyBuilder extends SchemaBuilder {
    private content: DataSchema | "buffer" | "none" = "none";
    private type: ContentType = "application/octet-stream";

    public accept(type: ContentType): this {
        this.type = type;
        return this;
    }

    public body(cb: ((builder: ContentBuilder) => void) | "buffer" | "none"): this {
        if (typeof cb == "string") {
            this.content = cb;
            return this;
        }
        const _: ContentBuilder = new ContentBuilder();
        cb(_);
        this.content = _.toJSON();
        return this;
    }

    public toJSON(): object {
        return {
            method: this.method,
            path: this.path,
            params: this.params,
            accept: this.type,
            body: this.content,
            responses: this.responses
        }
    }
}

export class ResponseBuilder {
    private type: ContentType = "application/octet-stream";
    private body: "buffer" | DataSchema = "buffer";

    public contentType(type: ContentType): this {
        this.type = type;
        return this;
    }

    public content(cb: ((builder: ContentBuilder) => void) | "buffer"): this {
        if (typeof cb == "string") {
            this.body = cb;
            return this;
        }

        const _: ContentBuilder = new ContentBuilder();
        cb(_);
        this.body = _.toJSON();
        return this;
    }

    public toJSON(): ResponseSchema {
        return {
            content_type: this.type,
            body: this.body
        }
    }
}

export class ContentBuilder {
    private schema: DataSchema | undefined = undefined;

    public property(type: SQLType, nullable: boolean = false, optional: boolean = false): void {
        this.schema = {
            sql_type: type.sqlName,
            json_type: type.jsonType,
            nullable: nullable,
            optional: optional,
        }
    }

    public reference(ref: TableRef<Table>, nullable: boolean = false, optional: boolean = false): void {
        this.schema = {
            json_type: "object",
            ref: `/schema/models/${ref.tableName}`,
            nullable: nullable,
            optional: optional
        }
    }

    public referenceArray(ref: TableRef<Table>, nullable: boolean = false, optional: boolean = false): void {
        this.schema = {
            json_type: "array",
            ref: `/schema/models/${ref.tableName}`,
            nullable: nullable,
            optional: optional
        }
    }

    public object(cb: (builder: ObjectBuilder) => void, nullable: boolean = false, optional: boolean = false): void {
        const _: ObjectBuilder = new ObjectBuilder();
        cb(_);

        this.schema = {
            json_type: "object",
            definition: _.toJSON(),
            nullable: nullable,
            optional: optional
        }
    }

    public objectArray(cb: (builder: ObjectBuilder) => void, nullable: boolean = false, optional: boolean = false): void {
        const _: ObjectBuilder = new ObjectBuilder();
        cb(_);

        this.schema = {
            json_type: "array",
            definition: _.toJSON(),
            nullable: nullable,
            optional: optional
        }
    }

    public toJSON(): DataSchema {
        if (!this.schema) {
            throw "No DateSchema was produces. (Are you missing some calls?)";
        }
        return this.schema;
    }
}

export class ObjectBuilder {
    private readonly items: Record<string, DataSchema>

    public constructor() {
        this.items = {};
    }

    public item(name: string,  cb: (builder: ContentBuilder) => void): this {
        const _: ContentBuilder = new ContentBuilder();
        cb(_);
        this.items[name] = _.toJSON();
        return this;
    }

    public toJSON(): Record<string, DataSchema> {
        return this.items
    }
}