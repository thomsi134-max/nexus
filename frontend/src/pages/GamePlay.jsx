import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Trophy } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useSound } from "../context/SoundContext";
import { GAMES } from "./Arcade";

const TITLES = Object.fromEntries(GAMES.map(g => [g.id, g.name]));

export default function GamePlay() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playClick, playWin, playLose, playCoin } = useSound();
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const onGameOver = async (finalScore) => {
    setScore(finalScore);
    playLose();
    if (user && !submitted) {
      setSubmitted(true);
      try {
        const { data } = await api.post("/games/score", { game_id: gameId, score: finalScore });
        toast.success(`+${data.coins_earned} coins · +${data.xp_earned} XP`, { duration: 3000 });
        playCoin();
      } catch (e) { /* not logged in */ }
    }
  };

  const GameComp = {
    snake: SnakeGame, memory: MemoryGame, dodge: DodgeGame, reaction: ReactionGame,
    racing: RacingGame, click: ClickSpeedGame, aim: AimGame
  }[gameId];

  if (!GameComp) return <div className="text-center mt-20 mono-label">UNKNOWN GAME</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/arcade" className="mono-label text-white/60 hover:text-neon-blue inline-flex items-center gap-2" onClick={playClick}>
        <ArrowLeft className="w-4 h-4" /> Back to Arcade
      </Link>
      <h1 className="h-display text-3xl sm:text-4xl text-white mt-4">{TITLES[gameId]}</h1>
      <div className="mt-6">
        <GameComp onGameOver={onGameOver} onWin={() => { playWin(); }} />
      </div>
      {!user && <div className="mt-4 mono-label text-neon-pink">Login to save your scores!</div>}
    </div>
  );
}

// ============================================================
// SNAKE PRO — Canvas-based neon snake
// ============================================================
function SnakeGame({ onGameOver }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const stateRef = useRef(null);

  const start = useCallback(() => {
    setScore(0);
    setRunning(true);
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    const cell = 20, w = 20, h = 20;
    let snake = [{ x: 10, y: 10 }];
    let dir = { x: 1, y: 0 };
    let food = { x: 5, y: 5 };
    let s = 0;
    let alive = true;
    stateRef.current = { setDir: (d) => { if (snake.length > 1 && d.x === -dir.x && d.y === -dir.y) return; dir = d; } };

    const tick = () => {
      if (!alive) return;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.x >= w || head.y < 0 || head.y >= h || snake.some(s => s.x === head.x && s.y === head.y)) {
        alive = false; setRunning(false); onGameOver(s); return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        s += 10; setScore(s);
        food = { x: Math.floor(Math.random() * w), y: Math.floor(Math.random() * h) };
      } else snake.pop();
      // draw
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#ff003c";
      ctx.shadowColor = "#ff003c"; ctx.shadowBlur = 12;
      ctx.fillRect(food.x * cell, food.y * cell, cell - 2, cell - 2);
      ctx.fillStyle = "#00f0ff"; ctx.shadowColor = "#00f0ff";
      snake.forEach((p, i) => { ctx.shadowBlur = i === 0 ? 16 : 8; ctx.fillRect(p.x * cell, p.y * cell, cell - 2, cell - 2); });
      ctx.shadowBlur = 0;
    };
    const id = setInterval(tick, 110);
    return () => clearInterval(id);
  }, [onGameOver]);

  useEffect(() => {
    if (!running) return;
    const cleanup = start();
    const key = (e) => {
      const s = stateRef.current; if (!s) return;
      if (e.key === "ArrowUp") s.setDir({ x: 0, y: -1 });
      if (e.key === "ArrowDown") s.setDir({ x: 0, y: 1 });
      if (e.key === "ArrowLeft") s.setDir({ x: -1, y: 0 });
      if (e.key === "ArrowRight") s.setDir({ x: 1, y: 0 });
    };
    window.addEventListener("keydown", key);
    return () => { cleanup && cleanup(); window.removeEventListener("keydown", key); };
  }, [running, start]);

  return (
    <div className="flex flex-col items-center gap-4" data-testid="snake-game">
      <div className="mono-label text-neon-blue">SCORE: {score}</div>
      <canvas ref={canvasRef} width={400} height={400} className="game-canvas" />
      {!running && <button onClick={() => setRunning(true)} className="btn-neon" data-testid="snake-start">{score ? "Restart" : "Start"}</button>}
      <div className="mono-label text-white/50 text-xs">USE ARROW KEYS · Mobile: swipe coming soon</div>
      <MobileDPad onDir={(d) => stateRef.current?.setDir(d)} />
    </div>
  );
}

