// 1. Pythonの処理と同等のデコード用関数群

function calculateDoMgL(tempC: number, doSaturation: number): number | null {
  if (tempC == null || doSaturation == null) return null;
  try {
    const Tk = tempC + 273.15;
    const lnCstar =
      -139.34411 +
      1.575701e5 / Tk -
      6.642308e7 / Math.pow(Tk, 2) +
      1.2438e10 / Math.pow(Tk, 3) -
      8.621949e11 / Math.pow(Tk, 4);
    const doSatMlL = Math.exp(lnCstar);
    const doSatMgL = doSatMlL * 1.42905;
    return Number((doSatMgL * (doSaturation / 100.0)).toFixed(2));
  } catch {
    return null;
  }
}

function hexToUint8Array(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return arr;
}

function decodePayload(hexStr: string) {
  const result: any = {
    latitude: null,
    longitude: null,
    temperature: null,
    do_saturation: null,
    do_mg_l: null,
    text_data: null,
  };

  try {
    const bytes = hexToUint8Array(hexStr);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    // デコードし、右側のnull文字(\x00)を削除
    const decodedText = decoder.decode(bytes).replace(/\x00+$/, '');

    // "30"〜"3e"で始まるかどうかを判定する正規表現
    const startsWithHexPattern = /^3[0-9a-e]/i;

    if (
      decodedText.includes("STAT:") ||
      (decodedText.includes(",") && !startsWithHexPattern.test(hexStr))
    ) {
      result.text_data = decodedText;
      return result;
    }

    if (bytes.length >= 16) {
      try {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        
        // リトルエンディアン(true)でFloat32を読み取る
        let lat = Number(view.getFloat32(0, true).toFixed(6));
        let lon = Number(view.getFloat32(4, true).toFixed(6));
        let temp = Number(view.getFloat32(8, true).toFixed(2));
        let doSat = Number(view.getFloat32(12, true).toFixed(2));

        if (temp >= -100 && temp <= 60 && doSat >= -200 && doSat <= 500) {
          if (lat > 1000) {
            const degLat = Math.floor(lat / 100);
            lat = Number((degLat + (lat - degLat * 100) / 60).toFixed(6));
          }
          if (lon > 1000) {
            const degLon = Math.floor(lon / 100);
            lon = Number((degLon + (lon - degLon * 100) / 60).toFixed(6));
          }

          result.latitude = lat;
          result.longitude = lon;
          result.temperature = temp;
          result.do_saturation = doSat;

          if (temp > -100 && doSat > -100) {
            result.do_mg_l = calculateDoMgL(temp, doSat);
          }
          return result;
        }
      } catch (e) {
        // パース失敗時はスキップしてtext_dataとして処理
      }
    }
    result.text_data = decodedText;
  } catch (e) {
    // 処理継続
  }

  return result;
}

function convertToJst(dateStr: string, timeStr: string): string {
  try {
    const utcDate = new Date(`${dateStr}T${timeStr}Z`);
    if (isNaN(utcDate.getTime())) {
      return `${dateStr} ${timeStr}`;
    }

    // 9時間を足して日本時間（JST）にする
    utcDate.setHours(utcDate.getHours() + 9);

    // YYYY-MM-DD HH:mm:ss 形式にフォーマット
    const yyyy = utcDate.getUTCFullYear();
    const mm = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(utcDate.getUTCDate()).padStart(2, '0');
    const hh = String(utcDate.getUTCHours()).padStart(2, '0');
    const min = String(utcDate.getUTCMinutes()).padStart(2, '0');
    const ss = String(utcDate.getUTCSeconds()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  } catch {
    return `${dateStr} ${timeStr}`;
  }
}

function transformToSensorData(rawData: any[]): string[] {
  const formattedLines: string[] = [];

  for (const item of rawData) {
    const buoyId = item.buoy_id || '';
    const date = item.date || '';
    const time = item.time || '';
    const payload = item.payload || '';

    const jstDatetimeStr = convertToJst(date, time);
    const decoded = decodePayload(payload);

    const lat = decoded.latitude !== null ? decoded.latitude : '';
    const lon = decoded.longitude !== null ? decoded.longitude : '';
    const temp = decoded.temperature !== null ? decoded.temperature : '';
    const doSat = decoded.do_saturation !== null ? decoded.do_saturation : '';
    const doMg = decoded.do_mg_l !== null ? decoded.do_mg_l : '';
    const text = decoded.text_data !== null ? decoded.text_data : '';

    if (text) {
      formattedLines.push(`${buoyId},${jstDatetimeStr},${text}`);
    } else {
      formattedLines.push(`${buoyId},${jstDatetimeStr},${lat},${lon},${temp},${doSat},${doMg}`);
    }
  }

  return formattedLines;
}


// 2. APIルートの本体

const API_URL: string | undefined = process.env.DO2_API_URL; //ここのみ編集

export default async function handler(_request: any, response: any) {
  // 管理画面から環境変数（本当のURL）を読み込む
  const targetUrl: string | undefined = API_URL;

  if (!targetUrl) {
    return response.status(500).json({ error: "API URLが設定されていません。" });
  }

  try {
    // Vercelのサーバーが、身代わりになって本当のAPIを叩く
    const apiResponse = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
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

    const rawText = await apiResponse.text();
    let rawData: any[];

    // 取得した文字列をJSONの配列としてパースする
    try {
      rawData = JSON.parse(rawText);
      if (!Array.isArray(rawData)) {
        rawData = [rawData]; // 万が一単一オブジェクトだった場合は配列に包む
      }
    } catch (e) {
      return response.status(500).json({ error: "外部APIからのレスポンスがJSON形式ではありません。" });
    }

    // デコード処理の実行（Pythonプログラムに相当する処理）
    const formattedLines = transformToSensorData(rawData);
    
    // 文字列の配列を改行で結合し、テキストデータを作成
    const resultText = formattedLines.join('\n');

    // CORSを回避するためのヘッダーを付与
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET');
    // テキスト形式として返すのでContent-Typeを調整
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');

    // 3. ブラウザにデコード済みのデータを返す
    return response.status(200).send(resultText);

  } catch (error) {
    console.error("do2 API error:", error);
    return response.status(500).json({ error: "通信エラーが発生しました。" });
  }
}
