import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export const getCache = (key) => {
  return cache.get(key);
};

export const setCache = (key, value, ttl = 60) => {
  cache.set(key, value, ttl);
};

export const delCache = (key) => {
  cache.del(key);
};

export const delCacheByPattern = (pattern) => {
  const keys = cache.keys();
  keys.forEach((key) => {
    if (key.startsWith(pattern)) {
      cache.del(key);
    }
  });
};

export const flushCache = () => {
  cache.flushAll();
};

export default cache;

