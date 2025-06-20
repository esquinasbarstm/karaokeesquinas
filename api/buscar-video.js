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

    const API_KEY = 'AIzaSyDsdUMRJMx6NIaylLQPMZKkye3-m8DQwH8';
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=5&q=${encodeURIComponent(query)}&key=${AIzaSyA3Lwmtd2Wn4rRF-xhLXIUhb-PjfFhMXxc}`;

    const resposta = await fetch(url);
    const texto = await resposta.text();

    if (!resposta.ok) {
      console.error("❌ Erro da API do YouTube:", texto);
      return new Response(texto, {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const dados = JSON.parse(texto);

    const video = dados.items.find(
      item =>
        item.id?.videoId?.length === 11 &&
        !item.snippet.title.toLowerCase().includes("ao vivo") && // evita vídeos ao vivo
        !item.snippet.title.toLowerCase().includes("podcast")    // evita podcasts
    );

    if (!video) {
      return new Response(JSON.stringify({ error: 'Nenhum vídeo válido encontrado' }), {
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
    return new Response(JSON.stringify({ error: 'Erro interno', detalhes: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
