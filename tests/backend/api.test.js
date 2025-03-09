// tests/backend/api.test.js
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  afterEach,
} from "vitest";
import axios from "axios";
import { Pool } from "pg";

// Mock the pg Pool
vi.mock("pg", () => {
  const mockPool = {
    query: vi.fn(),
    end: vi.fn(),
  };

  return {
    Pool: vi.fn(() => mockPool),
  };
});

// API endpoint
const API_URL = "http://localhost:5454";

describe("Contacts API", () => {
  let mockPool;

  beforeAll(() => {
    // Get the mocked pool instance
    mockPool = new Pool();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    mockPool.end();
  });

  describe("GET /contacts", () => {
    it("should return all contacts", async () => {
      const mockContacts = [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          phone: "1234567890",
          address: "123 Main St",
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          phone: "0987654321",
          address: "456 Oak Ave",
        },
      ];

      // Mock the successful response from the database
      mockPool.query.mockResolvedValueOnce({ rows: mockContacts });

      try {
        const response = await axios.get(`${API_URL}/contacts`);

        expect(response.status).toBe(200);
        expect(response.data).toEqual(mockContacts);
        expect(mockPool.query).toHaveBeenCalledWith("SELECT * FROM contacts");
      } catch (error) {
        // This will fail the test if the request fails
        expect(error).toBeUndefined();
      }
    });

    it("should handle database errors", async () => {
      const errorMessage = "Database connection error";

      // Mock a database error
      mockPool.query.mockRejectedValueOnce(new Error(errorMessage));

      try {
        await axios.get(`${API_URL}/contacts`);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error.response.status).toBe(500);
        expect(error.response.data).toEqual({ error: errorMessage });
      }
    });
  });

  describe("POST /contacts", () => {
    it("should create a new contact", async () => {
      const newContact = {
        name: "Test User",
        email: "test@example.com",
        phone: "1122334455",
        address: "789 Pine Rd",
      };

      const savedContact = { id: 3, ...newContact };

      // Mock the successful response from the database
      mockPool.query.mockResolvedValueOnce({ rows: [savedContact] });

      try {
        const response = await axios.post(`${API_URL}/contacts`, newContact);

        expect(response.status).toBe(200);
        expect(response.data).toEqual(savedContact);
        expect(mockPool.query).toHaveBeenCalledWith(
          "INSERT INTO contacts (name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING *",
          [
            newContact.name,
            newContact.email,
            newContact.phone,
            newContact.address,
          ]
        );
      } catch (error) {
        // This will fail the test if the request fails
        expect(error).toBeUndefined();
      }
    });

    it("should handle duplicate email error", async () => {
      const duplicateContact = {
        name: "Duplicate User",
        email: "existing@example.com",
        phone: "9988776655",
        address: "321 Elm St",
      };

      // Mock a database error for duplicate email
      const duplicateError = new Error(
        "duplicate key value violates unique constraint"
      );
      duplicateError.code = "23505"; // PostgreSQL error code for unique constraint violation

      mockPool.query.mockRejectedValueOnce(duplicateError);

      try {
        await axios.post(`${API_URL}/contacts`, duplicateContact);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.error).toContain("duplicate key value");
      }
    });
  });
});
