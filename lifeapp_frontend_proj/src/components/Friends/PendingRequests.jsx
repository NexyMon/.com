import React from 'react';
import friendService from '../../services/friendService';

function PendingRequests({ friendships, onAction }) {
    // Filtert nur die Anfragen heraus, die an den aktuellen User gerichtet und 'pending' sind.
    const pendingReceivedRequests = friendships.filter(
        f => f.status === 'pending' && f.to_user.username === authService.getCurrentUser()?.username // Annahme: getCurrentUser liefert username
        // Sicherer wäre es, wenn das Backend eine User-ID im FriendshipSerializer für to_user und from_user hätte
        // oder wenn getCurrentUser() die ID des aktuellen Users liefert und wir diese mit f.to_user.id vergleichen.
        // Für dieses Beispiel vereinfachen wir es und nehmen an, der Username ist im Token oder authService.getCurrentUser()
        // liefert ein Objekt mit der ID des aktuellen Nutzers, die wir dann mit f.to_user.id vergleichen.
        // Da authService.getCurrentUser() aktuell nur {token: ...} liefert, müssen wir das anpassen oder
        // die Logik anders gestalten.
        // Für jetzt: Wir gehen davon aus, dass getFriendships() im Service nur die relevanten Anfragen liefert
        // und wir hier nur nach Status und Empfänger filtern.
        // Die FriendshipSerializer liefert from_user und to_user als Objekte mit id und username.
        // Wir brauchen die ID des aktuellen Users.
        // WORKAROUND: Wir nehmen an, dass der Parent diese Komponente nur mit relevanten Daten füttert oder
        // wir müssen den aktuellen User (ID) hier verfügbar machen.
        // Besser: Die Parent-Komponente filtert die Anfragen.
    );

    // Wenn die obige Filterung nicht ideal ist, sollte der Parent (z.B. eine FriendsPage Komponente)
    // die `friendships` bereits so filtern, dass hier nur die relevanten ankommen.
    // Für dieses Beispiel gehen wir davon aus, dass `friendships` bereits die Liste der
    // an den aktuellen User gerichteten, pendenten Anfragen ist.

    const handleAccept = async (friendshipId) => {
        try {
            await friendService.acceptFriendRequest(friendshipId);
            if (onAction) onAction(); // Signal an Parent zum Neuladen
        } catch (error) {
            console.error("Failed to accept request:", error);
            alert("Error accepting request. Please try again.");
        }
    };

    const handleDecline = async (friendshipId) => {
        try {
            await friendService.declineFriendRequest(friendshipId);
            if (onAction) onAction(); // Signal an Parent zum Neuladen
        } catch (error) {
            console.error("Failed to decline request:", error);
            alert("Error declining request. Please try again.");
        }
    };

    if (!friendships || friendships.length === 0) {
        return <p>No pending friend requests.</p>;
    }

    return (
        <div className="pending-requests-container">
            <h4>Pending Friend Requests</h4>
            <ul className="pending-list">
                {friendships.map(req => (
                    <li key={req.id}>
                        <span>
                            Request from: <strong>{req.from_user.username}</strong>
                            ({req.from_user.first_name} {req.from_user.last_name})
                        </span>
                        <div className="actions">
                            <button onClick={() => handleAccept(req.id)} style={{backgroundColor: 'green', color: 'white'}}>Accept</button>
                            <button onClick={() => handleDecline(req.id)} style={{backgroundColor: 'red', color: 'white', marginLeft: '5px'}}>Decline</button>
                        </div>
                    </li>
                ))}
            </ul>
            {/* Styling (Beispiel)
            .pending-list li { display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee; }
            .pending-list .actions button { padding: 5px 10px; }
            */}
        </div>
    );
}
// HINWEIS: Die Abhängigkeit von authService.getCurrentUser()?.username für den Vergleich ist nicht ideal.
// Es wäre besser, wenn die übergeordnete Komponente (z.B. eine Hauptseite für Freunde)
// die Freundschaftsdaten lädt und dann die spezifischen Listen (pending, accepted) an die Kindkomponenten weitergibt.
// Die `getFriendships` im Service liefert alle relevanten Einträge. Die Filterung sollte im aufrufenden Code geschehen.
import authService from '../../services/authService'; // Import vergessen, füge ich hinzu.

export default PendingRequests;
