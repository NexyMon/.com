import React, { useState, useEffect } from 'react';
import activityService from '../../services/activityService';

function UserPreferencesForm() {
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const categoriesResponse = await activityService.getAllActivityCategories();
                setAllCategories(categoriesResponse.data || []);

                const preferencesResponse = await activityService.getUserPreferences();
                if (preferencesResponse.data && preferencesResponse.data.preferred_categories) {
                    setSelectedCategoryIds(new Set(preferencesResponse.data.preferred_categories));
                }
            } catch (err) {
                setError('Failed to load preferences or categories. Please try again.');
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCategoryChange = (categoryId) => {
        setSelectedCategoryIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(categoryId)) {
                newIds.delete(categoryId);
            } else {
                newIds.add(categoryId);
            }
            return newIds;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await activityService.updateUserPreferences({
                preferred_categories: Array.from(selectedCategoryIds)
            });
            setSuccess('Preferences updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to update preferences. Please try again.');
            console.error("Error updating preferences:", err);
        }
    };

    if (loading) return <p>Loading preferences form...</p>;

    return (
        <div className="user-preferences-form">
            <h3>Your Activity Preferences</h3>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}

            <form onSubmit={handleSubmit}>
                <fieldset>
                    <legend>Select your preferred activity categories:</legend>
                    {allCategories.length > 0 ? allCategories.map(category => (
                        <div key={category.id}>
                            <input
                                type="checkbox"
                                id={`category-${category.id}`}
                                value={category.id}
                                checked={selectedCategoryIds.has(category.id)}
                                onChange={() => handleCategoryChange(category.id)}
                            />
                            <label htmlFor={`category-${category.id}`}>{category.name}</label>
                            {category.description && <small style={{ marginLeft: '10px', color: '#555' }}>({category.description})</small>}
                        </div>
                    )) : <p>No categories available to select.</p>}
                </fieldset>
                <button type="submit" disabled={loading}>Save Preferences</button>
            </form>
        </div>
    );
}

export default UserPreferencesForm;
