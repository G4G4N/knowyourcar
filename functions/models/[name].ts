/**
 * GET /models/<genId>-<hash>.glb → streamed from the private R2 bucket bound as MODELS.
 * Same-origin, so no public bucket and no CORS. File names are content-hashed by
 * scripts/publish-models.mjs, so responses can be cached forever.
 */

interface R2ObjectBody {
  body: ReadableStream;
  httpEtag: string;
  size: number;
  writeHttpMetadata(headers: Headers): void;
}
interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
}
interface Ctx {
  request: Request;
  params: { name?: string | string[] };
  env: { MODELS?: R2Bucket };
}

const NAME = /^[a-z0-9-]+\.glb$/;

export const onRequestGet = async ({ request, params, env }: Ctx): Promise<Response> => {
  const name = String(params.name ?? '');
  if (!NAME.test(name)) return new Response('Not found', { status: 404 });
  if (!env.MODELS) return new Response('Model storage is not configured (R2 binding MODELS missing)', { status: 503 });

  const obj = await env.MODELS.get(name);
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('content-type', 'model/gltf-binary');
  headers.set('content-length', String(obj.size));
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  // public/_headers only covers static assets, not Function responses.
  headers.set('x-content-type-options', 'nosniff');
  if (request.headers.get('if-none-match') === obj.httpEtag) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers });
};
