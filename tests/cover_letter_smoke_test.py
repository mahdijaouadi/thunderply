from backend.src.domain.models import JobPost
from backend.src.adapters.outbound.hiringcafe.job_posts_repository import (
    JobPostsRepository,
)
import asyncio
from dotenv import load_dotenv
from backend.src.config.logging import setup_logging


async def main():
    load_dotenv()
    setup_logging("DEBUG")

    # fake job post for testing
    job_post = [
        JobPost(
            job_information="", apply_url="", company_name="", score=0, cover_letter=""
        )
    ]

    job_post[0].job_information = """
About The Job

The CAI team at Allianz Technology is at the forefront of building intelligent conversational bots that enhance customer experience and operational efficiency. We’re looking for a passionate student to join us and contribute to the development of next-generation AI assistants.

What You Do

Assist in designing and developing conversational AI bots using modern frameworks and platforms.
Support the integration of Natural Language Understanding (NLU) components to improve bot comprehension.
Explore and experiment with Large Language Models (LLMs) and Agentic AI concepts to enhance bot capabilities.
Collaborate with cross-functional teams including designers, developers, and product managers.
Participate in testing, debugging, and refining bot interactions for real-world use cases.

What You Bring

Currently enrolled in a Bachelor’s or Master’s program in Computer Science, Artificial Intelligence, Computational Linguistics, or a related field.
Familiarity with Python, JavaScript, or similar programming languages.
Interest in conversational AI, NLU, LLMs, and emerging Agentic AI technologies.
Curious, proactive, and eager to learn in a fast-paced environment.
Basic knowledge of AI technologies, principles, and their practical use.

Bonus: If you’ve heard of NLU, LLMs, or Agentic AI and are excited to explore how these technologies are shaping the future of digital assistants—this internship is for you!

What We Offer

6 months internship
Part time: Monday to Friday, 09am-2pm
A modern and open space office located in Barcelona (Poblenou)
Flexible working hours and an excellent hybrid working model
You will receive a laptop and any material you need for your work.
Activities nearly every week (afterworks, games night, skating, padel and many more!)
Job opportunities in a global company
Exposure to cutting-edge AI technologies and real-world applications. 
Mentorship from experienced professionals in the CAI domain. 
A collaborative and innovative team culture in our Barcelona office. 

About Allianz Technology

With its headquarters in Munich, Germany, Allianz Technology is Allianz's global IT service provider and delivers IT solutions that drive the group's digitalization. With more than 11,000 employees in over 20 countries around the world, Allianz Technology is tasked to run, optimize, transform, and innovate the infrastructure, applications, and services together with Allianz companies to co-create the best customer experience.

We service the entire spectrum of digitalization – from one of the industry's largest IT infrastructure projects that spans data centres, networks, and security, to application platforms ranging from workplace services to digital interaction.

In short: We deliver comprehensive end-to-end IT solutions for Allianz in the digital age. We are the backbone of Allianz.

Find us at: www.linkedin.com/company/allianz-technology.

Commitment to Integrity, Fairness & Inclusion 

Allianz Group is one of the most trusted insurance and asset management companies in the world. Caring for our employees, their ambitions, dreams and challenges, is what makes us a unique employer. Together we can build an environment where everyone feels empowered and has the confidence to explore, to grow and to shape a better future for our customers and the world around us.

We at Allianz believe in a strong inclusive culture that encourages people to speak their minds, get involved and question the status quo. We are proud to be an equal opportunity employer and encourage you to bring your whole self to work, no matter where you are from, what you look like, who you love, or what you believe in. We therefore welcome applications regardless of race, ethnicity or cultural background, age, gender, nationality, religion, social class, disability, sexual orientation, or any other characteristics protected under applicable local laws and regulations.

To Recruitment Agencies

Allianz Technology has an in-house recruitment team that sources great candidates directly. Therefore, Allianz Technology does not accept unsolicited resumes from agencies or search firm recruiters.

When we do work with recruitment agencies, that engagement is formalized by a contract. Fees will only be paid when there is a contract in place. Without a contract in place, we will not accept invoices on unsolicited resumes, even if the candidate was ultimately employed by Allianz.

83187 | Data & AI | Student | n.a. | Allianz Technology | Part-Time | Temporary
    """

    job_post[0].company_name = "Allianz Technology"
    job_post[
        0
    ].apply_url = "https://careers.allianz.com/global/en/job/83187/Intern---Conversational-AI-Development-CAI-Team?utm_campaign=azgroup&utm_source=social&utm_medium=linkedinlimitedlistings"

    repository = JobPostsRepository()
    job_posts = await repository.get_cover_letter(job_post)
    print(job_posts[0].cover_letter)


if __name__ == "__main__":
    asyncio.run(main())
