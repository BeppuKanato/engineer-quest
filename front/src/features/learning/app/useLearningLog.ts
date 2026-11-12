"use client";
import { useCallback, useEffect } from "react";
import { useUserSession } from "@/lib/session/userSession";
import { auth } from "@/lib/firebase";
import { LearningEventQueue, learningSessionId, attachLearningEventQueue, type LearningObservation } from "@/lib/learningEvents";

let owner: { uid: string; queue: LearningEventQueue } | null = null;
export function useLearningLog(courseId?: string) {
  const { firebaseUser, token } = useUserSession();
  const getQueue = useCallback(() => {
    if (!firebaseUser || !token || auth.currentUser?.uid !== firebaseUser.uid) return null;
    if (owner?.uid !== firebaseUser.uid) {
      owner?.queue.close();
      owner = { uid: firebaseUser.uid, queue: new LearningEventQueue({ sessionId: learningSessionId(), token,
        getToken: async () => {
          if (auth.currentUser?.uid !== firebaseUser.uid) throw new Error("Session changed");
          return firebaseUser.getIdToken();
        } }) };
    }
    return owner.queue;
  }, [firebaseUser, token]);
  useEffect(() => {
    const queue = getQueue();
    if (!queue) return;
    return attachLearningEventQueue(queue, () => auth.currentUser?.uid === firebaseUser?.uid, () => {
      if (owner?.queue === queue) owner = null;
    });
  }, [getQueue, firebaseUser]);
  return useCallback((event: LearningObservation & { phaseKey?: string }) => {
    getQueue()?.enqueue({ ...event, courseId });
  }, [getQueue, courseId]);
}
