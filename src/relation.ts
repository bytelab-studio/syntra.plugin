import {Table, TableRef} from "./table";
import {Column, ColumnFlags} from "./column";
import {SQLType} from "./SQLType";

export enum RelationLoad {
    DIRECT,
    LAZY
}

export abstract class Relation<T extends TableRef<K>, K extends Table> extends Column<K> {
    public readonly refTable: TableRef<K>;
    public readonly loadingMethod: RelationLoad;
    private key: number | null;

    public constructor(table: T, flags: ColumnFlags = ColumnFlags.NONE, loadingMethod: RelationLoad = RelationLoad.DIRECT) {
        super(SQLType.BIGINT, flags, table.tableName + "_id");

        this.refTable = table;
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

export class Relation1T1<T extends TableRef<K>, K extends Table> extends Relation<T, K> {
}