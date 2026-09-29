import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBjAmkXGxYmDzYn_lGXuEKKiLp4_1L1Ksc",
  authDomain: "trg-cifras.firebaseapp.com",
  projectId: "trg-cifras",
  storageBucket: "trg-cifras.firebasestorage.app",
  messagingSenderId: "492275236191",
  appId: "1:492275236191:web:3fc1abc0b955e9589c0aea"
};


// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Sistema de login
export const auth = getAuth(app);

// Banco de dados das músicas
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
// ===== JANELA DE LOGIN =====

const btnLogin = document.getElementById('btnLogin');

const dialogLogin = document.getElementById('dialogLogin');

// Abrir a janela de login
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// Entrar ou sair
btnLogin.addEventListener('click', async () => {
  if (auth.currentUser) {
    await signOut(auth);
  } else {
    dialogLogin.showModal();
  }
});

// Atualizar o botão conforme o usuário
onAuthStateChanged(auth, async (usuario) => {
  if (!usuario) {
    btnLogin.textContent = '🔐 Entrar';
    return;
  }

  try {
    const admin = await getDoc(
      doc(db, 'admins', usuario.uid)
    );

    if (admin.exists() && admin.data().role === 'admin') {
      btnLogin.textContent = '🚪 Sair';
    } else {
      await signOut(auth);
    }
  } catch (erro) {
    console.error(erro);
    btnLogin.textContent = '🔐 Entrar';
  }
});

// Fechar a janela de login
document.getElementById('btnFecharLogin')
  .addEventListener('click', () => {
    dialogLogin.close();
  });
  // ===== AUTENTICAÇÃO =====

import {
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

document.getElementById('formLogin')
  .addEventListener('submit', async (evento) => {

    evento.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    const mensagem = document.getElementById('loginMensagem');

    mensagem.textContent = 'Verificando acesso...';

    try {
      const resultado = await signInWithEmailAndPassword(
        auth, email, senha
      );

      const referencia = doc(db, 'admins', resultado.user.uid);
      const administrador = await getDoc(referencia);

      if (!administrador.exists() ||
          administrador.data().role !== 'admin') {

        await signOut(auth);
        mensagem.textContent = 'Usuário sem permissão.';
        return;
      }

      mensagem.textContent = '';
      document.getElementById('loginSenha').value = '';

      dialogLogin.close();

      alert('Login de administrador realizado com sucesso!');

    } catch (erro) {
      console.error(erro);
      mensagem.textContent =
        'Não foi possível entrar. Confira suas credenciais e conexão.';
    }

  });
  // ===== REPERTÓRIO NA NUVEM =====

import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Indicador de conexão
const statusNuvem = document.createElement('span');

statusNuvem.style.cssText =
  'font-size:12px; color:white; opacity:0.9;';

document.querySelector('.header-direita')
  .prepend(statusNuvem);

statusNuvem.textContent = '☁️ Conectando...';

// Escutar alterações no banco de dados
onSnapshot(
  collection(db, 'cifras'),

  (snapshot) => {
    // Receber as músicas do Firebase
const lista = snapshot.docs.map(documento => ({
  ...documento.data(),
  id: documento.id
}));

// Atualizar o repertório na tela
if (typeof window.receberCifrasDaNuvem === 'function') {
  window.receberCifrasDaNuvem(lista);
}
    statusNuvem.textContent = snapshot.metadata.fromCache
      ? '☁️ Dados em cache'
      : `☁️ Nuvem conectada (${snapshot.size} músicas)`;
  },

  (erro) => {
    console.error(erro);
    statusNuvem.textContent = '⚠️ Erro na conexão';
  }
);
// ===== SALVAR MÚSICAS NA NUVEM =====

import {
  setDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

window.salvarCifraNaNuvem = async function(cifra) {

  if (!auth.currentUser) {
    throw new Error('Entre como administrador.');
  }

  await setDoc(doc(db, 'cifras', cifra.id), {
    titulo: cifra.titulo,
    artista: cifra.artista || '',
    tom: cifra.tom,
    corpo: cifra.corpo
  });

};
// ===== PERMISSÕES DA INTERFACE =====

function atualizarBotoesAdmin(admin) {

  const botoes = [
  'btnNova',
  'btnEditar',
  'btnSalvar',
  'btnExportar',
  'btnImportar',
  'btnExcluir'
];

  botoes.forEach(id => {
    const botao = document.getElementById(id);

    if (botao) {
      botao.style.display = admin ? '' : 'none';
    }
  });


}

// Inicialmente, esconder os controles
atualizarBotoesAdmin(false);

// Verificar as permissões do usuário
onAuthStateChanged(auth, async (usuario) => {

  if (!usuario) {
    atualizarBotoesAdmin(false);
    return;
  }

  try {
    const registro = await getDoc(
      doc(db, 'admins', usuario.uid)
    );

    if (auth.currentUser?.uid !== usuario.uid) return;

    const administrador =
      registro.exists() &&
      registro.data().role === 'admin';

    atualizarBotoesAdmin(administrador);

  } catch (erro) {
    console.error(erro);
    atualizarBotoesAdmin(false);
  }

});
// ===== EXCLUIR MÚSICAS DA NUVEM =====

import {
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

window.excluirCifraDaNuvem = async function(id) {

  if (!auth.currentUser) {
    throw new Error('Entre como administrador.');
  }

  await deleteDoc(doc(db, 'cifras', id));

};
// ===== IMPORTAÇÃO SEGURA PARA A NUVEM =====
import {
  getDocsFromServer,
  getDocFromServer,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Lê o repertório real do servidor, sem depender de uma lista local antiga.
window.buscarCifrasNaNuvem = async function() {
  const snapshot = await getDocsFromServer(collection(db, 'cifras'));
  return snapshot.docs.map(documento => ({
    ...documento.data(),
    id: documento.id
  }));
};

// Acrescenta somente as cifras preparadas pela mesclagem. Nunca exclui.
window.importarCifrasNaNuvem = async function(novas) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Entre como administrador.');

  const admin = await getDocFromServer(doc(db, 'admins', uid));
  if (!admin.exists() || admin.data().role !== 'admin') {
    throw new Error('Você não tem permissão de administrador.');
  }

  if (!Array.isArray(novas) || novas.length === 0 || novas.length > 400) {
    throw new Error('A importação deve conter de 1 a 400 cifras.');
  }

  const lote = writeBatch(db);
  for (const cifra of novas) {
    if (
      !cifra || typeof cifra.id !== 'string' || !cifra.id ||
      typeof cifra.titulo !== 'string' || !cifra.titulo.trim() ||
      typeof cifra.corpo !== 'string' || !cifra.corpo.trim()
    ) {
      throw new Error('Foi encontrada uma cifra inválida.');
    }
    lote.set(doc(db, 'cifras', cifra.id), {
      titulo: cifra.titulo,
      artista: cifra.artista || '',
      tom: cifra.tom,
      corpo: cifra.corpo
    });
  }

  await lote.commit();
};
