import { collection, onSnapshot, type Timestamp } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { getFirebaseDb } from "./client";

export type RegisteredUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  provider: string;
  createdAt: Date | null;
};

type FirestoreUser = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  provider?: unknown;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function timestampToDate(value: Timestamp | null | undefined): Date | null {
  return value && typeof value.toDate === "function" ? value.toDate() : null;
}

export function subscribeToRegisteredUsers(
  onUsers: (users: RegisteredUser[]) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    collection(getFirebaseDb(), "users"),
    (snapshot) => {
      const users = snapshot.docs
        .map((userDocument) => {
          const data = userDocument.data() as FirestoreUser;
          return {
            id: userDocument.id,
            name: textValue(data.name),
            email: textValue(data.email),
            phone: textValue(data.phone),
            provider: textValue(data.provider),
            // Older Google records predate createdAt, so retain them in the
            // list using their earliest available stored timestamp.
            createdAt: timestampToDate(data.createdAt ?? data.updatedAt),
          } satisfies RegisteredUser;
        })
        .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

      onUsers(users);
    },
    (error) =>
      onError(
        error instanceof FirebaseError && error.code === "permission-denied"
          ? "Sign in with an authorized CRM account to view registered users."
          : error.message || "Registered users could not be loaded.",
      ),
  );
}
