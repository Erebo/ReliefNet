import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.flood import FloodSimulation
from backend.app.schemas.flood import FloodSimulationOut

router = APIRouter()


@router.get("/simulations", response_model=List[FloodSimulationOut])
def get_flood_simulations(db: Session = Depends(get_db)):
    """Retrieve all active flood simulation scenarios. Clearly tagged as SIMULATION."""
    return db.query(FloodSimulation).filter(FloodSimulation.is_active == True).all()
