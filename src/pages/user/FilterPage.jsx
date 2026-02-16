import React, { useState } from 'react';
import { Sliders, X, ChevronRight, MapPin, Calendar, Activity, Ruler, Heart } from 'lucide-react';

const FilterPage = ({ onClose, onApplyFilters }) => {
  const [filters, setFilters] = useState({
    location: '',
    distance: 25,
    breed: '',
    age: [],
    size: [],
    temperament: [],
    energyLevel: '',
    healthStatus: [],
    goodWith: []
  });

  const ageOptions = [
    { id: 'puppy', label: 'Puppy (0-1 year)', icon: '🐶' },
    { id: 'young', label: 'Young (1-3 years)', icon: '🐕' },
    { id: 'adult', label: 'Adult (3-8 years)', icon: '🐩' },
    { id: 'senior', label: 'Senior (8+ years)', icon: '🦮' }
  ];

  const sizeOptions = [
    { id: 'small', label: 'Small (under 10kg)', icon: '🐕‍' },
    { id: 'medium', label: 'Medium (10-25kg)', icon: '🐕' },
    { id: 'large', label: 'Large (25-45kg)', icon: '🐕' },
    { id: 'xlarge', label: 'Extra Large (45kg+)', icon: '🦮' }
  ];

  const temperamentOptions = [
    { id: 'friendly', label: 'Friendly', icon: '😊' },
    { id: 'playful', label: 'Playful', icon: '🎾' },
    { id: 'calm', label: 'Calm', icon: '☕' },
    { id: 'energetic', label: 'Energetic', icon: '⚡' },
    { id: 'independent', label: 'Independent', icon: '💪' },
    { id: 'affectionate', label: 'Affectionate', icon: '💖' }
  ];

  const energyLevels = [
    { id: 'low', label: 'Low' },
    { id: 'medium', label: 'Medium' },
    { id: 'high', label: 'High' }
  ];

  const healthOptions = [
    { id: 'vaccinated', label: 'Vaccinated' },
    { id: 'neutered', label: 'Neutered/Spayed' },
    { id: 'microchipped', label: 'Microchipped' },
    { id: 'special-needs', label: 'Special Needs' }
  ];

  const goodWithOptions = [
    { id: 'kids', label: 'Kids' },
    { id: 'dogs', label: 'Other Dogs' },
    { id: 'cats', label: 'Cats' },
    { id: 'apartments', label: 'Apartments' }
  ];

  const breedOptions = [
    'Mixed Breed', 'Labrador Retriever', 'German Shepherd', 'Golden Retriever',
    'French Bulldog', 'Bulldog', 'Poodle', 'Beagle', 'Rottweiler', 'Other'
  ];

  const handleToggle = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const handleSelect = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category] === value ? '' : value
    }));
  };

  const handleClear = () => {
    setFilters({
      location: '',
      distance: 25,
      breed: '',
      age: [],
      size: [],
      temperament: [],
      energyLevel: '',
      healthStatus: [],
      goodWith: []
    });
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const activeFilterCount = [
    filters.breed ? 1 : 0,
    filters.age.length,
    filters.size.length,
    filters.temperament.length,
    filters.energyLevel ? 1 : 0,
    filters.healthStatus.length,
    filters.goodWith.length
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-button transition-colors"
          >
            <X size={24} className="text-muted" />
          </button>
          <div>
            <h1 className="text-xl font-heading font-semibold text-text">Filters</h1>
            {activeFilterCount > 0 && (
              <p className="text-xs text-muted">{activeFilterCount} active filters</p>
            )}
          </div>
        </div>
        <button
          onClick={handleClear}
          className="text-primary text-sm font-medium hover:underline"
        >
          Clear All
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Location */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Location</h2>
          </div>
          <div className="relative">
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              className="w-full pl-10 pr-3 py-3 bg-input-background border border-border rounded-input focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Enter city or zip code"
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted">Distance</span>
              <span className="text-sm font-medium text-primary">{filters.distance} miles</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={filters.distance}
              onChange={(e) => setFilters(prev => ({ ...prev, distance: parseInt(e.target.value) }))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* Breed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-text">Breed</h2>
            <ChevronRight size={20} className="text-muted" />
          </div>
          <select
            value={filters.breed}
            onChange={(e) => setFilters(prev => ({ ...prev, breed: e.target.value }))}
            className="w-full py-3 px-4 bg-input-background border border-border rounded-input focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Any Breed</option>
            {breedOptions.map(breed => (
              <option key={breed} value={breed}>{breed}</option>
            ))}
          </select>
        </div>

        {/* Age */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Age</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ageOptions.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleToggle('age', option.id)}
                className={`flex items-center gap-2 p-3 rounded-input border transition-all ${
                  filters.age.includes(option.id)
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-card border-border text-text hover:border-primary/50'
                }`}
              >
                <span className="text-xl">{option.icon}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Ruler size={20} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Size</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sizeOptions.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleToggle('size', option.id)}
                className={`flex items-center gap-2 p-3 rounded-input border transition-all ${
                  filters.size.includes(option.id)
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-card border-border text-text hover:border-primary/50'
                }`}
              >
                <span className="text-xl">{option.icon}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Temperament */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Temperament</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {temperamentOptions.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleToggle('temperament', option.id)}
                className={`flex items-center gap-2 p-3 rounded-input border transition-all ${
                  filters.temperament.includes(option.id)
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-card border-border text-text hover:border-primary/50'
                }`}
              >
                <span className="text-xl">{option.icon}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy Level */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Energy Level</h2>
          </div>
          <div className="flex gap-2">
            {energyLevels.map(level => (
              <button
                key={level.id}
                type="button"
                onClick={() => handleSelect('energyLevel', level.id)}
                className={`flex-1 py-2 px-4 rounded-input border transition-all ${
                  filters.energyLevel === level.id
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-card border-border text-text hover:border-primary/50'
                }`}
              >
                <span className="text-sm font-medium">{level.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Filters */}
        <div className="space-y-4">
          {/* Health Status */}
          <div className="space-y-2">
            <h3 className="font-medium text-text">Health Status</h3>
            <div className="flex flex-wrap gap-2">
              {healthOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleToggle('healthStatus', option.id)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                    filters.healthStatus.includes(option.id)
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-card border-border text-text hover:border-primary/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Good With */}
          <div className="space-y-2">
            <h3 className="font-medium text-text">Good With</h3>
            <div className="flex flex-wrap gap-2">
              {goodWithOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleToggle('goodWith', option.id)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                    filters.goodWith.includes(option.id)
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-card border-border text-text hover:border-primary/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Apply Button */}
      <div className="border-t border-border p-4">
        <button
          onClick={handleApply}
          className="w-full py-3 bg-primary text-white font-semibold rounded-button hover:bg-primary/90 active:scale-[0.98] transition-all shadow-button"
        >
          Apply Filters ({activeFilterCount})
        </button>
      </div>
    </div>
  );
};

export default FilterPage;