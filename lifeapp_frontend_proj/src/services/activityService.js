import apiClient from './api';

const ACTIVITY_CATEGORIES_ENDPOINT = '/activity-categories/';
const ACTIVITIES_ENDPOINT = '/activities/';
const USER_PREFERENCES_ENDPOINT = '/preferences/';

// --- Activity Categories ---
const getAllActivityCategories = () => {
  return apiClient.get(ACTIVITY_CATEGORIES_ENDPOINT);
};

// --- Activities ---
const getAllActivities = (categoryId = null) => {
  let endpoint = ACTIVITIES_ENDPOINT;
  if (categoryId) {
    endpoint += `?category_id=${categoryId}`;
  }
  return apiClient.get(endpoint);
};

const getActivityById = (id) => {
  return apiClient.get(`${ACTIVITIES_ENDPOINT}${id}/`);
};

// --- User Preferences ---
const getUserPreferences = () => {
  return apiClient.get(USER_PREFERENCES_ENDPOINT);
};

const updateUserPreferences = (preferenceData) => {
  // preferenceData sollte ein Objekt sein, z.B. { preferred_categories: [1, 2] }
  return apiClient.put(USER_PREFERENCES_ENDPOINT, preferenceData);
};

// Man könnte auch PATCH verwenden, wenn das Backend es unterstützt und man nur Teile aktualisieren will.
// const partialUpdateUserPreferences = (preferenceData) => {
//   return apiClient.patch(USER_PREFERENCES_ENDPOINT, preferenceData);
// };


const activityService = {
  getAllActivityCategories,
  getAllActivities,
  getActivityById,
  getUserPreferences,
  updateUserPreferences,
  // partialUpdateUserPreferences
};

export default activityService;
