'use client'

import { FamilyMember, FamilyMemberFormData } from '@/lib/types'
import { useState } from 'react'

interface MemberFormProps {
  member?: FamilyMember | null
  members: FamilyMember[]
  onSubmit: (data: FamilyMemberFormData) => Promise<void>
  onCancel: () => void
}

export default function MemberForm({ member, members, onSubmit, onCancel }: MemberFormProps) {
  const [formData, setFormData] = useState<FamilyMemberFormData>({
    first_name: member?.first_name || '',
    middle_name: member?.middle_name || '',
    last_name: member?.last_name || '',
    maiden_middle_name: member?.maiden_middle_name || '',
    nick_name: member?.nick_name || '',
    birthdate: member?.birthdate || '',
    deathdate: member?.deathdate || '',
    parent_id: member?.parent_id || '',
    spouse_id: member?.spouse_id || '',
    child_order: member?.child_order || 0,
    gender: member?.gender || '',
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    member?.photo_url || null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const submitData: FamilyMemberFormData = {
        ...formData,
        parent_id: formData.parent_id || undefined,
        spouse_id: formData.spouse_id || undefined,
        photo: photo || undefined,
      }
      await onSubmit(submitData)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter out current member from parent and spouse options
  const parentOptions = members.filter(m => m.id !== member?.id)
  // Allow selecting any member as spouse (except self)
  // Include current spouse so it shows in the dropdown when editing
  // The API will handle breaking old spouse relationships if needed
  const spouseOptions = members.filter(m => m.id !== member?.id)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4" data-member-form>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            {member ? 'Edit Family Member' : 'Add Family Member'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo
              </label>
              <div className="flex items-center gap-4">
                {photoPreview && (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Middle Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name
              </label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Maiden Middle Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maiden Middle Name
                <span className="text-xs text-gray-500 ml-1">(Name before marriage)</span>
              </label>
              <input
                type="text"
                name="maiden_middle_name"
                value={formData.maiden_middle_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Nick Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nick Name
              </label>
              <input
                type="text"
                name="nick_name"
                value={formData.nick_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Birthdate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birthdate
              </label>
              <input
                type="date"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Deathdate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deathdate
              </label>
              <input
                type="date"
                name="deathdate"
                value={formData.deathdate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Parent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent (Optional)
              </label>
              <select
                name="parent_id"
                value={formData.parent_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {parentOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nick_name || m.first_name} {m.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Child Order */}
            {formData.parent_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order (for ordering siblings)
                </label>
                <input
                  type="number"
                  name="child_order"
                  value={formData.child_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, child_order: parseInt(e.target.value) || 0 }))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first (left to right)</p>
              </div>
            )}

            {/* Spouse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spouse (Optional)
              </label>
              <select
                name="spouse_id"
                value={formData.spouse_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {spouseOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nick_name || m.first_name} {m.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-500 text-white py-2.5 sm:py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isSubmitting ? 'Saving...' : member ? 'Update' : 'Add Member'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-2.5 sm:py-2 px-4 rounded-md hover:bg-gray-400 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

