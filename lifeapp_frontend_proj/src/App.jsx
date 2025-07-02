import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import authService from './services/authService';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import './App.css'; // Behalte dein generelles App-Styling

// Eine einfache Home-Komponente als Platzhalter
const Home = ({ user }) => (
  <div>
    <h1>Willkommen bei LifeApp!</h1>
    {user ? <p>Du bist eingeloggt als: {user.username || 'Benutzer'}</p> : <p>Bitte logge dich ein oder registriere dich.</p>}
    <p>Hier entsteht dein persönlicher Tagesplaner und Aktivitätsfinder.</p>
  </div>
);

import TaskList from './components/Tasks/TaskList';
import TaskForm from './components/Tasks/TaskForm';
import UserPreferencesForm from './components/Preferences/UserPreferencesForm';
import ActivityList from './components/Activities/ActivityList';
import FriendsPage from './components/Friends/FriendsPage'; // FriendsPage importieren

// Eine Platzhalter-Komponente für geschützte Inhalte
const Dashboard = () => {
  // Diese State-Logik und Callback könnten auch in TaskList bleiben,
  // aber hier zu haben, erlaubt eine klarere Trennung, wenn TaskForm und TaskList Geschwister sind.
  const [refreshTaskList, setRefreshTaskList] = useState(false);

  const handleTaskCreated = () => {
    // Signalisiert der TaskList, sich neu zu laden oder den neuen Task hinzuzufügen
    // Eine einfache Methode ist, einen State zu togglen, den TaskList als Key oder im useEffect Dependency Array verwendet.
    // Oder man hebt den Task-State in diese Dashboard-Komponente.
    // Fürs Erste: Wir gehen davon aus, dass TaskList bei onTaskCreated den neuen Task selbst hinzufügt
    // oder wir übergeben eine Funktion, die die TaskList neu lädt.
    // Hier implementieren wir eine Callback-Logik, die TaskList nutzen kann.
    setRefreshTaskList(prev => !prev); // Toggle, um useEffect in TaskList (falls so implementiert) auszulösen
                                      // ODER TaskList könnte direkt die fetchTasks Methode haben, die hier aufgerufen wird
                                      // ODER wir heben den Task-State hierher.
                                      // Die aktuelle TaskList lädt bei Mount und TaskForm fügt zu seinem eigenen State hinzu.
                                      // Besser ist, wenn TaskList die Logik zum Neuladen/Hinzufügen kapselt.
                                      // TaskList hat bereits eine handleTaskCreated. Wir müssen sie nur von TaskForm aufrufen lassen.
                                      // Das ist schwierig, wenn sie Geschwister sind ohne State-Hochhebung oder Kontext.
                                      // Einfachste Lösung: TaskList bekommt einen Key, der sich bei Taskerstellung ändert.
  };


  return (
    <div>
      <h2>Dashboard</h2>
      <p>Verwalte hier deine Aufgaben.</p>
      <hr />
      {/* Wichtig: Damit TaskList die Änderungen von TaskForm mitbekommt,
          muss entweder der State der Tasks hier im Dashboard verwaltet werden
          oder TaskList muss eine Möglichkeit haben, sich selbst zu aktualisieren.
          Die aktuelle TaskList hat eine handleTaskCreated, die von TaskForm genutzt werden könnte,
          wenn TaskForm ein Child von TaskList wäre oder ein Callback übergeben wird.

          Wir übergeben hier eine Callback-Funktion an TaskForm,
          und TaskList wird so modifiziert, dass es diese Änderung mitbekommt (z.B. durch einen Key-Wechsel).
          Oder einfacher: TaskList bekommt eine Funktion zum Neuladen übergeben.
      */}
      <TaskForm onTaskCreated={() => setRefreshTaskList(prev => !prev)} />
      <hr style={{ margin: '20px 0' }}/>
      <TaskList key={refreshTaskList ? 'refreshTaskList' : 'normalTaskList'} /> {/* Key-Trick zum Neuladen der Taskliste */}

      <hr style={{ margin: '40px 0', borderStyle: 'dashed' }}/>

      <ActivityList /> {/* Aktivitäten anzeigen */}
    </div>
  );
};

function App() {
  const [currentUser, setCurrentUser] = useState(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser(); // Diese Funktion muss ggf. angepasst werden, um echte User-Daten zu liefern
    if (user && user.token) { // Prüfe auf Token Existenz
      // Hier könntest du den Token validieren oder User-Infos vom Backend holen
      // Fürs Erste nehmen wir an, ein vorhandener Token bedeutet eingeloggt.
      // Um den Benutzernamen zu bekommen, müssten wir den Token dekodieren oder einen /user/me Endpunkt haben.
      // Für das Beispiel setzen wir einen Dummy-User, wenn ein Token da ist.
      // In authService.getCurrentUser() könnte jwt-decode verwendet werden.
       const decodedUser = authService.getCurrentUser(); // Angenommen, dies gibt { username: '...' } zurück oder null
       if (decodedUser) {
        // Versuche, den Benutzernamen aus dem Token zu extrahieren (vereinfacht)
        // In einer echten App würde man den Token serverseitig validieren und User-Daten holen
        // oder den Token clientseitig dekodieren (mit jwt-decode)
        // Für dieses Beispiel nehmen wir an, getCurrentUser gibt uns etwas Brauchbares zurück
        // oder wir rufen einen /me Endpunkt auf.
        // Da wir das noch nicht haben, setzen wir einen generischen User, wenn Token da ist.
         setCurrentUser(decodedUser);
       }
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    navigate('/login');
  };

  };

  return (
    <> {/* React Fragment */}
      <nav>
        {/* Navigationsinhalt bleibt hier, nutzt volle Breite */}
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          {currentUser ? (
            <>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link to="/preferences">Preferences</Link>
              </li>
              <li>
                <Link to="/friends">Friends</Link>
              </li>
              <li>
                <span>Eingeloggt {currentUser.username ? `als ${currentUser.username}` : ''}</span>
              </li>
              <li>
                <button onClick={handleLogout}>Logout</button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* app-container umschließt den gesamten seitenabhängigen Inhalt */}
      <div className="app-container">
        {/* container für das "Karten"-Styling des Inhaltsbereichs */}
        <div className="container">
          <Routes>
            <Route path="/" element={<Home user={currentUser} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={currentUser ? <Dashboard /> : <Login />}
            />
            <Route
              path="/preferences"
              element={currentUser ? <UserPreferencesForm /> : <Login />}
            />
            <Route
              path="/friends"
              element={currentUser ? <FriendsPage /> : <Login />}
            />
          </Routes>
        </div>
      </div>
    </> // Schließt das React Fragment
  );
}

export default App;
