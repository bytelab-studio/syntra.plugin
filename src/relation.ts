import {Table, TableRef} from "./table";
import {Column, ColumnFlags, IColumn} from "./column";
import {SQLType} from "./SQLType";

export enum RelationLoad {
    DIRECT,
    LAZY
}

export interface IJoinable<K extends Table> {
    refTable: TableRef<K>

    getJoinName(activeTable: string): string;

    getColumnName(): string;
}

export class Relation1T1<K extends Table> extends Column<K> implements IJoinable<K> {
    public readonly refTable: TableRef<K>;
    public readonly columnRefName: string;
    public readonly loadingMethod: RelationLoad;
    private key: number | null;

    public constructor(table: TableRef<K>, flags: ColumnFlags = ColumnFlags.NONE, loadingMethod: RelationLoad = RelationLoad.DIRECT, columnIdName: string = table.tableName + "_id", columnRefName: string = table.tableName) {
        super(SQLType.BIGINT, flags, columnIdName);
        this.refTable = table;
        this.columnRefName = columnRefName;
        this.loadingMethod = loadingMethod;
        this.key = null;
    }

    public getKeyValue(): number {
        if (!this.containsFlag(ColumnFlags.NULLABLE) && this.key == null) {
            throw `Column '${this.getColumnName()}' is null`;
        }

        return this.key!;
    }

    public setKeyValue(key: number | null): void {
        if (!this.containsFlag(ColumnFlags.NULLABLE) && key == null) {
            throw `Column '${this.getColumnName()}' cannot be null`;
        }
        this.key = key;
    }

    public isKeyNull(): boolean {
        return this.key == null;
    }

    public setValue(value: K): void {
        super.setValue(value);
        if (value != null) {
            this.setKeyValue(value.primaryKey.getValue());
        }
    }

    public getJoinName(activeTable: string): string {
        return activeTable + "_" + this.getColumnName() + "_" + this.refTable.tableName + "_" + (new this.refTable()).primaryKey.getColumnName();
    }
}

export class Relation1TN<K extends Table> extends IColumn<K[]> implements IJoinable<K> {
    public readonly refTable: TableRef<K>;
    public readonly refColumn: Column<number>;
    public readonly loadingMethod: RelationLoad;

    public constructor(table: TableRef<K>, cb: (row: K) => Column<number>, loadingMethod: RelationLoad = RelationLoad.DIRECT, columnName: string = "") {
        super(columnName);
        this.refTable = table;
        this.loadingMethod = loadingMethod;
        // @ts-ignore
        this.refColumn = cb(new table());
        if (this.refColumn.getColumnType() != SQLType.BIGINT) {
            throw "1:N Relation must target a column of type BIGINT";
        }
    }

    public setValue(value: K[]): void {
        this.value = value;
    }

    public getValue(): K[] {
        if (this.value == null) {
            throw `Map relation '${this.columnName}' is null`
        }
        return this.value;
    }

    public getJoinName(activeTable: string): string {
        return activeTable + "_" + this.columnName + "_" + this.refTable.tableName + "_" + this.refColumn.getColumnName();
    }
}