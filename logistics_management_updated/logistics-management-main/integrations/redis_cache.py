
# Redis Caching Module
import redis

class RedisCache:
    def __init__(self, host="localhost", port=6379):
        self.client = redis.StrictRedis(host=host, port=port, decode_responses=True)
    def set(self, key, value):
        self.client.set(key, value)
    def get(self, key):
        return self.client.get(key)
