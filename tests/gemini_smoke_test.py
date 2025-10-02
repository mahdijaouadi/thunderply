import asyncio
from dotenv import load_dotenv
from backend.src.adapters.outbound.llms.google_genai_llms import GoogleGenAI


async def main():
    load_dotenv()
    gemini_llm = GoogleGenAI()
    test_messages = [
        {
            "role": "user",
            "content": "Hello! Please respond with just 'Hello back!' to confirm you're working.",
        }
    ]
    response = gemini_llm(test_messages)
    print(f"Response: {response.content}")


if __name__ == "__main__":
    asyncio.run(main())
