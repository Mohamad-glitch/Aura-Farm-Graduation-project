from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, APIRouter
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from pydantic import BaseModel
from sqlalchemy import create_engine
from sqlmodel import Session
from sqlmodel import select

from models.user import User

SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

sql_file_name = "farm_database.db"
sql_url = f"sqlite:///./{sql_file_name}"
connect_args = {"check_same_thread": False}  # recommended by FastAPI docs

# connecting database
engine = create_engine(sql_url, connect_args=connect_args)


def get_session():
    with Session(engine) as session:
        yield session  # yield that will provide a new Session for each request.

# create a session to connect to DB
SessionDep = Annotated[Session, Depends(get_session)]


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter(tags=["authentication"])


def get_user(session: SessionDep, username: str):
    user_db = session.exec(select(User).filter_by(username=username)).first()
    return user_db


# check if the entered password and email matches in DB user info
def authenticate_user(session: SessionDep, email: str, password: str):
    user = session.exec(select(User).filter_by(email=email)).first()
    print(user)  # testing
    if not user or password != user.password:  # if user email not found or password does not match return an error
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return user


#   generate a JWT token for authenticated user for security
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=120))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# this for checking if the given token is correct or not got it form Fast API docs
async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], session: SessionDep):
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}, )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = session.get(User, email)
    if user is None:
        raise credentials_exception

    return user


# using the token to know who is the user at this moment got it From Fast API docs
async def get_current_active_user(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user
