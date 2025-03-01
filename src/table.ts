import {toSQLFriendly} from "./utils";
import {Serializable} from "./serializable";
import {Column, ColumnFlags, IColumn, PrimaryColumn} from "./column";
import {Relation1T1, Relation1TN, RelationLoad} from "./relation";
import {Authentication, Permission} from "./security";
import {SQLType} from "./SQLType";
import {Event} from "./event";
import {bridge} from "./bridge";
import {RouteManager} from "./routeManager";

// export type TableRef<T extends Table> = { new(): T } & typeof Table;
export type TableRef<T extends Table | unknown> = T extends Table ? (T extends typeof Table ? never : {
    new(): T
} & typeof Table) : never;

export enum PermissionLevel {
    USER,
    AUTH,
    ALL
}

export class Table implements Serializable {
    public static namespaceStack: (string | null)[] = [];

    declare public static events: Event;
    declare public static routes: RouteManager;
    declare public static namespace: string | null;

    public readonly readLevel: PermissionLevel;
    public readonly writeLevel: PermissionLevel;
    public readonly deleteLevel: PermissionLevel;

    public readonly primaryKey: PrimaryColumn;
    public readonly permission: Relation1T1<Permission>;

    public get tableName(): string {
        return toSQLFriendly(this.constructor.name);
    }

    public get fullTableName(): string {
        // @ts-ignore
        if (!this.constructor.namespace) {
            // @ts-ignore
            return `${this.tableName}`;
        }
        // @ts-ignore
        return `${this.constructor.namespace}_${this.tableName}`;
    }

    protected constructor(readLevel: PermissionLevel = PermissionLevel.USER, writeLevel: PermissionLevel = PermissionLevel.USER, deleteLevel: PermissionLevel = PermissionLevel.USER) {
        this.primaryKey = new PrimaryColumn(SQLType.BIGINT, ColumnFlags.AUTO_INCREMENT | ColumnFlags.READONLY, this.tableName + "_id");
        this.permission = this.fullTableName != "permission" ? new Relation1T1<Permission>(Permission, ColumnFlags.READONLY) : undefined as unknown as Relation1T1<Permission>;
        this.readLevel = readLevel;
        this.writeLevel = writeLevel;
        this.deleteLevel = deleteLevel;
    }

    public async checkReadPermission(auth?: Authentication): Promise<boolean> {
        if (auth && !auth.canRead.getValue()) {
            return false;
        }

        const level: PermissionLevel = this.permission.getValue().readPermission.getValue();
        if (level == PermissionLevel.ALL) {
            return true;
        } else if (level == PermissionLevel.AUTH && !!auth) {
            return true;
        } else if (level == PermissionLevel.USER &&
            !!auth &&
            auth.primaryKey.getValue() == this.permission.getValue().authentication.getValue()
        ) {
            return true;
        }

        return false;
    }

    public async checkWritePermission(auth?: Authentication): Promise<boolean> {
        if (auth && !auth.canWrite.getValue()) {
            return false;
        }

        const level: PermissionLevel = this.permission.getValue().writePermission.getValue();
        if (level == PermissionLevel.ALL) {
            return true;
        } else if (level == PermissionLevel.AUTH && !!auth) {
            return true;
        } else if (level == PermissionLevel.USER &&
            !!auth &&
            auth.primaryKey.getValue() == this.permission.getValue().authentication.getValue()
        ) {
            return true;
        }

        return false;
    }

    public async checkDeletePermission(auth?: Authentication): Promise<boolean> {
        if (auth && !auth.canDelete.getValue()) {
            return false;
        }

        const level: PermissionLevel = this.permission.getValue().deletePermission.getValue();
        if (level == PermissionLevel.ALL) {
            return true;
        } else if (level == PermissionLevel.AUTH && !!auth) {
            return true;
        } else if (level == PermissionLevel.USER &&
            !!auth &&
            auth.primaryKey.getValue() == this.permission.getValue().authentication.getValue()
        ) {
            return true;
        }

        return false;
    }

    public async checkCreatePermission(auth?: Authentication): Promise<boolean> {
        return !!auth;
    }

    public serialize(data: Record<string, any>): void {
        for (const column of this.getColumns()) {
            if (!(column instanceof Column)) {
                continue;
            }
            const name: string = column.getColumnName();
            const type: SQLType = column.getColumnType();

            const value: any | undefined = data[name];
            if (column instanceof Relation1T1) {
                if (typeof value == "undefined") {
                    continue;
                }
                column.setKeyValue(type.import(value) as number | null);
            } else {
                if (typeof value == "undefined") {
                    column.setValue(null);
                }
                column.setValue(type.import(value));
            }
        }
    }

