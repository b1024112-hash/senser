// もしNext.jsをご利用なら、以下の型定義をインポートするとanyを避けられます。
// import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  request: any, // NextApiRequest に変更推奨
  response: any // NextApiResponse に変更推奨
) {
  // 1. 関数内で環境変数を読み込む（サーバーレス環境でのベストプラクティス）
  const targetUrl: string | undefined = process.env.DO2_API_URL;

  if (!targetUrl) {
    return response.status(500).json({ error: "API URLが設定されていません。" });
  }

  try {
    // 2. Vercelのサーバーが身代わりになって本当のAPIを叩く
    const apiResponse = await fetch(targetUrl, {
      headers: {
        // 【修正点】対象のデータがCSV/テキストなので、Acceptヘッダーを変更します
        Accept: 'text/csv, text/plain, */*',
        'User-Agent': 'api_test/1.0',
      },
    });
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();

      return response.status(apiResponse.status).json({
        error: "外部APIからのデータ取得に失敗しました。",
        upstreamStatus: apiResponse.status,
        upstreamBody: errorText.slice(0, 500),
      });
    }

    // データをテキスト（文字列）として取得
    const data = await apiResponse.text();

    // CORSを回避するためのヘッダーを付与
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET');
    
    // 【修正点】外部APIのContent-Typeをそのまま引き継ぐか、デフォルトで text/plain にする
    response.setHeader(
      'Content-Type', 
      apiResponse.headers.get('content-type') || 'text/plain; charset=utf-8'
    );

    // 3. ブラウザにデータを返す
    return response.status(200).send(data);
  } catch (error) {
    console.error("do1 API error:", error);
    return response.status(500).json({ error: "通信エラーが発生しました。" });
  }
}
