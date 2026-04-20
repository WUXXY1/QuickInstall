import { NextRequest, NextResponse } from 'next/server';

// ── App Router: configuração via exports de segmento, não via `config` object
export const runtime = 'edge';
export const dynamic = 'force-dynamic'; // nunca cachear uploads

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const response = await fetch(
      'https://litterbox.catbox.moe/resources/internals/api.php',
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Litterbox error: ${response.status}` },
        { status: 502 }
      );
    }

    const url = await response.text();
    return NextResponse.json({ url: url.trim() });

  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
