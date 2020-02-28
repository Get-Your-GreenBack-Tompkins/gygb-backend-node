import Redis from "ioredis";

const client = process.env.REDISTOGO_URL
  ? new Redis(process.env.REDISTOGO_URL, {
      lazyConnect: true
    })
  : new Redis({
      lazyConnect: true
    });

client.on("error", err => {
  console.log(`[redis] error: ${err.message}`);
});

export default client;
