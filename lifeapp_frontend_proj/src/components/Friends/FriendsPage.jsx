import React, { useState, useEffect, useCallback } from 'react';
import friendService from '../../services/friendService';
import authService from '../../services/authService'; // Für die aktuelle User ID
import UserSearch from './UserSearch';
import PendingRequests from './PendingRequests';
import FriendList from './FriendList';
import { jwtDecode } from 'jwt-decode'; // Um die User ID aus dem Token zu bekommen

function FriendsPage() {
    const [friendships, setFriendships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null);

    // Lade die User ID aus dem Token beim Mounten der Komponente
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setCurrentUserId(decodedToken.user_id);
            } catch (e) {
                console.error("Failed to decode token:", e);
                setError("Could not verify user session. Please log in again.");
                // Hier könnte man zum Login navigieren
            }
        } else {
            setError("You need to be logged in to manage friends.");
            // Hier könnte man zum Login navigieren
        }
    }, []);

    const fetchFriendships = useCallback(async () => {
        if (!currentUserId) return; // Nicht laden, wenn User ID noch nicht da ist

        setLoading(true);
        setError('');
        try {
            const response = await friendService.getFriendships();
            setFriendships(response.data || []);
        } catch (err) {
            setError('Failed to load friendship data. Please try again.');
            console.error("Error fetching friendships:", err);
        } finally {
            setLoading(false);
        }
    }, [currentUserId]); // Abhängigkeit von currentUserId

    useEffect(() => {
        if (currentUserId) { // Nur laden, wenn wir die User ID haben
            fetchFriendships();
        }
    }, [currentUserId, fetchFriendships]); // fetchFriendships als Abhängigkeit hinzugefügt

    const handleFriendshipAction = () => {
        // Wird aufgerufen, nachdem eine Aktion (Anfrage gesendet, angenommen, abgelehnt, entfernt)
        // in einer der Kindkomponenten erfolgreich war, um die Liste neu zu laden.
        fetchFriendships();
    };

    if (!currentUserId && !loading) { // Wenn keine User ID und nicht am Laden (z.B. kein Token)
        return <p style={{color: 'red'}}>{error || "Please log in to view your friends."}</p>;
    }

    if (loading && friendships.length === 0) return <p>Loading friend data...</p>; // Zeige Loading nur, wenn noch keine Daten da sind
    // Fehler wird innerhalb der Sektionen oder global angezeigt, je nach Präferenz

    // Filtere die Freundschaftsdaten für die jeweiligen Komponenten
    const pendingReceived = friendships.filter(f => f.status === 'pending' && f.to_user && f.to_user.id === currentUserId);
    // const sentPending = friendships.filter(f => f.status === 'pending' && f.from_user && f.from_user.id === currentUserId);
    const acceptedFriendsData = friendships.filter(f => f.status === 'accepted');


    return (
        <div className="friends-page-container" style={{ padding: '20px' }}>
            <h2>Manage Friends</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #eee', borderRadius: '5px' }}>
                <UserSearch onFriendRequestSent={handleFriendshipAction} />
            </div>

            <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #eee', borderRadius: '5px' }}>
                <PendingRequests friendships={pendingReceived} onAction={handleFriendshipAction} />
            </div>

            <div style={{ padding: '15px', border: '1px solid #eee', borderRadius: '5px' }}>
                <FriendList friendships={acceptedFriendsData} onAction={handleFriendshipAction} currentUserId={currentUserId} />
            </div>

            {/* Optional: Liste der gesendeten, noch ausstehenden Anfragen anzeigen
            <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #eee', borderRadius: '5px' }}>
                <h4>Sent Pending Requests</h4>
                {sentPending.length > 0 ? (
                    <ul>
                        {sentPending.map(req => (
                            <li key={req.id}>
                                Request to: <strong>{req.to_user.username}</strong>
                                <button onClick={() => friendService.removeFriendship(req.id).then(handleFriendshipAction)}>Cancel Request</button>
                            </li>
                        ))}
                    </ul>
                ) : <p>No pending sent requests.</p>}
            </div>
            */}
        </div>
    );
}

export default FriendsPage;
