import dotenv from 'dotenv';
// .env ファイルから環境変数をロード
dotenv.config();

const APIS = {
  Water: process.env.WATER_API_URL,
  Salinity: process.env.SALINITY_API_URL,
  DO1: process.env.DO1_API_URL,
  DO3: process.env.DO3_API_URL,//追加
};

async function testApi() {
  for (const [name, url] of Object.entries(APIS)) {
    console.log(`\n=== ${name} API 接続テスト開始 ===`);

    if (!url) {
      console.error(`エラー: ${name.toUpperCase()}_API_URL が設定されていません。`);
      console.error(`.env ファイルに ${name.toUpperCase()}_API_URL が正しく定義されているか確認してください。`);
      continue;
    }

    console.log(`接続先 URL: ${url}`);

    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'api_test_script/1.0',
        },
      });
      const duration = Date.now() - startTime;

      console.log(`ステータスコード: ${response.status} ${response.statusText}`);
      console.log(`応答時間: ${duration}ms`);

      if (response.ok) {
        const data = await response.text();
        console.log("=== レスポンスデータ (最初の500文字) ===");
        console.log(data.slice(0, 500));
        console.log("======================================");
        console.log(`${name} テスト結果: 成功 (APIからデータを正常に取得できました。)`);
      } else {
        const errorText = await response.text();
        console.error("エラーレスポンス内容:");
        console.error(errorText.slice(0, 500));
        console.log(`${name}_API テスト結果: 失敗 (ステータスコードが 2xx 以外です。)`);
      }
    } catch (error) {
      console.error("通信中にエラーが発生しました:", error);
      console.log(`${name}_API テスト結果: 失敗 (ネットワーク接続エラー、または無効なURLです。)`);
    }
  }
}

testApi();
