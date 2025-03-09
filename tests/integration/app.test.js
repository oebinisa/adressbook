// tests/integration/app.test.js
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import axios from "axios";
import { spawn } from "child_process";
import { Pool } from "pg";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const API_URL = "http://localhost:5454";
let server;
let pool;

describe("AddressBook Application Integration Tests", () => {
  // Start the server and initialize the test database before all tests
  beforeAll(async () => {
    // Create a test database connection
    pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

    // Start the server as a child process
    server = spawn(
      "node",
      [path.resolve(__dirname, "../../backend/server.js")],
      {
        env: process.env,
        stdio: "pipe",
      }
    );

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 3000));
  });

  // Clean up the test database before each test
  beforeEach(async () => {
    await pool.query("DELETE FROM contacts");
  });

  // Close the database connection and stop the server after all tests
  afterAll(async () => {
    await pool.end();
    server.kill();
  });

  it("should create and retrieve contacts", async () => {
    // Create a new contact
    const newContact = {
      name: "Integration Test",
      email: "integration@test.com",
      phone: "5555555555",
      address: "Test Address",
    };

    // Create contact via API
    const createResponse = await axios.post(`${API_URL}/contacts`, newContact);
    expect(createResponse.status).toBe(200);
    expect(createResponse.data.name).toBe(newContact.name);
    expect(createResponse.data.email).toBe(newContact.email);

    // Get all contacts via API
    const getResponse = await axios.get(`${API_URL}/contacts`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.data).toHaveLength(1);
    expect(getResponse.data[0].name).toBe(newContact.name);
    expect(getResponse.data[0].email).toBe(newContact.email);
  });

  it("should handle creating multiple contacts", async () => {
    const contacts = [
      {
        name: "Contact One",
        email: "one@example.com",
        phone: "1111111111",
        address: "Address One",
      },
      {
        name: "Contact Two",
        email: "two@example.com",
        phone: "2222222222",
        address: "Address Two",
      },
    ];

    // Create contacts via API
    for (const contact of contacts) {
      const response = await axios.post(`${API_URL}/contacts`, contact);
      expect(response.status).toBe(200);
    }

    // Get all contacts via API
    const getResponse = await axios.get(`${API_URL}/contacts`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.data).toHaveLength(2);

    // Check that both contacts were saved correctly
    const emails = getResponse.data.map((c) => c.email);
    expect(emails).toContain("one@example.com");
    expect(emails).toContain("two@example.com");
  });

  it("should handle duplicate email error", async () => {
    const contact = {
      name: "Duplicate Test",
      email: "duplicate@test.com",
      phone: "9999999999",
      address: "Duplicate Address",
    };

    // Create contact first time
    const firstResponse = await axios.post(`${API_URL}/contacts`, contact);
    expect(firstResponse.status).toBe(200);

    // Try to create contact with same email
    try {
      await axios.post(`${API_URL}/contacts`, contact);
      // If we reach here, the test should fail
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response.status).toBe(500);
      expect(error.response.data.error).toBeDefined();
    }
  });
});
