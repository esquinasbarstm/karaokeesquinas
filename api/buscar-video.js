export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || searchParams.get('musica');

  if (!query) {
    return new Response(JSON.stringify({ error: 'Consulta vazia' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const API_KEY = 'AIzaSyA3Lwmtd2Wn4rRF-xhLXIUhb-PjfFhMXxc';
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=5&q=${encodeURIComponent(query)}&key=${API_KEY}`;

  try {
    const resposta = await fetch(url);

    if (!resposta.ok) {
      const erroTexto = await resposta.text();
      console.error("Erro da API YouTube:", erroTexto);
      return new Response(JSON.stringify({ error: 'Erro na API do YouTube' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const dados = await resposta.json();
    const video = dados.items.find(item => item.id.videoId);

    if (!video) {
      return new Response(JSON.stringify({ error: 'Nenhum vídeo encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        youtubeId: video.id.videoId,
        titulo: video.snippet.title,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error("Erro interno:", err);
    return new Response(JSON.stringify({ error: 'Erro interno ao buscar vídeo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
