import os
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import OpenAI
from pydantic import BaseModel
from sqlmodel import Session, SQLModel, create_engine
from starlette.responses import HTMLResponse
from starlette.staticfiles import StaticFiles

from routers import JWTtoken
from routers import farm_routs, user_routs

load_dotenv()  # Load variables from .env
# chat-bot api and connection
api_key = os.getenv("gpt_api_key")


# this class main use to convert the data from JSON to object from it using BaseModel
class ChatBot(BaseModel):
    prompt: str


sql_file_name = "farm_database.db"
sql_url = f"sqlite:///./{sql_file_name}"
connect_args = {"check_same_thread": False}  # recommended by FastAPI docs

# connecting database
engine = create_engine(sql_url, connect_args=connect_args)


# creating database
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


# This is what ensures that we use a single session per request.
def get_session():
    with Session(engine) as session:
        yield session  # yield that will provide a new Session for each request.


# we create an Annotated dependency SessionDep to simplify the rest of the code that will use this dependency.
SessionDep = Annotated[Session, Depends(get_session)]

app = FastAPI()

app.add_middleware(
    CORSMiddleware, allow_origins=["*"],  # Replace "" with specific origins for better security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], )

# Connecting To Frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(farm_routs.router)
app.include_router(user_routs.router)
app.include_router(JWTtoken.router)

client = OpenAI(base_url="https://openrouter.ai/api/v1",
    api_key=api_key)


# send a request that has prompt as input(from user) to ChatBot(like chat gpt) to get the answer as a response then return it to client(FrontEnd)
@app.post("/chat_bot")
def chat_bot_answer(prompt: ChatBot):
    if not api_key:
        return JSONResponse(status_code=500, content={"error": "API key is missing."})

    try:
        response = client.chat.completions.create(model="deepseek/deepseek-chat",  # or any model OpenRouter supports
            messages=[{"role": "user", "content": prompt.prompt}], max_tokens=2000)

        return {"content": response.choices[0].message.content}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "Failed to process response", "details": str(e)})


# show first page
@app.get("/", response_class=HTMLResponse)
async def get_index():
    """Show Home Page."""
    return HTMLResponse(content=open("static/about.html").read())


# shows register page
@app.get("/register", response_class=HTMLResponse)  # get the register page
async def register():
    """Register User."""
    return HTMLResponse(content=open("static/register.html").read())


# shows home page (after logging in)
@app.get("/home", response_class=HTMLResponse)
async def home():
    """Home Page."""
    return HTMLResponse(content=open("static/index.html").read())


@app.get("/devs/whatever")
async def devs():
    """Whatever Page for devs"""
    return HTMLResponse(content=open("static/whatever.html").read())
