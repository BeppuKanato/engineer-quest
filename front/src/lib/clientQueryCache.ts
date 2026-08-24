type QueryEntry = {
  data?: unknown;
  updatedAt: number;
  promise?: Promise<unknown>;
  tags: Set<string>;
};

type QueryOptions = {
  staleTimeMs: number;
  tags: string[];
};

const entries = new Map<string, QueryEntry>();
let cacheScope: string | null = null;

export const queryTags = {
  authUser: "auth-user",
  hexad: "hexad",
  profile: "profile",
  home: "home",
  courses: "courses",
  roadmap: "roadmap",
  collection: "collection",
  achievements: "achievements",
  badges: "badges",
  history: "history",
  missionOverview: "mission-overview",
  missionRewards: "mission-rewards",
  questBoard: "quest-board",
  works: "works",
} as const;

export const setClientQueryCacheScope = (scope: string | null) => {
  if (scope === cacheScope) return;
  cacheScope = scope;
  entries.clear();
};

export const fetchClientQuery = async <T>(
  key: string,
  query: () => Promise<T>,
  options: QueryOptions
): Promise<T> => {
  const now = Date.now();
  const current = entries.get(key);

  if (current?.promise) return current.promise as Promise<T>;
  if (current?.data !== undefined && now - current.updatedAt < options.staleTimeMs) {
    return current.data as T;
  }

  const promise = query()
    .then((data) => {
      entries.set(key, {
        data,
        updatedAt: Date.now(),
        tags: new Set(options.tags),
      });
      return data;
    })
    .catch((error) => {
      const stale = entries.get(key);
      if (stale) entries.set(key, { ...stale, promise: undefined });
      throw error;
    });

  entries.set(key, {
    data: current?.data,
    updatedAt: current?.updatedAt ?? 0,
    promise,
    tags: new Set(options.tags),
  });

  return promise;
};

export const setClientQueryData = <T>(key: string, data: T, tags: string[]) => {
  entries.set(key, {
    data,
    updatedAt: Date.now(),
    tags: new Set(tags),
  });
};

export const updateClientQueryData = <T>(
  key: string,
  update: (current: T) => T
) => {
  const current = entries.get(key);
  if (current?.data === undefined) return;
  entries.set(key, {
    ...current,
    data: update(current.data as T),
    updatedAt: Date.now(),
    promise: undefined,
  });
};

export const invalidateClientQueries = (tags: readonly string[]) => {
  if (tags.length === 0) return;
  const invalidatedTags = new Set(tags);

  for (const [key, entry] of entries) {
    if ([...entry.tags].some((tag) => invalidatedTags.has(tag))) {
      entries.delete(key);
    }
  }
};
