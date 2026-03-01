import React, { useState, useEffect } from 'react';
import './ReviewView.css';

const ReviewView = ({ novelId }) => {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ reviewer: '', feedback: '', rating: 5 });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadReviews();
  }, [novelId]);

  const loadReviews = () => {
    const storageKey = `manuscript_oracle_reviews_${novelId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setReviews(JSON.parse(stored));
    }
  };

  const saveReviews = (updatedReviews) => {
    const storageKey = `manuscript_oracle_reviews_${novelId}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedReviews));
    setReviews(updatedReviews);
  };

  const addReview = () => {
    if (!newReview.reviewer.trim() || !newReview.feedback.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const review = {
      id: Date.now().toString(),
      ...newReview,
      date: new Date().toISOString(),
      status: 'pending'
    };

    const updatedReviews = [...reviews, review];
    saveReviews(updatedReviews);
    setNewReview({ reviewer: '', feedback: '', rating: 5 });
  };

  const updateReviewStatus = (id, status) => {
    const updatedReviews = reviews.map(r =>
      r.id === id ? { ...r, status } : r
    );
    saveReviews(updatedReviews);
  };

  const deleteReview = (id) => {
    if (window.confirm('Delete this review?')) {
      const updatedReviews = reviews.filter(r => r.id !== id);
      saveReviews(updatedReviews);
    }
  };

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter(r => r.status === filter);

  return (
    <div className="review-view">
      <div className="review-header">
        <h2>Beta Reader Reviews</h2>
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({reviews.length})
          </button>
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending ({reviews.filter(r => r.status === 'pending').length})
          </button>
          <button
            className={filter === 'reviewed' ? 'active' : ''}
            onClick={() => setFilter('reviewed')}
          >
            Reviewed ({reviews.filter(r => r.status === 'reviewed').length})
          </button>
          <button
            className={filter === 'implemented' ? 'active' : ''}
            onClick={() => setFilter('implemented')}
          >
            Implemented ({reviews.filter(r => r.status === 'implemented').length})
          </button>
        </div>
      </div>

      <div className="add-review-form">
        <h3>Add New Review</h3>
        <input
          type="text"
          placeholder="Reviewer Name"
          value={newReview.reviewer}
          onChange={(e) => setNewReview({ ...newReview, reviewer: e.target.value })}
        />
        <textarea
          placeholder="Feedback"
          value={newReview.feedback}
          onChange={(e) => setNewReview({ ...newReview, feedback: e.target.value })}
          rows={4}
        />
        <div className="rating-selector">
          <label>Rating:</label>
          <select
            value={newReview.rating}
            onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
          >
            {[5, 4, 3, 2, 1].map(rating => (
              <option key={rating} value={rating}>{rating} Stars</option>
            ))}
          </select>
        </div>
        <button onClick={addReview}>Add Review</button>
      </div>

      <div className="reviews-list">
        {filteredReviews.length === 0 ? (
          <div className="empty-state">
            <p>No reviews yet. Add your first beta reader feedback!</p>
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review.id} className={`review-card status-${review.status}`}>
              <div className="review-header-line">
                <div className="reviewer-info">
                  <strong>{review.reviewer}</strong>
                  <span className="rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </div>
                <span className="review-date">
                  {new Date(review.date).toLocaleDateString()}
                </span>
              </div>
              <div className="review-feedback">{review.feedback}</div>
              <div className="review-actions">
                <select
                  value={review.status}
                  onChange={(e) => updateReviewStatus(review.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="implemented">Implemented</option>
                </select>
                <button onClick={() => deleteReview(review.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewView;
