// basic-auth-test.ts
async function testBasicAuth(baseUrl: string) {
	console.log(`${baseUrl}にアクセスして、テストを開始します...`);

	console.log("テスト1: 認証なしでアクセス");
	try {
		const noAuthResponse = await fetch(baseUrl);
		console.log(`ステータスコード: ${noAuthResponse.status}`);
		console.log(
			`認証要求ヘッダー: ${noAuthResponse.headers.get("WWW-Authenticate")}`,
		);
		console.assert(
			noAuthResponse.status === 401,
			"認証なしでは401エラーが返されるべき",
		);
	} catch (error) {
		console.error("エラー:", error);
	}

	console.log("\nテスト2: 正しい認証情報でアクセス");
	try {
		const credentials = btoa("admin:password");
		const authResponse = await fetch(baseUrl, {
			headers: {
				Authorization: `Basic ${credentials}`,
			},
		});
		console.log(`ステータスコード: ${authResponse.status}`);
		console.assert(
			authResponse.status === 200,
			"正しい認証情報では200が返されるべき",
		);
	} catch (error) {
		console.error("エラー:", error);
	}

	console.log("\nテスト3: 誤った認証情報でアクセス");
	try {
		const wrongCredentials = btoa("wrong:credentials");
		const wrongAuthResponse = await fetch(baseUrl, {
			headers: {
				Authorization: `Basic ${wrongCredentials}`,
			},
		});
		console.log(`ステータスコード: ${wrongAuthResponse.status}`);
		console.log(
			`認証要求ヘッダー: ${wrongAuthResponse.headers.get("WWW-Authenticate")}`,
		);
		console.assert(
			wrongAuthResponse.status === 401,
			"誤った認証情報では401エラーが返されるべき",
		);
	} catch (error) {
		console.error("エラー:", error);
	}
}

testBasicAuth("http://localhost:5173");
