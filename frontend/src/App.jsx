import AddContact from "./AddContact";
import ContactList from "./ContactList";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

function App() {
  return (
    <Router>
      <div className="app-container">
        <h1 className="app-header">Address Book App</h1>

        <p className="app-description">
          React (Vite) + Express.js + PostgreSQL (inside Docker)
        </p>

        <nav className="nav-container">
          <Link to="/" className="nav-link">
            Add Contact
          </Link>

          <span>&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;</span>

          <Link to="/contacts" className="nav-link">
            View Contacts
          </Link>
        </nav>

        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<AddContact />} />
            <Route path="/contacts" element={<ContactList />} />
          </Routes>
        </div>

        <span>
          <br />
          <br />
          <Link to="https://devforge.cc">&copy; DevForge.cc</Link>
        </span>
      </div>
    </Router>
  );
}

export default App;
