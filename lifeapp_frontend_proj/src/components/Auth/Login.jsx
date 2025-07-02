import React, { useState } from 'react';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom'; // Für die Weiterleitung nach dem Login

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Hook für die Navigation

  // Die setUser Funktion würde von einem übergeordneten Kontext/State-Management kommen
  // Für dieses Beispiel gehen wir davon aus, dass authService das Nötige (Token speichern) erledigt
  // und wir dann weiterleiten.
  // const { setUser } = useAuth(); // Beispiel für einen AuthContext

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await authService.login(username, password);
      // setUser(authService.getCurrentUser()); // Falls ein Kontext genutzt wird
      navigate('/'); // Weiterleitung zur Homepage oder Dashboard
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message)
      }
      else {
        setError('Login failed. Please check your credentials.');
      }
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input id="username" name="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
