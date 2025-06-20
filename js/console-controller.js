// console-controller.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, doc, getDocs, onSnapshot,
  updateDoc, arrayRemove, serverTimestamp, query, orderBy, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBGkT5z6i3KycQHvuutOYiUOeX1hDG15lw",
  authDomain: "esquina-s-karaoke.firebaseapp.com",
  projectId: "esquina-s-karaoke",
  storageBucket: "esquina-s-karaoke.firebasestorage.app",
  messagingSenderId: "259976490299",
  appId: "1:259976490299:web:a7964bf79f1ead7e5e5b1e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ulFila = document.getElementById("fila");
const ulHist = document.getElementById("historico");
const infoTocando = document.getElementById("infoTocando");
const infoProxima = document.getElementById("infoProxima");

let mesas = [];
let filaRodizio = [];

document.getElementById("limparFila").addEventListener("click", limparFila);
onSnapshot(collection(db, "mesas"), gerarFilaRodizio);
onSnapshot(doc(db, "sistema", "recalcularFila"), async (docSnap) => {
  if (docSnap.exists()) {
    await gerarFilaRodizio();
    await setDoc(doc(db, "sistema", "recalcularFila"), { atualizar: false });
  }
});

// ✔️ Correção aqui: usar collection() ao invés de doc()
const qHist = query(collection(db, "historico"), orderBy("tocadaEm", "desc"));
onSnapshot(qHist, (snapshot) => {
  ulHist.innerHTML = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    const time = data.tocadaEm?.toDate().toLocaleString("pt-BR") || "sem data";
    const li = document.createElement("li");
    li.innerHTML = `<span><strong>${data.musica}</strong> <span class="tag">Mesa ${data.mesa}</span></span><span class="time">${time}</span>`;
    ulHist.appendChild(li);
  });
});

onSnapshot(doc(db, "status", "tocandoAgora"), (docSnap) => {
  if (!docSnap.exists()) {
    infoTocando.textContent = "Nenhuma música em reprodução.";
    return;
  }
  const data = docSnap.data();
  const time = data.atualizadoEm?.toDate().toLocaleTimeString("pt-BR") || "";
  infoTocando.innerHTML = `<strong>${data.musica}</strong><span class="tag">Mesa ${data.mesa}</span><span class="time">${time}</span>`;
});

async function gerarFilaRodizio() {
  const snapshot = await getDocs(collection(db, "mesas"));
  mesas = snapshot.docs.map(doc => ({ mesaId: doc.id, musicas: doc.data().musicas || [] }));
  filaRodizio = [];
  let index = 0;
  let aindaTem = true;
  while (aindaTem) {
    aindaTem = false;
    for (let mesa of mesas) {
      const primeira = mesa.musicas[index];
      const segunda = mesa.musicas[index + 1];
      if (typeof primeira === 'string') filaRodizio.push({ mesaId: mesa.mesaId, musica: primeira }), aindaTem = true;
      if (typeof segunda === 'string') filaRodizio.push({ mesaId: mesa.mesaId, musica: segunda }), aindaTem = true;
    }
    index += 2;
  }
  await setDoc(doc(db, "sistema", "filaOrdenada"), {
    fila: filaRodizio,
    atualizadaEm: serverTimestamp()
  });
  renderizarFila();
}

function renderizarFila() {
  ulFila.innerHTML = '';
  if (filaRodizio.length === 0) {
    ulFila.innerHTML = '<li>Nenhuma música na fila.</li>';
    infoProxima.textContent = "Nenhuma música após a atual.";
    return;
  }
  filaRodizio.forEach((item, i) => {
    const li = document.createElement("li");
    if (i === 0) li.classList.add("atual");
    li.innerHTML = `<span><strong>${item.musica}</strong> <span class="tag">Mesa ${item.mesaId}</span></span>
    <span>
      ${i === 0 ? `<button class="tocar" onclick="forcarTocar('${item.mesaId}', '${item.musica}')">Tocar agora</button>
      <button class="remover" onclick="pularMusica('${item.mesaId}', '${item.musica}')">Pular</button>` :
      `<button class="remover" onclick="removerMusica('${item.mesaId}', '${item.musica}')">Remover</button>`}
    </span>`;
    ulFila.appendChild(li);
  });
  if (filaRodizio.length > 1) {
    const proxima = filaRodizio[1];
    infoProxima.innerHTML = `<strong>${proxima.musica}</strong><span class="tag">Mesa ${proxima.mesaId}</span>`;
  } else {
    infoProxima.textContent = "Nenhuma música após a atual.";
  }
  new Sortable(ulFila, { animation: 150, onEnd: salvarOrdemManual });
}

async function salvarOrdemManual() {
  const novaOrdem = [];
  ulFila.querySelectorAll("li").forEach((li) => {
    const musica = li.querySelector("strong")?.textContent;
    const mesaSpan = li.querySelector(".tag")?.textContent;
    const mesaId = mesaSpan?.replace("Mesa ", "").trim();
    if (musica && mesaId) novaOrdem.push({ mesaId, musica });
  });
  await setDoc(doc(db, "sistema", "filaOrdenada"), {
    fila: novaOrdem,
    atualizadaEm: serverTimestamp()
  });
  console.log("🎯 Nova ordem manual salva:", novaOrdem);
}

window.forcarTocar = async (mesaId, musica) => {
  const youtubeId = await buscarYoutubeId(musica);
  if (!youtubeId) return alert("Vídeo não encontrado para essa música.");
  await setDoc(doc(db, "status", "forcarTocar"), {
    mesa: mesaId,
    musica,
    youtubeId,
    forcarEm: serverTimestamp()
  });
};

async function buscarYoutubeId(musica) {
  try {
    const response = await fetch(`/api/buscar-video?musica=${encodeURIComponent(musica)}`);
    const json = await response.json();
    return json?.youtubeId || null;
  } catch (err) {
    console.error("Erro ao buscar YouTube ID:", err);
    return null;
  }
}

window.pularMusica = async (mesaId, musica) => {
  await removerMusica(mesaId, musica);
};

window.removerMusica = async (mesaId, musica) => {
  const mesaRef = doc(db, "mesas", mesaId);
  await updateDoc(mesaRef, {
    musicas: arrayRemove(musica),
    ultimaAtualizacao: serverTimestamp()
  });
  await gerarFilaRodizio();
};

async function limparFila() {
  const snapshot = await getDocs(collection(db, "mesas"));
  for (let docSnap of snapshot.docs) {
    const mesaRef = doc(db, "mesas", docSnap.id);
    await updateDoc(mesaRef, {
      musicas: [],
      ultimaAtualizacao: serverTimestamp()
    });
  }
  await gerarFilaRodizio();
}
