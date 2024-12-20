import {Table, TableRef} from "./table";
import {Authentication} from "./security";
import * as math from "./math";
import {OpenAPISchemaBuilder} from "./schema";

export type ContentTypeBase =
    | "application"
    | "text"
    | "image"
    | "audio"
    | "video"
    | "font"
    | string;

export type ContentTypeType =
// Application subtypes
    | "json"
    | "xml"
    | "x-www-form-urlencoded"
    | "javascript"
    | "pdf"
    | "zip"
    | "gzip"
    | "octet-stream"
    | "x-tar"
    | "msword"
    | "vnd.ms-excel"
    | "vnd.openxmlformats-officedocument.wordprocessingml.document"
    | "vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    // Text subtypes
    | "plain"
    | "html"
    | "css"
    | "javascript"
    | "csv"
    | "xml"
    | "markdown"

    // Image subtypes
    | "png"
    | "jpeg"
    | "gif"
    | "bmp"
    | "webp"
    | "svg+xml"
    | "tiff"

    // Audio subtypes
    | "mpeg"
    | "ogg"
    | "wav"
    | "webm"

    // Video subtypes
    | "mp4"
    | "ogg"
    | "webm"

    // Font subtypes
    | "ttf"
    | "woff"
    | "woff2"
    | "otf"

    // Extendable string type for custom or future types
    | string;

export type ContentType = `${ContentTypeBase}/${ContentTypeType}`;

export interface Request {
    body: BodyHandler;
    authorization: AuthorizationHandler;
    params: ParamsHandler;
    headers: HeaderHandler;
}

export type ResponseContent = {
    status: number;
    data: string | Buffer | object;
    contentType: ContentType;
};

export type Route = {
    schema: OpenAPISchemaBuilder;
    route: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "ALL";
    cb: (req: Request, res: Response) => Promise<ResponseContent> | ResponseContent;
}

type SchemaCallback = (builder: OpenAPISchemaBuilder) => void;

export class RouteManager {
    public enableGetAllRoute: boolean = true;
    public enableGetSingleRoute: boolean = true;
    public enableCreateRoute: boolean = true;
    public enableUpdateRoute: boolean = true;
    public enableDeleteRoute: boolean = true;

    private readonly table: TableRef<Table>;
    private readonly routes: Route[];

    public constructor(table: TableRef<Table>) {
        this.table = table;
        this.routes = [];
    }

    public get(builder: SchemaCallback, route: string, cb: (req: Request, res: Response) => Promise<ResponseContent> | ResponseContent): this {
        const _ = new OpenAPISchemaBuilder("GET", "/" + this.table.tableName + route, this.table);
        builder(_);

        this.routes.push({
            schema: _,
            route: route,
            method: "GET",
            cb: cb
        });

        return this;
    }

    public post(builder: SchemaCallback, route: string, cb: (req: Request, res: Response) => Promise<ResponseContent> | ResponseContent): this {
        const _ = new OpenAPISchemaBuilder("POST", "/" + this.table.tableName + route, this.table);
        builder(_);

        this.routes.push({
            schema: _,
            route: route,
            method: "POST",
            cb: cb
        });

        return this;
    }

    public put(builder: SchemaCallback, route: string, cb: (req: Request, res: Response) => Promise<ResponseContent> | ResponseContent): this {
        const _ = new OpenAPISchemaBuilder("PUT", "/" + this.table.tableName + route, this.table);
        builder(_);

        this.routes.push({
            schema: _,
            route: route,
            method: "PUT",
            cb: cb
        });

        return this;
    }

    public delete(builder: SchemaCallback, route: string, cb: (req: Request, res: Response) => Promise<ResponseContent> | ResponseContent): this {
        const _ = new OpenAPISchemaBuilder("DELETE", "/" + this.table.tableName + route, this.table);
        builder(_);

        this.routes.push({
            schema: _,
            route: route,
            method: "DELETE",
            cb: cb
        });

        return this;
    }

