let type="number",mode="range";
let history=JSON.parse(localStorage.getItem("history"))||[];

const $=id=>document.getElementById(id);

const output=$("output");
const historyDiv=$("history");

function setType(t){
    type=t;
    $("numberMode").classList.toggle("hidden",t!=="number");
    $("nameMode").classList.toggle("hidden",t!=="name");
}

function setMode(m){
    mode=m;
    $("rangeMode").classList.toggle("hidden",m!=="range");
    $("listMode").classList.toggle("hidden",m!=="list");
}

function renderHistory(){
    historyDiv.innerHTML=history.join("<br>");
}
renderHistory();

/* THEME */
function setTheme(t){
    const root=document.documentElement;
    const themes={
        green:["#b9f5d6","#6ee64d","#111"],
        purple:["#d9c6ff","#7c4dff","#3f1dcb"],
        dark:["#111","#333","#000"]
    };
    let [bg1,bg2,primary]=themes[t];
    root.style.setProperty("--bg1",bg1);
    root.style.setProperty("--bg2",bg2);
    root.style.setProperty("--primary",primary);
    localStorage.setItem("theme",t);
}
setTheme(localStorage.getItem("theme")||"green");

/* POOL */
function getPool(){
    if(type==="number"){
        if(mode==="range"){
            let a=[];
            for(let i=+$("min").value;i<=+$("max").value;i++)
                if(!history.includes("🎉 "+i)) a.push(i);
            return a;
        }
        return $("list").value.split(",").map(x=>x.trim())
            .filter(x=>x&&!history.includes("🎉 "+x));
    }
    return $("nameList").value.split(",").map(x=>x.trim())
        .filter(x=>x&&!history.includes("👤 "+x));
}

/* FIREWORK */
function firework(){
    for(let i=0;i<30;i++){
        let f=document.createElement("div");
        f.className="firework";
        f.style.left="50%";
        f.style.top="50%";
        f.style.background=`hsl(${Math.random()*360},100%,50%)`;
        f.style.setProperty("--x",`${Math.random()*400-200}px`);
        f.style.setProperty("--y",`${Math.random()*400-200}px`);
        document.body.appendChild(f);
        setTimeout(()=>f.remove(),1000);
    }
}

/* SPIN */
function spin(){
    let pool=getPool();
    if(!pool.length) return alert("Hết!");
    let total=+$("time").value,start=performance.now();

    (function roll(){
        let p=(performance.now()-start)/total;
        if(p>1) p=1;
        output.innerText=pool[Math.floor(Math.random()*pool.length)];
        if(p<1) setTimeout(roll,30+200*p*p);
        else finalize(pool);
    })();
}

function normalize(v){
    return String(v).trim();
}

function finalize(pool){
    let final;
    let rigRaw = $("rigValue").value;
    let rig = normalize(rigRaw);

    if ($("rigMode").checked && rig) {

        // chuẩn hoá pool
        let normPool = pool.map(normalize);

        let idx = normPool.indexOf(rig);

        if (idx !== -1) {
            final = pool[idx]; // giữ nguyên giá trị gốc
        }
    }

    if (final === undefined) {
        final = pool[Math.floor(Math.random() * pool.length)];
    }

    let rec = (type === "number" ? "🎉 " : "👤 ") + final;
    output.innerText = final;
    history.push(rec);
    localStorage.setItem("history", JSON.stringify(history));
    renderHistory();
    firework();
}



function resetHistory(){
    if(confirm("Xóa lịch sử?")){
        history=[];
        localStorage.removeItem("history");
        renderHistory();
        output.innerText="--";
    }
}

/* EVENTS */
document.querySelectorAll(".theme").forEach(t=>{
    t.onclick=()=>setTheme(t.dataset.theme);
});

document.querySelectorAll("input[name=type]").forEach((r,i)=>{
    r.onchange=()=>setType(i===0?"number":"name");
});

document.querySelectorAll("input[name=mode]").forEach((r,i)=>{
    r.onchange=()=>setMode(i===0?"range":"list");
});

$("spinBtn").onclick=spin;
$("resetBtn").onclick=resetHistory;

document.addEventListener("keydown",e=>{
    if(e.ctrlKey&&e.altKey&&e.key==="r")
        $("rigPanel").classList.toggle("hidden");
});
