"use client";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

let authReadyPromise: Promise<void> | null = null;

function waitForAuthReady(timeoutMs = 2500): Promise<void> {
  if (auth.currentUser) return Promise.resolve();
  if (authReadyPromise) return authReadyPromise;

  authReadyPromise = new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      unsubscribe();
      clearTimeout(timer);
      resolve();
      authReadyPromise = null;
    };

    const unsubscribe = onAuthStateChanged(auth, () => finish());
    const timer = setTimeout(() => finish(), timeoutMs);
  });

  return authReadyPromise;
}

async function getToken(forceRefresh = false): Promise<string | null> {
  await waitForAuthReady();
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

async function withAuthHeaders(
  inputHeaders?: HeadersInit,
  forceRefresh = false
): Promise<Headers> {
  const headers = new Headers(inputHeaders);
  const token = await getToken(forceRefresh);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

export async function authedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  let headers = await withAuthHeaders(init.headers, false);
  let response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    headers = await withAuthHeaders(init.headers, true);
    response = await fetch(input, { ...init, headers });
  }

  return response;
}
