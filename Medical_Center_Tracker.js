(function(){

    if (location.href !== "https://wafid.com/book-appointment/") {
        console.warn("Blocked: Script only works on wafid appointment page.");
        return;
    }

    const centers = [
        "Bengal Medical Center",
        "Freedom Health Center",
        "Labcloud Chattogram",
        "Talukder Medical Center",
        "Urban Medical Center",
        "Actual Medical Network",
        "Faith Medical Centre",
        "Alabeer Medical Center",
        "Infinity Lab",
        "Royal Medical Center",
        "Irfan Medical Centre",
        "Sherpur Medical Point",
        "Tanjim Medical Center",
        "Zobeda Samad Center",
        "Mohsinia Diagnostic Center",
        "Akota Diagnostic Center"
    ];

    function genHex(n){
        let s=""; const c="abcdef0123456789";
        for(let i=0;i<n;i++) s+=c[Math.floor(Math.random()*c.length)];
        return s;
    }

    function genTok(n){
        const C="ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz";
        let t=""; for(let i=0;i<n;i++) t+=C[Math.floor(Math.random()*C.length)];
        return t;
    }

    function createPanel(){
        const div=document.createElement("div");
        div.id="___rotSim";
        div.style.cssText=`
            position:fixed; 
            top:20px; 
            right:20px; 
            width:430px; 
            padding:18px; 
            background:rgba(3,10,23,0.9); 
            color:#dff8ff; 
            border-radius:12px; 
            box-shadow:0 0 28px rgba(0,0,0,0.55);
            font-family:'Consolas', monospace; 
            z-index:99999999;
        `;
        document.body.appendChild(div);
        return div;
    }

    const panel = createPanel();

    function render(center){
        const session = genTok(30);
        const token = genTok(45);
        const hash = genHex(36);
        const load = Math.floor(Math.random()*100);
        const slot = `${Math.floor(Math.random()*12)+1}:${Math.floor(Math.random()*59)
            .toString().padStart(2,"0")} PM`;
        const latency = Math.floor(Math.random()*300)+80;

        panel.innerHTML = `
            <div style="font-size:17px;font-weight:700;margin-bottom:6px;">
                ${center}
            </div>

            <div style="font-size:13px;margin-bottom:12px;color:#8bd6e6;">
                Live Status Mirror · Passive DB Feed
            </div>

            <div style="font-size:13px;margin-bottom:10px;">
                Payment Required: <b style="color:#ffcb77">$10 USD</b>
            </div>

            <div style="font-size:13px;margin-bottom:6px;">
                Availability Load: <b>${load}%</b>
            </div>

            <div style="height:8px;background:#112a33;border-radius:5px;margin-bottom:10px;">
                <div style="height:8px;width:${load}%;background:#46c3c3;border-radius:5px;"></div>
            </div>

            <div style="font-size:13px;margin-bottom:6px;">
                Server Latency: <b>${latency} ms</b>
            </div>

            <div style="font-size:13px;margin-top:12px;">
                <div>session_key:</div>
                <div style="background:#021b29;padding:6px;border-radius:6px;font-size:12px;margin-bottom:8px;">
                    ${session}
                </div>

                <div>payment_token:</div>
                <div style="background:#021b29;padding:6px;border-radius:6px;font-size:12px;margin-bottom:8px;">
                    ${token}
                </div>

                <div>booking_hash:</div>
                <div style="background:#021b29;padding:6px;border-radius:6px;font-size:12px;">
                    ${hash}
                </div>
            </div>
        `;
    }

    function rotate(){
        const center = centers[Math.floor(Math.random()*centers.length)];
        render(center);

        const next = Math.floor(Math.random()*8000) + 5000;
        setTimeout(rotate, next);
    }

    rotate();

})();
