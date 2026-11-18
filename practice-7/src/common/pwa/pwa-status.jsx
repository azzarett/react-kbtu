import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import './pwa.css';
export function PwaStatus() {
  const [online,setOnline]=useState(navigator.onLine);
  const [cached,setCached]=useState(false);
  const [waiting,setWaiting]=useState(null);
  const [install,setInstall]=useState(null);
  const [status,setStatus]=useState('');
  useEffect(()=>{
    let active=true; let timer;
    const updateOnline=()=>setOnline(navigator.onLine);
    const message=e=>{if(e.data?.type==='API_CACHED'){setCached(true);setStatus('Каталог загружен из сохранённой копии.');}if(e.data?.type==='API_LIVE'){setCached(false);setOnline(true);setStatus('');}if(e.data?.type==='API_UNAVAILABLE')setStatus('Каталог недоступен: нет сохранённой копии этого запроса.');};
    const prompt=e=>{e.preventDefault();setInstall(e);};
    const installed=()=>setInstall(null);
    const check=async()=>{try{const r=await fetch(new URL(`connection-check.txt?t=${Date.now()}`,document.baseURI),{method:'GET',cache:'no-store',signal:AbortSignal.timeout(5000)});if(active)setOnline(r.ok);}catch{if(active)setOnline(false);}};
    window.addEventListener('online',check);window.addEventListener('offline',updateOnline);window.addEventListener('beforeinstallprompt',prompt);window.addEventListener('appinstalled',installed);
    navigator.serviceWorker?.addEventListener('message',message);
    if(import.meta.env.PROD && 'serviceWorker' in navigator){
      navigator.serviceWorker.register(new URL('sw.js',document.baseURI),{scope:'./',updateViaCache:'none'}).then(reg=>{
        if(!active)return;
        if(reg.waiting)setWaiting(reg.waiting);
        reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(active&&worker.state==='installed'&&navigator.serviceWorker.controller)setWaiting(reg.waiting);});});
        timer=setInterval(()=>reg.update().catch(()=>{}),60000);
      }).catch(()=>{if(active)setStatus('Офлайн-режим пока не установлен. Перезагрузите приложение при доступной сети.');});
    }
    if(import.meta.env.PROD) void check();
    return()=>{active=false;clearInterval(timer);window.removeEventListener('online',check);window.removeEventListener('offline',updateOnline);window.removeEventListener('beforeinstallprompt',prompt);window.removeEventListener('appinstalled',installed);navigator.serviceWorker?.removeEventListener('message',message);};
  },[]);
  function activate(){setStatus('Обновляем приложение…');navigator.serviceWorker.addEventListener('controllerchange',()=>window.location.reload(),{once:true});waiting?.postMessage({type:'SKIP_WAITING'});}
  return <aside className="pwa-bar" aria-label="Состояние приложения"><span role="status">{online?'● Онлайн':'○ Нет соединения'}{(cached||!online)&&' · сохранённые данные могут быть устаревшими'}{status&&` · ${status}`}</span><div><Link to="/offline">Офлайн-режим</Link>{install&&<button onClick={async()=>{await install.prompt();setInstall(null);}}>Установить</button>}{waiting&&<button onClick={activate}>Обновить · несохранённые изменения будут потеряны</button>}</div></aside>;
}
export function OfflinePage(){
 const [status,setStatus]=useState('');
 const retry=async()=>{setStatus('Проверяем соединение…');try{const r=await fetch(new URL(`connection-check.txt?t=${Date.now()}`,document.baseURI),{method:'GET',cache:'no-store',signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error();setStatus('Соединение восстановлено. Можно вернуться в каталог.');window.dispatchEvent(new Event('online'));}catch{setStatus('Сеть пока недоступна. Локальная полка и сохранённые запросы работают.');}};
 return <section className="offline-card"><span className="eyebrow">ПОЛКА / OFFLINE</span><h1>Связь потерялась.<br/>Книги остались.</h1><p>Открывайте локальную полку и ранее загруженные страницы каталога. Новые поиски и вход в аккаунт требуют подключения. Публичные данные хранятся до 24 часов.</p><div className="offline-actions"><button onClick={retry}>Проверить соединение</button><Link to="/library">Моя полка</Link><Link to="/catalog">Каталог</Link></div><p role="status">{status}</p><h2>Установите приложение</h2><p>В Chrome используйте «Установить» в адресной строке или меню. В Safari на iPhone: «Поделиться» → «На экран Домой». Офлайн-режим готов после первой успешной загрузки.</p></section>;
}
