import "firebase-admin/firestore";
import { v1 } from "@google-cloud/firestore";
import { GoogleError } from "google-gax/fallback";
import { Namespace, Root, Type } from "protobufjs";

let prepared = false;
// Captured by instrumentation before Next installs its page-data fetch cache.
// Firestore owns its transport and the catalogue owns its own data cache.
export const firestoreFetch = globalThis.fetch.bind(globalThis);

// Firestore's REST transport still uses protobuf converters. Workers permits
// their compilation during startup, but forbids it once a request has begun.
// No credentials, network requests, or database changes are involved here.
export function prepareFirestoreTransport() {
  if (prepared) return;
  function prepare(node: Namespace) {
    if (node instanceof Type) node.setup();
    for (const child of node.nestedArray) {
      if (child instanceof Namespace) prepare(child);
    }
  }
  // Cache only the fixed SDK schemas encountered during this startup routine.
  // Error decoding also asks Root.fromJSON for these schemas on every error.
  const compiled = new Map<string, Root>();
  const fromJSON = Root.fromJSON;
  let preparing = true;
  Root.fromJSON = function (json, root) {
    if (root) return fromJSON(json, root);
    const key = JSON.stringify(json);
    const existing = compiled.get(key);
    if (existing) return existing;
    const result = fromJSON(json);
    if (preparing) {
      prepare(result);
      compiled.set(key, result);
    }
    return result;
  };
  try {
    // Constructors only load descriptors; initialize()/RPC methods are not called.
    new v1.FirestoreClient({ fallback: true });
    GoogleError.parseGRPCStatusDetails(new GoogleError("Startup schema preparation"));
  } finally {
    preparing = false;
  }
  prepared = true;
}
