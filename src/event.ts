export class Event {
    beforeCreate: EventHolder<Function> = new EventHolder<Function>();
    afterCreate: EventHolder<Function> = new EventHolder<Function>();
    beforeSelect: EventHolder<Function> = new EventHolder<Function>();
    afterSelect: EventHolder<Function> = new EventHolder<Function>();
    beforeInsert: EventHolder<Function> = new EventHolder<Function>();
    afterInsert: EventHolder<Function> = new EventHolder<Function>();
    beforeUpdate: EventHolder<Function> = new EventHolder<Function>();
    afterUpdate: EventHolder<Function> = new EventHolder<Function>();
    beforeDelete: EventHolder<Function> = new EventHolder<Function>();
    afterDelete: EventHolder<Function> = new EventHolder<Function>();
}

export class EventHolder<T extends Function> {
    private readonly onCBs: T[] = [];
    private onceCBs: T[] = [];

    public on(cb: T): void {
        this.onCBs.push(cb);
    }

    public once(cb: T): void {
        this.onceCBs.push(cb);
    }

    public async emit(...args: any[]): Promise<void> {
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
