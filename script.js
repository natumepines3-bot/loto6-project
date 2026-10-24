// ===== 初期設定(settings.json が読めないときは、この値を使います) =====
var settings = {
  title: "ロト6 組み合わせ表",
  subtitle: "",
  minCandidates: 8,
  maxCandidates: 10,
  ballColors: ["#e03131", "#e8590c", "#2f9e44", "#1c7ed6", "#7048e8"]
};

var $ = function (id) { return document.getElementById(id); };
var chosen = [], picked = {};

// 数字ごとの色: 1〜9=1番目、10〜19=2番目、20〜29=3番目、30〜39=4番目、40〜43=5番目
function colorOf(n) { return settings.ballColors[Math.floor(n / 10)]; }
function pad(n) { return n < 10 ? "0" + n : "" + n; }

function start() {
  document.title = settings.title;
  $("title").textContent = settings.title;
  if (settings.subtitle) $("subtitle").textContent = settings.subtitle;
  $("max").textContent = settings.maxCandidates;

  var grid = $("grid");
  for (var i = 1; i <= 43; i++) {
    var b = document.createElement("button");
    b.type = "button"; b.textContent = i; b.dataset.v = i;
    b.style.setProperty("--ball", colorOf(i));
    b.setAttribute("aria-pressed", "false");
    grid.appendChild(b);
  }
  grid.addEventListener("click", function (e) {
    var t = e.target.closest("button"); if (!t) return;
    var v = +t.dataset.v, k = chosen.indexOf(v);
    if (k >= 0) chosen.splice(k, 1);
    else if (chosen.length < settings.maxCandidates) chosen.push(v);
    chosen.sort(function (a, b) { return a - b; });
    picked = {}; render();
  });
  $("clear").onclick = function () { chosen = []; picked = {}; render(); };
  $("unpick").onclick = function () { picked = {}; render(); };
  $("list").addEventListener("change", function (e) {
    var k = e.target.dataset.k; if (!k) return;
    if (e.target.checked) picked[k] = 1; else delete picked[k];
    e.target.closest("li").className = e.target.checked ? "sel" : "";
    renderPicks();
  });
  $("copy").onclick = copyPicks;
  render();
}

// 6個ずつの組み合わせをすべて作る(再帰)
function make(arr, k) {
  var out = [], cur = [];
  (function go(s) {
    if (cur.length === k) { out.push(cur.slice()); return; }
    for (var i = s; i < arr.length; i++) { cur.push(arr[i]); go(i + 1); cur.pop(); }
  })(0);
  return out;
}

function chips(c) {
  return '<span class="nums">' + c.map(function (n) {
    return '<span style="background:' + colorOf(n) + '">' + pad(n) + "</span>";
  }).join("") + "</span>";
}

function render() {
  var btns = $("grid").children;
  for (var i = 0; i < btns.length; i++) {
    var v = +btns[i].dataset.v, on = chosen.indexOf(v) >= 0;
    btns[i].setAttribute("aria-pressed", on);
    btns[i].disabled = !on && chosen.length >= settings.maxCandidates;
  }
  $("n").textContent = chosen.length;
  var list = $("list"); list.innerHTML = "";
  if (chosen.length < settings.minCandidates) {
    $("total").textContent = 0; $("msg").hidden = false;
    $("msg").textContent = "あと" + (settings.minCandidates - chosen.length) + "個えらぶと、一覧が出ます。";
  } else {
    var combos = make(chosen, 6);
    $("total").textContent = combos.length; $("msg").hidden = true;
    combos.forEach(function (c) {
      var key = c.join("-"), li = document.createElement("li");
      if (picked[key]) li.className = "sel";
      li.innerHTML = '<label><input type="checkbox"' + (picked[key] ? " checked" : "") +
        ' data-k="' + key + '">' + chips(c) + "</label>";
      list.appendChild(li);
    });
  }
  renderPicks();
}

function renderPicks() {
  var keys = Object.keys(picked).sort();
  $("picked").textContent = keys.length;
  $("pickedMsg").hidden = keys.length > 0;
  $("picks").innerHTML = keys.map(function (k) {
    return "<li><label>" + chips(k.split("-").map(Number)) + "</label></li>";
  }).join("");
  $("copied").textContent = "";
}

function copyPicks() {
  var keys = Object.keys(picked).sort();
  if (!keys.length) { $("copied").textContent = "コピーする組み合わせがありません。一覧でチェックを入れてください。"; return; }
  var text = keys.map(function (k) {
    return k.split("-").map(function (n) { return pad(+n); }).join(" ");
  }).join("\n");
  var ok = function () { $("copied").textContent = keys.length + "口分をコピーしました。"; };
  var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); ok(); } catch (e) { $("copied").textContent = "コピーできませんでした。"; }
  document.body.removeChild(ta);
}

// settings.json を読み込んでから開始(読めなくても初期設定で動きます)
fetch("settings.json")
  .then(function (r) { return r.json(); })
  .then(function (s) { for (var k in s) settings[k] = s[k]; })
  .catch(function () {})
  .then(start);
