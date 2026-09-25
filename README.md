\# AI Car Mechanic Chatbot



An AI-powered car troubleshooting chatbot built for the Full-Stack Developer Intern assignment.



The application allows car owners to describe vehicle problems, upload automotive media, receive troubleshooting guidance, view a structured diagnosis, and book a mechanic.



\## Tech Stack



\### Frontend

\- React

\- Vite

\- JavaScript

\- CSS

\- Vercel-ready deployment



\### Backend

\- Python

\- Django

\- Django REST Framework

\- SQLite

\- django-cors-headers



\### AI

\- Google Gemini API

\- Gemini is used only where visual AI analysis is useful, primarily for uploaded car images.

\- Traditional backend rule-based logic handles common mechanical symptoms to minimize unnecessary AI/API usage.



\## Features



\- Conversational car troubleshooting

\- Rule-based diagnosis for common vehicle problems

\- Car image upload

\- Audio and video upload support

\- Gemini-powered image analysis

\- Diagnosis with:

&#x20; - Problem

&#x20; - Possible cause

&#x20; - Recommended action

\- Mechanic booking

\- Booking confirmation

\- Booking lookup by booking ID

\- Responsive React interface

\- REST API architecture

\- SQLite database



\## Project Structure



```text

AI Car Mechanic Chatbot/

│

├── backend/

│   ├── config/

│   ├── mechanic/

│   │   ├── migrations/

│   │   ├── gemini\_service.py

│   │   ├── mechanic\_logic.py

│   │   ├── models.py

│   │   ├── serializers.py

│   │   ├── urls.py

│   │   └── views.py

│   ├── manage.py

│   └── requirements.txt

│

├── frontend/

│   ├── src/

│   │   ├── App.jsx

│   │   ├── App.css

│   │   └── index.css

│   ├── package.json

│   └── vite.config.js

│

├── .gitignore

└── README.md

