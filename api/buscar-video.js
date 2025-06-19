export default async function handler(req, res) {
  const query = req.query.q;
  const API_KEY = 'AIzaSyBzHqKTAFuemsQV95chHZ3MsfKReKP5Tdk'; // 👈 troque aqui pela sua chave

  if (!query) return res.status(400).json({ error: 'Consulta vazia' });

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=5&q=${encodeURIComponent(query)}&key=${API_KEY}`;

  try {
    const resposta = await fetch(url);
    const dados = await resposta.json();

    const video = dados.items.find(item => item.id.videoId);
    if (!video) return res.status(404).json({ error: 'Nenhum vídeo válido encontrado' });

    res.json({
      youtubeId: video.id.videoId,
      titulo: video.snippet.title
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar vídeo' });
  }
}