function MobileDPad({ onDir }) {
  const Btn = ({ d, label }) => (
    <button onClick={() => onDir(d)} className="w-14 h-14 glass border border-neon-blue/50 font-mono text-neon-blue">{label}</button>
  );
  return (
    <div className="md:hidden grid grid-cols-3 gap-2 w-fit mx-auto mt-2">
      <div /><Btn d={{x:0,y:-1}} label="↑" /><div />
      <Btn d={{x:-1,y:0}} label="←" /><div /><Btn d={{x:1,y:0}} label="→" />
      <div /><Btn d={{x:0,y:1}} label="↓" /><div />
    </div>
  );
}

// ============================================================
// MEMORY — flip & match grid
// ============================================================
function MemoryGame({ onGameOver, onWin }) {
  const symbols = ["⚡","◈","☣","✦","✪","◉","▲","◇"];
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);

  const init = () => {
    const deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5).map((s, i) => ({ id: i, s }));
    setCards(deck); setFlipped([]); setMatched([]); setMoves(0); setDone(false);
  };
  useEffect(init, []);

  const click = (i) => {
    if (flipped.includes(i) || matched.includes(i) || flipped.length === 2) return;
    const nf = [...flipped, i];
    setFlipped(nf);
    if (nf.length === 2) {
      setMoves(m => m + 1);
      if (cards[nf[0]].s === cards[nf[1]].s) {
        setMatched(m => [...m, ...nf]);
        setFlipped([]);
      } else setTimeout(() => setFlipped([]), 700);
    }
  };
  useEffect(() => {
    if (matched.length && matched.length === cards.length) {
      setDone(true); onWin?.();
      const score = Math.max(50, 500 - moves * 10);
      setTimeout(() => onGameOver(score), 600);
    }
  }, [matched, cards, moves, onGameOver, onWin]);

  return (
    <div className="flex flex-col items-center gap-4" data-testid="memory-game">
      <div className="mono-label">MOVES: {moves}</div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((c, i) => {
          const open = flipped.includes(i) || matched.includes(i);
          return (
            <button key={c.id} data-testid={`mem-card-${i}`} onClick={() => click(i)} className={`w-16 h-16 sm:w-20 sm:h-20 grid place-items-center text-2xl font-mono transition-all ${open ? "bg-neon-blue text-black" : "glass text-transparent"}`}>
              {open ? c.s : "?"}
            </button>
          );
        })}
      </div>
      {done && <button onClick={init} className="btn-neon">Play Again</button>}
    </div>
  );
}

// ============================================================
// DODGE — falling pixel storm
// ============================================================
function DodgeGame({ onGameOver }) {
  const ref = useRef(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!running) return;
    const c = ref.current; const ctx = c.getContext("2d");
    let player = { x: 180, y: 360, w: 30, h: 30 };
    let blocks = []; let s = 0; let alive = true;
    const onMove = (e) => {
      const r = c.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      player.x = Math.max(0, Math.min(c.width - player.w, cx - player.w/2));
    };
    c.addEventListener("mousemove", onMove);
    c.addEventListener("touchmove", onMove);
    const tick = () => {
      if (!alive) return;
      ctx.fillStyle = "#000"; ctx.fillRect(0,0,c.width,c.height);
      if (Math.random() < 0.08) blocks.push({ x: Math.random()*c.width, y: -20, w: 18, h: 18, v: 2 + s*0.02 });
      blocks.forEach(b => b.y += b.v);
      blocks = blocks.filter(b => b.y < c.height);
      ctx.fillStyle = "#ff003c"; ctx.shadowColor = "#ff003c"; ctx.shadowBlur = 8;
      blocks.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
      ctx.fillStyle = "#00f0ff"; ctx.shadowColor = "#00f0ff"; ctx.shadowBlur = 12;
      ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.shadowBlur = 0;
      for (const b of blocks) {
        if (player.x < b.x + b.w && player.x + player.w > b.x && player.y < b.y + b.h && player.y + player.h > b.y) {
          alive = false; setRunning(false); onGameOver(s); return;
        }
      }
      s++; setScore(s);
    };
    const id = setInterval(tick, 30);
    return () => { clearInterval(id); c.removeEventListener("mousemove", onMove); c.removeEventListener("touchmove", onMove); };
  }, [running, onGameOver]);

  return (
    <div className="flex flex-col items-center gap-4" data-testid="dodge-game">
      <div className="mono-label">SCORE: {score}</div>
      <canvas ref={ref} width={400} height={400} className="game-canvas" />
      {!running && <button onClick={() => { setScore(0); setRunning(true); }} className="btn-neon">{score ? "Restart" : "Start"}</button>}
      <div className="mono-label text-white/50 text-xs">MOVE MOUSE OR FINGER</div>
    </div>
  );
}

