// ===============================
//  丸ノーツ版 FNF（1ファイル完全版）
// ===============================

// -------------------------------
//  グローバル変数
// -------------------------------
let canvas, ctx;
let notes = [];
let songPos = 0; // 曲の再生時間(ms)
let lastTime = 0;

let score = 0;
let combo = 0;
let health = 1.0;

const scrollSpeed = 0.45;
const downscroll = false;

// -------------------------------
//  ノーツクラス（Note.hx 移植）
// -------------------------------
class Note {
    constructor({ strumTime, direction, mustPress, isSustain = false }) {
        this.strumTime = strumTime;
        this.direction = direction;
        this.mustPress = mustPress;
        this.isSustain = isSustain;

        this.x = 100 + direction * 80; // 簡易ストラム位置
        this.y = 0;

        this.radius = 22;
        this.color = this.getColor(direction);

        this.hit = false;
        this.missed = false;
        this.canBeHit = false;
        this.tooLate = false;
    }

    getColor(dir) {
        switch (dir) {
            case 0: return "#a64cff"; // 紫
            case 1: return "#4cff4c"; // 緑
            case 2: return "#4c4cff"; // 青
            case 3: return "#ff4c4c"; // 赤
        }
    }

    update(songPos) {
        const diff = this.strumTime - songPos;
        const baseY = diff * scrollSpeed;

        this.y = downscroll ? -baseY : baseY;

        const absDiff = Math.abs(diff);
        this.canBeHit = absDiff <= 180 && !this.hit && !this.missed;
        this.tooLate = diff < -180 && !this.hit && !this.missed;
    }

    draw(ctx) {
        if (this.hit || this.missed) return;

        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// -------------------------------
//  判定処理（Psych Engine と同じ）
// -------------------------------
const JudgementWindows = {
    sick: 45,
    good: 90,
    bad: 135,
    shit: 180
};

function getJudgement(note, songPos) {
    const diff = Math.abs(note.strumTime - songPos);

    if (diff <= JudgementWindows.sick) return "sick";
    if (diff <= JudgementWindows.good) return "good";
    if (diff <= JudgementWindows.bad)  return "bad";
    if (diff <= JudgementWindows.shit) return "shit";

    return null;
}

// -------------------------------
//  ノーツヒット処理
// -------------------------------
function goodNoteHit(note) {
    const judgement = getJudgement(note, songPos);
    if (!judgement) return;

    note.hit = true;

    switch (judgement) {
        case "sick": score += 350; combo++; health += 0.02; break;
        case "good": score += 200; combo++; health += 0.01; break;
        case "bad":  score += 50;  combo--; health -= 0.02; break;
        case "shit": combo = 0;    health -= 0.05; break;
    }

    console.log("HIT:", judgement);
}

function opponentNoteHit(note) {
    note.hit = true;
    health -= 0.01;
}

function noteMiss(note) {
    note.missed = true;
    combo = 0;
    health -= 0.1;
    console.log("MISS");
}

// -------------------------------
//  ノーツ更新ループ
// -------------------------------
function updateNotes() {
    for (const note of notes) {
        note.update(songPos);

        if (note.mustPress && note.tooLate && !note.hit && !note.missed) {
            noteMiss(note);
        }

        if (!note.mustPress && !note.hit && songPos >= note.strumTime) {
            opponentNoteHit(note);
        }
    }
}

// -------------------------------
//  描画
// -------------------------------
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const note of notes) {
        note.draw(ctx);
    }

    ctx.fillStyle = "#fff";
    ctx.fillText("Score: " + score, 10, 20);
    ctx.fillText("Combo: " + combo, 10, 40);
    ctx.fillText("Health: " + health.toFixed(2), 10, 60);
}

// -------------------------------
//  キー入力（方向キー）
// -------------------------------
window.addEventListener("keydown", (e) => {
    const keyMap = {
        ArrowLeft: 0,
        ArrowDown: 1,
        ArrowUp: 2,
        ArrowRight: 3
    };

    if (!(e.key in keyMap)) return;

    const dir = keyMap[e.key];

    const candidates = notes.filter(n =>
        n.mustPress &&
        !n.hit &&
        !n.missed &&
        n.direction === dir &&
        n.canBeHit
    );

    if (candidates.length === 0) return;

    let best = candidates[0];
    let bestDiff = Math.abs(best.strumTime - songPos);

    for (const n of candidates) {
        const diff = Math.abs(n.strumTime - songPos);
        if (diff < bestDiff) {
            best = n;
            bestDiff = diff;
        }
    }

    goodNoteHit(best);
});

// -------------------------------
//  メインループ
// -------------------------------
function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    songPos += delta;

    updateNotes();
    draw();

    requestAnimationFrame(loop);
}

// -------------------------------
//  初期化
// -------------------------------
function startGame() {
    canvas = document.getElementById("game");
    ctx = canvas.getContext("2d");
    ctx.font = "20px Arial";

    // テスト用ノーツ
    notes.push(new Note({ strumTime: 1000, direction: 0, mustPress: true }));
    notes.push(new Note({ strumTime: 1500, direction: 1, mustPress: true }));
    notes.push(new Note({ strumTime: 2000, direction: 2, mustPress: true }));
    notes.push(new Note({ strumTime: 2500, direction: 3, mustPress: true }));

    requestAnimationFrame(loop);
}

window.onload = startGame;
