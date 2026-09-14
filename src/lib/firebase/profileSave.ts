type PendingSave = { uid: string; request: Promise<unknown> };

export type ProfileSaveState = { uid: string | null; saving: boolean; pending: boolean; failed: boolean };
export const IDLE_PROFILE_SAVE_STATE: ProfileSaveState = { uid: null, saving: false, pending: false, failed: false };

export function getProfileSaveStateForUser(state: ProfileSaveState, uid: string | null | undefined): ProfileSaveState {
  return uid && state.uid === uid ? state : IDLE_PROFILE_SAVE_STATE;
}

export class ProfileSaveTimeoutError extends Error {
  constructor() {
    super("Your save is still waiting for a connection. Check again to recover the pending save, or sign out and continue browsing.");
    this.name = "ProfileSaveTimeoutError";
  }
}

/** Firestore queues offline writes. Retain a single request so retrying after
 * a deadline never submits competing edits to the same customer profile. */
export function createProfileSaveController(timeoutMs = 10000) {
  let pending: PendingSave | undefined;

  return {
    start(uid: string, save: () => Promise<unknown>, complete: () => void): Promise<void> {
      let current = pending;
      if (!current || current.uid !== uid) {
        current = { uid, request: Promise.resolve().then(save) };
        pending = current;
        const selected = current;
        // Observe the original request even after a deadline has elapsed. A
        // later successful save can release the form without another click.
        void current.request.then(() => {
          if (pending === selected) {
            pending = undefined;
            complete();
          }
        }, () => {
          if (pending === selected) pending = undefined;
        });
      }
      const request = current.request;
      return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new ProfileSaveTimeoutError()), timeoutMs);
        void request.then(() => {
          clearTimeout(timer);
          resolve();
        }, (error: unknown) => {
          clearTimeout(timer);
          reject(error);
        });
      });
    },
  };
}
