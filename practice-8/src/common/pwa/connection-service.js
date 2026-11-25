export async function probeConnection(signal) {
  const url = new URL("connection-check.txt", document.baseURI);
  url.searchParams.set("t", Date.now());
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
  });
  if (!response.ok) throw new Error("Connection check failed");
}
