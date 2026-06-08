/* ============================================================
   RentSafe — 렌터카 거래이력 (심플 버전)
   * 기능: 등록 + 조회 (+ 목록)
   * 순수 JS + localStorage(mock). Firebase 없음.
   * 매칭: 이름+생년월일(핵심·필수) / 면허·휴대폰(보조, 동명이인 구분)
   ============================================================ */

const STORE_KEY = "rentsafe_simple_v3";

const RISK_TYPES = {
  unpaid:        "대여료 장기 미납",
  not_returned:  "차량 미반납",
  accident:      "사고비용 미정산",
  unauthorized:  "무단 제3자 운행",
  disposal:      "차량 임의처분/담보 의심",
};

/* ---------- store ---------- */
function nowISO(){ return new Date().toISOString(); }
function fmtDate(iso){ if(!iso) return "-"; const d=new Date(iso); return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`; }
function uid(){ return "RK-"+Math.random().toString(36).slice(2,8).toUpperCase(); }
function mask(n){ if(!n) return ""; if(n.length<=1) return n; if(n.length===2) return n[0]+"○"; return n[0]+"○".repeat(n.length-2)+n.slice(-1); }
function cleanBirth(b){ return (b||"").replace(/\D/g,"").slice(0,6); }       // 숫자 6자리만
function fmtBirth(b){ const d=cleanBirth(b); return d.length===6 ? `${d.slice(0,2)}.${d.slice(2,4)}.${d.slice(4,6)}` : (b||"-"); }
function maskPhone(p){ if(!p) return "-"; const d=p.replace(/\D/g,""); return d.length>=10 ? d.slice(0,3)+"-****-"+d.slice(-4) : p; }
function copyText(t){ navigator.clipboard?.writeText(t); toast("복사되었습니다","safe"); }

/* 자동 하이픈 */
function hyphenPhone(el){
  let v=el.value.replace(/\D/g,"").slice(0,11);
  el.value = v.length<4 ? v : v.length<8 ? v.slice(0,3)+"-"+v.slice(3) : v.slice(0,3)+"-"+v.slice(3,7)+"-"+v.slice(7);
}
function hyphenLicense(el){   // 11-22-334455-66 (2-2-6-2)
  let v=el.value.replace(/\D/g,"").slice(0,12), o=v;
  if(v.length>2)  o=v.slice(0,2)+"-"+v.slice(2);
  if(v.length>4)  o=v.slice(0,2)+"-"+v.slice(2,4)+"-"+v.slice(4);
  if(v.length>10) o=v.slice(0,2)+"-"+v.slice(2,4)+"-"+v.slice(4,10)+"-"+v.slice(10);
  el.value=o;
}

const SEED = () => ([
  { id:"RK-A1B2C3", name:"홍길동", birth:"900715", type:"unpaid",       license:"31-44-667788-99", phone:"010-5555-1212", company:"스피드렌터카", reason:"대여료 4개월 연속 미납, 3차 통지 후 무응답.", createdAt:"2026-04-02T00:00:00Z", status:"active" },
  { id:"RK-D4E5F6", name:"홍길동", birth:"850228", type:"accident",     license:"41-55-778899-00", phone:"010-9090-3434", company:"하나모빌리티", reason:"단독사고 자기부담금 미정산, 연락 두절.",       createdAt:"2026-03-15T00:00:00Z", status:"active" },
  { id:"RK-G7H8I9", name:"최민재", birth:"920909", type:"not_returned", license:"51-66-889900-11", phone:"010-1212-3434", company:"국민카대여",   reason:"계약 만료 후 차량 미반납, 위치 추적 불가.",     createdAt:"2026-01-20T00:00:00Z", status:"active" },
]);

let DB = load();
function load(){ try{ const r=localStorage.getItem(STORE_KEY); if(r) return JSON.parse(r); }catch(e){} const d=SEED(); localStorage.setItem(STORE_KEY,JSON.stringify(d)); return d; }
function save(){ localStorage.setItem(STORE_KEY,JSON.stringify(DB)); }
function resetDB(){ DB=SEED(); save(); localStorage.removeItem(CONSENTS_KEY); }

/* 동의 store — 발송(가맹사) ↔ 손님 동의 연결 (같은 origin localStorage 공유) */
const CONSENTS_KEY="rentsafe_consents_v1";
function loadC(){ try{ return JSON.parse(localStorage.getItem(CONSENTS_KEY)||"[]"); }catch(e){ return []; } }
function saveC(a){ localStorage.setItem(CONSENTS_KEY, JSON.stringify(a)); }
/* 손님이 다른 탭에서 동의 완료하면 → 발송 현황 자동 갱신 */
window.addEventListener("storage", e=>{ if(e.key===CONSENTS_KEY && TAB==="send") render(); });

/* ---------- matching ----------
   핵심: 이름+생년월일 완전일치(필수)
   보조: 면허/휴대폰도 입력 시 독립적으로 함께 매칭(회피 방지)
         → 이름·생년월일이 달라도 면허/폰이 같으면 함께 잡힘
         → 동명이인(이름+생년월일 2건 이상)은 보조 식별자로 특정
*/
function matchRisk(q){
  const name=(q.name||"").trim(), qb=cleanBirth(q.birth);
  const lic=(q.license||"").trim(), ph=(q.phone||"").trim();
  const active = DB.filter(r => r.status==="active");

  const core = active.filter(r => r.name===name && cleanBirth(r.birth)===qb);          // 핵심
  const aux  = (lic||ph) ? active.filter(r => (lic&&r.license===lic) || (ph&&r.phone===ph)) : []; // 보조

  const seen=new Set(), all=[];
  [...core, ...aux].forEach(r => { if(!seen.has(r.id)){ seen.add(r.id); all.push(r); } });

  if(all.length===0) return { kind:"none", records:[] };
  if(core.length>=2 && aux.length===0) return { kind:"ambiguous", records:core };       // 동명이인, 보조 필요
  if(core.length>=2 && aux.length>=1)  return { kind:"hit", records:aux };               // 보조로 특정
  return { kind:"hit", records:all };
}

/* ---------- toast ---------- */
function toast(msg,kind){
  let h=document.querySelector(".toast-host"); if(!h){h=document.createElement("div");h.className="toast-host";document.body.appendChild(h);}
  const e=document.createElement("div"); e.className="toast"+(kind?" "+kind:""); e.textContent=msg; h.appendChild(e); setTimeout(()=>e.remove(),2600);
}

/* ---------- render ---------- */
let TAB = "send";
function setTab(t){ TAB=t; render(); }

function render(){
  const app=document.getElementById("app");
  app.innerHTML = `
    <div class="header"><div class="wrap">
      <div class="logo">R</div>
      <div><h1>RentSafe</h1><div class="sub">렌터카 안전거래 플랫폼 · 등록 / 조회</div></div>
    </div></div>
    <div class="container">
      <div class="tabs">
        <button class="tab ${TAB==="send"?"active":""}" onclick="setTab('send')">📨 동의요청</button>
        <button class="tab ${TAB==="query"?"active":""}" onclick="setTab('query')">⌕ 조회</button>
        <button class="tab ${TAB==="register"?"active":""}" onclick="setTab('register')">＋ 등록</button>
      </div>
      ${TAB==="send"?viewSend():TAB==="register"?viewRegister():viewQuery()}
    </div>`;
}

/* ---------- 조회 ---------- */
function viewQuery(){
  return `
  <div class="card">
    <div class="card-title">거래이력 조회</div>
    <div class="card-desc">신규 계약 전, 해당 고객의 거래이력 등록 여부만 확인합니다. 개인정보는 암호화 보관되며, 결과는 가린 상태로 ‘있음/없음’만 표시됩니다.</div>
    <form onsubmit="runQuery(event)">
      <div class="grid">
        <div class="field"><label>이름 <span class="req">*</span></label><input name="name" required placeholder="홍길동"></div>
        <div class="field"><label>생년월일 <span class="req">*</span></label><input name="birth" required inputmode="numeric" maxlength="6" placeholder="900715 (6자리)"></div>
        <div class="field"><label>운전면허번호</label><input name="license" oninput="hyphenLicense(this)" placeholder="11-22-334455-66"></div>
        <div class="field"><label>휴대폰번호</label><input name="phone" inputmode="numeric" oninput="hyphenPhone(this)" placeholder="010-0000-0000"></div>
      </div>
      <div class="actions"><button class="btn btn-primary btn-block" type="submit">⌕ 조회하기</button></div>
    </form>
    <div id="result"></div>
  </div>`;
}
function runQuery(e){
  e.preventDefault(); const f=e.target;
  const res=matchRisk({ name:f.name.value, birth:f.birth.value, license:f.license.value, phone:f.phone.value });
  let html;
  if(res.kind==="none"){
    html=`<div class="r-clean"><div class="ic">✓</div><div><h3>거래이력 없음</h3><p>입력한 정보와 일치하는 등록 내역이 없습니다.</p></div></div>`;
  }else if(res.kind==="ambiguous"){
    html=`<div class="r-amb"><div class="ic">⚠</div><div><h3>동일 이름·생년월일이 여러 건입니다</h3><p>정확한 확인을 위해 운전면허번호 또는 휴대폰번호를 추가 입력해 주세요. (오탐 방지를 위해 후보는 표시하지 않습니다.)</p></div></div>`;
  }else{
    const who=res.records[0];
    const lines=res.records.map(r=>`<div class="risk-row"><div><div class="type">${RISK_TYPES[r.type]}</div><div class="meta">등록일 ${fmtDate(r.createdAt)}</div></div><div class="sp"></div><span class="badge b-red"><span class="dot"></span>유효</span></div>`).join("");
    html=`<div class="r-hit"><div class="head"><div class="ic">!</div><div><h3>거래이력 있음 · ${res.records.length}건</h3><p>대상 <b>${mask(who.name)} · ${fmtBirth(who.birth)}</b> — 개인정보는 가린 상태로 존재 여부만 확인됩니다.</p></div></div>${lines}</div>`;
  }
  document.getElementById("result").innerHTML=`<div class="result">${html}</div>`;
}

/* ---------- 등록 ---------- */
function viewRegister(){
  const opts=Object.entries(RISK_TYPES).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");
  return `
  <div class="card">
    <div class="card-title">거래이력 등록</div>
    <div class="card-desc">중대한 계약위반(미납·미반납·사고비용 미정산 등)이 실제 발생한 경우에만 등록합니다.</div>
    <div class="demo-note">⚠ 데모 버전 — 실제 개인정보는 저장되지 않습니다. 입력값은 브라우저 localStorage의 mock 더미입니다.</div>
    <form onsubmit="addRisk(event)">
      <div class="grid">
        <div class="field"><label>이름 <span class="req">*</span></label><input name="name" required placeholder="홍길동"></div>
        <div class="field"><label>생년월일 <span class="req">*</span></label><input name="birth" required inputmode="numeric" maxlength="6" placeholder="900715 (6자리)"></div>
        <div class="field"><label>위험유형 <span class="req">*</span></label><select name="type" required>${opts}</select></div>
        <div class="field"><label>등록처(렌터카회사)</label><input name="company" placeholder="우리 회사명"></div>
        <div class="field"><label>운전면허번호</label><input name="license" oninput="hyphenLicense(this)" placeholder="11-22-334455-66"></div>
        <div class="field"><label>휴대폰번호</label><input name="phone" inputmode="numeric" oninput="hyphenPhone(this)" placeholder="010-0000-0000"></div>
        <div class="field full"><label>등록 사유 <span class="req">*</span></label><textarea name="reason" rows="3" required placeholder="계약위반 경위를 구체적으로 기재"></textarea></div>
      </div>
      <div class="actions"><button class="btn btn-primary btn-block" type="submit">＋ 등록하기</button></div>
    </form>
  </div>`;
}
function addRisk(e){
  e.preventDefault(); const f=e.target;
  DB.unshift({ id:uid(), name:f.name.value.trim(), birth:cleanBirth(f.birth.value), type:f.type.value, company:f.company.value.trim()||"미입력", license:f.license.value.trim(), phone:f.phone.value.trim(), reason:f.reason.value.trim(), createdAt:nowISO(), status:"active" });
  save(); toast("거래이력가 등록되었습니다.","safe"); e.target.reset();
}

/* ---------- 동의요청 (손님에게 발송) ---------- */
function viewConsentReq(){
  return `
  <div class="card">
    <div class="card-title">동의요청 보내기</div>
    <div class="card-desc">손님에게 거래안전 동의를 요청합니다. 손님은 <b>본인명의 휴대폰 인증</b> 후 동의합니다.</div>
    <form onsubmit="startConsent(event)">
      <div class="grid">
        <div class="field"><label>손님 이름 <span class="req">*</span></label><input name="name" required placeholder="홍길동"></div>
        <div class="field"><label>휴대폰번호 <span class="req">*</span></label><input name="phone" required inputmode="numeric" oninput="hyphenPhone(this)" placeholder="010-0000-0000"></div>
        <div class="field full"><label>렌터카회사명</label><input name="company" placeholder="우리 회사명"></div>
      </div>
      <div class="hint">실제로는 손님 휴대폰으로 동의요청 문자/알림톡이 발송됩니다. 데모에서는 ‘보내기’를 누르면 손님 화면이 바로 열립니다.</div>
      <div class="actions"><button class="btn btn-primary btn-block" type="submit">📨 동의요청 보내기 (손님 화면 열기)</button></div>
    </form>
  </div>`;
}

/* 손님 동의 화면 + 본인명의 폰 인증 (오버레이) */
let CST = null; // {name, phone, company, sent, step, agreed}
function startConsent(e){
  e.preventDefault(); const f=e.target;
  CST = { name:f.name.value.trim(), phone:f.phone.value.trim(), company:f.company.value.trim()||"렌터카회사", sent:false, agreed:false, step:1 };
  renderConsent();
}
function renderConsent(){
  let host=document.getElementById("consent-host");
  if(!host){ host=document.createElement("div"); host.id="consent-host"; document.body.appendChild(host); }
  host.innerHTML = CST ? consentSheet() : "";
}
function closeConsent(){ CST=null; renderConsent(); }
function consentSheet(){
  const bar=`<div class="cs-steps"><div class="s ${CST.step>=1?"on":""}"></div><div class="s ${CST.step>=2?"on":""}"></div><div class="s ${CST.step>=3?"on":""}"></div></div>`;
  let body;
  if(CST.step===1){
    body=`<div class="cs-step-label">STEP 1 · 본인확인</div>
      <div class="cs-title">본인명의 휴대폰 인증</div>
      <div class="cs-desc">동의 전, 본인 명의 휴대폰으로 본인확인을 진행합니다.</div>
      <div class="field"><label>휴대폰번호</label><input id="cst-phone" value="${CST.phone}" ${CST.sent?"disabled":""} inputmode="numeric" oninput="hyphenPhone(this)"></div>
      ${!CST.sent
        ? `<div class="actions"><button class="btn btn-primary btn-block" onclick="sendCode()">인증번호 발송</button></div>`
        : `<div class="field" style="margin-top:14px"><label>인증번호 6자리</label>
            <div class="auth-row"><input id="cst-code" inputmode="numeric" maxlength="6" placeholder="6자리 입력"><button class="btn btn-primary" onclick="verifyCode()">확인</button></div>
            <div class="hint">데모 인증번호: <b>123456</b> · 실제는 통신사/PASS 본인확인 API로 본인명의 여부까지 검증</div></div>`}`;
  } else if(CST.step===2){
    body=`<div class="auth-verified" style="margin-bottom:16px">✓ 본인확인 완료 · ${maskPhone(CST.phone)}</div>
      <div class="cs-step-label">STEP 2 · 거래안전 동의</div>
      <div class="cs-title">거래안전 동의 안내</div>
      <div class="notice">
        <div class="notice-i safe"><div class="n">1</div><div><b>정상 이용 시 등록되지 않습니다.</b> 정상 납부·반환 시 거래이력는 등록되지 않습니다.</div></div>
        <div class="notice-i"><div class="n">2</div><div><b>중대한 계약위반 시에만 등록됩니다.</b> 대여료 장기 미납·차량 미반납·사고비용 미정산 등.</div></div>
        <div class="notice-i"><div class="n">3</div><div><b>회원사가 제한 조회합니다.</b> 신규 계약·거래조건 판단 목적의 ‘있음/없음’ 확인만.</div></div>
        <div class="notice-i safe"><div class="n">4</div><div><b>해소 시 삭제·상태변경됩니다.</b></div></div>
      </div>
      <div class="statement">본 절차는 차량 임대차계약의 안전한 이행과 중대한 계약위반 피해 예방을 위한 확인입니다. 정상 이행 시 거래이력는 등록되지 않으며, 중대한 계약위반 발생 시에만 거래이력(RentSafe)로 등록되어 회원 자동차대여사업자가 제한적으로 조회할 수 있습니다. 문제 해소 시 삭제·상태변경됩니다. 본 동의는 차량 임대차계약 체결의 조건입니다.</div>
      <label class="cc ${CST.agreed?"on":""}" onclick="toggleAgree()"><input type="checkbox" ${CST.agreed?"checked":""} onclick="event.stopPropagation()"> 위 내용을 확인하였으며 거래이력 등록·조회에 동의합니다.</label>
      <button class="btn btn-safe btn-block" ${CST.agreed?"":"disabled"} onclick="finishConsent()">동의 완료</button>`;
  } else {
    body=`<div class="cs-done"><div class="big">✓</div><h2>동의가 완료되었습니다</h2>
      <p>${CST.company} 거래안전 동의가 정상 처리되었습니다.<br>본인확인 ${maskPhone(CST.phone)}</p></div>
      <button class="btn btn-block" onclick="closeConsent()">닫기</button>`;
  }
  return `<div class="consent-overlay"><div class="consent-sheet">
    <div class="cs-head"><button class="x" onclick="closeConsent()">×</button><div class="eyebrow">RENTSAFE · 거래안전 확인</div><h2>${CST.name} 님</h2><div class="co">${CST.company} 차량 임대차계약</div></div>
    <div class="cs-body">${bar}${body}</div></div></div>`;
}
function sendCode(){ const p=document.getElementById("cst-phone"); if(p) CST.phone=p.value.trim(); CST.sent=true; toast("인증번호를 발송했습니다 (데모: 123456)","safe"); renderConsent(); }
function verifyCode(){ const c=(document.getElementById("cst-code").value||"").replace(/\D/g,""); if(c.length<6){ toast("인증번호 6자리를 입력하세요","danger"); return; } CST.step=2; renderConsent(); }
function toggleAgree(){ CST.agreed=!CST.agreed; renderConsent(); }
function finishConsent(){ CST.step=3; renderConsent(); toast("동의가 완료되었습니다","safe"); }

/* ---------- API 연동 ---------- */
function viewApi(){
  return `
  <div class="card">
    <div class="card-title">API 연동</div>
    <div class="card-desc">렌터카회사 자체 시스템(계약 프로그램 등)에서 RentSafe를 직접 호출합니다. 모든 요청은 회사별 API 키로 인증되며, 응답에는 개인정보 원문이 포함되지 않습니다.</div>

    <div class="api-label">인증 — 회사별 API 키</div>
    <div class="api-key-box"><code>rsk_live_8f3a21d9c4b7e0</code><button class="btn btn-sm" onclick="copyText('rsk_live_8f3a21d9c4b7e0')">복사</button></div>
    <pre class="code"><span class="c">// 모든 요청 헤더</span>
Authorization: Bearer <span class="s">rsk_live_8f3a21d9c4b7e0</span></pre>

    <div class="api-label">① 조회 — 거래이력 있/없 확인</div>
    <div class="api-ep"><span class="method">POST</span><span class="api-url">/api/v1/check</span></div>
    <pre class="code"><span class="c">// 요청</span>
{ <span class="k">"name"</span>: <span class="s">"홍길동"</span>, <span class="k">"birth"</span>: <span class="s">"900715"</span>,
  <span class="k">"license"</span>: <span class="s">"31-44-667788-99"</span>, <span class="k">"phone"</span>: <span class="s">"010-5555-1212"</span> }

<span class="c">// 응답 (개인정보 원문 없음 · 있/없 + 유형만)</span>
{ <span class="k">"exists"</span>: <span class="s">true</span>, <span class="k">"count"</span>: <span class="s">1</span>,
  <span class="k">"records"</span>: [ { <span class="k">"type"</span>: <span class="s">"unpaid"</span>, <span class="k">"status"</span>: <span class="s">"active"</span>, <span class="k">"registered_at"</span>: <span class="s">"2026-04-02"</span> } ] }</pre>

    <div class="api-label">② 등록 — 거래이력 등록</div>
    <div class="api-ep"><span class="method">POST</span><span class="api-url">/api/v1/register</span></div>
    <pre class="code"><span class="c">// 요청</span>
{ <span class="k">"name"</span>: <span class="s">"홍길동"</span>, <span class="k">"birth"</span>: <span class="s">"880101"</span>, <span class="k">"type"</span>: <span class="s">"unpaid"</span>,
  <span class="k">"license"</span>: <span class="s">"11-22-334455-66"</span>, <span class="k">"reason"</span>: <span class="s">"대여료 3개월 미납"</span>,
  <span class="k">"consent_id"</span>: <span class="s">"CS-..."</span> <span class="c">// 손님 동의 건과 연계</span> }

<span class="c">// 응답</span>
{ <span class="k">"ok"</span>: <span class="s">true</span>, <span class="k">"id"</span>: <span class="s">"RK-9A2B7C"</span> }</pre>

    <div class="api-label">③ 동의요청 — 손님 본인인증+동의 링크 발급</div>
    <div class="api-ep"><span class="method">POST</span><span class="api-url">/api/v1/consent</span></div>
    <pre class="code"><span class="c">// 요청</span>
{ <span class="k">"name"</span>: <span class="s">"홍길동"</span>, <span class="k">"phone"</span>: <span class="s">"010-1234-5678"</span> }

<span class="c">// 응답 (이 링크로 손님이 본인명의 폰 인증 후 동의)</span>
{ <span class="k">"consent_id"</span>: <span class="s">"CS-7F3A21"</span>, <span class="k">"url"</span>: <span class="s">"https://rentsafe.kr/c/7F3A21"</span>,
  <span class="k">"status"</span>: <span class="s">"pending"</span> }</pre>

    <div class="api-label">조회 API 테스트 (실제 매칭 엔진으로 동작)</div>
    <form onsubmit="apiTest(event)">
      <div class="grid">
        <div class="field"><label>name</label><input name="name" placeholder="홍길동"></div>
        <div class="field"><label>birth</label><input name="birth" inputmode="numeric" maxlength="6" placeholder="900715"></div>
        <div class="field"><label>license</label><input name="license" oninput="hyphenLicense(this)" placeholder="선택"></div>
        <div class="field"><label>phone</label><input name="phone" inputmode="numeric" oninput="hyphenPhone(this)" placeholder="선택"></div>
      </div>
      <div class="actions"><button class="btn btn-primary" type="submit">POST /api/v1/check 호출</button></div>
    </form>
    <pre class="code" id="api-out"><span class="c">// 응답이 여기에 표시됩니다</span></pre>
  </div>`;
}
function apiTest(e){
  e.preventDefault(); const f=e.target;
  const res=matchRisk({ name:f.name.value, birth:f.birth.value, license:f.license.value, phone:f.phone.value });
  let out;
  if(res.kind==="none") out={ exists:false, count:0 };
  else if(res.kind==="ambiguous") out={ exists:true, ambiguous:true, message:"동명이인 다수 — license 또는 phone 추가 필요" };
  else out={ exists:true, count:res.records.length, records:res.records.map(r=>({ type:r.type, status:r.status, registered_at:r.createdAt.slice(0,10) })) };
  document.getElementById("api-out").textContent=JSON.stringify(out,null,2);
}

/* ---------- 동의요청 발송 (가맹사) ---------- */
function viewSend(){
  const cs = loadC().slice().reverse();
  const rows = cs.length ? cs.map(c=>`
    <div class="risk-row">
      <div>
        <div class="type">${mask(c.name)} · ${c.phone||"-"}</div>
        <div class="meta">${c.cid} · ${fmtDate(c.createdAt)}</div>
      </div>
      <div class="sp"></div>
      ${c.status==="completed"
        ? `<span class="badge b-green"><span class="dot"></span>동의완료</span>`
        : `<button class="btn btn-sm" onclick="openConsentLink('${c.cid}')">고객화면 ↗</button> <span class="badge b-amber"><span class="dot"></span>대기</span>`}
    </div>`).join("") : `<div class="empty" style="text-align:center;color:var(--ink3);padding:28px 0">발송 내역이 없습니다.</div>`;

  return `
  <div class="card">
    <div class="card-title">동의요청 보내기</div>
    <div class="card-desc">손님 이름·휴대폰을 입력하면 동의 링크가 생성됩니다. (실제로는 카카오 알림톡으로 발송)</div>
    <form onsubmit="sendConsent(event)">
      <div class="grid">
        <div class="field"><label>손님 이름 <span class="req">*</span></label><input name="name" required placeholder="홍길동"></div>
        <div class="field"><label>휴대폰 <span class="req">*</span></label><input name="phone" required inputmode="numeric" oninput="hyphenPhone(this)" placeholder="010-0000-0000"></div>
      </div>
      <div class="actions"><button class="btn btn-primary btn-block" type="submit">📨 동의요청 생성 · 발송</button></div>
    </form>
  </div>
  <div class="card">
    <div class="card-title">동의 현황 <span style="font-size:12px;font-weight:500;color:var(--ink3)">· 손님이 동의 완료하면 자동 반영</span></div>
    ${rows}
  </div>`;
}
function sendConsent(e){
  e.preventDefault(); const f=e.target;
  const cid="CS-"+Math.random().toString(36).slice(2,8).toUpperCase();
  const arr=loadC();
  arr.push({ cid, name:f.name.value.trim(), phone:f.phone.value.trim(), status:"pending", createdAt:nowISO(), verified:null, completedAt:null });
  saveC(arr);
  toast("동의요청이 생성되었습니다. ‘고객화면 ↗’으로 열어보세요.","safe");
  render();
}
function openConsentLink(cid){ window.open(`동의.html?cid=${cid}`, "_blank"); }

/* ---------- dev ---------- */
function devReset(){ if(confirm("데모 데이터를 초기화할까요?")){ resetDB(); toast("초기화되었습니다."); render(); } }

window.addEventListener("DOMContentLoaded", render);
