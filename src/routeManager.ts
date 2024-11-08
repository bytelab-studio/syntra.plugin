import {Table, TableRef} from "./table";
import {Authentication} from "./security";
import * as math from "./math";
import {SchemaBodyBuilder, SchemaBuilder} from "./schema";

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
}

export type ResponseContent = {
    status: number;
    data: string | Buffer | object;
    contentType: ContentType;
};

export type Route = {
    schema: object;
    route: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "ALL";
    cb: (req: Request, res: Response) => Promise<ResponseContent> | ResponseContent;
}

type SchemaCallback<T extends SchemaBuilder = SchemaBuilder> = (builder: T) => void;

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
        const _ = new SchemaBuilder("GET", route)
        builder(_);

        this.routes.push({
            schema: _.toJSON(),
            route: route,
            method: "GET",
            cb: cb
        });

        return this;
    }

    public post(builder: SchemaCallback<SchemaBodyBuilder>, route: string, cb: (req: Request, res: Response) => Promise<ResponseContent> | ResponseContent): this {
        const _ = new SchemaBodyBuilder("POST", route)
        builder(_);

        this.routes.push({
            schema: _.toJSON(),
            route: route,
            method: "POST",
            cb: cb
        });

        return this;
    }

    public put(builder: SchemaCallback<SchemaBodyBuilder>, route: string, cb: (req: Request, res: Response) => Promise<ResponseContent> | ResponseContent): this {
        const _ = new SchemaBodyBuilder("PUT", route)
        builder(_);

        this.routes.push({
            schema: _.toJSON(),
            route: route,
            method: "PUT",
            cb: cb
        });

        return this;
    }

    public delete(builder: SchemaCallback<SchemaBodyBuilder>, route: string, cb: (req: Request, res: Response) => Promise<ResponseContent> | ResponseContent): this {
        const _ = new SchemaBodyBuilder("DELETE", route)
        builder(_);

        this.routes.push({
            schema: _.toJSON(),
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

        return this.params[name];
    }

    public isInt(name: string): boolean {
        return this.contains(name) && typeof this.params[name] == "number" && math.isInt(this.params[name]);
    }

    public getNumber(name: string): number | null {
        if (!this.isNumber(name)) {
            return null;
        }

        return this.params[name];
    }

    public isNumber(name: string): boolean {
        return this.contains(name) && typeof this.params[name] == "number";
    }

    public getString(name: string): string {
        return this.params[name];
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

