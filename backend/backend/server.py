"""NEXUS Gaming Platform Backend
Handles auth (Emergent Google OAuth), user profiles, games, leaderboards,
daily rewards, achievements, AI tools (GPT-5.2), and Stripe payments.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie, Header, Body
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from pathlib import Path
from datetime import datetime, timezone, timedelta
import os, uuid, logging, random, httpx

# Emergent integrations
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# DB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

app = FastAPI()
api = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# ---------- Helpers ----------
def now_utc():
    return datetime.now(timezone.utc)

async def get_current_user(request: Request) -> Optional[dict]:
    """Read session_token from cookie (preferred) or Authorization header."""
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
    if not token:
        return None
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        return None
    exp = sess.get("expires_at")
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp and exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp and exp < now_utc():
        return None
    user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    return user

async def require_user(request: Request) -> dict:
    u = await get_current_user(request)
    if not u:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return u

# ---------- Models ----------
class GameScore(BaseModel):
    game_id: str
    score: int

class AIRequest(BaseModel):
    tool: Literal["username", "story", "thumbnail", "minecraft", "video_title"]
    prompt: Optional[str] = ""

class CheckoutRequest(BaseModel):
    package_id: Literal["monthly", "yearly", "lifetime"]
    origin_url: str

# Fixed packages (price set on backend ONLY)
PACKAGES = {
    "monthly": {"amount": 4.99, "label": "Premium Monthly", "duration_days": 30},
    "yearly": {"amount": 39.99, "label": "Premium Yearly", "duration_days": 365},
    "lifetime": {"amount": 99.99, "label": "Premium Lifetime", "duration_days": 36500},
}

# ---------- Auth ----------
@api.post("/auth/session")
async def auth_session(response: Response, x_session_id: Optional[str] = Header(None)):
    """Exchange Emergent session_id for a session_token."""
    if not x_session_id:
        raise HTTPException(400, "Missing session id")
    async with httpx.AsyncClient(timeout=15) as cx:
        r = await cx.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": x_session_id},
        )
    if r.status_code != 200:
        raise HTTPException(401, "Invalid session")
    data = r.json()

    existing = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data["name"], "picture": data["picture"]}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data["picture"],
            "xp": 0,
            "coins": 500,  # welcome bonus
            "level": 1,
            "premium": False,
            "premium_until": None,
            "theme": "neon",
            "achievements": [],
            "high_scores": {},
            "last_daily_claim": None,
            "last_spin": None,
            "created_at": now_utc().isoformat(),
        })

    session_token = data["session_token"]
    expires_at = now_utc() + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": now_utc().isoformat(),
    })
    response.set_cookie(
        key="session_token", value=session_token, httponly=True,
        secure=True, samesite="none", max_age=7*24*60*60, path="/",
    )
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api.get("/auth/me")
async def auth_me(request: Request):
    return await require_user(request)

@api.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}

# ---------- User / Games ----------
def xp_for_level(level: int) -> int:
    return 100 * level * level

@api.post("/games/score")
async def submit_score(payload: GameScore, request: Request):
    user = await require_user(request)
    uid = user["user_id"]
    coins_earned = max(1, payload.score // 10)
    xp_earned = max(2, payload.score // 5)
    high_scores = user.get("high_scores") or {}
    prev = int(high_scores.get(payload.game_id) or 0)
    if payload.score > prev:
        high_scores[payload.game_id] = payload.score
    new_xp = int(user.get("xp", 0)) + xp_earned
    level = int(user.get("level", 1))
    while new_xp >= xp_for_level(level):
        level += 1
    new_coins = int(user.get("coins", 0)) + coins_earned
    achievements = set(user.get("achievements") or [])
    if payload.score >= 100 and "century" not in achievements:
        achievements.add("century")
    if level >= 5 and "level_5" not in achievements:
        achievements.add("level_5")
    await db.users.update_one(
        {"user_id": uid},
        {"$set": {
            "high_scores": high_scores, "xp": new_xp, "level": level,
            "coins": new_coins, "achievements": list(achievements),
        }}
    )
    # Leaderboard entry
    await db.leaderboard.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": uid, "name": user["name"], "picture": user.get("picture"),
        "game_id": payload.game_id, "score": payload.score,
        "created_at": now_utc().isoformat(),
    })
    return {"coins_earned": coins_earned, "xp_earned": xp_earned, "level": level, "new_xp": new_xp}

@api.get("/leaderboard")
async def get_leaderboard(game_id: Optional[str] = None):
    q = {"game_id": game_id} if game_id else {}
    cursor = db.leaderboard.find(q, {"_id": 0}).sort("score", -1).limit(20)
    return await cursor.to_list(20)

# ---------- Daily Rewards / Spin ----------
@api.post("/rewards/daily")
async def claim_daily(request: Request):
    user = await require_user(request)
    last = user.get("last_daily_claim")
    now = now_utc()
    if last:
        last_dt = datetime.fromisoformat(last) if isinstance(last, str) else last
        if last_dt.tzinfo is None:
            last_dt = last_dt.replace(tzinfo=timezone.utc)
        if (now - last_dt) < timedelta(hours=20):
            raise HTTPException(400, "Daily reward already claimed")
    reward = random.choice([50, 75, 100, 150])
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"coins": reward}, "$set": {"last_daily_claim": now.isoformat()}},
    )
    return {"reward": reward}

@api.post("/rewards/spin")
async def spin_wheel(request: Request):
    user = await require_user(request)
    now = now_utc()
    last = user.get("last_spin")
    if last:
        last_dt = datetime.fromisoformat(last) if isinstance(last, str) else last
        if last_dt.tzinfo is None:
            last_dt = last_dt.replace(tzinfo=timezone.utc)
        if (now - last_dt) < timedelta(hours=8):
            raise HTTPException(400, "Spin available every 8 hours")
    prizes = [10, 25, 50, 100, 250, 500, 1000, 5]
    idx = random.randint(0, len(prizes)-1)
    reward = prizes[idx]
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"coins": reward}, "$set": {"last_spin": now.isoformat()}},
    )
    return {"reward": reward, "index": idx, "prizes": prizes}

# ---------- AI Tools (GPT-5.2 via Emergent Universal Key) ----------
PROMPT_TEMPLATES = {
    "username": "Generate exactly 8 unique, creative gamer usernames inspired by cyberpunk, futuristic, and Minecraft themes. Style hint: {prompt}. Return only the list as bullet points with - prefix. No explanations.",
    "story": "Write a short (180 words) cyberpunk action story for a gaming platform. Topic: {prompt}. Make it cinematic and immersive.",
    "thumbnail": "Generate 6 viral YouTube gaming thumbnail concepts (composition + text overlay ideas) for: {prompt}. Use - bullets.",
    "minecraft": "Suggest 8 creative Minecraft build ideas (with one-line description each) inspired by: {prompt}. Use - bullets.",
    "video_title": "Generate 8 high-CTR YouTube gaming video titles about: {prompt}. Use - bullets. Use emojis/symbols sparingly."
}

@api.post("/ai/generate")
async def ai_generate(payload: AIRequest, request: Request):
    # Allow anonymous limited use; logged-in unlimited.
    user = await get_current_user(request)
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "AI key not configured")
    base = PROMPT_TEMPLATES[payload.tool]
    prompt = (payload.prompt or "").strip() or "anything creative"
    full = base.format(prompt=prompt)
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"ai-{payload.tool}-{uuid.uuid4().hex[:8]}",
        system_message="You are a creative AI assistant for a futuristic gaming platform. Be concise, vivid, and on-brand.",
    ).with_model("openai", "gpt-5.2")
    try:
        reply = await chat.send_message(UserMessage(text=full))
    except Exception as e:
        logger.error(f"AI error: {e}")
        raise HTTPException(500, f"AI generation failed: {str(e)[:120]}")
    text = reply if isinstance(reply, str) else str(reply)
    if user:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$inc": {"xp": 5}}
        )
    return {"text": text, "tool": payload.tool}

# ---------- Stripe Payments ----------
@api.post("/payments/checkout")
async def create_checkout(req: CheckoutRequest, request: Request):
    user = await require_user(request)
    if req.package_id not in PACKAGES:
        raise HTTPException(400, "Invalid package")
    pkg = PACKAGES[req.package_id]
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    sc = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    success_url = f"{req.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{req.origin_url}/premium"
    creq = CheckoutSessionRequest(
        amount=float(pkg["amount"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"user_id": user["user_id"], "package_id": req.package_id},
    )
    sess = await sc.create_checkout_session(creq)
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": sess.session_id,
        "user_id": user["user_id"],
        "package_id": req.package_id,
        "amount": pkg["amount"],
        "currency": "usd",
        "payment_status": "initiated",
        "status": "pending",
        "created_at": now_utc().isoformat(),
    })
    return {"url": sess.url, "session_id": sess.session_id}

@api.get("/payments/status/{session_id}")
async def payment_status(session_id: str, request: Request):
    user = await require_user(request)
    sc = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    status = await sc.get_checkout_status(session_id)
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(404, "Transaction not found")
    already = txn.get("payment_status") == "paid"
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"status": status.status, "payment_status": status.payment_status,
                  "updated_at": now_utc().isoformat()}},
    )
    if status.payment_status == "paid" and not already:
        pkg = PACKAGES.get(txn["package_id"])
        if pkg:
            until = now_utc() + timedelta(days=pkg["duration_days"])
            await db.users.update_one(
                {"user_id": txn["user_id"]},
                {"$set": {"premium": True, "premium_until": until.isoformat()}}
            )
    return {"status": status.status, "payment_status": status.payment_status,
            "amount": status.amount_total/100 if status.amount_total else 0,
            "currency": status.currency}

@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    sc = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    try:
        ev = await sc.handle_webhook(body, sig)
    except Exception as e:
        logger.error(f"webhook err: {e}")
        return JSONResponse({"ok": False}, status_code=400)
    if ev.payment_status == "paid":
        txn = await db.payment_transactions.find_one({"session_id": ev.session_id})
        if txn and txn.get("payment_status") != "paid":
            pkg = PACKAGES.get(txn["package_id"])
            if pkg:
                until = now_utc() + timedelta(days=pkg["duration_days"])
                await db.users.update_one(
                    {"user_id": txn["user_id"]},
                    {"$set": {"premium": True, "premium_until": until.isoformat()}}
                )
            await db.payment_transactions.update_one(
                {"session_id": ev.session_id},
                {"$set": {"payment_status": "paid", "status": "complete"}}
            )
    return {"ok": True}

# ---------- Misc ----------
@api.get("/")
async def root():
    return {"name": "NEXUS Gaming API", "version": "1.0"}

@api.post("/profile/theme")
async def set_theme(request: Request, payload: dict = Body(...)):
    user = await require_user(request)
    theme = payload.get("theme", "neon")
    if theme not in ("neon", "matrix", "sunset", "ice"):
        raise HTTPException(400, "Invalid theme")
    # Premium-only themes
    if theme in ("sunset", "ice") and not user.get("premium"):
        raise HTTPException(403, "Premium required for this theme")
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"theme": theme}})
    return {"theme": theme}

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
