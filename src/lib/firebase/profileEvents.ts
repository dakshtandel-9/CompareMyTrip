export const USER_PROFILE_SAVED_EVENT = "cmt:user-profile-saved";
export const COMPLETED_PROFILE_UID_KEY = "cmt:completed-profile-uid";

export type UserProfileSavedDetail = {
  uid: string;
};

export function markProfileCompleted(uid: string) {
  try {
    sessionStorage.setItem(COMPLETED_PROFILE_UID_KEY, uid);
  } catch {
    // Storage can be unavailable in private or embedded browser sessions.
  }
  window.dispatchEvent(new CustomEvent(USER_PROFILE_SAVED_EVENT, { detail: { uid } }));
}

export function consumeCompletedProfile(uid: string): boolean {
  try {
    if (sessionStorage.getItem(COMPLETED_PROFILE_UID_KEY) !== uid) return false;
    sessionStorage.removeItem(COMPLETED_PROFILE_UID_KEY);
    return true;
  } catch {
    return false;
  }
}
