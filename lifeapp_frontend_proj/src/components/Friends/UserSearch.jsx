import React, { useState } from 'react';
import friendService from '../../services/friendService';

function UserSearch({ onFriendRequestSent }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [requestStatus, setRequestStatus] = useState({}); // Track status per user ID

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        setError('');
        setRequestStatus({}); // Reset status on new search
        try {
            const response = await friendService.searchUsers(searchTerm);
            setSearchResults(response.data || []);
            if (response.data.length === 0) {
                setError('No users found matching your search.');
            }
        } catch (err) {
            setError('Failed to search users. Please try again.');
            console.error("User search failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async (toUserId) => {
        setRequestStatus(prev => ({ ...prev, [toUserId]: { loading: true, error: '', success: '' } }));
        try {
            await friendService.sendFriendRequest(toUserId);
            setRequestStatus(prev => ({
                ...prev,
                [toUserId]: { loading: false, success: 'Request sent!', error: '' }
            }));
            if (onFriendRequestSent) { // Callback, um z.B. eine übergeordnete Liste zu aktualisieren
                onFriendRequestSent(toUserId);
            }
            // Optional: disable button or change text after sending
        } catch (err) {
            let specificError = 'Failed to send friend request.';
            if (err.response && err.response.data && err.response.data.detail) {
                specificError = err.response.data.detail;
            } else if (err.response && err.response.data && typeof err.response.data === 'object') {
                // Handle validation errors from serializer (e.g., "User does not exist.")
                const messages = Object.values(err.response.data).flat();
                if (messages.length > 0) specificError = messages.join(' ');
            }
            setRequestStatus(prev => ({
                ...prev,
                [toUserId]: { loading: false, error: specificError, success: '' }
            }));
            console.error("Send friend request failed:", err);
        }
    };

    return (
        <div className="user-search-container">
            <h4>Find New Friends</h4>
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search by username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {searchResults.length > 0 && (
                <ul className="search-results-list">
                    {searchResults.map(user => (
                        <li key={user.id}>
                            <span>{user.username} ({user.first_name} {user.last_name})</span>
                            <button
                                onClick={() => handleSendRequest(user.id)}
                                disabled={requestStatus[user.id]?.loading || requestStatus[user.id]?.success}
                                style={{ marginLeft: '10px' }}
                            >
                                {requestStatus[user.id]?.loading ? 'Sending...' :
                                 requestStatus[user.id]?.success ? 'Sent!' :
                                 requestStatus[user.id]?.error ? 'Retry' : 'Add Friend'}
                            </button>
                            {requestStatus[user.id]?.error && <p style={{ color: 'red', fontSize: '0.9em' }}>{requestStatus[user.id].error}</p>}
                        </li>
                    ))}
                </ul>
            )}
            {/* Styling (Beispiel)
            .user-search-container input { margin-right: 10px; }
            .search-results-list { list-style: none; padding: 0; }
            .search-results-list li { display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee; }
            */}
        </div>
    );
}

export default UserSearch;
