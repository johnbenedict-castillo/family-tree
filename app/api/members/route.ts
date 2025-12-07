import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('GET /api/members error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch family members',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()

    const childOrderStr = formData.get('child_order') as string
    const memberData = {
      first_name: formData.get('first_name') as string,
      middle_name: formData.get('middle_name') as string || null,
      last_name: formData.get('last_name') as string,
      maiden_middle_name: formData.get('maiden_middle_name') as string || null,
      nick_name: formData.get('nick_name') as string || null,
      birthdate: formData.get('birthdate') as string || null,
      deathdate: formData.get('deathdate') as string || null,
      parent_id: formData.get('parent_id') as string || null,
      spouse_id: formData.get('spouse_id') as string || null,
      child_order: childOrderStr ? parseInt(childOrderStr) : 0,
      gender: formData.get('gender') as string || null,
    }

    // Handle photo upload if present
    const photo = formData.get('photo') as File | null
    let photoUrl = null

    if (photo && photo.size > 0) {
      const fileExt = photo.name.split('.').pop() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Upload to bucket - fileName only, bucket is specified in .from()
      const { error: uploadError } = await supabase.storage
        .from('family-photos')
        .upload(fileName, photo, {
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Photo upload failed: ${uploadError.message}`)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('family-photos')
        .getPublicUrl(fileName)

      photoUrl = publicUrl
    }

    const { data, error } = await supabase
      .from('family_members')
      .insert([{ ...memberData, photo_url: photoUrl }])
      .select()
      .single()

    if (error) {
      console.error('Database insert error:', error)
      console.error('Member data:', { ...memberData, photo_url: photoUrl })
      throw error
    }

    // If spouse_id is set, also update the spouse to point back to this member
    if (data.spouse_id) {
      // Check if the spouse already has a spouse
      const { data: existingSpouse } = await supabase
        .from('family_members')
        .select('spouse_id')
        .eq('id', data.spouse_id)
        .single()

      // If spouse already has a spouse, clear that relationship first
      if (existingSpouse?.spouse_id && existingSpouse.spouse_id !== data.id) {
        await supabase
          .from('family_members')
          .update({ spouse_id: null })
          .eq('id', existingSpouse.spouse_id)
      }

      // Update the spouse to point back to this new member
      await supabase
        .from('family_members')
        .update({ spouse_id: data.id })
        .eq('id', data.spouse_id)
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Create member error:', error)
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to create family member',
        details: error?.details || error?.hint || error
      },
      { status: 500 }
    )
  }
}

