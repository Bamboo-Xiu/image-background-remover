export const runtime = 'edge'

export async function POST() {
  return new Response(JSON.stringify({ message: 'hello' }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
