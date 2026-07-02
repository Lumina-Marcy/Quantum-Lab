# Quantum-Lab

Hypothesis: We believe that experiential learning is the missing link in quantum education. By allowing users to see, interact with, and experiment with quantum concepts through familiar real-world problems, we can make quantum computing understandable to anyone regardless of technical background.

Quantum Quest is an interactive educational platform that helps everyday people understand quantum computing through visual storytelling and simulation.
Rather than teaching equations or theory, we allow users to experience how quantum computers approach problems differently than traditional computers.
Through missions focused on cybersecurity, search, healthcare, and logistics, users gain an intuitive understanding of one of the most important technologies shaping the future.
Our goal is simple:
Make quantum computing understandable in five minutes or less.

Project Description: (Rather than teaching equations, we teach through experience. )
Quantum Lab
Experience the Future of Problem Solving
An interactive learning experience that helps everyday people understand quantum computing through stories, simulations, and hands-on exploration.
Rather than teaching complex mathematics or physics, Quantum Quest transforms abstract quantum concepts into relatable experiences. Users step into real-world scenarios from protecting a password vault to finding a critical file in a massive warehouse and discover how quantum computers approach problems differently from traditional computers.
Through interactive simulations, decision-making challenges, and visual comparisons between classical and quantum approaches, users learn not only how quantum computing could impact cybersecurity, but also how it could transform fields such as healthcare, logistics, finance, and scientific discovery.
Our goal is to make one of the most important emerging technologies of the 21st century understandable to anyone, regardless of technical background.

Flow
Home
"What if computers could explore many possibilities at once?"
↓
Choose a Mission
Mission 1: The Password Vault
Learn how encryption works and why quantum computing challenges current security systems.
Mission 2: Find the Exit
Navigate a maze using both classical and quantum search.
Mission 3: Lost Medical Breakthrough
Search millions of molecular combinations to find a life-saving treatment.
Mission 4: The Supply Chain Crisis
Optimize routes and deliveries across a complex logistics network.
↓
1-Minute Interactive Experience
The user plays through a scenario.
↓
Decision Point
The user chooses strategies.
↓
Outcome
Consequences unfold.
↓
How Did The Computer Think?
This is where the side-by-side comparison lives.
Classical Search:
Checking Path #1...
Checking Path #2...
Checking Path #3...
Quantum Search:
Exploring possibilities...
Amplifying correct solution...
Probability: 87%
Visual animations make this intuitive.

User Personas/Audience
Our intended audience is everyday internet users, students, young professionals, and individuals who regularly use online services but have limited knowledge of cybersecurity and quantum computing. They value privacy, security, and protecting their personal information, but often assume that current security measures are sufficient.
The problem they face is a lack of awareness about how advances in quantum computing could threaten the encryption systems that currently protect passwords, banking information, medical records, and online communications. While many users have heard of cybersecurity risks, quantum computing remains a complex and unfamiliar topic that is difficult to understand through traditional articles, videos, or technical explanations.
Our solution provides an interactive simulation and sandbox environment that allows users to visualize these threats, experiment with security concepts, and learn about quantum-resistant technologies in an engaging and accessible way. By making abstract cybersecurity risks tangible, we help users better understand and prepare for the future of digital security.
User Stories
MVP (Without these features, the application will not be useful)
As a User, I can enter sample personal data at the start and see it exposed throughout the scenario, making the cybersecurity risks feel personal and tangible. 
As a User, I can make decisions throughout a scenario and immediately see the consequences of those choices.
As a User, I can receive an explanation after each story that connects the scenario to real-world quantum computing and cybersecurity risks.
As a User, I can visually compare how a classical computer and a quantum computer approach the same problem so I can understand the difference without needing technical knowledge.
As a User, I can complete a real-world mission in under five minutes and walk away with a practical understanding of a quantum concept.

Stretch Features (When time is running short, these features will get cut)
As a User, I can play a scenario-matched quantum game after completing a story that reinforces the concept I just learned.
As a User, I can earn a Quantum Readiness Score based on decisions made across multiple scenarios.
As a User, I can unlock additional scenarios covering banking, healthcare, government systems, and personal privacy risks.
As a User, I can explore a sandbox environment where I can experiment with different security scenarios, encryption methods, and quantum attack simulations to deepen my understanding of quantum-resistant encryption and how to protect data in a post-quantum world.


