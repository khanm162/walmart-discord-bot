import { generateWalmartHeaders } from "../lib/walmart";
import { redis } from "../lib/redis";

export default async function handler(req, res) {
  try {
    const lastTimestamp =
      (await redis.get("last_checked")) ||
      new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const headers = generateWalmartHeaders({
      clientId: process.env.WM_CLIENT_ID,
      consumerId: process.env.WM_CONSUMER_ID,
      privateKey: process.env.WM_PRIVATE_KEY
    });

    const url = `https://marketplace.walmartapis.com/v3/orders?createdStartDate=${lastTimestamp}`;

    const response = await fetch(url, { headers });
    const data = await response.json();

    const orders = data?.list?.elements || [];

    for (const order of orders) {
      const orderId = order.purchaseOrderId;

      const alreadyProcessed = await redis.sismember(
        "processed_orders",
        orderId
      );

      if (alreadyProcessed) continue;

      // Send to Discord
      await fetch(process.env.DISCORD_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: `🛒 New Order\nOrder ID: ${orderId}\nTotal: ${order.orderAmount?.amount}`
        })
      });

      await redis.sadd("processed_orders", orderId);
    }

    await redis.set("last_checked", new Date().toISOString());

    res.status(200).json({ success: true, orders: orders.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}