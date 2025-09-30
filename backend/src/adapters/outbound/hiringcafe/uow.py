from backend.src.adapters.outbound.hiringcafe.job_posts_repository import JobPostsRepository


class HiringCafeUnitOfWork:
    def __init__(self) -> None:
        self.job_posts_repository = None

    async def __aenter__(self):
        self.job_posts_repository = JobPostsRepository()
        return self

    async def __aexit__(self, exc_type, exc, tb):
        pass

    async def commit(self):
        pass

    async def rollback(self):
        pass