    public deserialize(): object {
        const obj: Record<string, any> = {};

        for (const column of this.getColumns()) {
            if (column instanceof Relation1T1) {
                if (column.containsFlag(ColumnFlags.PRIVATE)) {
                    continue;
                }

                obj[column.getColumnName()] = column.getKeyValue();

                if (column.loadingMethod == RelationLoad.DIRECT) {
                    const table: Table = column.getValue();
                    obj[column.columnRefName] = !!table ? table.deserialize() : null;
                }
            } else if (column instanceof Relation1TN) {
                obj[column.getColumnName()] = column.getValue().map(row => row.deserialize());
            } else if (column instanceof Column) {
                if (column.containsFlag(ColumnFlags.PRIVATE)) {
                    continue;
                }

                obj[column.getColumnName()] = column.getColumnType().export(column.getValue());
            }
        }

        return obj;
    }

    private _cacheColumns: IColumn<unknown>[] | undefined;

    public* getColumns(): Generator<IColumn<unknown>> {
        if (this._cacheColumns) {
            for (const column of this._cacheColumns!) {
                yield column;
            }
            return;
        }

        this._cacheColumns = [];
        const set: Set<string> = new Set<string>();

        for (const key of Object.keys(this)) {
            // @ts-ignore
            const property: any = this[key];
            if (property instanceof Column) {
                this._cacheColumns.push(property);

                if (property.getColumnName().trim() == "") {
                    property.setColumnName(toSQLFriendly(key));
                }
                const name: string = property.getColumnName();

                if (property instanceof Relation1T1) {
                    if (set.has(name)) {
                        throw `Duplicate column name '${name}'`;
                    }
                    if (set.has(property.columnRefName)) {
                        throw `Duplicate column name '${property.columnRefName}'`;
                    }
                    set.add(name);
                    set.add(property.columnRefName);
                } else {
                    if (set.has(name)) {
                        throw `Duplicate column name '${name}'`;
                    }
                    set.add(name);
                }

                yield property as IColumn<unknown>;
            } else if (property instanceof Relation1TN) {
                this._cacheColumns.push(property);

                if (property.getColumnName().trim() == "") {
                    property.setColumnName(toSQLFriendly(key));
                }
                const name: string = property.getColumnName();
                if (set.has(name)) {
                    throw `Duplicate column name '${name}'`;
                }
                set.add(name);

                yield property as IColumn<unknown>;
            }
        }
    }

    public* get1T1Relations(): Generator<Relation1T1<Table>> {
        for (const column of this.getColumns()) {
            if (column instanceof Relation1T1) {
                yield column;
            }
        }
    }

    public* get1TNRelations(): Generator<Relation1TN<Table>> {
        for (const column of this.getColumns()) {
            if (column instanceof Relation1TN) {
                yield column;
            }
        }
    }

    public setupColumns(): void {
        if (!!this._cacheColumns) {
            return;
        }

        const columns: Generator<IColumn<unknown>> = this.getColumns();
        let iterator: IteratorYieldResult<IColumn<unknown>> | IteratorReturnResult<any> = columns.next();
        while (!iterator.done) {
            iterator = columns.next();
        }
    }

    public async insert(auth: Authentication, readLevel?: PermissionLevel, writeLevel?: PermissionLevel, deleteLevel?: PermissionLevel): Promise<void> {
        if (auth != Authentication.root && !(await this.checkCreatePermission(auth))) {
            throw `Cannot insert '${this.fullTableName}' row because of missing permission`;
        }

        const permission: Permission = new Permission();
        permission.readPermission.setValue(readLevel || this.readLevel);
        permission.writePermission.setValue(writeLevel || this.writeLevel);
        permission.deletePermission.setValue(deleteLevel || this.deleteLevel);
        permission.authentication.setValue(auth.primaryKey.getValue());

        await (<TableRef<Table>>this.constructor).events.beforeInsert.emit(this);
        await bridge.insert(this, permission);
        await (<TableRef<Table>>this.constructor).events.afterInsert.emit(this);
    }

    public async update(auth?: Authentication): Promise<void> {
        if (auth != Authentication.root && !(await this.checkWritePermission(auth))) {
            throw `Cannot update '${this.fullTableName}' row because of missing permission`;
        }

        if (!await bridge.rowExist(this)) {
            throw `Cannot update '${this.fullTableName}' row because it was never inserted`;
        }

        await (<TableRef<Table>>this.constructor).events.beforeUpdate.emit(this);
        await bridge.update(this);
        await (<TableRef<Table>>this.constructor).events.afterUpdate.emit(this);
    }

    public async delete(auth?: Authentication): Promise<void> {
        if (auth != Authentication.root && !(await this.checkDeletePermission(auth))) {
            throw `Cannot delete '${this.fullTableName}' row because of missing permission`;
        }

        if (!await bridge.rowExist(this)) {
            throw `Cannot delete '${this.fullTableName}' row because it was never inserted`;
        }
        await (<TableRef<Table>>this.constructor).events.beforeDelete.emit(this);
        await bridge.delete(this);
        await (<TableRef<Table>>this.constructor).events.afterDelete.emit(this);
    }

