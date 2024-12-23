import {PermissionLevel, Table, table} from "./table";
import {Column, ColumnFlags} from "./column";
import {SQLType, VarChar} from "./SQLType";

@table()
export class Permission extends Table {
    public constructor() {
        super();
    }

    public readonly authentication: Column<number> = new Column<number>(SQLType.BIGINT, ColumnFlags.NONE, "authentication_id");
    public readonly readPermission: Column<PermissionLevel> = new Column<PermissionLevel>(SQLType.TINYINT, ColumnFlags.READONLY, "read");
    public readonly writePermission: Column<PermissionLevel> = new Column<PermissionLevel>(SQLType.TINYINT, ColumnFlags.READONLY, "write");
    public readonly deletePermission: Column<PermissionLevel> = new Column<PermissionLevel>(SQLType.TINYINT, ColumnFlags.READONLY, "delete");

    public async insert(_: Authentication): Promise<void> {
        throw "Operation not performable";
    }
}

Permission.routes.enableGetSingleRoute = false;
Permission.routes.enableGetAllRoute = false;
Permission.routes.enableCreateRoute = false;
Permission.routes.enableUpdateRoute = false;
Permission.routes.enableDeleteRoute = false;

@table()
export class Authentication extends Table {
    public constructor() {
        super(PermissionLevel.USER, PermissionLevel.USER, PermissionLevel.USER);
    }

    public username: Column<string> = new Column(new VarChar(250));
    public email: Column<string> = new Column(new VarChar(250));
    public password: Column<string> = new Column(new VarChar(64), ColumnFlags.PRIVATE);
    public deactivated: Column<boolean> = new Column(SQLType.BOOL, ColumnFlags.PRIVATE);
    public canRead: Column<boolean> = new Column(SQLType.BOOL, ColumnFlags.PRIVATE, "read");
    public canWrite: Column<boolean> = new Column(SQLType.BOOL, ColumnFlags.PRIVATE, "write");
    public canDelete: Column<boolean> = new Column(SQLType.BOOL, ColumnFlags.PRIVATE, "delete");

    public static readonly root: Authentication = new Authentication();

    static {
        this.root.primaryKey.setValue(1);
        this.root.username.setValue("root");
        this.root.email.setValue("root");
        this.root.password.setValue("4813494d137e1631bba301d5acab6e7bb7aa74ce1185d456565ef51d737677b2");
        this.root.deactivated.setValue(false);
        this.root.canRead.setValue(true);
        this.root.canWrite.setValue(true);
        this.root.canDelete.setValue(true);
    }
}

Authentication.routes.enableCreateRoute = false;
Authentication.routes.enableUpdateRoute = false;
Authentication.routes.enableDeleteRoute = false;

Authentication.events.afterCreate.on(async () => {
    await Authentication.root.insert(Authentication.root);
});