Part II — Technical Specifications

Schema Design
Document the tables required for your project. For each table, include the name of the table, the field names, and any relevant constraints. Below is an example of a simple todo application's schema.

users table
Field
Constraints
user_id
SERIAL PRIMARY KEY
username
TEXT UNIQUE NOT NULL
email
TEXT UNIQUE NOT NULL
created_at
TIMESTAMP DEFAULT CURRENT_TIMESTAMP
password_hash
TEXT NOT NULL


missions table
Field
Constraints
mission_id
SERIAL PRIMARY KEY
title
TEXT NOT NULL
description
TEXT NOT NULL
difficulty
TEXT NOT NULL
estimated_time
INTEGER NOT NULL
created_at
TIMESTAMP DEFAULT CURRENT_TIMESTAMP


mission_steps table
Stores each screen within a mission
Field
Constraints
step_id
SERIAL PRIMARY KEY
mission_id
INTEGER REFERENCES missions(mission_id) ON DELETE CASCADE
step_order
INTEGER NOT NULL
title
TEXT NOT NULL
content
TEXT NOT NULL
step_type
TEXT NOT NULL


user_choices table
Stores choices made throughout scenarios

Field
Constraints
choice_id
SERIAL PRIMARY KEY
user_id
INTEGER REFERENCES users(user_id) ON DELETE CASCADE
mission_id
INTEGER REFERENCES missions(mission_id) ON DELETE CASCADE
step_id
INTEGER REFERENCES mission_steps(step_id)
selected_option
TEXT NOT NULL
created_at
TIMESTAMP DEFAULT CURRENT_TIMESTAMP


sandbox_runs table
Stores user experiments in the Quantum Lab Sandbox

Field
Constraints
run_id
SERIAL PRIMARY KEY
user_id
INTEGER REFERENCES users(user_id) ON DELETE CASCADE
simulation_type
TEXT NOT NULL
search_space_size
INTEGER NOT NULL
algorithm_type
TEXT NOT NULL
classical_steps
INTEGER NOT NULL
quantum_steps
INTEGER NOT NULL
created_at
TIMESTAMP DEFAULT CURRENT_TIMESTAMP


API Contract
Document each available endpoint for your application including
The method type and endpoint path (include path parameters)
A brief description
Request information including the body structure and any optional query strings. Provide default values for optional request body fields.
Response information including success/error response structures and status codes

Below is an example of a simple todo application's API contract with three endpoints:

GET /api/todos 
Returns all todos in an array of objects
Request: 
Body: None
Optional ?complete=true or ?complete=false query string to filter by completion status
Response 
Success: [{ id, title, isComplete }, {...}, …] 200

GET /api/todos/:id
Returns a single todo object based on the given id
Request: 
Body: None
Response 
Success: { id, title, isComplete } 200

POST /api/todos
Creates and returns new todo object.
Request: 
Body: { title, isComplete=false }
A title is required. isComplete is optional, defaulting to false when not provided.
Response: 
Success: { id, title, isComplete } 200 
Error, Not Authenticated: { message } 401
Error, Unauthorized:{ message } 403

POST /api/auth/register
Creates a new user account.
Request:
Body:
{
 "username": "string",
 "email": "string",
 "password": "string"
}
All fields are required.
Response:
Success:
Status: 201
{
 "id": 1,
 "username": "string",
 "email": "string"
}
Error – Bad Request:
Status: 400
{ "message": "Missing required fields" }
Error – Conflict (email exists):
Status: 409
{ "message": "User already exists" }

POST /api/auth/login
Authenticates a user and creates a session/token.
Request:
Body:
{
 "email": "string",
 "password": "string"
}
Both fields are required.
Response:
Success:
Status: 200
{
 "id": 1,
 "username": "string",
 "token": "jwt-token"
}
Error – Unauthorized:
Status: 401
{ "message": "Invalid credentials" }

POST /api/auth/logout
Logs out the current user.
Request:
Body: None
Requires authentication
Response:
Success:
Status: 200
{ "message": "Logged out successfully" }
Error – Not Authenticated:
Status: 401
{ "message": "User not logged in" }

