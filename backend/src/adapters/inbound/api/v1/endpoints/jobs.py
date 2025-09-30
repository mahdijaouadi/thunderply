from fastapi import APIRouter
from backend.src.adapters.outbound.hiringcafe.uow import HiringCafeUnitOfWork
from backend.src.service_layer.search_jobs import SearchJobs
from backend.src.adapters.outbound.logging.std_logger import StdLogger
router = APIRouter()


def uow_factory():
    return HiringCafeUnitOfWork()

@router.post("/launch_search_jobs")
async def launch_search_jobs():
    service = SearchJobs(uow_factory=uow_factory, logger=StdLogger())
    result = await service.run()
    return result