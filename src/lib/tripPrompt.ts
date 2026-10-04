/* A visitor who has already sent the trip-plan form is remembered in
   localStorage and never prompted again. */
const SUBMITTED_KEY = "cmt:trip-prompt-submitted";

export const hasSubmittedTripPrompt = () => {
  try {
    return window.localStorage.getItem(SUBMITTED_KEY) === "1";
  } catch {
    return false;
  }
};

export const rememberTripPromptSubmitted = () => {
  try {
    window.localStorage.setItem(SUBMITTED_KEY, "1");
  } catch {
    /* Private mode or blocked storage: the lead is still sent. */
  }
};
