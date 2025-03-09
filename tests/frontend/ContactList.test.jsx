// tests/frontend/ContactList.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ContactList from "../../frontend/src/ContactList";
import axios from "axios";

// Mock axios
vi.mock("axios");

describe("ContactList Component", () => {
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

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Mock the axios get method to return mock contacts
    axios.get.mockResolvedValue({ data: mockContacts });
  });

  it("makes a GET request to fetch contacts", async () => {
    render(<ContactList />);

    expect(axios.get).toHaveBeenCalledWith("http://localhost:5454/contacts");
  });

  it("renders contacts from the API response", async () => {
    render(<ContactList />);

    // Wait for contacts to load
    await vi.waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/jane@example.com/)).toBeInTheDocument();
    });

    // Check if all contact information is displayed
    mockContacts.forEach((contact) => {
      const contactInfo = `${contact.name} - ${contact.email} - ${contact.phone} - ${contact.address}`;
      expect(screen.getByText(new RegExp(contactInfo))).toBeInTheDocument();
    });
  });

  it("handles empty contacts array", async () => {
    // Override the mock to return empty array
    axios.get.mockResolvedValueOnce({ data: [] });

    render(<ContactList />);

    // Ensure no contacts are rendered
    await vi.waitFor(() => {
      mockContacts.forEach((contact) => {
        const regex = new RegExp(`${contact.name}.*${contact.email}`);
        expect(screen.queryByText(regex)).not.toBeInTheDocument();
      });
    });
  });
});
