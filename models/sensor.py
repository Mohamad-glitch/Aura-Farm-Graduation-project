from typing import Optional

from pydantic import BaseModel
from sqlmodel import Field, SQLModel, Relationship

class SensorBase(SQLModel):
    temperature: int = Field(index=True)
    soil_moisture: float = Field(default=0, index=True)  # Changed to float
    humidity: float = Field(default=0, index=True)  # New field

class Sensor(SensorBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    farm_id: int = Field(foreign_key="farm.id")
    farm: Optional["Farm"] = Relationship(back_populates="sensors")

class SensorPublic(SensorBase):
    id: int
    farm_id: int

class SensorCreate(SensorBase):
    pass

class SensorUpdate(SensorBase):
    temperature: Optional[int] = None
    soil_moisture: Optional[float] = None  # Changed to float
    humidity: Optional[float] = None


class WindowStatus(BaseModel):
    status: str