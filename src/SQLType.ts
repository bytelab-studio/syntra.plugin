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

    VARCHAR,
}

export class SQLType {
    public static readonly TINYINT: SQLType = new SQLType("TINYINT", "number", SQLTypeGroup.TINYINT);
    public static readonly SMALLINT: SQLType = new SQLType("SMALLINT", "number", SQLTypeGroup.SMALLINT);
    public static readonly MEDIUMINT: SQLType = new SQLType("MEDIUMINT", "number", SQLTypeGroup.MEDIUMINT);
    public static readonly INT: SQLType = new SQLType("INT", "number", SQLTypeGroup.INT);
    public static readonly BIGINT: SQLType = new SQLType("BIGINT", "number", SQLTypeGroup.BIGINT);

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
            return typeof value == "number" && math.inRange(value, -128, 127);
        } else if (this.group == SQLTypeGroup.SMALLINT) {
            return typeof value == "number" && math.inRange(value, -32768, 32767);
        } else if (this.group == SQLTypeGroup.MEDIUMINT) {
            return typeof value == "number" && math.inRange(value, -8388608, 8388607);
        } else if (this.group == SQLTypeGroup.INT) {
            return typeof value == "number" && math.inRange(value, -2147483648, 2147483647);
        } else if (this.group == SQLTypeGroup.BIGINT) {
            return typeof value == "number" && math.inRange(value, -Math.pow(2, 63), Math.pow(2, 63) - 1);
        } else if (this.group == SQLTypeGroup.VARCHAR) {
            return this instanceof VarChar && typeof value == "string" && value.length <= this.size;
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
