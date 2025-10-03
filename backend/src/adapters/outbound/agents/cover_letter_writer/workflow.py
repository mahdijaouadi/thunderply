from jinja2 import Environment, FileSystemLoader
import os
from langchain_core.messages import SystemMessage, HumanMessage
from backend.src.adapters.outbound.llms import GoogleGenAI
from langchain_community.document_loaders import PyPDFLoader
from backend.src.domain.models import JobPost
import asyncio
import logging

# Set project root at the top for simple path calculations
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
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
        resume_path = os.path.join(PROJECT_ROOT, 'user_information', 'resume.pdf')
        
        if not os.path.exists(resume_path):
            raise FileNotFoundError(f"Resume file not found at: {resume_path}")
        
        resume_loader = PyPDFLoader(resume_path)
        resume_docs = resume_loader.load()
        
        resume_content = "\n".join([doc.page_content for doc in resume_docs])
        
        logging.debug(f"Resume loaded: {resume_content[:20]}...")
        
        job_description = f"""
Company: {job_post.company_name}
Job Information: {job_post.job_information}
"""
        
        system_prompt = await self.load_prompt("cover_letter_prompt.jinja",
                                               resume=resume_content,
                                               job_description=job_description)
        
        logging.debug(f"System prompt loaded: {system_prompt[:20]}...")
        
        # Check if system_prompt is empty
        if not system_prompt or not system_prompt.strip():
            raise ValueError("System prompt is empty or None")
        
        messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content="Please write a cover letter based on the provided resume and job description.")
            ]
        
        response= await self.llm.ainvoke(messages)
        await asyncio.sleep(self.llm_sleep)
        return response.content