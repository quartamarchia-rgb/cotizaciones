/* Capa de conexión Quarta Marchia ⇄ Supabase.
   Imita la interfaz que usa la app (db, user, downloads) para que el resto del código no cambie. */
(function(){
  "use strict";
  const cfg=window.QM_CONFIG||{};
  const configurado=cfg.url&&cfg.key&&!/PEGA_AQUI|XXXX/.test(cfg.url+cfg.key);
  let resolverSesion;const sesionLista=new Promise(r=>resolverSesion=r);
  let sb=null;
  if(configurado&&window.supabase){sb=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true}})}

  /* ---------- pantalla de inicio de sesión ---------- */
  const usuarios=(cfg.usuarios||[]).filter(u=>u&&u.email&&!/CORREO_DE/.test(u.email));
  const nombreDe=email=>{const u=(cfg.usuarios||[]).find(x=>x.email&&email&&x.email.toLowerCase()===email.toLowerCase());return u?u.nombre:(email||"")};
  window.QM_NOMBRE=()=>window.__qmNombre||"";
  function pantallaLogin(msg,elegido){
    let ov=document.getElementById("qm-login");
    if(!ov){ov=document.createElement("div");ov.id="qm-login";document.body.appendChild(ov)}
    const u=elegido!=null?usuarios[elegido]:null;
    let cuerpo="";
    if(sb&&!u&&elegido!=="otro"){
      cuerpo=`<div class="qm-q">¿Quién entra?</div><div class="qm-quien">${usuarios.map((x,i)=>`<button type="button" class="qm-u" data-i="${i}"><b>${x.nombre}</b><small>${x.puesto||""}</small></button>`).join("")}</div>
        <button type="button" class="qm-otro" data-i="otro">Entrar con otro correo</button>`;
    } else if(sb){
      cuerpo=`${u?`<div class="qm-q">Entrar como ${u.nombre}</div>`:`<label>Correo<input id="qm-email" type="email" required autocomplete="username"></label>`}
        <label>PIN de 6 dígitos<input id="qm-pass" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" minlength="6" required autocomplete="current-password" class="qm-pin" placeholder="••••••"></label>
        <button class="primary" type="submit" id="qm-entrar">Entrar</button>
        <button type="button" class="qm-otro" id="qm-volver">← Elegir otra área</button>`;
    }
    ov.innerHTML=`<form id="qm-login-f" autocomplete="on">
      <img src="logo.png" alt="Quarta Marchia" style="height:46px;align-self:center">
      <h2 style="margin:0;text-align:center">Cotizaciones</h2>
      ${msg?`<div class="qm-login-msg">${msg}</div>`:""}${cuerpo}</form>`;
    ov.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>pantallaLogin("",b.dataset.i==="otro"?"otro":+b.dataset.i));
    const v=document.getElementById("qm-volver");if(v)v.onclick=()=>pantallaLogin("");
    const p=document.getElementById("qm-pass");if(p){setTimeout(()=>p.focus(),0);p.oninput=()=>{p.value=p.value.replace(/\D/g,"").slice(0,6);if(p.value.length===6&&u)document.getElementById("qm-login-f").requestSubmit()}}
    const f=document.getElementById("qm-login-f");
    if(sb)f.onsubmit=async e=>{e.preventDefault();const b=document.getElementById("qm-entrar");if(!b)return;b.disabled=true;b.textContent="Entrando…";
      const email=u?u.email:document.getElementById("qm-email").value.trim();
      const {data,error}=await sb.auth.signInWithPassword({email,password:document.getElementById("qm-pass").value});
      if(error){pantallaLogin("PIN incorrecto. Intenta de nuevo.",elegido);return}
      entro(data.session)};
  }
  function entro(s){
    window.__qmNombre=nombreDe(s&&s.user&&s.user.email);
    const meta=(s&&s.user&&s.user.user_metadata)||{};
    if(!meta.pin_listo){crearPin(s);return} // primera vez: cada quien crea su propio PIN
    const ov=document.getElementById("qm-login");if(ov)ov.remove();
    resolverSesion(s);botonSalir(s)}
  function crearPin(s,msg){
    let ov=document.getElementById("qm-login");
    if(!ov){ov=document.createElement("div");ov.id="qm-login";document.body.appendChild(ov)}
    ov.innerHTML=`<form id="qm-pin-f">
      <img src="logo.png" alt="Quarta Marchia" style="height:46px;align-self:center">
      <div class="qm-q">Primera vez en ${window.__qmNombre||"la app"}</div>
      <div class="hint" style="text-align:center">Crea el <b>PIN de 6 dígitos</b> de esta área. Solo quien lo cree lo sabrá y lo usará cada vez que entre.</div>
      ${msg?`<div class="qm-login-msg">${msg}</div>`:""}
      <label>Tu nuevo PIN<input id="qm-n1" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required class="qm-pin" placeholder="••••••"></label>
      <label>Repítelo<input id="qm-n2" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required class="qm-pin" placeholder="••••••"></label>
      <button class="primary" type="submit" id="qm-guardar-pin">Guardar mi PIN</button></form>`;
    ["qm-n1","qm-n2"].forEach(id=>{const i=document.getElementById(id);i.oninput=()=>{i.value=i.value.replace(/\D/g,"").slice(0,6)}});
    setTimeout(()=>document.getElementById("qm-n1").focus(),0);
    document.getElementById("qm-pin-f").onsubmit=async e=>{e.preventDefault();
      const a=document.getElementById("qm-n1").value,b=document.getElementById("qm-n2").value;
      if(!/^\d{6}$/.test(a))return crearPin(s,"El PIN debe tener exactamente 6 números.");
      if(a!==b)return crearPin(s,"Los dos PIN no coinciden. Escríbelos otra vez.");
      if(/^(\d)\1{5}$/.test(a)||"0123456789".includes(a)||"9876543210".includes(a))return crearPin(s,"Ese PIN es muy fácil de adivinar. Elige otro.");
      const btn=document.getElementById("qm-guardar-pin");btn.disabled=true;btn.textContent="Guardando…";
      const {data,error}=await sb.auth.updateUser({password:a,data:{pin_listo:true}});
      if(error)return crearPin(s,"No se pudo guardar el PIN ("+(error.message||"error")+"). Intenta con otro.");
      const nueva=(await sb.auth.getSession()).data.session||s;
      if(nueva&&nueva.user)nueva.user.user_metadata={...(nueva.user.user_metadata||{}),pin_listo:true};
      entro(nueva)};
  }
  function botonSalir(s){
    const nav=document.querySelector("nav.tabs");if(!nav||document.getElementById("qm-salir"))return;
    const b=document.createElement("button");b.id="qm-salir";b.type="button";b.textContent=(window.__qmNombre?window.__qmNombre+" · ":"")+"Salir";b.title=(s&&s.user&&s.user.email)||"";
    b.onclick=async()=>{await sb.auth.signOut();location.reload()};nav.appendChild(b);
  }
  const st=document.createElement("style");
  st.textContent=`#qm-login{position:fixed;inset:0;z-index:50;background:var(--bg);display:grid;place-items:center;padding:16px}
  #qm-login form{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:24px;display:grid;gap:12px;width:min(360px,100%)}
  #qm-login label{display:grid;gap:4px;font-size:13px;color:var(--muted)}
  .qm-pin{font-size:28px;letter-spacing:.5em;text-align:center}
  .qm-q{text-align:center;font-weight:700;font-size:18px}
  .qm-quien{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .qm-u{display:grid;gap:2px;padding:16px 8px;font-size:18px;justify-items:center}
  .qm-u small{font-size:12px;color:var(--muted);font-weight:500}
  .qm-otro{border:0;background:none;color:var(--muted);font-size:13px;text-decoration:underline}
  .qm-login-msg{background:var(--bad-soft);color:var(--bad);border-radius:8px;padding:8px 10px;font-size:14px}`;
  document.head.appendChild(st);

  function iniciar(){
    if(!configurado){pantallaLogin("Falta configurar la conexión: abre el archivo <b>config.js</b> y pega la dirección y la clave pública de Supabase.");return}
    if(!sb){pantallaLogin("No se pudo cargar la conexión con Supabase. Revisa tu internet y recarga la página.");return}
    sb.auth.getSession().then(({data})=>{if(data.session)entro(data.session);else pantallaLogin("")});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",iniciar);else iniciar();

  /* ---------- base de datos ---------- */
  const cache=new Map(),docL=new Map(),colL=new Set();let cargado=false,rt=null;
  const colDe=p=>p.split("/")[0];
  const err=e=>({code:(e&&(e.code==="42501"||/row-level security|permission/i.test(e.message||"")))?"invalid_argument":"unavailable",message:(e&&e.message)||"error"});
  function snap(p){const v=cache.get(p);return {id:p.split("/").pop(),exists:v!==undefined,data:()=>v===undefined?undefined:JSON.parse(JSON.stringify(v)),metadata:{fromCache:!cargado,hasPendingWrites:false}}}
  function avisar(p){if(p==null){docL.forEach(fs=>fs.forEach(f=>f()));colL.forEach(l=>l.fire());return}(docL.get(p)||[]).forEach(f=>f());colL.forEach(l=>{if(p.startsWith(l.col+"/"))l.fire()})}
  async function cargarTodo(){
    const filas=[];for(let desde=0;;desde+=1000){const {data,error}=await sb.from("qm_docs").select("path,data").not("col","like","apl%").range(desde,desde+999);if(error)throw err(error);filas.push(...data);if(data.length<1000)break}
    for(const k of [...cache.keys()])if(!k.startsWith("apl"))cache.delete(k);filas.forEach(r=>cache.set(r.path,r.data));cargado=true;avisar(null);
  }
  function enVivo(){
    if(rt)return;
    rt=sb.channel("qm_docs").on("postgres_changes",{event:"*",schema:"public",table:"qm_docs"},m=>{
      if(m.eventType==="DELETE"){const p=m.old&&m.old.path;if(p){cache.delete(p);avisar(p)}}
      else if(m.new&&m.new.path){if(m.new.path.startsWith("apl")&&!cache.has(m.new.path))return;cache.set(m.new.path,m.new.data);avisar(m.new.path)}}).subscribe();
    setInterval(()=>{if(document.visibilityState==="visible")cargarTodo().catch(()=>{})},60000); // respaldo por si se cae la conexión en vivo
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")cargarTodo().catch(()=>{})});
  }
  const db={
    doc(path){return {path,id:path.split("/").pop(),
      async get(){const {data,error}=await sb.from("qm_docs").select("data").eq("path",path).maybeSingle();if(error)throw err(error);if(data)cache.set(path,data.data);else cache.delete(path);return snap(path)},
      async set(d){const {error}=await sb.from("qm_docs").upsert({path,col:colDe(path),data:d,updated_at:new Date().toISOString()});if(error)throw err(error);cache.set(path,JSON.parse(JSON.stringify(d)));avisar(path)},
      async update(d){const {error}=await sb.rpc("qm_merge",{p_path:path,p_patch:d});if(error)throw err(error);cache.set(path,{...(cache.get(path)||{}),...JSON.parse(JSON.stringify(d))});avisar(path)},
      async delete(){const {error}=await sb.from("qm_docs").delete().eq("path",path);if(error)throw err(error);cache.delete(path);avisar(path)},
      async acquire(){return {acquired:true}},
      onSnapshot(next){const f=()=>next(snap(path));if(!docL.has(path))docL.set(path,[]);docL.get(path).push(f);if(cargado)setTimeout(f,0);return()=>{const a=docL.get(path)||[];const i=a.indexOf(f);if(i>=0)a.splice(i,1)}}}},
    collection(c){let ord=null,lim=5000;const q={
      orderBy(field,dir){ord={field,dir:dir||"asc"};return q},limit(n){lim=n;return q},
      onSnapshot(next){const l={col:c,fire(){let docs=[...cache.keys()].filter(k=>k.startsWith(c+"/")&&k.split("/").length===2).map(snap);
          if(ord)docs.sort((a,b)=>{const x=(a.data()||{})[ord.field]??"",y=(b.data()||{})[ord.field]??"";return (x<y?-1:x>y?1:0)*(ord.dir==="desc"?-1:1)});
          docs=docs.slice(0,lim);next({docs,size:docs.length,empty:!docs.length,metadata:{fromCache:!cargado,hasPendingWrites:false},docChanges:()=>[]})}};
        colL.add(l);if(cargado)setTimeout(()=>l.fire(),0);return()=>colL.delete(l)}};return q},
    async nextFolio(serie){const {data,error}=await sb.rpc("qm_next_folio",{p_serie:serie});if(error)throw err(error);return data}
  };
  /* La primera vez que Gerencia entra con la base vacía, elige en su computadora el archivo
     datos-iniciales.json (cotizaciones, catálogos, márgenes). Así esos datos nunca se publican en internet. */
  async function cargaInicial(){
    if(cache.has("cfg/folios"))return;
    const {data:esAdmin}=await sb.rpc("qm_is_admin");
    if(!esAdmin){aviso("La base de datos está vacía. Gerencia debe entrar primero para cargar los datos.");return}
    const filas=await elegirArchivo();
    if(!filas)return;
    aviso("Cargando "+filas.length+" registros…");
    for(let i=0;i<filas.length;i+=25){const {error}=await sb.from("qm_docs").upsert(filas.slice(i,i+25).map(f=>({path:f.path,col:f.col,data:f.data,updated_at:new Date().toISOString()})));if(error){aviso("Error al cargar datos: "+error.message);return}}
    await cargarTodo();aviso("Listo: se cargaron "+filas.length+" registros.",true);
  }
  function elegirArchivo(){return new Promise(res=>{
    let ov=document.createElement("div");ov.id="qm-login";document.body.appendChild(ov);
    ov.innerHTML=`<form id="qm-carga"><img src="logo.png" alt="Quarta Marchia" style="height:46px;align-self:center">
      <div class="qm-q">Cargar datos iniciales</div>
      <div class="hint" style="text-align:center">Es la primera vez que se usa esta base. Elige el archivo <b>datos-iniciales.json</b> de la carpeta <b>APP COTIZACIONES QM</b> en tu computadora.</div>
      <div id="qm-carga-msg"></div>
      <label class="primary" style="display:block;text-align:center;padding:12px;border-radius:8px;background:var(--brand);color:var(--brand-ink);font-weight:700;cursor:pointer">Elegir archivo…<input id="qm-file" type="file" accept=".json,application/json" style="display:none"></label>
      <button type="button" class="qm-otro" id="qm-omitir">Empezar sin datos anteriores</button></form>`;
    document.getElementById("qm-omitir").onclick=async()=>{await sb.from("qm_docs").upsert({path:"cfg/folios",col:"cfg",data:{C:0,P:0}});ov.remove();res(null)};
    document.getElementById("qm-file").onchange=async e=>{const f=e.target.files[0];if(!f)return;
      try{const filas=JSON.parse(await f.text());if(!Array.isArray(filas)||!filas.some(x=>x&&x.path==="cfg/folios"))throw 0;ov.remove();res(filas)}
      catch(_){document.getElementById("qm-carga-msg").innerHTML='<div class="qm-login-msg">Ese no es el archivo correcto. Busca datos-iniciales.json.</div>'}};
  })}
  function aviso(t,cerrar){let a=document.getElementById("qm-aviso");if(!a){a=document.createElement("div");a.id="qm-aviso";a.style.cssText="position:fixed;left:50%;transform:translateX(-50%);top:12px;z-index:60;background:#0c769e;color:#fff;padding:10px 16px;border-radius:10px;font-weight:600;max-width:90%";document.body.appendChild(a)}a.textContent=t;if(cerrar)setTimeout(()=>a.remove(),5000)}
  const user={can:async()=>true,isOwner:async()=>{const {data}=await sb.rpc("qm_is_admin");return !!data},canEdit:async()=>true};
  const downloads={save:async({filename,data})=>{const blob=data instanceof Blob?data:new Blob([data]);const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}};
  window.claude={use:async n=>{await sesionLista;
    if(n==="db"){if(!cargado){try{await cargarTodo();await cargaInicial()}catch(e){console.error(e)}}enVivo();return db}
    if(n==="user")return user;if(n==="downloads")return downloads;return null}};
})();
