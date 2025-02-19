import * as fs from "node:fs";
import * as dotenv from "dotenv";
import {
	SecretsManagerClient,
	DescribeSecretCommand,
	GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

export const getSecretValue = async (secretArn: string): Promise<string> => {
	const client = new SecretsManagerClient({});
	const command = new GetSecretValueCommand({
		SecretId: secretArn,
	});
	try {
		const response = await client.send(command);
		if (response.SecretString) {
			return response.SecretString;
		}
		throw new Error("SecretString is empty");
	} catch (error) {
		console.error("Error retrieving secret:", error);
		throw error;
	}
};

async function getSecretArn(secretName: string): Promise<string> {
	const client = new SecretsManagerClient({ region: "ap-northeast-1" }); // 適切なリージョンを指定
	const command = new DescribeSecretCommand({ SecretId: secretName });
	const response = await client.send(command);

	if (!response.ARN) {
		throw new Error(`シークレット ${secretName} のARNが見つかりませんでした。`);
	}
	return response.ARN;
}

async function check() {
	try {
		// .envファイルから環境変数を取得
		const envConfig = dotenv.parse(fs.readFileSync(".env"));
		// envConfigでループ（各キーと値を正しく表示）
		for (const [key, _value] of Object.entries(envConfig)) {
			const secretArn = await getSecretArn(key);
			const secretValue = await getSecretValue(secretArn);
			console.log(`${key}: ${secretValue}`);
		}
	} catch (error) {
		console.log(error);
	}
}

(async () => {
	try {
		const result = await check();
		console.log("結果:", result);
	} catch (error) {
		console.error("エラー:", error);
	}
})();
