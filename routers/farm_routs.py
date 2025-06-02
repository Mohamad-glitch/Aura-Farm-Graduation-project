import time
from typing import Annotated

from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy import desc
from sqlmodel import Session, SQLModel, create_engine, select

from collections import Counter
from ultralytics import YOLO
import cv2
from starlette.concurrency import run_in_threadpool
import main
from models.crop import Crop, CropCreate, CropNameUpdate
from models.farm import Farm, FarmPublic
from models.sensor import SensorCreate, Sensor, WindowStatus
from models.user import User
from routers.JWTtoken import get_current_user

#hi
router = APIRouter(
    prefix="/farms",
    tags=["farm"]
)

sql_file_name = "farm_database.db"
sql_url = f"sqlite:///./{sql_file_name}"
connect_args = {"check_same_thread": False} # recommended by FastAPI docs

#connecting database
engine = create_engine(sql_url, connect_args=connect_args)


#creating database
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# This is what ensures that we use a single session per request.
def get_session():
    with Session(engine) as session:
        yield session #yield that will provide a new Session for each request.


# we create an Annotated dependency SessionDep to simplify the rest of the code that will use this dependency.
SessionDep = Annotated[Session, Depends(get_session)]

#AI things
#----------------------------------------------------------------------------------------------------------------------------------


#----------------------------------------------------------------------------------------------------------------------------------


# create the database on starting app startup
@router.on_event("startup")
def on_startup():
    create_db_and_tables()


@router.get("/read_all")
def read_farm(session: SessionDep):
    """Get All Farms In DB"""
    farms = session.exec(select(Farm)).all()
    return farms


#to add authentication use this in the function  current_user: User = Depends(get_current_user)
@router.get("/", response_model=FarmPublic)
def read_farm(session: SessionDep, current_user: User = Depends(get_current_user)) -> Farm:
    """Get the current user's farm"""
    farm_name = current_user.farm_id  # assumes 'farm_name' is a field on the User model

    statement = select(Farm).where(Farm.id == farm_name)
    farm = session.exec(statement).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    return farm


@router.get("/crops")
def read_farm_crops(session: SessionDep, current_user: User = Depends(get_current_user)):
    """Get Crops Of Farm """
    farm_id = current_user.farm_id

    # Step 2: Get the crops linked to this farm
    crops = session.exec(select(Crop).where(Crop.farm_id == farm_id)).all()
    return crops


@router.post("/crops")
def create_crops(crops: CropCreate, session: SessionDep, current_user: User = Depends(get_current_user)):
    """Create Crops Of Farm """

    farm_id = current_user.farm_id
    # Find the farm by name
    farm = session.exec(select(Farm).where(Farm.id == farm_id)).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    # Assign the farm ID to the crop
    db_crop = Crop(**crops.dict(), farm_id=farm.id)

    session.add(db_crop)
    session.commit()
    session.refresh(db_crop)

    return db_crop


@router.patch("/crops/{crop_id}")
def update_crop_name(crop_id: int, crop_data: CropNameUpdate,  session: SessionDep, current_user: User = Depends(get_current_user)):
    crop = session.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    crop.name = crop_data.name
    session.commit()
    session.refresh(crop)
    print({"id": crop.id, "name": crop.name})
    return {"message": "Crop name updated successfully", "crop": crop}


@router.delete("/crops/{crop_id}")
def delete_crops(crop_id: int, session: SessionDep, current_user: User = Depends(get_current_user)):
    """Delete Crops Of Farm """
    crop = session.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    session.delete(crop)
    session.commit()
    return {"message": "Crop Deleted"}


@router.post("/sensor")
def create_sensor_data(sensor_data: SensorCreate, session: SessionDep, current_user: User = Depends(get_current_user)):
    """Create a new sensor reading for a specific farm."""

    farm_id = current_user.farm_id
    # Create Sensor instance linked to farm
    sensor = Sensor(**sensor_data.dict(), farm_id=farm_id)

    session.add(sensor)
    session.commit()
    session.refresh(sensor)

    return sensor


@router.get("/sensorStats")
def read_farm_sensor_stats(session: SessionDep, current_user: User = Depends(get_current_user)):
    """Read sensor Stats for a specific farm."""
    farm_id = current_user.farm_id

    farm_sensor = session.exec(
        select(Sensor)
        .where(Sensor.farm_id == farm_id)
        .order_by(desc(Sensor.id))
        .limit(1)
    ).first()
    return farm_sensor


# Window Show/Control code

# Temporary storage in memory
last_window_status = {"status": "close"}

# get the
@router.post("/window-status")
def receive_window_status(
        window_status: WindowStatus,
        current_user: User = Depends(get_current_user)
):
    """
    Receive the current status of the window from Arduino (open/closed).
    """
    if window_status.status not in ["open", "closed"]:
        raise HTTPException(status_code=400, detail=f"Invalid status received: {window_status.status}")

    # Update the last known window status
    last_window_status["status"] = window_status.status

    # You can process it here, for example log or update UI
    return {"message": "Window status received", "status": window_status.status}


@router.get("/window-status")
def get_window_status_for_frontend(current_user: User = Depends(get_current_user)):
    """
    Get the last known window status for the frontend (open/closed).
    """
    return {"status": last_window_status["status"]}


def analyze_photo():
    print("Starting photo analysis...")

    RTSP_URL = "rtsp://AuraCamera:12345678@192.168.70.134:554/stream1"
    RETRIES = 5
    TIMEOUT = 60_000  # ms

    # --- Load model(s) ---
    custom = YOLO("best.pt")  # your own model
    coco = YOLO("yolov8n.pt")  # optional second model

    # --- Open stream ---
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, TIMEOUT)
    cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, TIMEOUT)
    # if not cap.open(RTSP_URL):
    #     raise RuntimeError("Cannot open RTSP stream")

    # --- Grab with retry ---
    for attempt in range(RETRIES):
        ok, frame = cap.read()
        if ok and frame is not None:
            break
        print(f"Grab failed ({attempt + 1}/{RETRIES}); retrying…")
        time.sleep(1)
    else:
        raise RuntimeError("All frame‑grab attempts failed")

    cap.release()

    # --- Run inference ---
    res_custom = custom.predict(frame, verbose=False)[0]
    res_coco = coco.predict(frame, verbose=False)[0]  # drop if not needed

    names = (
            [custom.names[int(c)] for c in res_custom.boxes.cls] +
            [coco.names[int(c)] for c in res_coco.boxes.cls]
    )
    counts = Counter(names)

    # --- Present results ---

    cv2.waitKey(0)
    cv2.destroyAllWindows()
    return [f"{v} {k}" for k, v in counts.items() or "none"]

@router.get("/photo_analysis")
async def photo_analysis_result():
    # Run the analysis in a thread and await the result
    result = await run_in_threadpool(analyze_photo)
    return {"result" :result}
