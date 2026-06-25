export type PendingActivityCompletion = {
  missionId: string;
  activityId: string;
  queuedAt: string;
};

type SyncResult = {
  syncedCount: number;
  failedItems: PendingActivityCompletion[];
};

const storageKey = (firebaseUid: string) =>
  `activity-completion-pending:${firebaseUid}`;

const readQueue = (firebaseUid: string): PendingActivityCompletion[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(storageKey(firebaseUid));
    if (!stored) return [];

    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is PendingActivityCompletion =>
        typeof item === "object" &&
        item !== null &&
        typeof item.missionId === "string" &&
        typeof item.activityId === "string" &&
        typeof item.queuedAt === "string"
    );
  } catch {
    return [];
  }
};

const writeQueue = (
  firebaseUid: string,
  queue: PendingActivityCompletion[]
) => {
  if (typeof window === "undefined") return false;

  try {
    if (queue.length === 0) {
      window.localStorage.removeItem(storageKey(firebaseUid));
    } else {
      window.localStorage.setItem(storageKey(firebaseUid), JSON.stringify(queue));
    }
    return true;
  } catch {
    return false;
  }
};

const removeQueuedItem = (
  firebaseUid: string,
  completedItem: PendingActivityCompletion
) => {
  const latestQueue = readQueue(firebaseUid);
  return writeQueue(
    firebaseUid,
    latestQueue.filter(
      (item) =>
        item.missionId !== completedItem.missionId ||
        item.activityId !== completedItem.activityId
    )
  );
};

export const getPendingActivityCompletions = (firebaseUid: string) =>
  readQueue(firebaseUid);

export const enqueueActivityCompletion = (
  firebaseUid: string,
  missionId: string,
  activityId: string
) => {
  const queue = readQueue(firebaseUid);
  const alreadyQueued = queue.some(
    (item) => item.missionId === missionId && item.activityId === activityId
  );

  if (alreadyQueued) return true;

  return writeQueue(firebaseUid, [
    ...queue,
    {
      missionId,
      activityId,
      queuedAt: new Date().toISOString(),
    },
  ]);
};

const syncChains = new Map<string, Promise<SyncResult>>();

export const syncPendingActivityCompletions = (
  firebaseUid: string,
  sendCompletion: (item: PendingActivityCompletion) => Promise<unknown>
): Promise<SyncResult> => {
  const previous = syncChains.get(firebaseUid) ??
    Promise.resolve({ syncedCount: 0, failedItems: [] });

  const next = previous
    .catch(() => ({ syncedCount: 0, failedItems: [] }))
    .then(async () => {
      const queue = readQueue(firebaseUid);
      const failedItems: PendingActivityCompletion[] = [];
      let syncedCount = 0;

      for (const item of queue) {
        try {
          await sendCompletion(item);
          syncedCount += 1;
          removeQueuedItem(firebaseUid, item);
        } catch {
          failedItems.push(item);
        }
      }

      return { syncedCount, failedItems };
    });

  syncChains.set(firebaseUid, next);
  return next;
};
