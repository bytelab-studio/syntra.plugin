import {Table, TableRef} from "./table";
import {Permission} from "./security";

export let bridge: Bridge;

export function setBridge(_bridge: Bridge): void {
    bridge = _bridge;
}

export interface Bridge {
    selectSingle<T extends TableRef<K>, K extends Table>(table: T, id: number): Promise<K | null>;

    selectAll<T extends TableRef<K>, K extends Table>(table: T): Promise<K[]>;

    update<K extends Table>(item: K): Promise<void>;

    insert<K extends Table>(item: K, permission: Permission): Promise<void>;

    delete<K extends Table>(item: K): Promise<void>;

    rowExist<K extends Table>(item: K): Promise<boolean>;
}