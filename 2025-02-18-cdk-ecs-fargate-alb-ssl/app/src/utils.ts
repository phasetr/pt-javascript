import {
	SecretsManagerClient,
	GetSecretValueCommand,
	DescribeSecretCommand,
} from "@aws-sdk/client-secrets-manager";

export function nowJst(): string {
	const now = new Date();
	return now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export async function getSecretArn(
	secretName: string,
	region: string,
): Promise<string> {
	const client = new SecretsManagerClient({ region });
	const command = new DescribeSecretCommand({ SecretId: secretName });
	const response = await client.send(command);

	if (!response.ARN) {
		throw new Error(`シークレット ${secretName} のARNが見つかりませんでした。`);
	}
	return response.ARN;
}

export async function getSecretValue(secretName: string, region: string) {
	try {
		const secretArn = await getSecretArn(secretName, region);
		const client = new SecretsManagerClient({});
		const command = new GetSecretValueCommand({
			SecretId: secretArn,
		});
		const response = await client.send(command);
		if (response.SecretString) {
			return response.SecretString;
		}
		throw new Error("SecretString is empty");
	} catch (error) {
		console.log(error);
		throw new Error();
	}
}

export async function getAllSecretValues(env: NodeJS.ProcessEnv) {
	console.debug("👺👺👺getAllSecretValues", env);
	const openaiSecretName = env.OPENAI_SECRET_NAME;
	const awsRegion = env.AWS_REGION;
	const serviceURLSecretName = env.SERVICE_URL_SECRET_NAME;
	if (!openaiSecretName || !awsRegion || !serviceURLSecretName) {
		throw new Error("環境変数が適切に設定されていません。");
	}
	const OPENAI_API_KEY = await getSecretValue(openaiSecretName, awsRegion);
	const SERVICE_URL = await getSecretValue(serviceURLSecretName, awsRegion);
	if (!OPENAI_API_KEY || !SERVICE_URL) {
		throw new Error("適切な値が取得できませんでした。");
	}
	return { OPENAI_API_KEY, SERVICE_URL };
}
