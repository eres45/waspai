"""
Steel Browser Use Starter Template
Integrates Steel with browser-use framework to create an AI agent for web interactions.
Requires STEEL_API_KEY & OPENAI_API_KEY in .env file.
"""

import asyncio
from steel import Steel
from browser_use import Agent, BrowserSession
from langchain_openai import ChatOpenAI
import os
import time
from dotenv import load_dotenv

# Load variables from .env if present
load_dotenv()

# Initialize the Steel client with API key
api_key = os.getenv("STEEL_API_KEY")
if not api_key:
    # Fallback to the one provided by user if env not loaded
    api_key = "ste-TWfCy6vSBLkJQBlEiw0LdtqLAGfy8H7UGWg2IByPNG2fYO5ww7wPjQ03LTbl1EnmPIkCmeonQWcziwmMRqMzXbgUFROVqaFhTfd"

client = Steel(steel_api_key=api_key)

# Create a Steel session
print("Creating Steel session...")
session = client.sessions.create()
print(f"Session created at {session.session_viewer_url}")

# Connect browser-use to Steel
cdp_url = f"wss://connect.steel.dev?apiKey={api_key}&sessionId={session.id}"

# Create and configure the AI agent
# Note: Ensure OPENAI_API_KEY is set in your environment
model = ChatOpenAI(
    model="gpt-4o",
    temperature=0.3,
    api_key=os.getenv("OPENAI_API_KEY"),
)

task = "Go to docs.steel.dev, open the changelog, and tell me what's new."

agent = Agent(
    task=task,
    llm=model,
    browser_session=BrowserSession(cdp_url=cdp_url)
)

async def main():
  try:
      # Run the agent
      print("Running the agent...")
      await agent.run()
      print("Task completed!")
      
  except Exception as e:
      print(f"An error occurred: {e}")
  finally:
      time.sleep(10)
      
      # Clean up resources
      if session:
          client.sessions.release(session.id)
          print("Session released")
      print("Done!")

# Run the async main function
if __name__ == '__main__':
    asyncio.run(main())
