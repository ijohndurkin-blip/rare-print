export function GET() {
  return Response.json({ enabled: Boolean(process.env.OPENAI_API_KEY) });
}
