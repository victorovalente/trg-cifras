import {initializeApp} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager,collection,onSnapshot,doc,getDoc,getDocFromServer,getDocsFromServer,setDoc,deleteDoc,writeBatch} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig={
  apiKey:"AIzaSyBjAmkXGxYmDzYn_lGXuEKKiLp4_1L1Ksc",
  authDomain:"trg-cifras.firebaseapp.com",
  projectId:"trg-cifras",
  storageBucket:"trg-cifras.firebasestorage.app",
  messagingSenderId:"492275236191",
  appId:"1:492275236191:web:3fc1abc0b955e9589c0aea"
};

const app=initializeApp(firebaseConfig);
export const auth=getAuth(app);
export const db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});

const $=id=>document.getElementById(id);
const btnLogin=$('btnLogin');
const dialogLogin=$('dialogLogin');

async function eAdmin(usuario){
  if(!usuario)return false;
  try{
    const r=await getDoc(doc(db,'admins',usuario.uid));
    return r.exists()&&r.data().role==='admin';
  }catch(e){return false}
}

btnLogin.addEventListener('click',async()=>{
  if(auth.currentUser)await signOut(auth);
  else dialogLogin.showModal();
});

$('btnFecharLogin').onclick=()=>dialogLogin.close();

$('formLogin').addEventListener('submit',async e=>{
  e.preventDefault();
  const msg=$('loginMensagem');
  msg.textContent='Verificando acesso…';
  try{
    const r=await signInWithEmailAndPassword(auth,$('loginEmail').value.trim(),$('loginSenha').value);
    if(!(await eAdmin(r.user))){
      await signOut(auth);msg.textContent='Usuário sem permissão.';return;
    }
    $('loginSenha').value='';msg.textContent='';dialogLogin.close();
  }catch(err){
    console.error(err);
    msg.textContent='Não foi possível entrar. Confira os dados e a conexão.';
  }
});

onAuthStateChanged(auth,async usuario=>{
  const admin=await eAdmin(usuario);
  if(usuario&&!admin){await signOut(auth);return}
  btnLogin.textContent=admin?'🚪 Sair':'🔐 Entrar';
  window.TRGCifras?.setAdmin(admin);
});

onSnapshot(collection(db,'cifras'),{includeMetadataChanges:true},snap=>{
  const lista=snap.docs.map(d=>({...d.data(),id:d.id}));
  window.receberCifrasDaNuvem?.(lista);
  window.TRGCifras?.setStatus(
    snap.metadata.fromCache?`Offline/cache • ${snap.size} músicas`:`Nuvem sincronizada • ${snap.size} músicas`,
    snap.metadata.fromCache?'offline':'online'
  );
},err=>{
  console.error(err);
  window.TRGCifras?.setStatus(navigator.onLine?'Erro de sincronização':'Offline • repertório salvo','offline');
});

window.salvarCifraNaNuvem=async cifra=>{
  if(!auth.currentUser||!(await eAdmin(auth.currentUser)))throw new Error('Sem permissão');
  await setDoc(doc(db,'cifras',cifra.id),{
    titulo:cifra.titulo,artista:cifra.artista||'',tom:cifra.tom,corpo:cifra.corpo
  });
};

window.excluirCifraDaNuvem=async id=>{
  if(!auth.currentUser||!(await eAdmin(auth.currentUser)))throw new Error('Sem permissão');
  await deleteDoc(doc(db,'cifras',id));
};

window.buscarCifrasNaNuvem=async()=>{
  const s=await getDocsFromServer(collection(db,'cifras'));
  return s.docs.map(d=>({...d.data(),id:d.id}));
};

window.importarCifrasNaNuvem=async novas=>{
  if(!auth.currentUser)throw new Error('Entre como administrador');
  const reg=await getDocFromServer(doc(db,'admins',auth.currentUser.uid));
  if(!reg.exists()||reg.data().role!=='admin')throw new Error('Sem permissão');
  if(!Array.isArray(novas)||!novas.length||novas.length>400)throw new Error('Quantidade inválida');
  const lote=writeBatch(db);
  for(const c of novas){
    lote.set(doc(db,'cifras',c.id),{
      titulo:c.titulo,artista:c.artista||'',tom:c.tom,corpo:c.corpo
    });
  }
  await lote.commit();
};
