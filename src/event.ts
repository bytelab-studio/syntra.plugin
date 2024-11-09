import type {Table} from "./table";

export class Event {
    beforeCreate: EventHolder<Function> = new EventHolder<Function>();
    afterCreate: EventHolder<Function> = new EventHolder<Function>();
    beforeSelect: EventHolder<Function> = new EventHolder<Function>();
    afterSelect: EventHolder<(rows: Table[] | [Table | null]) => void> = new EventHolder<(rows: Table[] | [Table | null]) => void>();
    beforeInsert: EventHolder<(row: Table) => void> = new EventHolder<(row: Table) => void>();
    afterInsert: EventHolder<(row: Table) => void> = new EventHolder<(row: Table) => void>();
    beforeUpdate: EventHolder<(row: Table) => void> = new EventHolder<(row: Table) => void>();
    afterUpdate: EventHolder<(row: Table) => void> = new EventHolder<(row: Table) => void>();
    beforeDelete: EventHolder<(row: Table) => void> = new EventHolder<(row: Table) => void>();
    afterDelete: EventHolder<(row: Table) => void> = new EventHolder<(row: Table) => void>();
}

type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : []

export class EventHolder<T extends Function> {
    private readonly onCBs: T[] = [];
    private onceCBs: T[] = [];

    public on(cb: T): void {
        this.onCBs.push(cb);
    }

    public once(cb: T): void {
        this.onceCBs.push(cb);
    }

    public async emit(...args: ArgumentTypes<T>): Promise<void> {
        for (const cb of this.onCBs) {
            const r = cb(...args);
            if (r instanceof Promise) {
                await r;
            }
        }
        for (const cb of this.onceCBs) {
            const r = cb(...args);
            if (r instanceof Promise) {
                await r;
            }
        }
        this.onceCBs = [];
    }
}