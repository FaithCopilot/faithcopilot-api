export const proxy = async (request: any, env: any) => {
  const content = env?.request?.content;
  if (!content) {
    return new Response("Bad Request", { status: 400 });
  }
  let { url, method, headers, body } = content;
  if (!url) return new Response("Bad Request", { status: 400 });
  if (!method) method = "GET";
  const options: any = { method };
  if (headers) options["headers"] = headers;
  if (body) options["body"] = typeof body !== "string" ? JSON.stringify(body) : body;
  const response = await fetch(url, options);
  if (!response?.ok) {
    console.error("Proxy Error: ", response);
  };
  // clone the response to return a response with modifiable headers
  const newResponse = new Response(response.body, response);
  return newResponse;
};

export const proxyPartial = async (request: any, env: any) => {
  // using: cloudflared tunnel --url http://localhost:8788
  const proxyPartialBaseURL = env?.PROXY_PARTIAL_BASE_URL;
  const proxyPartialToken = env?.PROXY_PARTIAL_TOKEN;
  if (!proxyPartialBaseURL || !proxyPartialToken) {
    console.error("Missing PROXY_PARTIAL_BASE_URL or PROXY_PARTIAL_TOKEN");
    return new Response("Server Error", { status: 500 });
  }
  const proxyPartialPath = env?.PROXY_PARTIAL_PATH;
  // clone the original request
  const clonedRequest = request.clone();
  // reconstruct the URL using the original and the proxy base URL
  const urlObj = new URL(request.url);
  let pathname = urlObj.pathname;
  // TODO: better handling of slashes in config (e.g. /path/ vs path)
  if (!pathname.includes(`/${proxyPartialPath}/`)) {
    pathname = "/" + proxyPartialPath + pathname;
  }
  const search = urlObj.search;
  const proxyURL = proxyPartialBaseURL + pathname + search;
  // create a new Request object with the proxyURL and cloned properties
  const proxyRequest = new Request(proxyURL, {
    method: clonedRequest.method,
    headers: new Headers(clonedRequest.headers),
    body: clonedRequest.body,
    //redirect: clonedRequest.redirect,
  });
  proxyRequest.headers.set("Authorization", `Bearer ${proxyPartialToken}`);
  if (env?.request?.uid) {
    proxyRequest.headers.set("X-TENANT-ID", env.request.uid);
  }
  const response = await fetch(proxyRequest);
  // clone the response to return a response with modifiable headers
  const newResponse = new Response(response.body, response);
  return newResponse;
};
