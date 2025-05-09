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
pretrained_model = YOLO("yolov8n.pt")
custom_model = YOLO("best.pt")

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

    # Load the image from the given file path
    image = cv2.imread("./OIP (2).jpg")
    if image is None:
        print("Error: Cannot open image.")
        return {"error": "Image not found"}

    # Run the analysis
    try:
        results_pretrained = pretrained_model.predict(image, verbose=False)
    except Exception as e:
        print(f"Error with pretrained model: {e}")
        return {"error": f"Error with pretrained model: {e}"}

    try:
        results_custom = custom_model.predict(image, verbose=False)
    except Exception as e:
        print(f"Error with custom model: {e}")
        return {"error": f"Error with custom model: {e}"}

    # Get class names from both models
    class_ids_pretrained = results_pretrained[0].boxes.cls.int().tolist()
    names_pretrained = [pretrained_model.names[cid] for cid in class_ids_pretrained]

    class_ids_custom = results_custom[0].boxes.cls.int().tolist()
    names_custom = [custom_model.names[cid] for cid in class_ids_custom]

    # Combine the names from both models
    combined_names = names_pretrained + names_custom

    # Count occurrences of each detected class
    final_counts = Counter(combined_names)

    if final_counts:
        output_str = ', '.join([f"{v} {k}" for k, v in final_counts.items()])
    else:
        output_str = 'none'

    print("Finished photo analysis.")
    return {"result": dict(final_counts)}

@router.get("/photo_analysis")
async def photo_analysis_result():
    # Run the analysis in a thread and await the result
    result = await run_in_threadpool(analyze_photo)
    return result


#---------------------------------------------------------
#  this for live cam
    # print("Starting live analysis...")
    #
    # cap = cv2.VideoCapture(0)
    # if not cap.isOpened():
    #     print("Error: Cannot open camera.")
    #     return {"error": "Camera not available"}
    #
    # # Run for ~1 minute (or set your own time limit)
    # start_time = time.time()
    # duration = 60  # seconds
    #
    # final_counts = Counter()
    #
    # while True:
    #     ret, frame = cap.read()
    #     if not ret:
    #         print("Failed to grab frame.")
    #         break
    #
    #     try:
    #         results_pretrained = pretrained_model.predict(frame, verbose=False)
    #     except Exception as e:
    #         print(f"Error with pretrained model: {e}")
    #         continue
    #
    #     try:
    #         results_custom = custom_model.predict(frame, verbose=False)
    #     except Exception as e:
    #         print(f"Error with custom model: {e}")
    #         continue
    #
    #     # Get class names from both models
    #     class_ids_pretrained = results_pretrained[0].boxes.cls.int().tolist()
    #     names_pretrained = [pretrained_model.names[cid] for cid in class_ids_pretrained]
    #
    #     class_ids_custom = results_custom[0].boxes.cls.int().tolist()
    #     names_custom = [custom_model.names[cid] for cid in class_ids_custom]
    #
    #     combined_names = names_pretrained + names_custom
    #
    #     # Update counts
    #     frame_counts = Counter(combined_names)
    #     final_counts.update(frame_counts)
    #
    #     # Optional: show the frame if running locally
    #     # cv2.imshow("YOLO Analysis", frame)
    #     # if cv2.waitKey(1) & 0xFF == ord('q'):
    #     #     break
    #
    #     # Stop after the duration
    #     if time.time() - start_time > duration:
    #         break
    #
    # cap.release()
    # # cv2.destroyAllWindows()
    #
    # if final_counts:
    #     output_str = ', '.join([f"{v} {k}" for k, v in final_counts.items()])
    # else:
    #     output_str = 'none'
    #
    # print("Finished live analysis.")
    # return {"result": dict(final_counts)}


