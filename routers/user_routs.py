from fastapi import APIRouter
from typing import Annotated

from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, SQLModel, create_engine, select
from starlette.responses import RedirectResponse, HTMLResponse, JSONResponse

from models.farm import Farm
from models.user import UserCreate, User, UserPublic
from routers.JWTtoken import create_access_token, get_current_user

router = APIRouter(tags=["users"])

sql_file_name = "farm_database.db"
sql_url = f"sqlite:///./{sql_file_name}"
connect_args = {"check_same_thread": False} # recommended by FastAPI docs

#connecting database
engine = create_engine(sql_url, connect_args=connect_args)

class LoginData(BaseModel):
    email: str = Field(..., alias="user_email")
    password: str

#creating database
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# This is what ensures that we use a single session per request.
def get_session():
    with Session(engine) as session:
        yield session #yield that will provide a new Session for each request.


# we create an Annotated dependency SessionDep to simplify the rest of the code that will use this dependency.
SessionDep = Annotated[Session, Depends(get_session)]

@router.on_event("startup")
def on_startup():
    create_db_and_tables()

@router.post("/login_1")
def login_user(request: LoginData, session: SessionDep):
    user = session.get(User, request.email)
    if not user or user.password != request.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": user.email})
    response = JSONResponse(content={"message": "Login successful", "token": access_token})
    response.set_cookie(key="access_token", value=access_token, httponly=True)
    return response

@router.get("/login", response_class=HTMLResponse)
def login():
    return HTMLResponse(content=open("static/login.html").read())



#create new user
@router.post("/register")
def register_user(user: UserCreate, session: SessionDep):
    #check if the user already exist
    check_user = session.exec(select(User).where(User.email == user.email)).first()
    if  check_user:
        raise HTTPException(status_code=409, detail="User is already registered")


   #create a farm for the user at first
    farm = Farm(name=user.full_name)
    session.add(farm)
    session.commit()
    session.refresh(farm)
    farm_id = farm.id

    # Create user
    db_user = User(
        email=user.email,
        full_name=user.full_name,
        password=user.password,
        farm_id=farm_id
    )

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    # Prepare response
    response = UserPublic.from_orm(db_user)
    if db_user.farm:
        response.farm_name = db_user.farm.name

    return RedirectResponse(url="https://whatever-qw7l.onrender.com/login", status_code=303)

@router.get("/show_user")
def show_user(session: SessionDep, current_user: User = Depends(get_current_user)):
    return {"full_name" : current_user.full_name}

@router.get("/some-endpoint")
def get_data():
    return {"message": "Hello, world!"}
