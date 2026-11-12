export async function request(resource, method = "GET", data, signal) {
  const response = await fetch("/api/admin/" + resource, {
    method, cache: "no-store", signal,
    headers: data === undefined ? undefined : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The request failed. Try again.");
  return result.data;
}