    public forEach(cb: (item: Route, index: number) => void): void {
        this.routes.forEach((value: Route, index: number): void => cb(value, index));
    }
}

export class BodyHandler {
    private readonly content: Buffer;
    public readonly contentType: ContentType;


    public constructor(content: Buffer, contentType: ContentType) {
        this.content = content;
        this.contentType = contentType;
    }

    public json<T extends {} | []>(): T | null {
        try {
            if (this.contentType != "application/json") {
                return null;
            }

            return JSON.parse(this.content.toString());
        } catch {
            return null;
        }
    }

    public text(encoding: BufferEncoding = "utf8"): string | null {
        if (!this.contentType.startsWith("text/")) {
            return null;
        }
        return this.content.toString(encoding);
    }

    public raw(): Buffer {
        return this.content;
    }

    public isEmpty(): boolean {
        return this.content.length == 0;
    }
}

export class AuthorizationHandler {
    public readonly auth: Authentication | undefined;
    public readonly faulty: boolean;

    public constructor(auth: Authentication | undefined, faulty: boolean) {
        this.auth = auth;
        this.faulty = faulty;
    }

    /**
     * @deprecated Use AuthorizatonHandler.auth instead
     */
    public valid(): boolean {
        return !!this.auth;
    }
}

export class ParamsHandler {
    private readonly params: Record<string, any>;

    public constructor(params: Record<string, any>) {
        this.params = params;
    }

    public contains(name: string): boolean {
        return name in this.params;
    }

    public getInt(name: string): number | null {
        if (!this.isInt(name)) {
            return null;
        }

        return parseInt(this.params[name]);
    }

    public isInt(name: string): boolean {
        return this.contains(name) && math.isInt(parseInt(this.params[name]));
    }

    public getNumber(name: string): number | null {
        if (!this.isNumber(name)) {
            return null;
        }

        return parseFloat(this.params[name]);
    }

    public isNumber(name: string): boolean {
        return this.contains(name) && !isNaN(parseFloat(this.params[name]));
    }

    public getString(name: string): string {
        return this.params[name];
    }
}

export class HeaderHandler {
    private readonly headers: Record<string, string>;

    public constructor(headers: Record<string, string>) {
        this.headers = headers;
    }

    public contains(name: string): boolean {
        return name.toLowerCase() in this.headers;
    }

    public getString(name: string): string | null {
        if (!this.contains(name)) {
            return null;
        }
        return this.headers[name.toLowerCase()];
    }

    public get token(): string | null {
        if (!this.contains("Authorization")) {
            return null;
        }
        return this.getString("Authorization")!.substring(7);
    }
}


export class Response {
    badRequest(details?: string): ResponseContent {
        return this.failure(
            400,
            "Bad Request",
            details || "The request could not be understood or was missing required parameters"
        );
    }

    unauthorized(details?: string): ResponseContent {
        return this.failure(
            401,
            "Unauthorized",
            details || "Authentication is required and has failed or has not yet been provided."
        );
    }

    forbidden(details?: string): ResponseContent {
        return this.failure(
            403,
            "Forbidden",
            details || "The request was valid, but server is refusing action."
        );
    }

    notFound(details?: string): ResponseContent {
        return this.failure(
            404,
            "Not Found",
            details || "The requested resource could not be found"
        );
    }

    internalServerError(details?: string): ResponseContent {
        return this.failure(
            500,
            "Internal Server Error",
            details || "An error occurred on the server and could not be completed."
        );
    }

    failure(code: number, message: string, details: string): ResponseContent {
        return {
            status: code,
            contentType: "application/json",
            data: {
                status: code,
                message: message,
                details: details
            }
        }
    }

    ok(content: string, type: ContentType): ResponseContent;

    ok(content: Buffer, type: ContentType): ResponseContent;

    ok(content: object | object[]): ResponseContent;

    ok(content: string | Buffer | object | object[], type: ContentType = "application/json"): ResponseContent {
        return {
            status: 200,
            contentType: type,
            data: content
        }
    }
}

