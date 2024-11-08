import {Serializable} from "./serializable";
import {SQLType} from "./SQLType";

export type ColumnTypes = unknown | number | Serializable | ColumnTypes[];
export type Nullable<T extends ColumnTypes> = T | null;

export enum ColumnFlags {
    NONE = 0b0,
    NULLABLE = 0b1,
    AUTO_INCREMENT = 0b10,
    UNIQUE = 0b100,
    READONLY = 0b1000,
    PRIVATE = 0b10000
}

export class Column<T extends ColumnTypes> {
    private columnName: string;
    private columnType: SQLType;
    private value: T | null;
    private flags: ColumnFlags;

    public constructor(columnType: SQLType, flags: ColumnFlags = ColumnFlags.NONE, columnName: string = "") {
        this.columnName = columnName;
        this.columnType = columnType;
        this.value = null;
        this.flags = flags;
    }

    public setColumnName(name: string): void {
        if (this.columnName.trim() == "") {
            this.columnName = name;
        }
    }

    public getColumnName(): string {
        return this.columnName;
    }

    public isNull(): boolean {
        return this.value == null;
    }

    public setValue(value: T): void {
        this.value = value;
    }

    public getValue(): T {
        if (!this.containsFlag(ColumnFlags.NULLABLE) && this.value == null) {
            throw `Column '${this.columnName}' is null`;
        }
        return this.value!;
    }

    public containsFlag(flag: ColumnFlags): boolean {
        return (this.flags & flag) > 0;
    }

    public getColumnType(): SQLType {
        return this.columnType;
    }
}

export class PrimaryColumn extends Column<number> {
}