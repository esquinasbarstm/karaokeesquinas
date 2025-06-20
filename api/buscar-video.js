export default async function handler(req, res) {
  const query = req.query.q;
  const API_KEY = 'AIzaSyBzHqKTAFuemsQV95chHZ3MsfKReKP5Tdk';

  if (!query) return res.status(400).json({ error: 'Consulta vazia' });

  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(query)}&key=${API_KEY}`;

  try {
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      return res.status(404).json({ error: 'Nenhum vídeo encontrado na busca' });
    }

    // Extrair IDs dos vídeos encontrados
    const videoIds = searchData.items
      .map(item => item.id?.videoId)
      .filter(id => id)
      .join(',');

    if (!videoIds) {
      return res.status(404).json({ error: 'Nenhum vídeo com ID válido encontrado' });
    }

    // Agora buscamos os detalhes dos vídeos encontrados
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${videoIds}&key=${API_KEY}`;
    const videosResponse = await fetch(videosUrl);
    const videosData = await videosResponse.json();

    // Filtramos apenas vídeos embeddáveis
    const embeddableVideo = videosData.items.find(video => {
      return (
        video.status?.embeddable &&
        video.status?.privacyStatus === 'public'
      );
    });

    if (!embeddableVideo) {
      return res.status(404).json({ error: 'Nenhum vídeo embeddável encontrado' });
    }

    res.json({
      youtubeId: embeddableVideo.id,
      titulo: embeddableVideo.snippet.title
    });

  } catch (err) {
    console.error("Erro ao buscar vídeo:", err);
    res.status(500).json({ error: 'Erro interno ao buscar vídeo' });
  }
}
