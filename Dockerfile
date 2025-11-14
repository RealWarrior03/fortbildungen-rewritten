FROM node:20-alpine

WORKDIR /app

# Backend-Abhängigkeiten
# COPY backend/package*.json ./backend/
# RUN cd backend && npm install

# # Frontend-Abhängigkeiten
# COPY frontend/package*.json ./frontend/
# RUN cd frontend && npm install

# # Code kopieren
# COPY backend/ ./backend
# COPY frontend/ ./frontend
# COPY .env /app/

COPY backend ./backend
COPY frontend ./frontend
COPY .env /app/

RUN cd backend && npm install
RUN cd frontend && npm install


WORKDIR /app/backend

# Frontend bauen und Backend starten
CMD ["npm", "run", "deploy"]