import crypto from "crypto";

export function generateWalmartHeaders({
  clientId,
  consumerId,
  privateKey
}) {
  const timestamp = Date.now().toString();

  const stringToSign = `${clientId}\n${timestamp}\n`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(stringToSign);
  signer.end();

  const signature = signer.sign(privateKey, "base64");

  return {
    "WM_CONSUMER.ID": consumerId,
    "WM_CONSUMER.INTIMESTAMP": timestamp,
    "WM_SEC.AUTH_SIGNATURE": signature,
    "WM_SVC.NAME": "Walmart Marketplace",
    "WM_QOS.CORRELATION_ID": crypto.randomUUID()
  };
}