import {Table, TableRef} from "./table";
import {Column, ColumnFlags} from "./column";
import {SQLType} from "./SQLType";
import {Permission} from "./security";

export enum RelationLoad {
    DIRECT,
    LAZY
}

export abstract class Relation<K extends Table> extends Column<K> {
    public readonly refTable: TableRef<K>;
    public readonly columnRefName: string;
    public readonly loadingMethod: RelationLoad;
    private key: number | null;

    public constructor(table: TableRef<K>, flags: ColumnFlags = ColumnFlags.NONE, loadingMethod: RelationLoad = RelationLoad.DIRECT, columnIdName: string = table.tableName + "_id", columnRefName: string = table.tableName) {
        super(SQLType.BIGINT, flags, columnIdName);
        if (table == Permission as unknown as TableRef<K>) {

        }
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
}

export class Relation1T1<K extends Table> extends Relation<K> {
}