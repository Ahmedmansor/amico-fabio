/** Bounded I/O for the server-only Auth hook. Never logs bodies or credentials. */
export async function readBoundedBody(stream: ReadableStream<Uint8Array> | null, maxBytes = 32768, signal?: AbortSignal): Promise<string> {
  if (!stream) throw new Error('Missing body');
  if (signal?.aborted) { void stream.cancel().catch(() => {}); throw new Error('Read aborted'); }
  const reader = stream.getReader();
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal?.addEventListener('abort', cancel, {once: true});
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (signal?.aborted) throw new Error('Read aborted');
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('Body too large');
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(bytes);
  } finally {
    signal?.removeEventListener('abort', cancel);
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function withDeadline<T>(work: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work(controller.signal),
      new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Deadline exceeded')); }, timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}

export async function sha256(value: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}
