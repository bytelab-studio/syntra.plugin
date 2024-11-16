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

export abstract class IColumn<T extends ColumnTypes> {
    protected columnName: string;
    protected value: T | null = null;

    protected constructor(columnName: string = "") {
        this.columnName = columnName;
    }

    public abstract setValue(value: T): void;

    public abstract getValue(): T;

    public isNull(): boolean {
        return this.value == null;
    }

    public setColumnName(name: string): void {
        if (this.columnName.trim() == "") {
            this.columnName = name;
        }
    }

    public getColumnName(): string {
        return this.columnName;
    }
}

export class Column<T extends ColumnTypes> extends IColumn<T> {
    private columnType: SQLType;
    private flags: ColumnFlags;

    public constructor(columnType: SQLType, flags: ColumnFlags = ColumnFlags.NONE, columnName: string = "") {
        super(columnName);
        this.columnType = columnType;
        this.value = null;
        this.flags = flags;
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