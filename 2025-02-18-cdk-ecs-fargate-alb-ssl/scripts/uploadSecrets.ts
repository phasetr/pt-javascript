import * as fs from "node:fs";
import * as dotenv from "dotenv";
import {
	SecretsManagerClient,
	CreateSecretCommand,
} from "@aws-sdk/client-secrets-manager";

// AWS SDKの設定
const secretsManagerClient = new SecretsManagerClient({
	region: "ap-northeast-1",
}); // 例: 'us-east-1'

// .envファイルから環境変数を取得
const envConfig = dotenv.parse(fs.readFileSync(".env"));

// シークレットとして保存するためにJSON文字列に変換
const secretsString = JSON.stringify(envConfig);

async function uploadSecrets() {
	const secrets = JSON.parse(secretsString);
	for (const key in secrets) {
		const command = new CreateSecretCommand({
			Name: key,
			SecretString: secrets[key],
		});
		try {
			const data = await secretsManagerClient.send(command);
			console.log("シークレットが正常に作成されました:", data);
		} catch (err) {
			console.error("シークレットの作成に失敗しました:", err);
		}
	}
}
uploadSecrets();
