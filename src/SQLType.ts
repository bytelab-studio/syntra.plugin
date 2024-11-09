import * as math from "./math";

// export enum SQLType {
//     SMALLINT,
//     INT,
//     BIGINT
// }

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
    public static readonly TINYINT: SQLType = new SQLType("TINYINT", "number", SQLTypeGroup.TINYINT);
    public static readonly SMALLINT: SQLType = new SQLType("SMALLINT", "number", SQLTypeGroup.SMALLINT);
    public static readonly MEDIUMINT: SQLType = new SQLType("MEDIUMINT", "number", SQLTypeGroup.MEDIUMINT);
    public static readonly INT: SQLType = new SQLType("INT", "number", SQLTypeGroup.INT);
    public static readonly BIGINT: SQLType = new SQLType("BIGINT", "number", SQLTypeGroup.BIGINT);
    public static readonly BOOL: SQLType = new SQLType("TINYINT", "boolean", SQLTypeGroup.TINYINT);

    public static readonly FLOAT: SQLType = new SQLType("FLOAT", "number", SQLTypeGroup.FLOAT);
    public static readonly DOUBLE: SQLType = new SQLType("DOUBLE", "number", SQLTypeGroup.DOUBLE);

    public static readonly DATE: SQLType = new SQLType("DATE", "string", SQLTypeGroup.DATE);
    public static readonly TIME: SQLType = new SQLType("TIME", "string", SQLTypeGroup.TIME);
    public static readonly DATETIME: SQLType = new SQLType("DATETIME", "string", SQLTypeGroup.DATETIME);

    public readonly sqlName: string;
    public readonly jsonType: string;
    public readonly group: SQLTypeGroup;

    public constructor(sqlName: string, jsonType: string, group: SQLTypeGroup) {
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
