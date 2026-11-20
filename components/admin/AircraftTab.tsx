'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/lib/toast';

interface AircraftImageInput {
  url: string;
  caption: string;
  source: string;
  license: string;
}

interface Aircraft {
  id: string;
  name: string;
  slug: string;
  isConcept: boolean;
  category: string;
  era: string;
  releaseYear: number | null;
  topSpeedKmh: number;
  serviceCeilingFt: number;
  maxRangeNm: number;
  wingspanM: number;
  maxTakeoffWeightLbs: number;
  stallSpeedKts: number;
  liftToDragRatio: number;
  engineType: string;
  description: string;
  flightControlsDescription: string;
  youtubeId: string;
  schematicUrl: string | null;
  tags: { name: string }[];
  images: { url: string }[];
  _count: { reviews: number; bookings: number; favorites: number; ratings: number };
}

interface AircraftForm {
  name: string;
  isConcept: boolean;
  category: string;
  era: string;
  releaseYear: string;
  topSpeedKmh: string;
  serviceCeilingFt: string;
  maxRangeNm: string;
  wingspanM: string;
  maxTakeoffWeightLbs: string;
  stallSpeedKts: string;
  liftToDragRatio: string;
  engineType: string;
  description: string;
  flightControlsDescription: string;
  youtubeId: string;
  schematicUrl: string;
  tags: string;
  images: AircraftImageInput[];
}

const EMPTY_FORM: AircraftForm = {
  name: '',
  isConcept: false,
  category: 'GENERAL_AVIATION',
  era: 'MODERN',
  releaseYear: '',
  topSpeedKmh: '',
  serviceCeilingFt: '',
  maxRangeNm: '',
  wingspanM: '',
  maxTakeoffWeightLbs: '',
  stallSpeedKts: '',
  liftToDragRatio: '',
  engineType: '',
  description: '',
  flightControlsDescription: '',
  youtubeId: '',
  schematicUrl: '',
  tags: '',
  images: [],
};

const NUMERIC_FIELDS: { key: keyof AircraftForm; label: string }[] = [
  { key: 'topSpeedKmh', label: 'Top Speed (km/h)' },
  { key: 'serviceCeilingFt', label: 'Service Ceiling (ft)' },
  { key: 'maxRangeNm', label: 'Max Range (nmi)' },
  { key: 'wingspanM', label: 'Wingspan (m)' },
  { key: 'maxTakeoffWeightLbs', label: 'Max Takeoff Weight (lbs)' },
  { key: 'stallSpeedKts', label: 'Stall Speed (kts)' },
  { key: 'liftToDragRatio', label: 'Lift-to-Drag Ratio' },
];

const CATEGORIES = ['GENERAL_AVIATION', 'COMMERCIAL_AIRLINER', 'MILITARY', 'SUPERSONIC', 'EXPERIMENTAL'];
const ERAS = ['PIONEER', 'WWII', 'JET_AGE', 'MODERN'];

interface AircraftTabProps {
  onRefresh: () => void;
}