// ============================================================
// REACTION TEST
// ============================================================
function ReactionGame({ onGameOver }) {
  const [state, setState] = useState("idle"); // idle, wait, go, done
  const [time, setTime] = useState(0);
  const startRef = useRef(0);
  const timeoutRef = useRef(null);

  const begin = () => {
    setState("wait"); setTime(0);
    timeoutRef.current = setTimeout(() => {
      startRef.current = Date.now();
      setState("go");
    }, 1500 + Math.random() * 2500);
  };
  const click = () => {
    if (state === "wait") {
      clearTimeout(timeoutRef.current); setState("idle"); setTime(-1);
    } else if (state === "go") {
      const t = Date.now() - startRef.current;
      setTime(t); setState("done");
      const score = Math.max(0, 1000 - t);
      onGameOver(score);
    } else begin();
  };
  return (
    <div className="flex flex-col items-center gap-4" data-testid="reaction-game">
      <button onClick={click}
        data-testid="reaction-btn"
        className={`w-full max-w-md h-80 grid place-items-center font-heading text-3xl uppercase transition-all border-2 ${
          state === "wait" ? "bg-neon-pink text-white border-neon-pink" :
          state === "go" ? "bg-neon-green text-black border-neon-green" :
          "glass border-neon-blue"
        }`}>
        {state === "idle" && "Click to start"}
        {state === "wait" && "Wait..."}
        {state === "go" && "CLICK!"}
        {state === "done" && `${time} ms`}
      </button>
      {time === -1 && <div className="mono-label text-neon-pink">TOO EARLY!</div>}
    </div>
  );
}

// ============================================================
// CAR RACING (endless lane)
// ============================================================
function RacingGame({ onGameOver }) {
  const ref = useRef(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [lane, setLane] = useState(1);

  useEffect(() => {
    if (!running) return;
    const c = ref.current; const ctx = c.getContext("2d");
    let cars = []; let s = 0; let alive = true; let myLane = 1;
    const setL = (l) => myLane = Math.max(0, Math.min(2, l));
    const onKey = (e) => {
      if (e.key === "ArrowLeft") setL(myLane - 1);
      if (e.key === "ArrowRight") setL(myLane + 1);
    };
    window.addEventListener("keydown", onKey);
    const tick = () => {
      if (!alive) return;
      ctx.fillStyle = "#000"; ctx.fillRect(0,0,c.width,c.height);
      ctx.strokeStyle = "#00f0ff66"; ctx.setLineDash([10, 20]);
      for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo((c.width/3)*i, 0); ctx.lineTo((c.width/3)*i, c.height); ctx.stroke(); }
      ctx.setLineDash([]);
      if (Math.random() < 0.04) cars.push({ lane: Math.floor(Math.random()*3), y: -50 });
      cars.forEach(car => car.y += 5 + s*0.005);
      cars = cars.filter(car => car.y < c.height);
      ctx.fillStyle = "#ff003c"; ctx.shadowColor = "#ff003c"; ctx.shadowBlur = 10;
      cars.forEach(car => ctx.fillRect(car.lane*(c.width/3) + 20, car.y, c.width/3 - 40, 50));
      ctx.fillStyle = "#39ff14"; ctx.shadowColor = "#39ff14"; ctx.shadowBlur = 14;
      ctx.fillRect(myLane*(c.width/3) + 20, c.height - 80, c.width/3 - 40, 60);
      ctx.shadowBlur = 0;
      setLane(myLane);
      for (const car of cars) {
        if (car.lane === myLane && car.y + 50 > c.height - 80 && car.y < c.height - 20) {
          alive = false; setRunning(false); onGameOver(s); return;
        }
      }
      s++; setScore(s);
    };
    const id = setInterval(tick, 30);
    return () => { clearInterval(id); window.removeEventListener("keydown", onKey); };
  }, [running, onGameOver]);

  return (
    <div className="flex flex-col items-center gap-4" data-testid="racing-game">
      <div className="mono-label">DIST: {score}</div>
      <canvas ref={ref} width={300} height={400} className="game-canvas" />
      {!running && <button onClick={() => { setScore(0); setRunning(true); }} className="btn-neon">{score ? "Restart" : "Start"}</button>}
      <div className="flex gap-2 md:hidden">
        <button onClick={() => setLane(l => Math.max(0, l-1))} className="btn-ghost">←</button>
        <button onClick={() => setLane(l => Math.min(2, l+1))} className="btn-ghost">→</button>
      </div>
      <div className="mono-label text-white/50 text-xs">ARROW LEFT/RIGHT</div>
    </div>
  );
}

