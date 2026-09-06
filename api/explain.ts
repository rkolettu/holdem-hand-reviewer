type ExplainRequest = {
  position: string;
  playstyle: string;
  rangePercentage: number;
  equity: number;
  potOdds: number;
  ev: number;
  pot: number;
  call: number;
  method: 'exact' | 'estimated';
};

type GroqResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

const MODEL = 'openai/gpt-oss-20b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validBody(value: unknown): value is ExplainRequest {
  if (!value || typeof value !== 'object') return false;
  const body = value as Partial<ExplainRequest>;

  return (
    typeof body.position === 'string' &&
    body.position.length <= 20 &&
    typeof body.playstyle === 'string' &&
    body.playstyle.length <= 40 &&
    isFiniteNumber(body.rangePercentage) &&
    isFiniteNumber(body.equity) &&
    isFiniteNumber(body.potOdds) &&
    isFiniteNumber(body.ev) &&
    isFiniteNumber(body.pot) &&
    isFiniteNumber(body.call) &&
    (body.method === 'exact' || body.method === 'estimated') &&
    body.rangePercentage >= 0 &&
    body.rangePercentage <= 100 &&
    body.equity >= 0 &&
    body.equity <= 1 &&
    body.potOdds >= 0 &&
    body.potOdds <= 1 &&
    body.pot >= 0 &&
    body.call >= 0
  );
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function cleanExplanation(value: string) {
  return value
    .replace(/\*\*/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .trim();
}

export async function POST(request: Request) {
  const apiKey =
    process.env.GROQ_API_KEY ?? process.env.Hand_Reviewer_Groq_Key;

  if (!apiKey) {
    return Response.json(
      { error: 'AI explanations are not configured on this deployment.' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!validBody(body)) {
    return Response.json({ error: 'Invalid hand analysis data.' }, { status: 400 });
  }

  const decision =
    body.call === 0
      ? 'check'
      : body.equity > body.potOdds
        ? 'call'
        : body.equity < body.potOdds
          ? 'fold'
          : 'break-even';

  const prompt = [
    `Opponent: ${body.position}, ${body.playstyle}`,
    `Assumed range width: ${body.rangePercentage.toFixed(1)}%`,
    `Equity: ${pct(body.equity)} (${body.method})`,
    `Pot odds: ${pct(body.potOdds)}`,
    `Call EV: ${body.ev >= 0 ? '+' : ''}${body.ev.toFixed(2)} BB`,
    `Pot before hero's call: ${body.pot.toFixed(1)} BB`,
    `Call amount: ${body.call.toFixed(1)} BB`,
    `Math-engine decision: ${decision}`,
  ].join('\n');

  try {
    const groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.15,
        max_completion_tokens: 900,
        messages: [
          {
            role: 'system',
            content:
              'You are a concise Texas Hold’em study coach. Explain only the deterministic results supplied by the app. Never recalculate any number, never show a formula or equation, and never invent win rates, loss rates, outs, implied odds, future action, or hand-strength claims that were not supplied. Treat the opponent range as an assumption, not a GTO solution or population fact. Write one polished paragraph of 45 to 70 words. Start directly with Call, Fold, Check, or Break-even as appropriate. Mention the supplied equity, pot odds, and call EV naturally, then end with one short limitation of the model. Use plain text only: no Markdown, no bullets, no headings, no asterisks.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!groqResponse.ok) {
      console.error('Groq request failed:', groqResponse.status);
      return Response.json(
        { error: 'AI explanation is temporarily unavailable.' },
        { status: 502 },
      );
    }

    const data = (await groqResponse.json()) as GroqResponse;
    const rawExplanation = data.choices?.[0]?.message?.content?.trim();

    if (!rawExplanation) {
      return Response.json(
        { error: 'The AI provider returned an empty explanation.' },
        { status: 502 },
      );
    }

    const explanation = cleanExplanation(rawExplanation);

    return Response.json(
      { explanation },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    console.error('AI explanation request failed:', error);
    return Response.json(
      { error: 'AI explanation is temporarily unavailable.' },
      { status: 502 },
    );
  }
}
