export async function GET(req: Request) {
  const url = req.url;
  const response = await fetch(url);
  return new Response(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "image/jpeg",
    },
  });
}
