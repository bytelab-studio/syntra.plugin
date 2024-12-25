import {table, Table, TableRef, PermissionLevel} from "./table";
import {Column, ColumnFlags} from "./column";
import {SQLType, VarChar} from "./SQLType";
import {Relation1T1, RelationLoad} from "./relation";
import {ContentType} from "./routeManager";
import {SchemaDefinition} from "./schema";

@table()
export class Resource extends Table {
    public constructor() {
        super();
    }

    public readonly data: Column<Buffer> = new Column(new SQLType("LONGBLOB", "number", 0), ColumnFlags.NULLABLE | ColumnFlags.PRIVATE);
    public readonly length: Column<number> = new Column(SQLType.INT, ColumnFlags.NULLABLE);
    public readonly mimeType: Column<ContentType> = new Column(new VarChar(100), ColumnFlags.NULLABLE);
}

Resource.routes.enableGetAllRoute = false;
Resource.routes.enableGetSingleRoute = false;
Resource.routes.enableCreateRoute = false;
Resource.routes.enableUpdateRoute = false;
Resource.routes.enableDeleteRoute = false;

Resource.routes.get(builder => {
    builder.addParameter("id", "path", SQLType.BIGINT);
    builder.addResponse(200, "buffer", "application/octet-stream")
}, "/:id", async (req, res) => {
    const id: number | null = req.params.getInt("id");
    if (!id) {
        return res.badRequest();
    }

    const resource: Resource | null = await Resource.select<TableRef<Resource>, Resource>(req.authorization.auth, id);
    if (!resource) {
        return res.notFound();
    }
    if (resource.mimeType.isNull() || resource.data.isNull()) {
        return res.ok(Buffer.from([]), "application/octet-stream");
    }

    return res.ok(resource.data.getValue(), resource.mimeType.getValue());
});

Resource.routes.post(builder => {
    builder.setRequestBody("buffer", "*/*")
	builder.addParameter("mime", "query", new VarChar(100), true);
	builder.addParameter("read", "query", SQLType.SMALLINT, false);
	builder.addParameter("write", "query", SQLType.SMALLINT, false);
	builder.addParameter("delete", "query", SQLType.SMALLINT, false);
    builder.addResponse(200, SchemaDefinition.from("resource_select_res"))
}, "/", async (req, res) => {
    if (!req.authorization.auth) {
        return res.unauthorized();
    }
	if (!req.query.contains("mime")) {
		return res.badRequest();
	}

    const content: Buffer = req.body.raw();
	const contentType: ContentType = <ContentType>req.query.getString("mime");
    const length: number = content.length;

    const resource: Resource = new Resource();
    resource.data.setValue(content);
    resource.mimeType.setValue(contentType);
    resource.length.setValue(length);

	let readLevel: PermissionLevel | undefined;
	const readValue: number | null = req.query.getInt("read");
	let writeLevel: PermissionLevel | undefined;
	const writeValue: number | null = req.query.getInt("write");
	let deleteLevel: PermissionLevel | undefined;
	const deleteValue: number | null = req.query.getInt("delete");

	if (!!readValue) {
		const key: string | undefined = PermissionLevel[readValue];
		if (!!key) {
			// @ts-ignore
			readLevel = PermissionLevel[key];
		}	
	}
	if (!!writeValue) {
		const key: string | undefined = PermissionLevel[writeValue];
		if (!!key) {
			// @ts-ignore
			writeLevel  = PermissionLevel[key];
		}	
	}
	if (!!deleteValue) {
		const key: string | undefined = PermissionLevel[deleteValue];
		if (!!key) {
			// @ts-ignore
			deleteLevel = PermissionLevel[key];
		}
	}

    await resource.insert(req.authorization.auth, readLevel, writeLevel, deleteLevel);

    return res.ok({
        status: 200,
        count: 1,
        results: [
            resource.deserialize()
        ]
    });
})

export class ResourceColumn extends Relation1T1<Resource> {
    public constructor(columnName: string, flags: ColumnFlags = ColumnFlags.NONE, loadingMethod: RelationLoad = RelationLoad.DIRECT) {
        super(Resource, flags, loadingMethod, columnName + "_id", columnName);
    }
}
