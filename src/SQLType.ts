import * as math from "./math";

// export enum SQLType {
//     SMALLINT,
//     INT,
//     BIGINT
// }

type JSONType = 'integer' | 'number' | 'string' | 'boolean' | 'object' | 'null' | 'array' | JSONType[];

const enum SQLTypeGroup {
    NONE,
    TINYINT,
    SMALLINT,
    MEDIUMINT,
    INT,
    BIGINT,

    FLOAT,
    DOUBLE,

    VARCHAR,
    DATE,
    TIME,
    DATETIME
}

export class SQLType {
    public static readonly TINYINT: SQLType = new SQLType("TINYINT", "integer", SQLTypeGroup.TINYINT);
    public static readonly SMALLINT: SQLType = new SQLType("SMALLINT", "integer", SQLTypeGroup.SMALLINT);
    public static readonly MEDIUMINT: SQLType = new SQLType("MEDIUMINT", "integer", SQLTypeGroup.MEDIUMINT);
    public static readonly INT: SQLType = new SQLType("INT", "integer", SQLTypeGroup.INT);
    public static readonly BIGINT: SQLType = new SQLType("BIGINT", "integer", SQLTypeGroup.BIGINT);
    public static readonly BOOL: SQLType = new SQLType("TINYINT", "boolean", SQLTypeGroup.TINYINT);

    public static readonly FLOAT: SQLType = new SQLType("FLOAT", "number", SQLTypeGroup.FLOAT);
    public static readonly DOUBLE: SQLType = new SQLType("DOUBLE", "number", SQLTypeGroup.DOUBLE);

    public static readonly DATE: SQLType = new SQLType("DATE", "string", SQLTypeGroup.DATE);
    public static readonly TIME: SQLType = new SQLType("TIME", "string", SQLTypeGroup.TIME);
    public static readonly DATETIME: SQLType = new SQLType("DATETIME", "string", SQLTypeGroup.DATETIME);

    public readonly sqlName: string;
    public readonly jsonType: JSONType;
    public readonly group: SQLTypeGroup;

    public constructor(sqlName: string, jsonType: JSONType, group: SQLTypeGroup) {
        this.sqlName = sqlName;
        this.jsonType = jsonType;
        this.group = group;
    }

    public validate(value: any): boolean {
        if (this.group == SQLTypeGroup.TINYINT) {
            return typeof value == "number";
        } else if (this.group == SQLTypeGroup.SMALLINT) {
            return typeof value == "number";
        } else if (this.group == SQLTypeGroup.MEDIUMINT) {
            return typeof value == "number";
        } else if (this.group == SQLTypeGroup.INT) {
            return typeof value == "number";
        } else if (this.group == SQLTypeGroup.BIGINT) {
            return typeof value == "number";
        } else if (this.group == SQLTypeGroup.VARCHAR) {
            return this instanceof VarChar && typeof value == "string" && value.length <= this.size;
        } else if (this.group == SQLTypeGroup.FLOAT) {
            return typeof value == "number";
        } else if (this.group == SQLTypeGroup.DOUBLE) {
            return typeof value == "number";
        } else if (this.group == SQLTypeGroup.DATE) {
            return value instanceof Date;
        } else if (this.group == SQLTypeGroup.TIME) {
            return value instanceof Date;
        } else if (this.group == SQLTypeGroup.DATETIME) {
            return value instanceof Date;
        } else if (this.group == SQLTypeGroup.NONE) {
            return true;
        } else {
            return false;
        }
    }

    public export(value: any): string | number | boolean | null {
        if (!this.validate(value)) {
            return null;
        }
        if (this.group == SQLTypeGroup.DATE) {
            const date: Date = value;
            return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
        } else if (this.group == SQLTypeGroup.TIME) {
            const date: Date = value;
            return `${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}`;
        } else if (this.group == SQLTypeGroup.DATETIME) {
            const date: Date = value;
            return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}`;
        }

        return value;
    }

    public import(value: any): [string | null, any] {
        if (this.group == SQLTypeGroup.DATE) {
            const date: Date = new Date(value);
            if (isNaN(date.valueOf())) {
                return ["Wrong Date format", null];
            }
            return [null, date];
        } else if (this.group == SQLTypeGroup.TIME) {
            const date: Date = new Date(value);
            if (isNaN(date.valueOf())) {
                return ["Wrong Time format", null];
            }
            return [null, date];
        } else if (this.group == SQLTypeGroup.DATETIME) {
            const date: Date = new Date(value);
            if (isNaN(date.valueOf())) {
                return ["Wrong Datetime format", null];
            }
        }

        return [null, value];
    }
}

export class VarChar extends SQLType {
    public readonly size: number;

    public constructor(size: number) {
        if (!math.isInt(size)) {
            throw "size must be an integer";
        }
        super(`VARCHAR(${size})`, "string", SQLTypeGroup.VARCHAR);

        this.size = size;
    }
}
