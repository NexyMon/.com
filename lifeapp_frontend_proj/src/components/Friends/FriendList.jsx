import React from 'react';
import friendService from '../../services/friendService';
import authService from '../../services/authService'; // Benötigt für die ID des aktuellen Users

function FriendList({ friendships, onAction, currentUserId }) {
    // Filtert akzeptierte Freundschaften und zeigt den "anderen" User an.
    const acceptedFriends = friendships
        .filter(f => f.status === 'accepted')
        .map(f => {
            // Bestimme, wer der Freund ist (nicht der aktuelle User)
            if (f.from_user.id === currentUserId) {
                return { ...f.to_user, friendship_id: f.id }; // Füge friendship_id für die "Unfriend"-Aktion hinzu
            } else if (f.to_user.id === currentUserId) {
                return { ...f.from_user, friendship_id: f.id };
            }
            return null; // Sollte nicht passieren, wenn die Daten korrekt sind
        })
        .filter(friend => friend !== null); // Entferne Null-Einträge, falls vorhanden

    const handleRemoveFriend = async (friendshipId) => {
        if (window.confirm('Are you sure you want to remove this friend?')) {
            try {
                await friendService.removeFriendship(friendshipId);
                if (onAction) onAction(); // Signal an Parent zum Neuladen
            } catch (error) {
                console.error("Failed to remove friend:", error);
                alert("Error removing friend. Please try again.");
            }
        }
    };

    if (acceptedFriends.length === 0) {
        return <p>You have no friends yet. Send some requests!</p>;
    }

    return (
        <div className="friend-list-container">
            <h4>Your Friends</h4>
            <ul className="friend-list">
                {acceptedFriends.map(friend => (
                    <li key={friend.id}> {/* friend.id ist die ID des User-Objekts des Freundes */}
                        <span>
                            <strong>{friend.username}</strong> ({friend.first_name} {friend.last_name})
                        </span>
                        <button
                            onClick={() => handleRemoveFriend(friend.friendship_id)}
                            style={{backgroundColor: 'orange', color: 'white', marginLeft: '10px'}}
                        >
                            Remove Friend
                        </button>
                    </li>
                ))}
            </ul>
            {/* Styling (Beispiel)
            .friend-list li { display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee; }
            */}
        </div>
    );
}

export default FriendList;
