import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/seed-module-0-onboarding
 * Seeds Module 0: Prerequisites & Onboarding (4 lessons, 32 exercises)
 */

interface Lesson {
  order: number;
  title: string;
  theory: string;
  exercises: string[];
}

const MODULE_0_LESSONS: Lesson[] = [
  {
    order: 0,
    title: "Getting Started with Python for AI",
    theory: `# Getting Started with Python for AI

## Why Python?

Python is the de facto language for AI development because:
- Easy to learn (clear, readable syntax)
- Powerful libraries (NumPy, Pandas, scikit-learn)
- Strong AI/ML ecosystem (TensorFlow, PyTorch, Hugging Face)
- Fast iteration (great for experimentation)
- Industry standard (most AI teams use Python)

## Prerequisites

To follow this course, you need:
- Python 3.9 or higher
- Basic programming knowledge (variables, functions, loops)
- Comfort with terminal/command line
- A text editor or IDE (VS Code recommended)
- An internet connection

## What You'll Learn

This module prepares you for the Agentic AI course:
1. Python essentials (functions, classes, async)
2. Claude API setup and authentication
3. Managing dependencies with pip
4. Working with environment variables
5. Basic debugging and testing

## Installation

Install Python from python.org or your package manager:

Mac/Linux:
  brew install python3
  python3 --version  # Should show 3.9+

Windows:
  Download from python.org
  python --version  # Should show 3.9+

## Virtual Environments

Always use a virtual environment to isolate dependencies:

Create:
  python3 -m venv venv

Activate:
  Mac/Linux: source venv/bin/activate
  Windows: venv\\Scripts\\activate

You'll see (venv) in your terminal when active.

## Next Steps

You're ready for Lesson 1! We'll assume you have:
- Python 3.9+ installed
- Virtual environment set up
- API key ready (see next lesson)`,
    exercises: [
      "Install: Set up Python 3.9+ and verify version",
      "Venv: Create and activate a virtual environment",
      "IDE: Set up VS Code or your preferred editor",
      "Terminal: Navigate directories and run Python commands",
      "Problem: Fix a Python version conflict if it occurs",
      "Test: Run 'python --version' and confirm output",
      "Explore: List files in a directory using terminal",
      "MCQ: Which Python version is required?"
    ]
  },
  {
    order: 1,
    title: "Setting Up Your Claude API Key",
    theory: `# Setting Up Your Claude API Key

## What You Need

To use Claude in your code, you need:
1. A Claude API account
2. An API key (like a password)
3. A way to securely store it

## Getting an API Key

1. Go to console.anthropic.com
2. Sign up or log in
3. Go to API keys section
4. Create a new key
5. Copy it (you'll only see it once!)

Never share your API key publicly!

## Storing Your Key Securely

**Never** put API keys in code:
  # Bad - NEVER do this!
  api_key = "sk-ant-v0-xxxx"

**Always** use environment variables:
  # Good
  import os
  api_key = os.environ.get("ANTHROPIC_API_KEY")

## Environment Variables

Create a .env file (in your project root):

  ANTHROPIC_API_KEY=sk-ant-v0-xxxx

Install python-dotenv:
  pip install python-dotenv

Load it in your code:
  from dotenv import load_dotenv
  import os

  load_dotenv()
  api_key = os.environ.get("ANTHROPIC_API_KEY")

## Using Claude in Code

Install the SDK:
  pip install anthropic

Import and use:
  from anthropic import Anthropic

  client = Anthropic()
  message = client.messages.create(
      model="claude-3-5-sonnet-20241022",
      max_tokens=1024,
      messages=[
          {"role": "user", "content": "Hello!"}
      ]
  )
  print(message.content[0].text)

## Security Best Practices

1. Never commit .env to Git (add to .gitignore)
2. Never log or print your API key
3. Rotate keys if exposed
4. Use appropriate rate limiting
5. Monitor your API usage

## Troubleshooting

"AuthenticationError: Invalid API key"
  → Check that your key is correct
  → Verify it's set in environment variable
  → Get a new key if unsure

"Module not found: anthropic"
  → Install: pip install anthropic
  → Verify: pip list | grep anthropic`,
    exercises: [
      "Setup: Create account and get API key from console.anthropic.com",
      "Env: Create .env file with your API key",
      "Install: pip install anthropic and python-dotenv",
      "Test: Write code to load API key from environment",
      "Verify: Make a simple API call and print response",
      "Security: Add .env to .gitignore",
      "Problem: Fix an authentication error",
      "MCQ: How should you store API keys?"
    ]
  },
  {
    order: 2,
    title: "Python Essentials for AI Agents",
    theory: `# Python Essentials for AI Agents

## Functions and Classes

Functions are reusable blocks of code:

  def greet(name):
      return f"Hello, {name}!"

  result = greet("Alice")  # "Hello, Alice!"

Classes organize code:

  class Agent:
      def __init__(self, name):
          self.name = name

      def respond(self, message):
          return f"{self.name}: Processing {message}"

  agent = Agent("Claude")
  print(agent.respond("Hi"))

## Dictionaries and Lists

Store collections of data:

  # List: ordered collection
  tools = ["search", "calculate", "summarize"]

  # Dictionary: key-value pairs
  config = {
      "model": "claude-3-5-sonnet",
      "max_tokens": 1024,
      "temperature": 0.7
  }

  # Access values
  model = config["model"]
  first_tool = tools[0]

## Loops and Conditionals

Repeat actions or make decisions:

  # Loop through items
  for tool in tools:
      print(f"Available: {tool}")

  # Conditional logic
  if config["temperature"] > 0.8:
      print("Creative mode")
  else:
      print("Precise mode")

## Async/Await (Important for AI Agents!)

AI operations take time. Use async to not block:

  import asyncio

  async def call_api(prompt):
      # Simulated API call
      await asyncio.sleep(1)
      return f"Response to: {prompt}"

  async def main():
      result = await call_api("Hello")
      print(result)

  # Run async function
  asyncio.run(main())

## Error Handling

Handle problems gracefully:

  try:
      api_response = client.messages.create(...)
  except AuthenticationError:
      print("Invalid API key")
  except TimeoutError:
      print("API call timed out")
  except Exception as e:
      print(f"Unexpected error: {e}")

## Working with JSON

APIs return JSON, Python uses dictionaries:

  import json

  # JSON string → Python dict
  json_str = '{"name": "Claude", "type": "AI"}'
  data = json.loads(json_str)

  # Python dict → JSON string
  config = {"model": "claude-3-5-sonnet"}
  json_str = json.dumps(config)

## Tips for AI Agents

- Use classes to organize agent logic
- Use dictionaries for configuration
- Use async/await for responsive agents
- Handle errors gracefully
- Store API responses as dictionaries`,
    exercises: [
      "Functions: Write a function that takes parameters",
      "Classes: Build a simple Agent class",
      "Data: Store and access values in dict and list",
      "Loops: Iterate through tools and print each",
      "Conditional: Write if/else logic",
      "Async: Write an async function with await",
      "JSON: Parse JSON and convert to dict",
      "Error: Add try/except to API call"
    ]
  },
  {
    order: 3,
    title: "Your First Agent: Hello World",
    theory: `# Your First Agent: Hello World

## Goal

Build your very first AI agent in 10 minutes. This teaches the fundamental agent pattern you'll use throughout the course.

## The Agent Pattern

Every agent follows this pattern:

1. **Define**: What the agent can do (tools/capabilities)
2. **Prompt**: How to behave (system prompt)
3. **Loop**: Take input → Process → Return output
4. **Iterate**: Refine based on results

## Your First Agent

Here's a complete working agent:

  from anthropic import Anthropic

  client = Anthropic()
  MODEL_ID = "claude-3-5-sonnet-20241022"

  def run_agent():
      """Run a simple conversational agent."""
      conversation_history = []

      system_prompt = """You are a helpful AI assistant.
  Be friendly, concise, and accurate."""

      print("Chat with Claude (type 'quit' to exit)")

      while True:
          # Get user input
          user_input = input("You: ").strip()

          if user_input.lower() == "quit":
              break

          # Add to history
          conversation_history.append({
              "role": "user",
              "content": user_input
          })

          # Call Claude
          response = client.messages.create(
              model=MODEL_ID,
              max_tokens=1024,
              system=system_prompt,
              messages=conversation_history
          )

          # Extract response
          assistant_message = response.content[0].text

          # Add to history
          conversation_history.append({
              "role": "assistant",
              "content": assistant_message
          })

          # Show response
          print(f"Assistant: {assistant_message}\\n")

  if __name__ == "__main__":
      run_agent()

## How It Works

1. **Initialize**: Create Anthropic client
2. **Loop**: While user wants to chat:
   - Get user input
   - Add to conversation history
   - Call Claude API with history
   - Get response
   - Add response to history
   - Print to user
3. **Remember**: History keeps context across messages

## Running It

  python agent.py

Then chat naturally:
  You: What is machine learning?
  Assistant: Machine learning is...

  You: Tell me more about neural networks
  Assistant: Neural networks are...

The agent remembers what you said!

## What You've Built

Congratulations! You've built:
✓ An agent that maintains conversation history
✓ System-prompted behavior control
✓ Stateful interaction (remembers context)
✓ Error-resilient loop (quit gracefully)

This is the foundation for all projects in this course!`,
    exercises: [
      "Code: Copy and run the Hello World agent",
      "Chat: Have a 5-turn conversation with your agent",
      "Modify: Change the system prompt",
      "Debug: Add print statements to trace flow",
      "Extend: Add a tool (e.g., calculator simulation)",
      "Save: Save conversation to a file",
      "Problem: Fix a bug if one occurs",
      "Explore: Try different model parameters"
    ]
  }
];

