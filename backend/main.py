from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import engine, Base
from routes.api import router as api_router
from schemas import LoginRequest, LoginResponse
from auth import verify_password, create_token
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lecture Simplifier")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.post("/api/login", response_model=LoginResponse)
def login(data: LoginRequest):
    if not verify_password(data.password):
        raise HTTPException(status_code=401, detail="Wrong password")
    token = create_token()
    return LoginResponse(token=token)


os.makedirs("./uploads", exist_ok=True)

if os.path.exists("./static"):
    app.mount("/assets", StaticFiles(directory="./static/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = f"./static/{full_path}"
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse("./static/index.html")
