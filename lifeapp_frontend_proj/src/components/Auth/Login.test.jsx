import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom'; // Benötigt, da Login useNavigate verwendet
import Login from './Login';
import authService from '../../services/authService';

// Mocken des authService
vi.mock('../../services/authService', () => ({
  default: {
    login: vi.fn(),
    // getCurrentUser: vi.fn() // falls es in Login direkt verwendet würde
  }
}));

// Mocken von useNavigate, da es außerhalb eines Routers nicht funktioniert
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    // Setzt Mocks vor jedem Test zurück
    vi.clearAllMocks();
  });

  test('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('allows user to enter username and password', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
  });

  test('calls authService.login and navigates on successful login', async () => {
    authService.login.mockResolvedValue({
      /* response data von successful login, z.B. user Objekt oder token */
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('testuser', 'password123');
    });
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('shows error message on failed login', async () => {
    const errorMessage = 'Invalid credentials';
    authService.login.mockRejectedValue({
      response: { data: { detail: errorMessage } }
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('testuser', 'password123');
    });

    // Warte bis die Fehlermeldung im Dokument erscheint
    const errorElement = await screen.findByText(errorMessage);
    expect(errorElement).toBeInTheDocument();
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

   test('shows generic error message if no detail in error response', async () => {
    authService.login.mockRejectedValue({ message: 'Network Error' }); // Simuliert einen Fehler ohne response.data.detail

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('testuser', 'password123');
    });

    // Hier wird die Fallback-Fehlermeldung aus der Login-Komponente erwartet
    const genericErrorElement = await screen.findByText('Network Error');
    expect(genericErrorElement).toBeInTheDocument();
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

});
