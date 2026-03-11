from fastapi import FastAPI
from endpoints import users
from endpoints import events
from endpoints import internships

app = FastAPI(title="School Platform", version="1.0.0")

app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(events.router, prefix="/events", tags=["Events"])
app.include_router(internships.router, prefix="/internships", tags=["Internships"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="127.0.0.1", port=8000, reload=True)