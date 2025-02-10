import Redis from "ioredis";

// Create Redis client instance
const redis = new Redis({
  host: "127.0.0.1", // Redis server host
  port: 6379,        // Default Redis port
  retryStrategy(times) {
    // Retry strategy for reconnecting in case of failure
    const delay = Math.min(times * 50, 2000); // Exponential backoff
    return delay;
  },
});

redis.on("connect", () => {
  console.log("Connected to Redis successfully!");
});

redis.on("ready", () => {
  console.log("Redis is ready to accept commands!");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redis.on("end", () => {
  console.log("Redis connection closed.");
});

redis.on("reconnecting", () => {
  console.log("Reconnecting to Redis...");
});

// Export Redis instance for use in controllers
export default redis;