// ============================================================
// CLICK SPEED — clicks per 5s
// ============================================================
function ClickSpeedGame({ onGameOver }) {
  const [clicks, setClicks] = useState(0);
  const [time, setTime] = useState(5);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!running) return;
    setTime(5); setClicks(0); setDone(false);
    const t0 = Date.now();
    const id = setInterval(() => {
      const left = 5 - Math.floor((Date.now() - t0) / 1000);
      if (left <= 0) {
        setTime(0); setRunning(false); setDone(true);
        clearInterval(id);
      } else setTime(left);
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (done) onGameOver(clicks * 20);
  }, [done, clicks, onGameOver]);

  return (
    <div className="flex flex-col items-center gap-4" data-testid="click-game">
      <div className="mono-label">TIME: {time}s · CLICKS: {clicks}</div>
      <button data-testid="click-target"
        onClick={() => running && setClicks(c => c + 1)}
        className="w-64 h-64 rounded-full bg-neon-blue text-black font-heading text-2xl grid place-items-center transition-transform active:scale-95"
        style={{ boxShadow: "0 0 40px #00f0ff" }}>
        CLICK
      </button>
      {!running && <button onClick={() => setRunning(true)} className="btn-neon">{done ? `Score: ${clicks*20} · Retry` : "Start"}</button>}
    </div>
  );
}

// ============================================================
// AIM TRAINER — pop targets
// ============================================================
function AimGame({ onGameOver }) {
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(20);
  const [target, setTarget] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (!running) return;
    setScore(0); setTime(20);
    const t0 = Date.now();
    const id = setInterval(() => {
      const left = 20 - Math.floor((Date.now() - t0) / 1000);
      if (left <= 0) { setTime(0); setRunning(false); clearInterval(id); }
      else setTime(left);
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running && time === 0) onGameOver(score * 50);
  }, [running, time, score, onGameOver]);

  const hit = (e) => {
    e.stopPropagation();
    setScore(s => s + 1);
    setTarget({ x: 10 + Math.random()*80, y: 10 + Math.random()*80 });
  };

  return (
    <div className="flex flex-col items-center gap-4" data-testid="aim-game">
      <div className="mono-label">HITS: {score} · TIME: {time}s</div>
      <div className="relative w-full max-w-md h-96 game-canvas">
        {running && (
          <button onClick={hit} data-testid="aim-target"
            className="absolute w-12 h-12 rounded-full bg-neon-pink"
            style={{ left: `${target.x}%`, top: `${target.y}%`, transform: "translate(-50%,-50%)", boxShadow: "0 0 20px #ff003c" }} />
        )}
      </div>
      {!running && <button onClick={() => setRunning(true)} className="btn-neon">{time === 0 ? "Play Again" : "Start"}</button>}
    </div>
  );
}
