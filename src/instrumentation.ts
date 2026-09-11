export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { prepareFirestoreTransport } = await import("./lib/firebase/prepareTransport");
    prepareFirestoreTransport();
  }
}
