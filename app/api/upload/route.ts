// Esta rota resolve o problema de CORS ao fazer upload para o Litterbox.
// O browser não pode chamar litterbox.catbox.moe diretamente em produção
// porque o cabeçalho Access-Control-Allow-Origin não cobre seu domínio.
// A solução é proxiar via Next.js: browser → /api/upload → litterbox.

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Edge Runtime: menor latência, sem timeout de 10s

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Repassamos o FormData diretamente para o Litterbox
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

    const url = await response.text(); // Litterbox retorna a URL como texto puro
    return NextResponse.json({ url: url.trim() });

  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

// Limite de 50 MB (ajuste conforme Vercel plan)
export const config = { api: { bodyParser: false } };
