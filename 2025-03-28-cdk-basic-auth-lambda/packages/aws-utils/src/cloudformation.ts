import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
import { getEnvironment } from "./config.js";

/**
 * CloudFormationスタックの出力からAPI GatewayのURLを取得する
 * @param stackName スタック名
 * @returns API GatewayのURL
 */
export async function getApiUrlFromCloudFormation(
	stackName?: string,
): Promise<string> {
	// 環境に応じたスタック名を生成
	const environment = getEnvironment(process.env.NODE_ENV);
	const defaultStackName = `CbalStack-${environment}`;

	// 引数でスタック名が指定されていない場合はデフォルト値を使用
	const cfnStackName = stackName || defaultStackName;

	// AWS SDKクライアントを初期化
	const client = new CloudFormationClient({
		region: process.env.AWS_REGION || "ap-northeast-1",
	});

	try {
		// スタックの情報を取得
		const command = new DescribeStacksCommand({
			StackName: cfnStackName,
		});

		const response = await client.send(command);

		// スタックの出力からAPI GatewayのURLを取得
		const stack = response.Stacks?.[0];
		if (stack?.Outputs) {
			// API Endpointの出力を検索
			// 出力キーは「CBALdevApiEndpoint」のような形式
			console.log(`Searching for API endpoint in stack outputs for environment: ${environment}`);
			console.log("Stack outputs:", JSON.stringify(stack.Outputs, null, 2));
			
			// 環境に応じた出力キーを検索
			const apiEndpointOutput = stack.Outputs.find(
				(output) => {
					const isMatch = 
						output.OutputKey === `CBAL${environment}ApiEndpoint` ||
						output.OutputKey?.includes("ApiEndpoint") ||
						output.Description?.includes("API Gateway endpoint URL");
					
					console.log(`Checking output key: ${output.OutputKey} match: ${isMatch}`);
					return isMatch;
				}
			);

			if (apiEndpointOutput?.OutputValue) {
				console.log(`Found API endpoint: ${apiEndpointOutput.OutputValue}`);
				// APIエンドポイントが見つかった場合、環境に応じたパスを追加
				let apiUrl = apiEndpointOutput.OutputValue;
				// URLの末尾が/で終わっていない場合は追加
				if (!apiUrl.endsWith('/')) {
					apiUrl += '/';
				}
				
				// 環境に応じたパスを追加（例: prod/ -> dev/）
				// 注意: API GatewayのURLは常に/prod/を含む可能性があるため、環境に応じて置換する
				if (environment === 'dev') {
					// dev環境の場合、/prod/を/dev/に置換
					apiUrl = apiUrl.replace('/prod/', '/dev/');
					console.log(`Modified API URL for dev environment: ${apiUrl}`);
				} else if (environment === 'prod') {
					// prod環境の場合、/dev/を/prod/に置換（念のため）
					if (apiUrl.includes('/dev/')) {
						apiUrl = apiUrl.replace('/dev/', '/prod/');
						console.log(`Modified API URL for prod environment: ${apiUrl}`);
					}
				}
				
				console.log(`Found API URL in CloudFormation: ${apiUrl}`);
				return apiUrl;
			}
		}

		// API GatewayのURLが見つからない場合はエラー
		throw new Error(
			`Failed to get API Gateway URL from CloudFormation stack: ${cfnStackName}`,
		);
	} catch (error) {
		console.error("Error getting API Gateway URL from CloudFormation:", error);
		throw error;
	}
}

/**
 * CloudFormationスタックの情報を取得する
 * @param stackName スタック名
 * @returns スタック情報
 */
export async function getStackInfo(stackName?: string) {
  // 環境に応じたスタック名を生成
  const environment = getEnvironment(process.env.NODE_ENV);
  const defaultStackName = `CbalStack-${environment}`;

  // 引数でスタック名が指定されていない場合はデフォルト値を使用
  const cfnStackName = stackName || defaultStackName;
  
  console.log(`Checking CloudFormation stack: ${cfnStackName}`);
  
  // AWS SDKクライアントを初期化
  const client = new CloudFormationClient({
    region: process.env.AWS_REGION || 'ap-northeast-1',
  });
  
  // スタックの情報を取得
  const command = new DescribeStacksCommand({
    StackName: cfnStackName,
  });
  
  const response = await client.send(command);
  
  // スタックの情報を返す
  return response.Stacks?.[0];
}
