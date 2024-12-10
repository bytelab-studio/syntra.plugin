import {
    ContentObject,
    ParameterObject, PathItemObject,
    RequestBodyObject,
    ResponseObject,
    SchemaObjectType,
    ReferenceObject,
    SchemaObject
} from "openapi3-ts/oas31";
import * as oas from "openapi3-ts/oas31";
import {SQLType} from "./SQLType";
import {ContentType} from "./routeManager";
import {Table, TableRef} from "./table";

export class SchemaDefinition {
    public readonly location: string;
    public readonly name: string;


    private constructor(name: string) {
        this.location = `#/components/schemas/${name}`;
        this.name = name;
    }

    private static names: Set<string> = new Set();
    private static definitions: Map<string, SchemaObject | ReferenceObject> = new Map();

    public static of(table: TableRef<Table>, type: "select" | "update" | "create"): SchemaDefinition {
        return new SchemaDefinition(`${table.tableName}_${type}`);
    }

    public static define(name: string, definition: SchemaObject | ReferenceObject): SchemaDefinition {
        if (this.names.has(name)) {
            throw "Name already in use";
        }

        this.names.add(name);
        this.definitions.set(name, definition);
        return new SchemaDefinition(name);
    }

    public static from(name: string): SchemaDefinition {
        return new SchemaDefinition(name);
    }

    public static forEach(cb: (name: string, definition: SchemaObject | ReferenceObject) => void): void {
        for (let [name, definition] of this.definitions.entries()) {
            cb(name, definition);
        }
    }
}

export const DEFAULT_ERROR: SchemaDefinition = SchemaDefinition.define("DEFAULT_ERROR", {
    type: "object",
    properties: {
        status: {
            type: "integer"
        },
        message: {
            type: "string"
        },
        details: {
            type: "string"
        }
    }
});

export class OpenAPISchemaBuilder {
    private method: "GET" | "POST" | "PUT" | "DELETE";
    private route: string;
    private tag: string;
    private summary: string;
    private parameters: ParameterObject[];
    private requestBody: RequestBodyObject | undefined;
    private responses: Record<string, ResponseObject>;

    public constructor(method: "GET" | "POST" | "PUT" | "DELETE", route: string, group: TableRef<Table>) {
        this.method = method;
        this.route = route.replace(/:(\w+)/g, "{$1}");
        this.tag = group.tableName.replace(/(^[a-z]|_+[a-z])/g, (m) => m[m.length > 1 ? 1 : 0].toLowerCase());
        this.summary = "";
        this.parameters = [];
        this.requestBody = undefined;
        this.responses = {};
        this.addResponse("default", DEFAULT_ERROR);
    }

    public setSummary(summary: string): void {
        this.summary = summary;
    }

    public addParameter(name: string, inType: "query", type: SQLType, required: boolean): void;
    public addParameter(name: string, inType: "path", type: SQLType): void;
    public addParameter(name: string, inType: "query" | "path", type: SQLType, required = true): void {
        this.parameters.push({
            name: name,
            in: inType,
            schema: {
                type: type.jsonType as SchemaObjectType | SchemaObjectType[]
            },
            required: required
        });
    }

    public setRequestBody(schema: SchemaDefinition): void;
    public setRequestBody(schema: "buffer", contentType: ContentType): void;
    public setRequestBody(schema: SchemaDefinition | "buffer", contentType: ContentType = "application/json"): void {
        const content: ContentObject = {};
        content[contentType] = {
            schema: schema == "buffer" ? {
                type: "string",
                format: "binary"
            } : {
                $ref: schema.location
            }
        }

        this.requestBody = {
            content: content,
            required: true
        }
    }

    public addResponse(code: number | "default", schema: SchemaDefinition): void;
    public addResponse(code: number | "default", schema: "buffer", contentType: ContentType): void;
    public addResponse(code: number | "default", schema: SchemaDefinition | "buffer", contentType: ContentType = "application/json"): void {
        this.responses[code.toString()] = {
            description: "",
            content: {}
        }
        this.responses[code.toString()]!.content![contentType] = schema == "buffer" ? {
            schema: {
                type: "string",
                format: "binary"
            }
        } : {
            schema: {
                $ref: schema.location
            },
        }
    }

    public add(builder: oas.OpenApiBuilder): void {
        const path: PathItemObject = {};
        switch (this.method) {
            case "GET":
                path.get = {
                    summary: this.summary,
                    tags: [this.tag],
                    parameters: this.parameters,
                    responses: this.responses
                }
                break;
            case "POST":
                path.post = {
                    summary: this.summary,
                    tags: [this.tag],
                    parameters: this.parameters,
                    responses: this.responses,
                    requestBody: this.requestBody
                }
                break;
            case "PUT":
                path.put = {
                    summary: this.summary,
                    tags: [this.tag],
                    parameters: this.parameters,
                    responses: this.responses,
                    requestBody: this.requestBody
                }
                break;
            case "DELETE":
                path.delete = {
                    summary: this.summary,
                    tags: [this.tag],
                    parameters: this.parameters,
                    responses: this.responses,
                    requestBody: this.requestBody
                }
                break;
        }

        builder.addPath(this.route, path);
    }
}