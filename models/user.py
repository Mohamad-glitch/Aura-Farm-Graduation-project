from pydantic import BaseModel
from sqlmodel import Field, SQLModel, Relationship
from typing import Optional

class UserBase(SQLModel):
    full_name: str = Field(index=True)
    email: str = Field(primary_key=True)

class UserCreate(UserBase):
    password: str


class User(UserBase, table=True):
    password: str
    farm_id: Optional[int] = Field(
        default=None,
        foreign_key="farm.id",
        nullable=True  # Makes the FK truly optional
    )
    farm: Optional["Farm"] = Relationship(back_populates="users")

class UserPublic(UserBase):
    farm_name: Optional[str] = None  # For displaying farm name

class login(BaseModel):
    email: str
    password: str