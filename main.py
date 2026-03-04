import dotenv
from fastapi import FastAPI
from router.health_router import router as health_router

dotenv.load_dotenv()

app = FastAPI()

app.include_router(health_router)


