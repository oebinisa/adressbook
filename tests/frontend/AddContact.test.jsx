// tests/frontend/AddContact.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AddContact from "../../frontend/src/AddContact";
import axios from "axios";

// Mock axios
vi.mock("axios");

describe("AddContact Component", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it("renders all form inputs", () => {
    render(<AddContact />);

    expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Phone")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Address")).toBeInTheDocument();
    expect(screen.getByText("Save Contact")).toBeInTheDocument();
  });

  it("updates form state when input values change", () => {
    render(<AddContact />);

    const nameInput = screen.getByPlaceholderText("Name");
    const emailInput = screen.getByPlaceholderText("Email");
    const phoneInput = screen.getByPlaceholderText("Phone");
    const addressInput = screen.getByPlaceholderText("Address");

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(phoneInput, { target: { value: "1234567890" } });
    fireEvent.change(addressInput, { target: { value: "123 Main St" } });

    expect(nameInput.value).toBe("John Doe");
    expect(emailInput.value).toBe("john@example.com");
    expect(phoneInput.value).toBe("1234567890");
    expect(addressInput.value).toBe("123 Main St");
  });

  it("submits the form and makes a POST request", async () => {
    // Mock the axios post method
    axios.post.mockResolvedValue({ data: {} });

    render(<AddContact />);

    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText("Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Phone"), {
      target: { value: "1234567890" },
    });
    fireEvent.change(screen.getByPlaceholderText("Address"), {
      target: { value: "123 Main St" },
    });

    // Submit the form
    fireEvent.click(screen.getByText("Save Contact"));

    // Check if axios.post was called with the right arguments
    expect(axios.post).toHaveBeenCalledWith("http://localhost:5454/contacts", {
      name: "John Doe",
      email: "john@example.com",
      phone: "1234567890",
      address: "123 Main St",
    });

    // Check if form is reset after submission
    await vi.waitFor(() => {
      expect(screen.getByPlaceholderText("Name").value).toBe("");
      expect(screen.getByPlaceholderText("Email").value).toBe("");
      expect(screen.getByPlaceholderText("Phone").value).toBe("");
      expect(screen.getByPlaceholderText("Address").value).toBe("");
    });
  });
});
