/* 
  Client loader (works only on https://wafid.com/book-appointment/)
  - Loads a script from a given GitHub/raw URL
  - Starts a 60-second free trial on first run for that machine
  - Binds trial/license to a simple fingerprint stored in localStorage
  - After trial expiry shows payment link
  - NOTE: This is client-side only; for robust protection you MUST use server-side license issuance/verification
*/

(async function(){
  const ALLOWED_ORIGIN = "https://wafid.com/book-appointment/";
  if(location.href !== ALLOWED_ORIGIN){
    console.warn("Loader blocked: run on " + ALLOWED_ORIGIN);
    return;
  }

  // --- CONFIG ---
  const REMOTE_SCRIPT_URL = "https://raw.githubusercontent.com/youruser/yourrepo/main/your-script.js";
  // Show this payment link to user on expiry (you gave a hex-like id; replace with real gateway URL)
  const PAYMENT_LINK = "https://your-payments-gateway.example/pay?ref=de6447d333c8ab484770eff186a73500"; 

  const TRIAL_SECONDS = 60; // 1 minute free trial

  // --- HELPERS ---
  function toHex(str){
    return Array.from(new TextEncoder().encode(str)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function sha256hex(message){
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
  }

  // create a modest fingerprint (not super-robust, but avoids trivial cookie-only repeat)
  async function getFingerprint(){
    const parts = [
      navigator.userAgent || '',
      navigator.language || '',
      screen.width + 'x' + screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      location.hostname || ''
    ].join('||');
    const h = await sha256hex(parts);
    return h;
  }

  // localStorage keys
  const fp = await getFingerprint();
  const KEY_TRIAL = `__sim_trial_${fp}`;
  const KEY_LOCKED = `__sim_locked_${fp}`;
  const KEY_LICENSE = `__sim_license_${fp}`; // if server issues license token, store here

  // check lock
  if(localStorage.getItem(KEY_LOCKED)){
    showBlocked();
    return;
  }

  // If license token exists, you would verify it (prefer server signature verification).
  // For demo: assume license token means allowed
  const license = localStorage.getItem(KEY_LICENSE);
  if(license){
    // optionally, verify license signature by calling your license verification endpoint:
    // fetch('/api/verify-license', {method:'POST', body: JSON.stringify({token: license})})
    loadRemoteScriptAndRun();
    return;
  }

  // If trial used already -> block
  const trialInfoRaw = localStorage.getItem(KEY_TRIAL);
  if(trialInfoRaw){
    const trial = JSON.parse(trialInfoRaw);
    if(trial.used){
      showBlocked();
      return;
    } else {
      // trial started but may be still running
      const now = Date.now();
      const elapsed = Math.floor((now - trial.start)/1000);
      if(elapsed >= TRIAL_SECONDS){
        // trial expired
        trial.used = true;
        localStorage.setItem(KEY_TRIAL, JSON.stringify(trial));
        showBlocked();
        return;
      } else {
        // resume remaining trial
        const remaining = TRIAL_SECONDS - elapsed;
        startTrialRun(remaining);
        return;
      }
    }
  }

  // No trial info - start a new trial
  const newTrial = { start: Date.now(), used: false };
  localStorage.setItem(KEY_TRIAL, JSON.stringify(newTrial));
  startTrialRun(TRIAL_SECONDS);

  // ---- functions ----

  function showBlocked(){
    const existing = document.getElementById("__loader_blocked_box");
    if(existing) existing.style.display = 'block';
    else {
      const box = document.createElement('div');
      box.id = "__loader_blocked_box";
      box.style.cssText = "position:fixed;right:18px;top:18px;background:#111;padding:14px;border-radius:8px;color:#fff;z-index:999999;";
      box.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px;">Simulation expired / Locked</div>
        <div style="font-size:13px;margin-bottom:8px;">This trial has ended on this device.</div>
        <a href="${PAYMENT_LINK}" target="_blank" style="display:inline-block;padding:8px 10px;background:#00a3cc;color:white;border-radius:6px;text-decoration:none;">Activate (Pay USDT-TRC20)</a>
        <div style="font-size:11px;margin-top:8px;color:#ccc">After payment, you'll receive a license token to paste here.</div>
        <div style="margin-top:8px;">
          <input id="__lic_inp" placeholder="Paste license token after payment" style="width:260px;padding:6px;border-radius:4px;border:1px solid #333;background:#08121a;color:#fff;">
          <button id="__lic_btn" style="padding:6px 8px;margin-left:6px;">Activate</button>
        </div>
      `;
      document.body.appendChild(box);
      document.getElementById('__lic_btn').addEventListener('click', async ()=>{
        const t = document.getElementById('__lic_inp').value.trim();
        if(!t) return alert('Paste license token here');
        // Here: call server to validate the token for this fingerprint.
        // For demo we assume any non-empty token activates.
        // Real implementation: POST to /api/activate with { token, fingerprint } -> server verifies payment & signs token
        localStorage.setItem(KEY_LICENSE, t);
        alert('Activated locally. Reloading page to apply.');
        location.reload();
      });
    }
  }

  async function startTrialRun(seconds){
    // load remote script immediately
    await loadRemoteScriptAndRun();

    // show small floating trial-info UI
    const id = "__loader_trial_box";
    const existing = document.getElementById(id);
    if(existing) existing.remove();
    const box = document.createElement('div');
    box.id = id;
    box.style.cssText = "position:fixed;right:18px;bottom:18px;background:#021a24;padding:10px;border-radius:8px;color:#cfeef1;z-index:999999;";
    box.innerHTML = `<div style="font-weight:700">Free trial active</div><div id="__trial_remain" style="font-size:13px;margin-top:6px;"></div>`;
    document.body.appendChild(box);

    const trial = JSON.parse(localStorage.getItem(KEY_TRIAL) || '{}');
    if(!trial.start) {
      trial.start = Date.now();
      trial.used = false;
      localStorage.setItem(KEY_TRIAL, JSON.stringify(trial));
    }

    // update countdown visually but do NOT show precise seconds to user? you said no timer visible,
    // but showing small remaining seconds is useful. If you want to hide, remove this update.
    const tick = setInterval(()=>{
      const now = Date.now();
      const elapsed = Math.floor((now - trial.start)/1000);
      const rem = Math.max(0, seconds - elapsed);
      document.getElementById('__trial_remain').innerText = `Approx remaining: ${rem}s`;
      if(rem <= 0){
        clearInterval(tick);
        // mark used
        trial.used = true;
        localStorage.setItem(KEY_TRIAL, JSON.stringify(trial));
        // cleanup UI and show blocked
        box.remove();
        showBlocked();
      }
    }, 800);
  }

  async function loadRemoteScriptAndRun(){
    // load remote JS via fetch then eval (or insert script tag)
    // Note: network call is visible in devtools; cannot hide
    try {
      const res = await fetch(REMOTE_SCRIPT_URL, {cache: "no-cache"});
      if(!res.ok) throw new Error("Failed to load remote script");
      const code = await res.text();

      // Option A: eval in an isolated function scope
      (new Function(code))();

      // Option B: you could insert a <script> tag; left out for clarity
      return true;
    } catch (err){
      console.error("Loader error:", err);
      alert("Could not load remote script. Please check the loader configuration.");
      return false;
    }
  }

})();
