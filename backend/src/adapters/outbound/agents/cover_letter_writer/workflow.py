from jinja2 import Environment, FileSystemLoader
import os
from langchain_core.messages import HumanMessage,SystemMessage
from backend.src.adapters.outbound.llms import GoogleGenAI
from langchain_community.document_loaders import PyPDFLoader
from backend.src.domain.models import JobPost
import asyncio

current_dir = os.path.dirname(os.path.abspath(__file__))



class JobPostCoverLetterWorkflow:
    def __init__(self) -> None:
        self.llm_obj = GoogleGenAI()
        self.llm= self.llm_obj.llm
        self.llm_sleep= self.llm_obj.llm_sleep
    async def load_prompt(self,template_name, **kwargs):
        env = Environment(loader=FileSystemLoader(os.path.join(current_dir,'prompts', 'templates')))
        template = env.get_template(template_name)
        return template.render(**kwargs)
    
    async def job_post_to_coverletter(self,job_post: JobPost) -> str:
        resume=PyPDFLoader(os.path.join(current_dir,'..', '..','..','..','..','user_information','resume.pdf'))
        resume=resume.load()
        system_prompt = await self.load_prompt("cover_letter_prompt.jinja",
                                               resume=resume)
        messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Job post: {job_post}")
            ]

        response= await self.llm.ainvoke(messages)
        await asyncio.sleep(self.llm_sleep)
        return response.content