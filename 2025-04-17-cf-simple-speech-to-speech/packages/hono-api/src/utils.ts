/**
 * モダンなBase64エンコード関数
 * Node.jsとCloudflare Workers環境の両方で共通して動作します
 * 
 * TextEncoder + Uint8Array + Base64変換の標準的な方法を使用
 */
export function toBase64(input: string): string {
  // TextEncoderを使用して文字列をUint8Arrayに変換
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  // Base64エンコード用の文字セット
  const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  
  // 出力用のBase64文字列
  let output = '';
  
  // 3バイトを4文字のBase64に変換
  const len = data.length;
  for (let i = 0; i < len; i += 3) {
    // 3バイトを1つの24ビット数値に結合
    const b1 = data[i];
    const b2 = i + 1 < len ? data[i + 1] : 0;
    const b3 = i + 2 < len ? data[i + 2] : 0;
    
    // 24ビットを4つの6ビット数値に分割
    const n1 = b1 >> 2;
    const n2 = ((b1 & 0x03) << 4) | (b2 >> 4);
    const n3 = ((b2 & 0x0F) << 2) | (b3 >> 6);
    const n4 = b3 & 0x3F;
    
    // 6ビット数値をBase64文字に変換
    output += BASE64_CHARS[n1];
    output += BASE64_CHARS[n2];
    output += (i + 1 < len) ? BASE64_CHARS[n3] : '=';
    output += (i + 2 < len) ? BASE64_CHARS[n4] : '=';
  }
  
  return output;
}