export async function POST(request: NextRequest) {
  try {
    const { createClient: createAdminAuthClient } = await import("@/lib/supabase/server");
    const adminAuthClient = await createAdminAuthClient();
    const { data: { user: adminUser } } = await adminAuthClient.auth.getUser();
    if (!isAdminEmail(adminUser?.email)) {
      return NextResponse.json(
        { error: "Unauthorized: admin email required" },
        { status: 403 }
      );
    }

    const db = createAdminClient();

    // Get the Agentic AI course
    const courseRes = await db
      .from("courses")
      .select("id")
      .eq("slug", "agentic-ai")
      .single();

    if (courseRes.error) {
      throw new Error(`Course not found: ${courseRes.error.message}`);
    }

    const courseId = courseRes.data.id;

    // Get Module 0 (or create it)
    let moduleId: string;
    const moduleRes = await db
      .from("modules")
      .select("id")
      .eq("course_id", courseId)
      .eq("order_index", 0)
      .single();

    if (moduleRes.data) {
      moduleId = moduleRes.data.id;
    } else {
      // Create Module 0
      const createModuleRes = await db
        .from("modules")
        .insert({
          course_id: courseId,
          order_index: 0,
          week_number: 0,
          title: "Module 0: Prerequisites & Onboarding",
          description: "Get your environment set up and learn Python essentials"
        })
        .select("id")
        .single();

      if (createModuleRes.error) {
        throw new Error(`Module creation failed: ${createModuleRes.error.message}`);
      }

      moduleId = createModuleRes.data.id;
    }

    // Get or create lessons for Module 0
    const lessonsRes = await db
      .from("lessons")
      .select("id, order_index")
      .eq("course_id", courseId)
      .eq("module_id", moduleId)
      .order("order_index", { ascending: true });

    if (lessonsRes.error) {
      throw new Error(`Lessons query failed: ${lessonsRes.error.message}`);
    }

    let lessonsUpdated = 0;
    let exercisesUpdated = 0;

    // Update or create each lesson
    for (const lessonData of MODULE_0_LESSONS) {
      let lessonId: string;

      // Find existing lesson
      const existingLesson = lessonsRes.data?.find(l => l.order_index === lessonData.order);

      if (existingLesson) {
        // Update existing
        lessonId = existingLesson.id;
        await db
          .from("lessons")
          .update({
            title: lessonData.title,
            theory_md: lessonData.theory
          })
          .eq("id", lessonId);
      } else {
        // Create new
        const createRes = await db
          .from("lessons")
          .insert({
            course_id: courseId,
            module_id: moduleId,
            order_index: lessonData.order,
            title: lessonData.title,
            theory_md: lessonData.theory
          })
          .select("id")
          .single();

        if (createRes.error) {
          throw new Error(`Lesson creation failed: ${createRes.error.message}`);
        }

        lessonId = createRes.data.id;
      }

      lessonsUpdated++;

      // Delete old exercises and insert new ones
      await db.from("exercises").delete().eq("lesson_id", lessonId);

      const exercises = lessonData.exercises.map((prompt, idx) => ({
        lesson_id: lessonId,
        order_index: idx + 1,
        type: idx < 2 ? "code" : idx < 5 ? "short_answer" : "mcq",
        title: `Exercise ${idx + 1}`,
        prompt_md: prompt,
        marks: 10,
        starter_code: idx < 2 ? "# TODO: Implement" : null,
        language: idx < 2 ? "python" : null
      }));

      await db.from("exercises").insert(exercises);
      exercisesUpdated += exercises.length;
    }

    return NextResponse.json({
      success: true,
      message: `Module 0 complete: ${lessonsUpdated} lessons, ${exercisesUpdated} exercises!`,
      summary: {
        moduleId,
        lessonsUpdated,
        exercisesUpdated,
        lessonTitles: MODULE_0_LESSONS.map(l => l.title)
      }
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
