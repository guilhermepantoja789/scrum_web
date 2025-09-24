import type RedisClient from "ioredis"
import { redis as defaultRedis } from "./redis"

export async function cacheGet<T>(
    key: string,
    client: RedisClient | undefined = defaultRedis
): Promise<T | null> {
    if (!client) return null
    const raw = await client.get(key)
    return raw ? (JSON.parse(raw) as T) : null
}

export async function cacheSet<T>(
    key: string,
    value: T,
    ttlSeconds = 60,
    client: RedisClient | undefined = defaultRedis
): Promise<void> {
    if (!client) return
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds)
}

export async function cacheDel(
    key: string,
    client: RedisClient | undefined = defaultRedis
): Promise<void> {
    if (!client) return
    await client.del(key)
}
