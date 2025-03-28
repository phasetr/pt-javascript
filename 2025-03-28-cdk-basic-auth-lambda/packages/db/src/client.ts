import { 
  DynamoDBClient, 
  ListTablesCommand, 
  CreateTableCommand, 
  KeyType, 
  ScalarAttributeType, 
  ProjectionType 
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// ローカルにアクセスするためだけのダミーアクセスキーを設定。
// 何も権限情報も存在しない。
const devConfig = {
	endpoint: "http://localhost:8000",
	region: "ap-northeast-1",
	credentials: {
		accessKeyId: "dummy",
		secretAccessKey: "dummy",
	},
};

const client = new DynamoDBClient(
	process.env.ENV === "local" ? devConfig : {},
);

const docClient = DynamoDBDocumentClient.from(client);

// 環境に応じたテーブル名を取得
const getTableName = () => {
	const prefix = "CBAL";
	const env = process.env.ENV || "local";
	return `${prefix}-${env}Todos`;
};

// テーブルとGSIを作成
const createTodosTable = async () => {
	const params = {
		TableName: getTableName(),
		KeySchema: [{ AttributeName: "id", KeyType: KeyType.HASH }],
		AttributeDefinitions: [
			{ AttributeName: "id", AttributeType: ScalarAttributeType.S },
			{ AttributeName: "userId", AttributeType: ScalarAttributeType.S },
		],
		ProvisionedThroughput: {
			ReadCapacityUnits: 5,
			WriteCapacityUnits: 5,
		},
		GlobalSecondaryIndexes: [
			{
				IndexName: "UserIdIndex",
				KeySchema: [{ AttributeName: "userId", KeyType: KeyType.HASH }],
				Projection: { ProjectionType: ProjectionType.ALL },
				ProvisionedThroughput: {
					ReadCapacityUnits: 5,
					WriteCapacityUnits: 5,
				},
			},
		],
	};

	try {
		await client.send(new CreateTableCommand(params));
		console.log("Todos table created successfully with UserIdIndex");
	} catch (err) {
		console.log(err);
	}
};

// ローカルデータベース内にテーブル作成
const initializeDynamoDB = async () => {
	if (process.env.ENV === "local") {
		try {
			const tableName = getTableName();
			const { TableNames } = await client.send(new ListTablesCommand({}));
			if (TableNames && !TableNames.includes(tableName)) {
				await createTodosTable();
			} else if (TableNames) {
				console.log(`${tableName} table already exists`);
			} else {
				console.log(`Unable to list tables, creating ${tableName} table`);
				await createTodosTable();
			}
		} catch (err) {
			console.error("Error initializing DynamoDB:", err);
		}
	}
};

// テーブル初期化を実行
initializeDynamoDB();

// getTableName関数もエクスポート
export {
  docClient,
  getTableName
};
