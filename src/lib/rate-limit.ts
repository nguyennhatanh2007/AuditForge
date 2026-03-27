type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type Bucket = {
  timestamps: number[];
};

const buckets = new Map<string, Bucket>();

export function consumeRateLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const bucket = buckets.get(key) ?? { timestamps: [] };

  bucket.timestamps = bucket.timestamps.filter((stamp) => stamp >= windowStart);
  const allowed = bucket.timestamps.length < options.max;

  if (allowed) {
    bucket.timestamps.push(now);
    buckets.set(key, bucket);
    return {
      allowed: true,
      remaining: Math.max(0, options.max - bucket.timestamps.length),
      retryAfterMs: 0,
      count: bucket.timestamps.length,
    };
  }

  const oldest = bucket.timestamps[0] ?? now;
  const retryAfterMs = Math.max(0, options.windowMs - (now - oldest));
  buckets.set(key, bucket);

  return {
    allowed: false,
    remaining: 0,
    retryAfterMs,
    count: bucket.timestamps.length,
  };
}
