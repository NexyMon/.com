import apiClient from './api';

const USERS_ENDPOINT = '/users/';
const FRIENDSHIPS_ENDPOINT = '/friendships/';

// --- User Search ---
const searchUsers = (searchTerm) => {
  return apiClient.get(`${USERS_ENDPOINT}?search=${encodeURIComponent(searchTerm)}`);
};

// --- Friendship Requests ---
const sendFriendRequest = (toUserId) => {
  return apiClient.post(FRIENDSHIPS_ENDPOINT, { to_user_id: toUserId });
};

// --- Get Friendships (all relevant to the current user) ---
const getFriendships = () => {
  // This will return pending sent, pending received, and accepted friendships
  return apiClient.get(FRIENDSHIPS_ENDPOINT);
};

// --- Manage Friendship Requests ---
const acceptFriendRequest = (friendshipId) => {
  return apiClient.post(`${FRIENDSHIPS_ENDPOINT}${friendshipId}/accept/`);
};

const declineFriendRequest = (friendshipId) => {
  return apiClient.post(`${FRIENDSHIPS_ENDPOINT}${friendshipId}/decline/`);
};

// --- Remove Friend or Cancel Sent Request ---
const removeFriendship = (friendshipId) => {
  // This can be used to delete a sent pending request (by sender)
  // or to unfriend someone (by either party in an accepted friendship)
  return apiClient.delete(`${FRIENDSHIPS_ENDPOINT}${friendshipId}/`);
};


const friendService = {
  searchUsers,
  sendFriendRequest,
  getFriendships,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriendship,
};

export default friendService;
