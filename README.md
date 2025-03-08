# AddressBook Application

A guide for building a full-stack application for managing contacts, built with React, Express, and PostgreSQL.

Project Structure:
  - Frontend (React + Vite)
  - Backend (Express.js)
  - Tests (Vitest)
  - PostgreSQL running in Docker

---

## **Project Overview**
We will build an **Address Book App** with a **React frontend** (Vite), an **Express.js backend**, and a **PostgreSQL database** running inside a **Docker container**.  

The application will have two pages:  
1. **Form Input Page** – Users can enter **name, email, phone, and address**.  
2. **Data Display Page** – Lists all saved contacts.

## **Project Structure**
```
addressbook/
│── frontend/       # React frontend (Vite)
│── backend/        # Express.js backend with PostgreSQL
│── tests/          # Vitest test scripts
│── docker-compose.yml  # Docker configuration for PostgreSQL
│── .env            # Environment variables
│── package.json    # Project dependencies
│── README.md       # Project documentation
```

---

## **Clone the Repo**

1. Clone the Repo
2. Ensure you have Docker engine installed and running
3. Run PostgreSQL:

```bash
cd backend
docker-compose up -d
```

4. Run the backend (this will hug the terminal):

```bash
node server.js
```

5. Run React frontend (on a separate terminal):

```bash
cd frontend
npm run dev
```

6. Open the app on a browser