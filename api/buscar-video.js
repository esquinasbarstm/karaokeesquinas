export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('musica');

    if (!query) {
      return new Response(JSON.stringify({ error: 'Consulta vazia' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const API_KEY = 'AIzaSyA3Lwmtd2Wn4rRF-xhLXIUhb-PjfFhMXxc'; // chave entre aspas
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=5&q=${encodeURIComponent(query)}&key=${API_KEY}`;

    const resposta = await fetch(url);
    const texto = await resposta.text();

    if (!resposta.ok) {
      console.error("❌ Erro bruto da API YouTube:", texto);
      return new Response(JSON.stringify({ error: 'Erro ao buscar no YouTube', detalhe: texto }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const dados = JSON.parse(texto);
    const video = dados.items.find(item => item.id?.videoId?.length === 11);

    if (!video) {
      return new Response(JSON.stringify({ error: 'Nenhum vídeo válido encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      youtubeId: video.id.videoId,
      titulo: video.snippet.title
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error("❌ Erro interno:", err);
    return new Response(JSON.stringify({ error: 'Erro interno', detalhe: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
