import React, { useEffect } from 'react';
import { usePersonalizationStore } from '../store/personalization';

export function PersonalizationForm() {
  const { personalInfo, updatePersonalInfo, loadPersonalInfo } = usePersonalizationStore();

  useEffect(() => {
    loadPersonalInfo();
  }, [loadPersonalInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePersonalInfo(personalInfo);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-6">
      {/* Basic Information */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold border-b pb-2">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={personalInfo.name || ''}
              onChange={(e) => updatePersonalInfo({ name: e.target.value })}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={personalInfo.email || ''}
              onChange={(e) => updatePersonalInfo({ email: e.target.value })}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              value={personalInfo.phone || ''}
              onChange={(e) => updatePersonalInfo({ phone: e.target.value })}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground"
            />
          </div>
        </div>
      </section>

      {/* Address Information */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold border-b pb-2">Address Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Street</label>
            <input
              type="text"
              value={personalInfo.address?.street || ''}
              onChange={(e) => updatePersonalInfo({
                address: {
                  ...personalInfo.address,
                  street: e.target.value
                }
              })}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                value={personalInfo.address?.city || ''}
                onChange={(e) => updatePersonalInfo({
                  address: {
                    ...personalInfo.address,
                    city: e.target.value
                  }
                })}
                className="w-full p-2 rounded-md border border-input bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <input
                type="text"
                value={personalInfo.address?.state || ''}
                onChange={(e) => updatePersonalInfo({
                  address: {
                    ...personalInfo.address,
                    state: e.target.value
                  }
                })}
                className="w-full p-2 rounded-md border border-input bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ZIP</label>
              <input
                type="text"
                value={personalInfo.address?.zip || ''}
                onChange={(e) => updatePersonalInfo({
                  address: {
                    ...personalInfo.address,
                    zip: e.target.value
                  }
                })}
                className="w-full p-2 rounded-md border border-input bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <input
                type="text"
                value={personalInfo.address?.country || ''}
                onChange={(e) => updatePersonalInfo({
                  address: {
                    ...personalInfo.address,
                    country: e.target.value
                  }
                })}
                className="w-full p-2 rounded-md border border-input bg-background text-foreground"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Professional Details */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold border-b pb-2">Professional Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Resume/Background</label>
            <textarea
              value={personalInfo.resume || ''}
              onChange={(e) => updatePersonalInfo({ resume: e.target.value })}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground min-h-[100px]"
              placeholder="Your professional background and experience..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Current Projects</label>
            <textarea
              value={personalInfo.projects || ''}
              onChange={(e) => updatePersonalInfo({ projects: e.target.value })}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground min-h-[100px]"
              placeholder="What are you currently working on?"
            />
          </div>
        </div>
      </section>

      {/* Health Information */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold border-b pb-2">Health Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Height</label>
            <input
              type="text"
              value={personalInfo.health_info?.height || ''}
              onChange={(e) => updatePersonalInfo({
                health_info: {
                  ...personalInfo.health_info,
                  height: e.target.value
                }
              })}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Weight</label>
            <input
              type="text"
              value={personalInfo.health_info?.weight || ''}
              onChange={(e) => updatePersonalInfo({
                health_info: {
                  ...personalInfo.health_info,
                  weight: e.target.value
                }
              })}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Allergies (comma-separated)</label>
          <input
            type="text"
            value={personalInfo.health_info?.allergies?.join(', ') || ''}
            onChange={(e) => updatePersonalInfo({
              health_info: {
                ...personalInfo.health_info,
                allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }
            })}
            className="w-full p-2 rounded-md border border-input bg-background text-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dietary Preferences (comma-separated)</label>
          <input
            type="text"
            value={personalInfo.health_info?.dietary_preferences?.join(', ') || ''}
            onChange={(e) => updatePersonalInfo({
              health_info: {
                ...personalInfo.health_info,
                dietary_preferences: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }
            })}
            className="w-full p-2 rounded-md border border-input bg-background text-foreground"
          />
        </div>
      </section>

      {/* Interests & Preferences */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold border-b pb-2">Interests & Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Interests (comma-separated)</label>
            <input
              type="text"
              value={personalInfo.interests?.join(', ') || ''}
              onChange={(e) => updatePersonalInfo({
                interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground"
              placeholder="e.g. AI, Programming, Design"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Areas of Expertise (comma-separated)</label>
            <input
              type="text"
              value={personalInfo.expertise_areas?.join(', ') || ''}
              onChange={(e) => updatePersonalInfo({
                expertise_areas: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground"
              placeholder="e.g. JavaScript, React, UI/UX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Communication Style</label>
            <select
              value={personalInfo.communication_style || ''}
              onChange={(e) => updatePersonalInfo({ communication_style: e.target.value })}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground"
            >
              <option value="">Select style...</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="direct">Direct</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Learning Style</label>
            <select
              value={personalInfo.learning_style || ''}
              onChange={(e) => updatePersonalInfo({ learning_style: e.target.value })}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground"
            >
              <option value="">Select style...</option>
              <option value="visual">Visual</option>
              <option value="auditory">Auditory</option>
              <option value="kinesthetic">Hands-on</option>
              <option value="reading">Reading/Writing</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Work Style</label>
            <select
              value={personalInfo.work_style || ''}
              onChange={(e) => updatePersonalInfo({ work_style: e.target.value })}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground"
            >
              <option value="">Select style...</option>
              <option value="independent">Independent</option>
              <option value="collaborative">Collaborative</option>
              <option value="structured">Structured</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
        </div>
      </section>

      {/* Identity & Worldview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold border-b pb-2">Identity & Worldview</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cultural Background</label>
            <textarea
              value={personalInfo.identity_info?.cultural_background || ''}
              onChange={(e) => updatePersonalInfo({
                identity_info: {
                  ...personalInfo.identity_info,
                  cultural_background: e.target.value
                }
              })}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground min-h-[100px]"
              placeholder="Share your cultural background and influences..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Values (comma-separated)</label>
            <input
              type="text"
              value={personalInfo.identity_info?.values?.join(', ') || ''}
              onChange={(e) => updatePersonalInfo({
                identity_info: {
                  ...personalInfo.identity_info,
                  values: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }
              })}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground"
              placeholder="e.g. Honesty, Creativity, Growth"
            />
          </div>
        </div>
      </section>

      {/* Goals & Dreams */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold border-b pb-2">Goals & Dreams</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Goals (comma-separated)</label>
          <input
            type="text"
            value={personalInfo.goals?.join(', ') || ''}
            onChange={(e) => updatePersonalInfo({
              goals: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
            })}
            className="w-full p-2 rounded-md border border-input bg-background text-foreground"
            placeholder="e.g. Start a business, Learn a new language, Travel to Japan"
          />
        </div>
      </section>

      {/* Additional Notes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold border-b pb-2">Additional Notes</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={personalInfo.notes || ''}
            onChange={(e) => updatePersonalInfo({ notes: e.target.value })}
            className="w-full p-2 rounded-md border border-input bg-background text-foreground min-h-[100px]"
            placeholder="Any additional information you'd like to share..."
          />
        </div>
      </section>

      <div className="flex justify-end gap-4 pt-4">
        <button
          type="submit"
          className="px-6 py-2 bg-primary text-button-text rounded-md hover:bg-primary/90 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}