export function AircraftTab({ onRefresh }: AircraftTabProps) {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<Aircraft | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<AircraftForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const { showToast } = useToast();

  const fetchAircraft = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/aircraft');
      if (response.ok) {
        const data = await response.json();
        setAircraftList(data.aircraft || []);
      }
    } catch {
      showToast('Failed to load aircraft', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAircraft();
  }, [fetchAircraft]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setIsCreating(true);
  };

  const openEdit = async (aircraft: Aircraft) => {
    setFieldErrors({});
    try {
      const response = await fetch(`/api/admin/aircraft/${aircraft.id}`);
      if (!response.ok) {
        showToast('Failed to load aircraft for editing', 'error');
        return;
      }
      const { aircraft: full } = await response.json();
      setEditing(full);
      setForm({
        name: full.name,
        isConcept: full.isConcept,
        category: full.category,
        era: full.era,
        releaseYear: full.releaseYear?.toString() ?? '',
        topSpeedKmh: String(full.topSpeedKmh),
        serviceCeilingFt: String(full.serviceCeilingFt),
        maxRangeNm: String(full.maxRangeNm),
        wingspanM: String(full.wingspanM),
        maxTakeoffWeightLbs: String(full.maxTakeoffWeightLbs),
        stallSpeedKts: String(full.stallSpeedKts),
        liftToDragRatio: String(full.liftToDragRatio),
        engineType: full.engineType,
        description: full.description,
        flightControlsDescription: full.flightControlsDescription,
        youtubeId: full.youtubeId,
        schematicUrl: full.schematicUrl ?? '',
        tags: full.tags.map((t: { name: string }) => t.name).join(', '),
        images: full.images.map(
          (img: { url: string; caption: string | null; source: string; license: string }) => ({
            url: img.url,
            caption: img.caption ?? '',
            source: img.source,
            license: img.license,
          })
        ),
      });
      setIsCreating(true);
    } catch {
      showToast('Failed to load aircraft for editing', 'error');
    }
  };

  const closeForm = () => {
    setIsCreating(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
  };

  const updateField = (key: keyof AircraftForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateImage = (index: number, key: keyof AircraftImageInput, value: string) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? { ...img, [key]: value } : img)),
    }));
  };

  const buildPayload = () => {
    const numeric = (value: string) => Number(value);
    return {
      name: form.name.trim(),
      isConcept: form.isConcept,
      category: form.category,
      era: form.era,
      releaseYear: form.releaseYear ? Number(form.releaseYear) : null,
      topSpeedKmh: numeric(form.topSpeedKmh),
      serviceCeilingFt: numeric(form.serviceCeilingFt),
      maxRangeNm: numeric(form.maxRangeNm),
      wingspanM: numeric(form.wingspanM),
      maxTakeoffWeightLbs: numeric(form.maxTakeoffWeightLbs),
      stallSpeedKts: numeric(form.stallSpeedKts),
      liftToDragRatio: numeric(form.liftToDragRatio),
      engineType: form.engineType.trim(),
      description: form.description,
      flightControlsDescription: form.flightControlsDescription,
      youtubeId: form.youtubeId.trim(),
      schematicUrl: form.schematicUrl.trim() || null,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      images: form.images.filter((img) => img.url.trim()).map((img) => ({
        url: img.url.trim(),
        caption: img.caption.trim() || null,
        source: img.source.trim() || 'Admin',
        license: img.license.trim() || 'Unknown',
      })),
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setFieldErrors({});
    try {
      const payload = buildPayload();
      const response = await fetch(
        editing ? `/api/admin/aircraft/${editing.id}` : '/api/admin/aircraft',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        showToast(editing ? 'Aircraft updated!' : 'Aircraft created!', 'success');
        closeForm();
        fetchAircraft();
        onRefresh();
        return;
      }

      const error = await response.json();
      if (error.error?.fieldErrors) {
        setFieldErrors(error.error.fieldErrors);
      }
      showToast(error.error?.message || 'Failed to save aircraft', 'error');
    } catch {
      showToast('Failed to save aircraft', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (aircraft: Aircraft) => {
    if (
      !confirm(
        `Delete "${aircraft.name}"? This also removes its bookings, reviews, ratings, favorites, notes and flight logs. This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/aircraft/${aircraft.id}`, { method: 'DELETE' });
      if (response.ok) {
        showToast('Aircraft deleted', 'success');
        fetchAircraft();
        onRefresh();
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to delete aircraft', 'error');
      }
    } catch {
      showToast('Failed to delete aircraft', 'error');
    }
  };

  const errorText = (key: string) =>
    fieldErrors[key] ? (
      <p className="text-xs text-red-400 mt-1">{fieldErrors[key][0]}</p>
    ) : null;

  const renderInputClass = (key: string) =>
    `w-full p-2 bg-slate-800/50 border ${
      fieldErrors[key] ? 'border-red-500' : 'border-slate-700'
    } rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan`;

  return (
    <div className="bg-panel rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Aircraft ({aircraftList.length})</h2>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-accent-cyan text-white text-sm font-medium rounded-lg hover:bg-cyan-600 transition-colors"
        >
          Add Aircraft
        </button>
      </div>

      {isLoading ? (
        <div className="text-slate-400">Loading aircraft...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700/50">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Era</th>
                <th className="py-2 pr-4">Speed</th>
                <th className="py-2 pr-4">Stats</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {aircraftList.map((aircraft) => (
                <tr key={aircraft.id} className="border-b border-slate-800/50">
                  <td className="py-2 pr-4 text-white">
                    {aircraft.name}
                    {aircraft.isConcept && (
                      <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                        Concept
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-slate-400">{aircraft.category}</td>
                  <td className="py-2 pr-4 text-slate-400">{aircraft.era}</td>
                  <td className="py-2 pr-4 text-slate-400">{aircraft.topSpeedKmh} km/h</td>
                  <td className="py-2 pr-4 text-xs text-slate-500">
                    {aircraft._count.bookings}b / {aircraft._count.reviews}r /{' '}
                    {aircraft._count.favorites}f
                  </td>
                  <td className="py-2">
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEdit(aircraft)}
                        className="hover:text-accent-cyan transition-colors"
                        aria-label={`Edit ${aircraft.name}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(aircraft)}
                        className="hover:text-red-400 transition-colors"
                        aria-label={`Delete ${aircraft.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
          <div className="bg-panel rounded-lg p-6 w-full max-w-3xl my-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editing ? `Edit ${editing.name}` : 'Add Aircraft'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={renderInputClass('name')}
                />
                {errorText('name')}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">YouTube Video ID *</label>
                <input
                  value={form.youtubeId}
                  onChange={(e) => updateField('youtubeId', e.target.value)}
                  className={renderInputClass('youtubeId')}
                />
                {errorText('youtubeId')}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className={renderInputClass('category')}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Era *</label>
                <select
                  value={form.era}
                  onChange={(e) => updateField('era', e.target.value)}
                  className={renderInputClass('era')}
                >
                  {ERAS.map((era) => (
                    <option key={era} value={era}>
                      {era}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Release Year</label>
                <input
                  type="number"
                  value={form.releaseYear}
                  onChange={(e) => updateField('releaseYear', e.target.value)}
                  className={renderInputClass('releaseYear')}
                />
                {errorText('releaseYear')}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Engine Type *</label>
                <input
                  value={form.engineType}
                  onChange={(e) => updateField('engineType', e.target.value)}
                  className={renderInputClass('engineType')}
                />
                {errorText('engineType')}
              </div>
              {NUMERIC_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs text-slate-400 mb-1">{field.label} *</label>
                  <input
                    type="number"
                    step="any"
                    value={form[field.key] as string}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className={renderInputClass(field.key)}
                  />
                  {errorText(field.key)}
                </div>
              ))}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Schematic URL</label>
                <input
                  value={form.schematicUrl}
                  onChange={(e) => updateField('schematicUrl', e.target.value)}
                  className={renderInputClass('schematicUrl')}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => updateField('tags', e.target.value)}
                  placeholder="jet, fighter, legendary"
                  className={renderInputClass('tags')}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  className={`${renderInputClass('description')} resize-none`}
                />
                {errorText('description')}
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">
                  Flight Controls Description *
                </label>
                <textarea
                  value={form.flightControlsDescription}
                  onChange={(e) => updateField('flightControlsDescription', e.target.value)}
                  rows={3}
                  className={`${renderInputClass('flightControlsDescription')} resize-none`}
                />
                {errorText('flightControlsDescription')}
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isConcept"
                    checked={form.isConcept}
                    onChange={(e) => updateField('isConcept', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="isConcept" className="text-sm text-slate-300">
                    Concept aircraft
                  </label>
                </div>
              </div>

              {/* Images */}
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-2">Images</label>
                <div className="space-y-3">
                  {form.images.map((img, index) => (
                    <div key={index} className="p-3 bg-slate-800/30 border border-slate-700 rounded space-y-2">
                      <div className="flex gap-2">
                        <input
                          value={img.url}
                          onChange={(e) => updateImage(index, 'url', e.target.value)}
                          placeholder="https://..."
                          className="flex-1 p-2 bg-slate-800/50 border border-slate-700 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                          aria-label="Image URL"
                        />
                        <button
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== index),
                            }))
                          }
                          className="px-2 text-slate-400 hover:text-red-400 transition-colors"
                          aria-label="Remove image"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          value={img.caption}
                          onChange={(e) => updateImage(index, 'caption', e.target.value)}
                          placeholder="Caption"
                          className="p-2 bg-slate-800/50 border border-slate-700 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                          aria-label="Image caption"
                        />
                        <input
                          value={img.source}
                          onChange={(e) => updateImage(index, 'source', e.target.value)}
                          placeholder="Source"
                          className="p-2 bg-slate-800/50 border border-slate-700 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                          aria-label="Image source"
                        />
                        <input
                          value={img.license}
                          onChange={(e) => updateImage(index, 'license', e.target.value)}
                          placeholder="License"
                          className="p-2 bg-slate-800/50 border border-slate-700 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                          aria-label="Image license"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      images: [...prev.images, { url: '', caption: '', source: '', license: '' }],
                    }))
                  }
                  className="mt-2 px-3 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-600 transition-colors"
                >
                  + Add Image
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-accent-cyan text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editing ? 'Save Changes' : 'Create Aircraft'}
              </button>
              <button
                onClick={closeForm}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
