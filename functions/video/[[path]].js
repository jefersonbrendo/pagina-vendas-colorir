/**
 * Entrega os vídeos de /video/* com suporte a pedidos de intervalo (Range → 206).
 *
 * O Cloudflare Pages ignora o cabeçalho Range nos arquivos estáticos e sempre devolve
 * o arquivo inteiro (200). O Safari do iPhone pede o vídeo em pedaços e não toca o
 * <video> se não receber 206. Esta função lê o arquivo publicado e devolve só o
 * pedaço pedido.
 */
export async function onRequest({ request, env }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  // Busca o arquivo estático sem o Range (o Pages devolveria o arquivo inteiro de qualquer jeito)
  const asset = await env.ASSETS.fetch(new Request(request.url, { method: 'GET' }));
  // Só mexe em vídeo de verdade (caminho inexistente cai na página inicial do Pages)
  if (!asset.ok || !(asset.headers.get('Content-Type') || '').startsWith('video/')) return asset;

  const headers = new Headers(asset.headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=604800');

  const range = request.headers.get('Range');
  if (!range) {
    return new Response(request.method === 'HEAD' ? null : asset.body, { status: 200, headers });
  }

  const buf = await asset.arrayBuffer();
  const size = buf.byteLength;
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!m || (m[1] === '' && m[2] === '')) {
    headers.set('Content-Length', String(size));
    return new Response(request.method === 'HEAD' ? null : buf, { status: 200, headers });
  }

  let start;
  let end;
  if (m[1] === '') {
    // "bytes=-500": os últimos 500 bytes
    start = Math.max(0, size - parseInt(m[2], 10));
    end = size - 1;
  } else {
    start = parseInt(m[1], 10);
    end = m[2] === '' ? size - 1 : Math.min(parseInt(m[2], 10), size - 1);
  }

  if (start >= size || end < start) {
    headers.set('Content-Range', `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }

  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(request.method === 'HEAD' ? null : buf.slice(start, end + 1), { status: 206, headers });
}
