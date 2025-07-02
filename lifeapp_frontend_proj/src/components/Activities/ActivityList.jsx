import React, { useState, useEffect } from 'react';
import activityService from '../../services/activityService';

function ActivityList() {
    const [activities, setActivities] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [userPreferences, setUserPreferences] = useState(null);
    const [suggestedActivities, setSuggestedActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            setError('');
            try {
                const [activitiesRes, categoriesRes, prefsRes] = await Promise.all([
                    activityService.getAllActivities(),
                    activityService.getAllActivityCategories(),
                    activityService.getUserPreferences()
                ]);
                setActivities(activitiesRes.data || []);
                setAllCategories(categoriesRes.data || []);
                setUserPreferences(prefsRes.data);
            } catch (err) {
                setError('Failed to load activity data. Please try again.');
                console.error("Error fetching activity data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        // Filtert Aktivitäten basierend auf der ausgewählten Kategorie
        if (selectedCategoryId) {
            activityService.getAllActivities(selectedCategoryId)
                .then(response => setActivities(response.data || []))
                .catch(err => {
                    console.error("Error fetching filtered activities:", err);
                    setError('Failed to load filtered activities.');
                });
        } else {
            // Wenn keine Kategorie ausgewählt ist, lade alle (oder mache nichts, wenn sie schon geladen sind)
            // Hier könnte man auch die ursprüngliche Liste wiederherstellen, wenn sie separat gehalten wird.
             activityService.getAllActivities()
                .then(response => setActivities(response.data || []))
                .catch(err => {
                    console.error("Error fetching all activities:", err);
                    setError('Failed to load all activities.');
                });
        }
    }, [selectedCategoryId]);

    useEffect(() => {
        // Einfacher Vorschlagsmechanismus: Zeige Aktivitäten, die zu den bevorzugten Kategorien passen
        if (userPreferences && userPreferences.preferred_categories && activities.length > 0) {
            const preferredCategoryIds = new Set(userPreferences.preferred_categories);
            const suggestions = activities.filter(activity =>
                activity.category && preferredCategoryIds.has(allCategories.find(cat => cat.name === activity.category)?.id)
            );
            setSuggestedActivities(suggestions);
        } else {
            setSuggestedActivities([]);
        }
    }, [userPreferences, activities, allCategories]);


    if (loading) return <p>Loading activities...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div className="activity-list-container">
            <h2>Activities</h2>

            {/* Filter nach Kategorie */}
            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="category-filter">Filter by Category: </label>
                <select
                    id="category-filter"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {allCategories.map(category => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Vorgeschlagene Aktivitäten */}
            {suggestedActivities.length > 0 && (
                <div className="suggested-activities">
                    <h3>Suggested for You (based on your preferences)</h3>
                    <ul>
                        {suggestedActivities.map(activity => (
                            <li key={`sugg-${activity.id}`} className="activity-item">
                                <h4>{activity.name} ({activity.category})</h4>
                                <p>{activity.description}</p>
                                <small>
                                    Type: {activity.is_outdoor ? 'Outdoor' : 'Indoor'} |
                                    Duration: {activity.min_duration_minutes} - {activity.max_duration_minutes} min
                                </small>
                                {activity.notes && <p><em>Notes: {activity.notes}</em></p>}
                            </li>
                        ))}
                    </ul>
                    <hr />
                </div>
            )}

            <h3>All Activities {selectedCategoryId ? `(in ${allCategories.find(c=>c.id === parseInt(selectedCategoryId))?.name || ''})` : ''}</h3>
            {activities.length === 0 ? (
                <p>No activities found for the selected criteria.</p>
            ) : (
                <ul className="activity-list">
                    {activities.map(activity => (
                        <li key={activity.id} className="activity-item">
                            <h4>{activity.name} ({activity.category})</h4>
                            <p>{activity.description}</p>
                            <small>
                                Type: {activity.is_outdoor ? 'Outdoor' : 'Indoor'} |
                                Duration: {activity.min_duration_minutes} - {activity.max_duration_minutes} min
                            </small>
                            {activity.notes && <p><em>Notes: {activity.notes}</em></p>}
                        </li>
                    ))}
                </ul>
            )}
            {/* Beispiel CSS (kann in App.css oder einer dedizierten Datei sein)
            .activity-item { border: 1px solid #eee; margin-bottom: 15px; padding: 15px; border-radius: 5px; background-color: #f9f9f9; }
            .activity-item h4 { margin-top: 0; }
            .suggested-activities { border-left: 3px solid #4CAF50; padding-left: 15px; margin-bottom: 20px; }
            */}
        </div>
    );
}

export default ActivityList;
