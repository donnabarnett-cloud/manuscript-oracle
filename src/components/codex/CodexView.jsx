import React, { useState } from 'react';
import './../../App.css';

// Codex Component for Manuscript Oracle
// Story bible/encyclopedia for characters, locations, objects, lore

export default function CodexView() {
  const [entries, setEntries] = useState([
    { id: 1, type: 'character', name: 'Example Character', description: 'Character details...' },
    { id: 2, type: 'location', name: 'Example Location', description: 'Location details...' }
  ]);
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);

  const types = ['all', 'character', 'location', 'object', 'lore', 'subplot', 'other'];

  const filteredEntries = entries.filter(entry => {
    const matchesType = selectedType === 'all' || entry.type === selectedType;
    const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleAddEntry = () => {
    const newEntry = {
      id: Date.now(),
      type: 'character',
      name: 'New Entry',
      description: 'Add details here...'
    };
    setEntries([...entries, newEntry]);
    setSelectedEntry(newEntry);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui' }}>
      {/* Sidebar */}
      <div style={{
        width: '280px',
        borderRight: '1px solid #e5e7eb',
        background: '#f9fafb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
          <button
            onClick={handleAddEntry}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              marginBottom: '1rem'
            }}
          >
            + New Entry
          </button>
          
          <input
            type="text"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem'
            }}
          />
        </div>

        {/* Type Filters */}
        <div style={{
          padding: '0.75rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          {types.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.375rem',
                border: 'none',
                background: selectedType === type ? '#e0e7ff' : '#f3f4f6',
                color: selectedType === type ? '#4f46e5' : '#6b7280',
                cursor: 'pointer',
                fontSize: '0.75rem',
                textTransform: 'capitalize',
                fontWeight: selectedType === type ? '600' : '400'
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Entry List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {filteredEntries.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', padding: '2rem' }}>
              No entries found
            </p>
          ) : (
            filteredEntries.map(entry => (
              <div
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  background: selectedEntry?.id === entry.id ? '#e0e7ff' : 'white',
                  marginBottom: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  {entry.name}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  textTransform: 'capitalize'
                }}>
                  {entry.type}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
        {selectedEntry ? (
          <>
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <input
                type="text"
                value={selectedEntry.name}
                onChange={(e) => {
                  const updated = { ...selectedEntry, name: e.target.value };
                  setSelectedEntry(updated);
                  setEntries(entries.map(e => e.id === updated.id ? updated : e));
                }}
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  marginBottom: '0.5rem'
                }}
              />
              <select
                value={selectedEntry.type}
                onChange={(e) => {
                  const updated = { ...selectedEntry, type: e.target.value };
                  setSelectedEntry(updated);
                  setEntries(entries.map(e => e.id === updated.id ? updated : e));
                }}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  textTransform: 'capitalize',
                  fontSize: '0.875rem'
                }}
              >
                {types.filter(t => t !== 'all').map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
              <textarea
                value={selectedEntry.description}
                onChange={(e) => {
                  const updated = { ...selectedEntry, description: e.target.value };
                  setSelectedEntry(updated);
                  setEntries(entries.map(e => e.id === updated.id ? updated : e));
                }}
                placeholder="Add details about this entry..."
                style={{
                  width: '100%',
                  minHeight: '400px',
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'system-ui',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{
              padding: '1rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => {
                  setEntries(entries.filter(e => e.id !== selectedEntry.id));
                  setSelectedEntry(null);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Delete Entry
              </button>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📖</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Story Codex
            </h3>
            <p style={{ fontSize: '0.875rem', textAlign: 'center', maxWidth: '400px' }}>
              Track characters, locations, objects, and lore for your manuscript.
              Select an entry or create a new one to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
