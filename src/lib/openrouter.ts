// Client-side wrapper — calls the /api/chat Vercel serverless function
// API key never touches the browser; all auth happens server-side

export async function callRodrigoChat(
  userMessage: string,
  history: { role: string; content: string }[]
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMessage, history }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Chat API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content as string;
}
