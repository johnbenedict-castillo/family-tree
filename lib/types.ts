export interface FamilyMember {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  maiden_middle_name: string | null
  nick_name: string | null
  birthdate: string | null
  deathdate: string | null
  photo_url: string | null
  parent_id: string | null
  spouse_id: string | null
  child_order: number | null
  gender: string | null
  created_at: string
  updated_at: string
}

export interface FamilyMemberFormData {
  first_name: string
  middle_name?: string
  last_name: string
  maiden_middle_name?: string
  nick_name?: string
  birthdate?: string
  deathdate?: string
  photo?: File
  parent_id?: string
  spouse_id?: string
  child_order?: number
  gender?: string
}

