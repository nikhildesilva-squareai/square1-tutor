#!/usr/bin/env node
/**
 * Creates GitHub starter template repos for all Square 1 AI projects.
 * Run: node scripts/create-starter-templates.mjs
 *
 * Requires: gh CLI authenticated, git installed
 */
import { execSync } from "child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { join } from "path";

const OWNER = "nikhildesilva-squareai";
const TEMP_DIR = join(process.env.TEMP || "/tmp", "s1-templates");

// ─── All projects from database ──────────────────────────────────────────────
const PROJECTS = [
  // AI Product Management
  { title: "AI Product Spec Document", course: "AI Product Management", difficulty: "beginner", tech: ["Notion","User Research","PRD"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Competitive Analysis Report", course: "AI Product Management", difficulty: "beginner", tech: ["Research","Analysis","Presentation"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "User Research Plan", course: "AI Product Management", difficulty: "beginner", tech: ["User Interviews","Surveys","Personas"], hours: 6, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "AI Ethics Review Framework", course: "AI Product Management", difficulty: "intermediate", tech: ["Ethics","Bias Analysis","Documentation"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Go-to-Market Strategy", course: "AI Product Management", difficulty: "intermediate", tech: ["GTM","Pricing","Positioning"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Product Roadmap", course: "AI Product Management", difficulty: "intermediate", tech: ["Roadmapping","Prioritisation","OKRs"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Stakeholder Presentation", course: "AI Product Management", difficulty: "intermediate", tech: ["Presentation","Data","Storytelling"], hours: 10, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "AI Metrics Dashboard Design", course: "AI Product Management", difficulty: "intermediate", tech: ["Analytics","KPIs","Figma"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Build vs Buy Analysis", course: "AI Product Management", difficulty: "advanced", tech: ["Analysis","Cost Modelling","Decision Framework"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Full AI Product Launch", course: "AI Product Management", difficulty: "advanced", tech: ["End-to-End","Launch","Retrospective"], hours: 25, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  // Artificial Intelligence
  { title: "Pathfinding Visualiser", course: "Artificial Intelligence", difficulty: "beginner", tech: ["Python","Pygame","BFS/DFS/A*"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "8-Puzzle Solver", course: "Artificial Intelligence", difficulty: "beginner", tech: ["Python","Heuristic Search"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Tic-Tac-Toe AI", course: "Artificial Intelligence", difficulty: "beginner", tech: ["Python","Minimax"], hours: 6, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Connect 4 with AI", course: "Artificial Intelligence", difficulty: "intermediate", tech: ["Python","Alpha-Beta Pruning"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Sudoku Solver & Generator", course: "Artificial Intelligence", difficulty: "intermediate", tech: ["Python","CSP","Backtracking"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Knowledge Graph Builder", course: "Artificial Intelligence", difficulty: "intermediate", tech: ["Python","spaCy","NetworkX"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Smart Calendar Scheduler", course: "Artificial Intelligence", difficulty: "intermediate", tech: ["Python","Planning","Flask"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Bayesian Network Analyser", course: "Artificial Intelligence", difficulty: "intermediate", tech: ["Python","pgmpy","Probability"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Self-Driving Car Sim (2D)", course: "Artificial Intelligence", difficulty: "advanced", tech: ["Python","Reinforcement Learning","Pygame"], hours: 20, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "AI Chess Engine", course: "Artificial Intelligence", difficulty: "advanced", tech: ["Python","Minimax","Neural Network"], hours: 22, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  // Computer Vision
  { title: "Face Detection App", course: "Computer Vision", difficulty: "beginner", tech: ["Python","OpenCV","Haar Cascades"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "OCR Receipt Scanner", course: "Computer Vision", difficulty: "beginner", tech: ["Python","Tesseract","OpenCV"], hours: 10, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Real-time Object Counter", course: "Computer Vision", difficulty: "beginner", tech: ["Python","OpenCV","YOLO"], hours: 10, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Image Classifier (Custom)", course: "Computer Vision", difficulty: "intermediate", tech: ["Python","PyTorch","Transfer Learning"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Document Scanner", course: "Computer Vision", difficulty: "intermediate", tech: ["Python","OpenCV","Perspective Transform"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Pose Estimation Fitness Tracker", course: "Computer Vision", difficulty: "intermediate", tech: ["Python","MediaPipe","OpenCV"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Face Recognition System", course: "Computer Vision", difficulty: "intermediate", tech: ["Python","FaceNet","dlib"], hours: 16, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "License Plate Reader", course: "Computer Vision", difficulty: "advanced", tech: ["Python","YOLO","Tesseract"], hours: 18, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Video Style Transfer", course: "Computer Vision", difficulty: "advanced", tech: ["Python","PyTorch","Neural Style"], hours: 20, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "AI Image Generation App", course: "Computer Vision", difficulty: "advanced", tech: ["Python","Stable Diffusion","Gradio"], hours: 18, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  // Cybersecurity
  { title: "Password Strength Analyser", course: "Cybersecurity", difficulty: "beginner", tech: ["Python","Cryptography"], hours: 6, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Caesar/AES Encryption Tool", course: "Cybersecurity", difficulty: "beginner", tech: ["Python","Cryptography","AES"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Port Scanner", course: "Cybersecurity", difficulty: "beginner", tech: ["Python","Socket","Networking"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "SQL Injection Lab", course: "Cybersecurity", difficulty: "intermediate", tech: ["Python","Flask","SQLite"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "XSS Detection Lab", course: "Cybersecurity", difficulty: "intermediate", tech: ["Python","Flask","JavaScript"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "JWT Auth System", course: "Cybersecurity", difficulty: "intermediate", tech: ["Python","Flask","JWT","OAuth"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Secure File Vault", course: "Cybersecurity", difficulty: "intermediate", tech: ["Python","AES","Argon2"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Network Packet Analyser", course: "Cybersecurity", difficulty: "intermediate", tech: ["Python","Scapy","Wireshark"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "OWASP Vulnerability Scanner", course: "Cybersecurity", difficulty: "advanced", tech: ["Python","Requests","BeautifulSoup"], hours: 20, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Incident Response Simulator", course: "Cybersecurity", difficulty: "advanced", tech: ["Python","Flask","Docker"], hours: 22, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  // Data Science
  { title: "Exploratory Data Analysis Tool", course: "Data Science", difficulty: "beginner", tech: ["Python","Pandas","Matplotlib"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "A/B Test Analyser", course: "Data Science", difficulty: "beginner", tech: ["Python","SciPy","Statistics"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Sales Dashboard", course: "Data Science", difficulty: "beginner", tech: ["Python","Streamlit","Plotly"], hours: 10, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Customer Churn Predictor", course: "Data Science", difficulty: "intermediate", tech: ["Python","scikit-learn","Pandas"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Cohort Analysis Tool", course: "Data Science", difficulty: "intermediate", tech: ["Python","Pandas","SQL"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Survey Data Analyser", course: "Data Science", difficulty: "intermediate", tech: ["Python","Pandas","NLP"], hours: 10, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Real Estate Price Map", course: "Data Science", difficulty: "intermediate", tech: ["Python","Folium","GeoPandas"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Time Series Forecaster", course: "Data Science", difficulty: "intermediate", tech: ["Python","Prophet","ARIMA"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Data Pipeline Builder", course: "Data Science", difficulty: "advanced", tech: ["Python","Airflow","PostgreSQL"], hours: 18, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Full Analytics Platform", course: "Data Science", difficulty: "advanced", tech: ["Python","dbt","Streamlit","PostgreSQL"], hours: 22, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  // DevOps Engineering
  { title: "CI/CD Pipeline", course: "DevOps Engineering", difficulty: "beginner", tech: ["GitHub Actions","Docker","Node.js"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Docker Multi-Container App", course: "DevOps Engineering", difficulty: "beginner", tech: ["Docker","Docker Compose","Nginx"], hours: 10, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Infrastructure as Code", course: "DevOps Engineering", difficulty: "beginner", tech: ["Terraform","AWS","CLI"], hours: 10, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Kubernetes Deployment", course: "DevOps Engineering", difficulty: "intermediate", tech: ["Kubernetes","Docker","Helm"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Monitoring Stack", course: "DevOps Engineering", difficulty: "intermediate", tech: ["Prometheus","Grafana","Docker"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Log Aggregation System", course: "DevOps Engineering", difficulty: "intermediate", tech: ["ELK Stack","Docker","Filebeat"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "GitOps Workflow", course: "DevOps Engineering", difficulty: "intermediate", tech: ["ArgoCD","Kubernetes","Git"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Secrets Management", course: "DevOps Engineering", difficulty: "intermediate", tech: ["Vault","Docker","Terraform"], hours: 10, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Blue-Green Deployment", course: "DevOps Engineering", difficulty: "advanced", tech: ["AWS","Terraform","Docker"], hours: 18, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Full Platform Engineering", course: "DevOps Engineering", difficulty: "advanced", tech: ["Kubernetes","Terraform","ArgoCD","Prometheus"], hours: 25, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  // Drone Technology
  { title: "Flight Controller Sim", course: "Drone Technology", difficulty: "beginner", tech: ["Python","PID Control","Matplotlib"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "GPS Waypoint Navigator", course: "Drone Technology", difficulty: "beginner", tech: ["Python","GPS","DroneKit"], hours: 10, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Altitude Hold System", course: "Drone Technology", difficulty: "beginner", tech: ["Python","PID","Sensors"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Obstacle Avoidance System", course: "Drone Technology", difficulty: "intermediate", tech: ["Python","OpenCV","Ultrasonic"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Aerial Photo Mapper", course: "Drone Technology", difficulty: "intermediate", tech: ["Python","OpenCV","Stitching"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Object Tracking Drone", course: "Drone Technology", difficulty: "intermediate", tech: ["Python","OpenCV","PID","Tracking"], hours: 16, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Autonomous Landing System", course: "Drone Technology", difficulty: "intermediate", tech: ["Python","ArUco Markers","OpenCV"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Swarm Coordination", course: "Drone Technology", difficulty: "advanced", tech: ["Python","Multi-Agent","Communication"], hours: 20, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Delivery Route Planner", course: "Drone Technology", difficulty: "advanced", tech: ["Python","A*","Optimisation"], hours: 18, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Full Autonomous Mission", course: "Drone Technology", difficulty: "advanced", tech: ["Python","ROS","OpenCV","PID"], hours: 25, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  // Full Stack Development
  { title: "REST API with CRUD", course: "Full Stack Development", difficulty: "beginner", tech: ["Node.js","Express","PostgreSQL"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Auth System (JWT + OAuth)", course: "Full Stack Development", difficulty: "beginner", tech: ["Node.js","JWT","OAuth","Supabase"], hours: 10, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Blog Platform with CMS", course: "Full Stack Development", difficulty: "beginner", tech: ["Next.js","Supabase","Markdown"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Real-time Chat App", course: "Full Stack Development", difficulty: "intermediate", tech: ["Next.js","WebSockets","Redis"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "E-commerce Store", course: "Full Stack Development", difficulty: "intermediate", tech: ["Next.js","Stripe","Supabase"], hours: 18, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "File Storage Service", course: "Full Stack Development", difficulty: "intermediate", tech: ["Node.js","S3","Express"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Social Feed with Notifications", course: "Full Stack Development", difficulty: "intermediate", tech: ["Next.js","Supabase","Realtime"], hours: 16, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Multi-tenant SaaS", course: "Full Stack Development", difficulty: "intermediate", tech: ["Next.js","Supabase","RLS"], hours: 18, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Analytics Dashboard", course: "Full Stack Development", difficulty: "advanced", tech: ["Next.js","D3.js","PostgreSQL"], hours: 18, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Microservices API Gateway", course: "Full Stack Development", difficulty: "advanced", tech: ["Node.js","Docker","Redis","RabbitMQ"], hours: 20, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Mobile App (React Native)", course: "Full Stack Development", difficulty: "advanced", tech: ["React Native","Expo","Supabase"], hours: 20, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Production SaaS (Capstone)", course: "Full Stack Development", difficulty: "advanced", tech: ["Next.js","Supabase","Stripe","Docker"], hours: 30, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  // Game Development
  { title: "Snake Game", course: "Game Development", difficulty: "beginner", tech: ["Python","Pygame"], hours: 6, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Breakout / Brick Breaker", course: "Game Development", difficulty: "beginner", tech: ["Python","Pygame","Physics"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "2D Platformer", course: "Game Development", difficulty: "beginner", tech: ["Python","Pygame","Tilemap"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Top-Down Shooter", course: "Game Development", difficulty: "intermediate", tech: ["Python","Pygame","Particles"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Inventory & Crafting System", course: "Game Development", difficulty: "intermediate", tech: ["Python","Pygame","JSON"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "AI Enemy with State Machine", course: "Game Development", difficulty: "intermediate", tech: ["Python","Pygame","FSM"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Tower Defence Game", course: "Game Development", difficulty: "intermediate", tech: ["Python","Pygame","A*"], hours: 16, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Multiplayer Pong", course: "Game Development", difficulty: "intermediate", tech: ["Python","Pygame","WebSockets"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Procedural Dungeon Generator", course: "Game Development", difficulty: "advanced", tech: ["Python","Pygame","Algorithms"], hours: 18, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Full Indie Game (Published)", course: "Game Development", difficulty: "advanced", tech: ["Python","Pygame","itch.io"], hours: 30, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  // Generative AI
  { title: "AI-Powered Chatbot", course: "Generative AI", difficulty: "beginner", tech: ["Python or JavaScript","Anthropic SDK","Next.js or Flask"], hours: 8, reqs: ["Multi-turn conversation with history","Custom system prompt / persona","Streaming responses","Simple web UI"] },
  { title: "Smart Document Q&A (RAG)", course: "Generative AI", difficulty: "beginner", tech: ["Python","Anthropic SDK","pgvector or Chroma","Next.js"], hours: 10, reqs: ["Document upload and chunking","Embedding generation","Vector similarity search","Context-injected Q&A"] },
  { title: "Prompt Engineering Toolkit", course: "Generative AI", difficulty: "beginner", tech: ["Next.js","Anthropic SDK","Supabase"], hours: 6, reqs: ["Side-by-side prompt comparison","Temperature and model controls","Save and version prompts","Export results"] },
  { title: "AI Code Review Assistant", course: "Generative AI", difficulty: "intermediate", tech: ["Next.js","Anthropic SDK","Monaco Editor","Supabase"], hours: 12, reqs: ["Code editor with syntax highlighting","AI-powered code review","Explain code in plain English","Suggest refactors and fixes"] },
  { title: "AI Research Agent", course: "Generative AI", difficulty: "intermediate", tech: ["Python","Anthropic SDK","Tavily or SerpAPI","LangChain (optional)"], hours: 15, reqs: ["Web search tool integration","Multi-step reasoning loop","Source citation","Structured report output"] },
  { title: "Personalised Learning Assistant", course: "Generative AI", difficulty: "intermediate", tech: ["Next.js","Anthropic SDK","Supabase"], hours: 14, reqs: ["Initial skill assessment","Adaptive explanations by level","Quiz generation","Progress tracking"] },
  { title: "RAG-Powered Knowledge Base", course: "Generative AI", difficulty: "intermediate", tech: ["Next.js","Supabase + pgvector","Anthropic SDK","PDF/DOCX parser"], hours: 16, reqs: ["Multi-document ingestion","Hybrid search (keyword + semantic)","Source attribution","Admin upload interface"] },
  { title: "AI Content Generation Platform", course: "Generative AI", difficulty: "intermediate", tech: ["Next.js","Anthropic SDK","Supabase","Vercel"], hours: 12, reqs: ["Content brief input","Multiple output formats","Tone and style controls","Save and export content"] },
  { title: "AI-Powered SaaS Starter", course: "Generative AI", difficulty: "advanced", tech: ["Next.js","Supabase","Anthropic SDK","Stripe"], hours: 25, reqs: ["Authentication with Supabase Auth","Stripe billing integration","Per-user AI usage tracking","Rate limiting by subscription tier"] },
  { title: "Multi-Agent AI System", course: "Generative AI", difficulty: "advanced", tech: ["Python","Anthropic SDK","Redis or Supabase","FastAPI"], hours: 20, reqs: ["Orchestrator agent","3+ specialised sub-agents","Agent communication protocol","Human approval checkpoints"] },
  // LLM Agent Architect
  { title: "Tool-Using Chatbot", course: "LLM Agent Architect", difficulty: "beginner", tech: ["Python","Anthropic SDK","Function Calling"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Code Executor Agent", course: "LLM Agent Architect", difficulty: "beginner", tech: ["Python","Anthropic SDK","Subprocess"], hours: 10, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Web Research Agent", course: "LLM Agent Architect", difficulty: "beginner", tech: ["Python","Anthropic SDK","Tavily"], hours: 10, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Multi-Step Reasoning Agent", course: "LLM Agent Architect", difficulty: "intermediate", tech: ["Python","Anthropic SDK","ReAct"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Agent with Memory", course: "LLM Agent Architect", difficulty: "intermediate", tech: ["Python","Anthropic SDK","Vector DB"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Multi-Agent Debate", course: "LLM Agent Architect", difficulty: "intermediate", tech: ["Python","Anthropic SDK"], hours: 16, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Autonomous Task Planner", course: "LLM Agent Architect", difficulty: "intermediate", tech: ["Python","Anthropic SDK","DAG"], hours: 16, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Human-in-the-Loop Agent", course: "LLM Agent Architect", difficulty: "advanced", tech: ["Python","Anthropic SDK","Flask"], hours: 18, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Agent Evaluation Framework", course: "LLM Agent Architect", difficulty: "advanced", tech: ["Python","Anthropic SDK","Pytest"], hours: 18, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Production Multi-Agent System", course: "LLM Agent Architect", difficulty: "advanced", tech: ["Python","Anthropic SDK","Redis","FastAPI"], hours: 25, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  // Machine Learning
  { title: "House Price Predictor", course: "Machine Learning", difficulty: "beginner", tech: ["Python","scikit-learn","Pandas"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Email Spam Classifier", course: "Machine Learning", difficulty: "beginner", tech: ["Python","scikit-learn","NLP"], hours: 8, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Customer Segmentation Dashboard", course: "Machine Learning", difficulty: "beginner", tech: ["Python","K-means","Streamlit"], hours: 10, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Movie Recommendation Engine", course: "Machine Learning", difficulty: "intermediate", tech: ["Python","Collaborative Filtering","Flask"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Fraud Detection System", course: "Machine Learning", difficulty: "intermediate", tech: ["Python","XGBoost","FastAPI"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Stock Price Forecaster", course: "Machine Learning", difficulty: "intermediate", tech: ["Python","LSTM","PyTorch"], hours: 14, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Image Classifier (CNN)", course: "Machine Learning", difficulty: "intermediate", tech: ["Python","PyTorch","CNN"], hours: 12, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "Sentiment Analysis API", course: "Machine Learning", difficulty: "intermediate", tech: ["Python","Hugging Face","FastAPI"], hours: 10, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "AutoML Pipeline Builder", course: "Machine Learning", difficulty: "advanced", tech: ["Python","Optuna","MLflow"], hours: 18, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
  { title: "End-to-End ML Platform", course: "Machine Learning", difficulty: "advanced", tech: ["Python","MLflow","Docker","FastAPI"], hours: 25, reqs: ["Complete all milestones","Deploy to GitHub","Write README","Pass AI code review"] },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function isPython(tech) {
  return tech.some(t => /python|pygame|flask|fastapi|scikit|pandas|pytorch|opencv|anthropic sdk/i.test(t));
}
function isNextjs(tech) {
  return tech.some(t => /next\.?js/i.test(t));
}
function isNode(tech) {
  return tech.some(t => /node\.?js|express/i.test(t));
}
function isDocker(tech) {
  return tech.some(t => /docker|kubernetes|terraform|helm/i.test(t));
}

function getPythonDeps(tech) {
  const deps = [];
  for (const t of tech) {
    const tl = t.toLowerCase();
    if (tl.includes("pygame")) deps.push("pygame");
    if (tl.includes("flask")) deps.push("flask");
    if (tl.includes("fastapi")) deps.push("fastapi", "uvicorn");
    if (tl.includes("opencv")) deps.push("opencv-python");
    if (tl.includes("pandas")) deps.push("pandas");
    if (tl.includes("matplotlib")) deps.push("matplotlib");
    if (tl.includes("scikit") || tl.includes("k-means")) deps.push("scikit-learn");
    if (tl.includes("pytorch") || tl.includes("lstm") || tl.includes("cnn") || tl.includes("neural")) deps.push("torch", "torchvision");
    if (tl.includes("streamlit")) deps.push("streamlit");
    if (tl.includes("plotly")) deps.push("plotly");
    if (tl.includes("spacy")) deps.push("spacy");
    if (tl.includes("networkx")) deps.push("networkx");
    if (tl.includes("pgmpy")) deps.push("pgmpy");
    if (tl.includes("mediapipe")) deps.push("mediapipe");
    if (tl.includes("tesseract")) deps.push("pytesseract", "Pillow");
    if (tl.includes("anthropic")) deps.push("anthropic");
    if (tl.includes("scapy")) deps.push("scapy");
    if (tl.includes("beautifulsoup")) deps.push("beautifulsoup4", "requests");
    if (tl.includes("requests")) deps.push("requests");
    if (tl.includes("scipy") || tl.includes("statistics")) deps.push("scipy");
    if (tl.includes("prophet")) deps.push("prophet");
    if (tl.includes("xgboost")) deps.push("xgboost");
    if (tl.includes("hugging face")) deps.push("transformers", "torch");
    if (tl.includes("optuna")) deps.push("optuna");
    if (tl.includes("mlflow")) deps.push("mlflow");
    if (tl.includes("folium")) deps.push("folium");
    if (tl.includes("geopandas")) deps.push("geopandas");
    if (tl.includes("gradio")) deps.push("gradio");
    if (tl.includes("dlib")) deps.push("dlib");
    if (tl.includes("tavily")) deps.push("tavily-python");
    if (tl.includes("cryptography") || tl.includes("aes") || tl.includes("argon")) deps.push("cryptography");
    if (tl.includes("dronekit")) deps.push("dronekit");
    if (tl.includes("redis")) deps.push("redis");
  }
  return [...new Set(deps)];
}

function generateReadme(p) {
  const diffBadge = p.difficulty === "beginner" ? "![Beginner](https://img.shields.io/badge/difficulty-beginner-22C55E)" :
    p.difficulty === "intermediate" ? "![Intermediate](https://img.shields.io/badge/difficulty-intermediate-F59E0B)" :
    "![Advanced](https://img.shields.io/badge/difficulty-advanced-EF4444)";

  const techBadges = p.tech.map(t => `\`${t}\``).join(" ");

  return `# ${p.title}

${diffBadge} ![${p.course}](https://img.shields.io/badge/course-${encodeURIComponent(p.course).replace(/-/g, "--")}-0056CE)

> **Square 1 AI** starter template for the **${p.title}** project.

## Tech Stack

${techBadges}

## Requirements

${p.reqs.map(r => `- [ ] ${r}`).join("\n")}

## Getting Started

\`\`\`bash
# Clone this template
git clone https://github.com/${OWNER}/starter-${toSlug(p.title)}.git
cd starter-${toSlug(p.title)}

${isPython(p.tech) ? `# Set up Python environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt

# Run
python main.py` : isNextjs(p.tech) ? `# Install dependencies
npm install

# Run dev server
npm run dev` : isNode(p.tech) ? `# Install dependencies
npm install

# Run
npm start` : isDocker(p.tech) ? `# Build and run
docker-compose up --build` : `# Follow the project instructions`}
\`\`\`

## Project Structure

\`\`\`
${toSlug(p.title)}/
${isPython(p.tech) ? `├── main.py            # Entry point
├── src/               # Your source code
│   └── __init__.py
├── tests/             # Unit tests
│   └── test_main.py
├── requirements.txt   # Python dependencies
├── .gitignore
└── README.md` : isNextjs(p.tech) ? `├── app/
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Home page
│   └── globals.css
├── components/        # React components
├── lib/               # Utilities
├── public/            # Static assets
├── package.json
├── .env.example
├── .gitignore
└── README.md` : isNode(p.tech) ? `├── src/
│   ├── index.js       # Entry point
│   ├── routes/        # API routes
│   └── middleware/     # Middleware
├── tests/
├── package.json
├── .env.example
├── .gitignore
└── README.md` : isDocker(p.tech) ? `├── docker-compose.yml
├── Dockerfile
├── src/               # Application code
├── config/            # Configuration files
├── .gitignore
└── README.md` : `├── docs/              # Documentation
├── assets/            # Images, diagrams
├── templates/         # Templates
├── .gitignore
└── README.md`}
\`\`\`

## Estimated Time

~${p.hours} hours

## Submission

1. Complete the project following all requirements above
2. Push your code to your own **public** GitHub repository
3. Go to [Square 1 AI](https://square1-tutor.vercel.app/projects) and submit your repo URL
4. Our AI will review your actual code and give you a score with line-level feedback

---

Built with [Square 1 AI](https://square1ai.com) | Learn. Build. Get Hired.
`;
}

function generateStarterFiles(p) {
  const files = {};

  if (isPython(p.tech)) {
    const deps = getPythonDeps(p.tech);
    files["requirements.txt"] = deps.length > 0 ? deps.join("\n") + "\n" : "# Add your dependencies here\n";
    files["main.py"] = `"""
${p.title} — Square 1 AI Project
Course: ${p.course}
Difficulty: ${p.difficulty}

TODO: Implement your solution here.
"""


def main():
    print("${p.title} — Starting...")
    # Your code here


if __name__ == "__main__":
    main()
`;
    files["src/__init__.py"] = "";
    files["tests/test_main.py"] = `"""Tests for ${p.title}"""
import unittest


class Test${p.title.replace(/[^a-zA-Z]/g, "")}(unittest.TestCase):
    def test_placeholder(self):
        \"\"\"TODO: Write your tests here.\"\"\"
        self.assertTrue(True)


if __name__ == "__main__":
    unittest.main()
`;
    files[".gitignore"] = `__pycache__/
*.py[cod]
*$py.class
venv/
.env
*.egg-info/
dist/
build/
.idea/
.vscode/
`;
  } else if (isNextjs(p.tech)) {
    files["package.json"] = JSON.stringify({
      name: `starter-${toSlug(p.title)}`,
      version: "0.1.0",
      private: true,
      scripts: { dev: "next dev", build: "next build", start: "next start" },
      dependencies: { next: "^15.0.0", react: "^19.0.0", "react-dom": "^19.0.0" },
      devDependencies: { typescript: "^5", "@types/node": "^22", "@types/react": "^19" },
    }, null, 2) + "\n";
    files["app/layout.tsx"] = `export const metadata = { title: "${p.title}", description: "Square 1 AI Project" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
`;
    files["app/page.tsx"] = `export default function Home() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <h1>${p.title}</h1>
      <p>Square 1 AI — ${p.course}</p>
      <p>TODO: Build your project here.</p>
    </main>
  );
}
`;
    files["app/globals.css"] = `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; }
`;
    files[".env.example"] = "# Add your environment variables here\n# ANTHROPIC_API_KEY=sk-...\n";
    files[".gitignore"] = `node_modules/
.next/
out/
.env
.env.local
`;
    files["tsconfig.json"] = JSON.stringify({ compilerOptions: { target: "ES2017", lib: ["dom","dom.iterable","esnext"], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "preserve", incremental: true, plugins: [{ name: "next" }], paths: { "@/*": ["./*"] } }, include: ["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"], exclude: ["node_modules"] }, null, 2) + "\n";
  } else if (isNode(p.tech)) {
    files["package.json"] = JSON.stringify({
      name: `starter-${toSlug(p.title)}`,
      version: "0.1.0",
      private: true,
      scripts: { start: "node src/index.js", dev: "node --watch src/index.js", test: "node --test tests/" },
      dependencies: { express: "^4.18.0" },
    }, null, 2) + "\n";
    files["src/index.js"] = `const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ project: "${p.title}", status: "TODO: implement" });
});

app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
`;
    files["src/routes/.gitkeep"] = "";
    files["tests/test.js"] = `const { describe, it } = require("node:test");
const assert = require("node:assert");

describe("${p.title}", () => {
  it("should pass placeholder test", () => {
    assert.strictEqual(true, true);
  });
});
`;
    files[".env.example"] = "PORT=3000\n# Add your environment variables here\n";
    files[".gitignore"] = "node_modules/\n.env\n.env.local\n";
  } else if (isDocker(p.tech)) {
    files["docker-compose.yml"] = `version: "3.8"
services:
  app:
    build: .
    ports:
      - "8080:8080"
    # TODO: Add your services here
`;
    files["Dockerfile"] = `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
`;
    files["src/.gitkeep"] = "";
    files["config/.gitkeep"] = "";
    files[".gitignore"] = "node_modules/\n.env\n*.log\n";
  } else {
    // Non-code projects (AI PM, etc.)
    files["docs/.gitkeep"] = "";
    files["assets/.gitkeep"] = "";
    files["templates/.gitkeep"] = "";
    files[".gitignore"] = ".env\n*.log\n.DS_Store\n";
  }

  return files;
}

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: "pipe", ...opts }).trim();
  } catch (e) {
    return e.stderr || e.message;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Creating ${PROJECTS.length} starter template repos under ${OWNER}...`);

  if (existsSync(TEMP_DIR)) rmSync(TEMP_DIR, { recursive: true });
  mkdirSync(TEMP_DIR, { recursive: true });

  let created = 0, skipped = 0, failed = 0;

  for (const p of PROJECTS) {
    const slug = `starter-${toSlug(p.title)}`;
    const repoDir = join(TEMP_DIR, slug);

    // Check if repo already exists
    const exists = run(`gh repo view ${OWNER}/${slug} --json name 2>&1`);
    if (exists.includes(`"name":`)) {
      console.log(`  SKIP  ${slug} (already exists)`);
      skipped++;
      continue;
    }

    console.log(`  CREATE  ${slug}...`);

    // Create directory + files
    mkdirSync(repoDir, { recursive: true });
    writeFileSync(join(repoDir, "README.md"), generateReadme(p));

    const starterFiles = generateStarterFiles(p);
    for (const [path, content] of Object.entries(starterFiles)) {
      const fullPath = join(repoDir, path);
      const dir = fullPath.replace(/[/\\][^/\\]+$/, "");
      mkdirSync(dir, { recursive: true });
      writeFileSync(fullPath, content);
    }

    // Git init + commit
    run("git init -b main", { cwd: repoDir });
    run('git config user.email "hello@square1ai.com"', { cwd: repoDir });
    run('git config user.name "Square 1 AI"', { cwd: repoDir });
    run("git add -A", { cwd: repoDir });
    run(`git commit -m "Initial starter template for ${p.title}"`, { cwd: repoDir });

    // Create repo on GitHub + push
    const result = run(
      `gh repo create ${OWNER}/${slug} --public --source . --push --description "${p.title} — ${p.course} starter template (Square 1 AI)"`,
      { cwd: repoDir }
    );

    if (result.includes("github.com") || result.includes("Created")) {
      // Mark as template repo
      run(`gh api repos/${OWNER}/${slug} -X PATCH -f is_template=true`);
      created++;
      console.log(`    OK  https://github.com/${OWNER}/${slug}`);
    } else {
      console.log(`    FAIL  ${result}`);
      failed++;
    }
  }

  // Cleanup
  rmSync(TEMP_DIR, { recursive: true, force: true });

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch(console.error);