    public validate(): string[] {
        const errors: string[] = [];

        for (const column of this.getColumns()) {
            if (!(column instanceof Column)) {
                continue;
            }

            if (column instanceof Relation1T1) {
                if (column.isKeyNull() && !column.containsFlag(ColumnFlags.NULLABLE) && !(column instanceof PrimaryColumn) && column != this.permission) {
                    errors.push(`Column '${column.getColumnName()}' cannot be null`);
                    continue;
                }

                continue;
            }

            if (column.isNull() && !column.containsFlag(ColumnFlags.NULLABLE) && !(column instanceof PrimaryColumn) && column != this.permission) {
                errors.push(`Column '${column.getColumnName()}' cannot be null`);
                continue;
            }
            if (!(column instanceof PrimaryColumn) && column != this.permission && !column.getColumnType().validate(column.getValue())) {
                errors.push(`Wrong type '${column.getColumnType().sqlName}' on column '${column.getColumnName()}'`);
                continue;
            }
        }

        return errors;
    }

    public async resolve(auth: Authentication | undefined): Promise<void> {
        for (const relation of this.get1T1Relations()) {
            if (relation.loadingMethod != RelationLoad.DIRECT || relation.isKeyNull()) {
                continue;
            }
            if (relation == this.permission) {
                continue;
            }
            const row: Table | null = await relation.refTable.select(auth, relation.getKeyValue());
            if (!!row) {
                relation.setValue(row);
            }
        }
    }

    public static get tableName(): string {
        return toSQLFriendly(this.name);
    }

    public static get fullTableName(): string {
        if (!this.namespace) {
            return `${this.tableName}`;
        }
        return `${this.namespace}_${this.tableName}`;
    }

    public static set namespaceScope(value: string | null) {
        if (!value) {
            this.namespaceStack.push(value);
            return;
        }
        this.namespaceStack.push(toSQLFriendly(value));
    }

    public static async selectAll<T extends TableRef<K>, K extends Table>(table: T, auth?: Authentication): Promise<K[]>;

    public static async selectAll<T extends TableRef<K>, K extends Table>(auth?: Authentication): Promise<K[]>;
    public static async selectAll<T extends TableRef<K>, K extends Table>(...args: any[]): Promise<K[]> {
        if (args.length != 2 || typeof args[0] != "function" || (typeof args[1] != "object" && typeof args[1] != "undefined")) {
            throw "Wrong call";
        }

        const table: T = args[0];
        const auth: Authentication | undefined = args[1];
        await table.events.beforeSelect.emit()

        const result: K[] = await bridge.selectAll<T, K>(table);

        if (auth == Authentication.root) {
            await table.events.afterSelect.emit(result);
            return result;
        }

        const rows: K[] = [];
        for (const row of result) {
            if (await row.checkReadPermission(auth)) {
                rows.push(row);
            }
        }

        await table.events.afterSelect.emit(rows);
        return rows;
    }

    public static select<T extends TableRef<K>, K extends Table>(table: T, auth: Authentication | undefined, id: number): Promise<K | null>;

    public static select<T extends TableRef<K>, K extends Table>(auth: Authentication | undefined, id: number): Promise<K | null>;

    public static async select<T extends TableRef<K>, K extends Table>(...args: any[]): Promise<K | null> {
        if (args.length != 3 || typeof args[0] != "function" || (typeof args[1] != "object" && typeof args[1] != "undefined") || typeof args[2] != "number") {
            throw "Wrong call";
        }

        const table: T = args[0];
        const auth: Authentication | undefined = args[1];
        const id: number = args[2];
        await table.events.beforeSelect.emit();

        const row: K | null = await bridge.selectSingle<T, K>(table, id);
        if (!row) {
            return null;
        }

        if (auth == Authentication.root || await row.checkReadPermission(auth)) {
            await table.events.afterSelect.emit([row]);
            return row;
        }

        await table.events.afterSelect.emit([null]);
        return null;
    }

    public static registerTable<T extends TableRef<K>, K extends Table>(table: T): void {
        if (this.namespaceStack.length > 0) {
            table.namespace = this.namespaceStack[this.namespaceStack.length - 1];
        } else {
            table.namespace = null;
        }

        if (tableNames.has(table.fullTableName)) {
            throw `Ambiguous name '${table.fullTableName}'. '${table.fullTableName}' was already declared once`;
        }
        tableNames.add(table.fullTableName);

        table.events = new Event();
        table.routes = new RouteManager(table);

        // @ts-ignore
        table.select = async (auth: Authentication, id: number): Promise<K | null> => {
            return await Table.select<T, K>(table, auth, id);
        }
        table.selectAll = async (auth: Authentication): Promise<K[]> => {
            return await Table.selectAll(table, auth);
        }
        tables.push(table);
    }
}

const tables: TableRef<Table>[] = [];
const tableNames: Set<string> = new Set<string>();

export function getTables(): TableRef<Table>[] {
    return tables.filter(t => t.tableName);
}

export function table<T extends TableRef<K>, K extends Table>() {
    return (target: T) => {
        Table.registerTable(target);
    }
}