Missions
GET /api/missions
Returns all available missions.
Request:
Body: None
Optional query:
?difficulty=beginner|intermediate|advanced
Response:
Success:
Status: 200
[
 {
   "id": 1,
   "title": "Password Vault",
   "description": "Learn encryption and quantum threats",
   "difficulty": "beginner"
 }
]
GET /api/missions/:id
Returns a single mission.
Request:
Body: None
Path Params:
id (required)
Response:
Success:
Status: 200
{
 "id": 1,
 "title": "Password Vault",
 "story": "A system is under attack...",
 "difficulty": "beginner"
}
Error – Not Found:
Status: 404
{ "message": "Mission not found" }
GET /api/missions/:id/result/:sessionId
Returns final simulation outcome.
Request:
Body: None
Path Params:
id (mission id)
sessionId
Response:
Success:
Status: 200
{
 "missionId": 1,
 "sessionId": "abc123",
 "outcome": "success",
 "userChoice": "strong_encryption",
 "probability": 87,
 "classicalSimulation": [
   "Checking key 1...",
   "Checking key 2..."
 ],
 "quantumSimulation": [
   "Exploring states...",
   "Amplifying result..."
 ],
 "explanation": "Quantum computing explores multiple states at once."
}
Error – Not Found:
Status: 404
{ "message": "Session not found" }
Sandbox
GET /api/sandbox/options
Returns available simulation settings.
Request:
Body: None
Response:
Status: 200
{
 "modes": ["encryption", "search", "optimization"],
 "computerTypes": ["classical", "quantum"],
 "sizes": ["small", "medium", "large"]
}
Resources
GET /api/resources
Returns learning content.
Request:
Body: None
Response:
Status: 200
{
 "intro": "Learn quantum computing basics",
 "topics": [
   {
     "title": "What is a Qubit?",
     "type": "article"
   },
   {
     "title": "Superposition Explained",
     "type": "video"
   }
 ],
 "glossary": [
   "qubit",
   "entanglement",
   "superposition",
   "quantum advantage"
 ]
}

Wireframe


Core Technologies, 3rd-Party APIs and New Libraries
This project will make use of the following technologies, 3rd-Party APIs, and new libraries
React for the frontend user interface
Python and FastAPI for the server
Postgres for the database
[API name and description]
Specific endpoint and values being used
[Library name and description]
Specific endpoint and values being used
Core Technologies
React
React will be used to build the frontend user interface, including the interactive story system, decision-making screens, password vault demonstration, quantum sandbox, and educational comparison views.
Python
Python will be used to develop the backend logic, including the story engine, quantum risk calculations, user progress tracking, and simulation processing.
FastAPI
FastAPI will provide REST API endpoints for retrieving stories, processing user choices, running sandbox simulations, and storing user progress. FastAPI is lightweight, fast, and includes automatic API documentation.
PostgreSQL
PostgreSQL will store user accounts, story completions, decision history, sandbox simulation results, and Quantum Readiness Scores.

New Libraries
SQLAlchemy
SQLAlchemy will be used as the Object Relational Mapper (ORM) between FastAPI and PostgreSQL, simplifying database interactions and model creation.
Pydantic
Pydantic will validate incoming and outgoing API data, ensuring request and response structures remain consistent throughout the application.
Framer Motion
Framer Motion will power animations throughout the application, including scene transitions, terminal effects, progress indicators, and visual feedback during quantum attack simulations.
Tailwind CSS
Tailwind CSS will be used to rapidly build a responsive cyber-security themed interface while maintaining consistent styling across the application.
React Router
React Router will manage navigation between the Home page, Story pages, Learning screens, Results pages, and Sandbox mode.
React Type Animation
React Type Animation will create terminal-style typing effects for the quantum attack simulator and educational comparison screens.

External Services / APIs
No External APIs Required for MVP
The application's stories, simulations, and educational content will be generated internally rather than relying on third-party APIs. This ensures a reliable and fully controlled educational experience.

Optional Stretch Integrations
Chart.js
Chart.js may be used to visualize risk scores, encryption comparisons, and Quantum Readiness metrics through interactive charts and graphs.
OpenAI API (Stretch Feature)
The OpenAI API may be integrated to generate additional educational explanations, scenario variations, or adaptive learning content based on user decisions within the simulation.

Rationale
The selected technology stack supports an interactive educational platform that combines storytelling, simulation, and cybersecurity awareness. React and FastAPI provide a modern full-stack architecture, PostgreSQL enables persistent user progress tracking, and the supporting libraries enhance the user experience through animations, routing, validation, and data visualization.



