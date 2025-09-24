import Redis from "ioredis"

declare global {
    // eslint-disable-next-line no-var
    var __redis: Redis | undefined
}

const url = process.env.REDIS_URL

export const redis: Redis | undefined =
    global.__redis ?? (url ? new Redis(url, { maxRetriesPerRequest: null }) : undefined)

if (process.env.NODE_ENV !== "production") {
    global.__redis = redis
}
