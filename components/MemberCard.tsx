'use client'

import { FamilyMember } from '@/lib/types'
import { format } from 'date-fns'
import Image from 'next/image'

interface MemberCardProps {
  member: FamilyMember
  onEdit?: (member: FamilyMember) => void
  onDelete?: (id: string) => void
  isPrimary?: boolean // True if this is the primary member (child), false if spouse
}

export default function MemberCard({ member, onEdit, onDelete, isPrimary }: MemberCardProps) {
  const displayName = member.nick_name || member.first_name
  const middleName = member.middle_name ? ` ${member.middle_name}` : ''
  const fullName = `${member.first_name}${middleName} ${member.last_name}`
  const maidenName = member.maiden_middle_name ? ` (${member.maiden_middle_name})` : ''
  
  const formatDate = (date: string | null) => {
    if (!date) return null
    try {
      return format(new Date(date), 'MMM d, yyyy')
    } catch {
      return date
    }
  }

  const calculateAge = (birthdate: string | null, deathdate: string | null) => {
    if (!birthdate) return null
    try {
      const birth = new Date(birthdate)
      const today = deathdate ? new Date(deathdate) : new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      
      return age
    } catch {
      return null
    }
  }

  const age = calculateAge(member.birthdate, member.deathdate)
  
  // Determine background color based on gender
  const getBackgroundColor = () => {
    if (member.gender === 'male') return 'bg-blue-50'
    if (member.gender === 'female') return 'bg-pink-50'
    if (member.gender === 'other') return 'bg-gradient-to-br from-red-100 via-yellow-100 via-green-100 via-blue-100 to-purple-100'
    return 'bg-white'
  }
  
  // Determine border color based on gender
  const getBorderColor = () => {
    if (member.gender === 'male') return 'border-blue-500'
    if (member.gender === 'female') return 'border-pink-500'
    if (member.gender === 'other') return 'border-purple-500'
    return 'border-gray-300'
  }

  return (
    <div className={`${getBackgroundColor()} rounded-lg shadow-md p-2 w-40 sm:w-48 h-44 flex flex-col items-center hover:shadow-lg transition-shadow border-2 ${getBorderColor()} relative`}>
      {/* Indicator for primary member (child) - only show if member has a parent */}
      {isPrimary && member.parent_id && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold z-10" title="Child">
          C
        </div>
      )}
      {/* Circular Photo */}
      <div className="relative w-14 h-14 mb-1 flex-shrink-0">
        {member.photo_url ? (
          <div className={`rounded-full overflow-hidden w-14 h-14 border-2 ${getBorderColor()}`}>
            <Image
              src={member.photo_url}
              alt={fullName}
              width={56}
              height={56}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className={`rounded-full w-14 h-14 border-2 ${getBorderColor()} bg-gray-200 flex items-center justify-center`}>
            <span className="text-lg text-gray-500 font-bold">
              {member.first_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className={`text-xs font-semibold text-gray-800 mb-0.5 text-center line-clamp-1 ${member.nick_name ? 'font-bold uppercase' : ''}`}>
        {displayName}
        {member.deathdate && (
          <span className="ml-1 text-red-600">✝</span>
        )}
      </h3>
      <p className="text-xs text-gray-600 mb-0.5 text-center line-clamp-1">{fullName}{maidenName}</p>

      {/* Dates */}
      <div className="text-xs text-gray-600 space-y-0 mb-1 flex-grow flex flex-col justify-center min-h-0">
        {member.birthdate && (
          <p className="text-center leading-tight">Born: {formatDate(member.birthdate)} {age !== null && `(${age})`}</p>
        )}
        {member.deathdate && (
          <p className="text-center leading-tight">Died: {formatDate(member.deathdate)}</p>
        )}
      </div>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="flex gap-1 mt-auto">
          {onEdit && (
            <button
              onClick={() => onEdit(member)}
              className="px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(member.id)}
              className="px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

