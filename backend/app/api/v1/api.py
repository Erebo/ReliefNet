from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    auth,
    health,
    geo,
    flood,
    institutions,
    providers,
    reports,
    sms,
    verification,
    assignments,
    deliveries,
    gaps,
    audit,
    overview
)

api_router = APIRouter()

api_router.include_router(health.router, prefix="/system", tags=["System & Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(geo.router, prefix="/geo", tags=["Geospatial & Boundaries"])
api_router.include_router(flood.router, prefix="/flood", tags=["Flood Simulation"])
api_router.include_router(institutions.router, prefix="/institutions", tags=["Institutions & Anchors"])
api_router.include_router(providers.router, prefix="/providers", tags=["Relief Providers & Resources"])
api_router.include_router(reports.router, prefix="/reports", tags=["Community Reports"])
api_router.include_router(sms.router, prefix="/sms", tags=["SMS Gateway & Simulator"])
api_router.include_router(verification.router, prefix="/verification", tags=["Ground-Truth Verification"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["Relief Assignments"])
api_router.include_router(deliveries.router, prefix="/deliveries", tags=["Relief Deliveries"])
api_router.include_router(gaps.router, prefix="/gaps", tags=["Gap & Duplication Intelligence"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit Log"])
api_router.include_router(overview.router, prefix="/overview", tags=["Command Overview"])
