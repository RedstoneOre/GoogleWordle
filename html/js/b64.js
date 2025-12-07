function b64Encode(str){
  const textEncoder = new TextEncoder();
  const utf8Bytes = textEncoder.encode(str);
  const binaryString = String.fromCodePoint(...utf8Bytes);
  const base64Encoded = btoa(binaryString);
  return base64Encoded;
}
function b64Decode(str){
  let binaryString = atob(str);
  let len = binaryString.length;
  let bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  let decodedString = new TextDecoder("utf-8").decode(bytes);
  return decodedString;
}