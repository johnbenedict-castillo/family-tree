import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const formData = await request.formData()

    // Get current member to handle spouse relationship updates
    const { data: currentMember } = await supabase
      .from('family_members')
      .select('spouse_id')
      .eq('id', id)
      .single()

    const childOrderStr = formData.get('child_order') as string
    const memberData: any = {
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
    if (photo && photo instanceof File && photo.size > 0 && photo.name) {
      try {
        const fileExt = photo.name.split('.').pop() || 'jpg'
        const fileName = `${id}-${Date.now()}.${fileExt}`
        const filePath = `family-photos/${fileName}`

        // Delete old photo if it exists (optional - don't fail if this fails)
        try {
          const { data: currentMemberData } = await supabase
            .from('family_members')
            .select('photo_url')
            .eq('id', id)
            .single()

          if (currentMemberData?.photo_url) {
            // Extract file path from URL and try to delete
            const urlParts = currentMemberData.photo_url.split('/family-photos/')
            if (urlParts.length > 1) {
              const oldFilePath = urlParts[1].split('?')[0] // Remove query params if any
              if (oldFilePath) {
                await supabase.storage
                  .from('family-photos')
                  .remove([oldFilePath])
              }
            }
          }
        } catch (deleteError) {
          // Don't fail the update if old photo deletion fails
          console.warn('Failed to delete old photo:', deleteError)
        }

        // Upload new photo
        const { error: uploadError } = await supabase.storage
          .from('family-photos')
          .upload(filePath, photo, {
            upsert: false // Don't overwrite, use unique filename
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`Photo upload failed: ${uploadError.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('family-photos')
          .getPublicUrl(filePath)

        memberData.photo_url = publicUrl
      } catch (photoError: any) {
        console.error('Photo processing error:', photoError)
        // Don't fail the entire update if photo upload fails, but log it
        // You can choose to throw here if you want to require photo uploads
        throw new Error(`Photo upload failed: ${photoError.message || 'Unknown error'}`)
      }
    }

    const { data, error } = await supabase
      .from('family_members')
      .update(memberData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database update error:', error)
      console.error('Member data:', memberData)
      throw error
    }

    // Handle spouse relationship updates
    const oldSpouseId = currentMember?.spouse_id
    const newSpouseId = memberData.spouse_id

    // If spouse changed, update old spouse to remove relationship
    if (oldSpouseId && oldSpouseId !== newSpouseId) {
      await supabase
        .from('family_members')
        .update({ spouse_id: null })
        .eq('id', oldSpouseId)
    }

    // If new spouse is set, update spouse to point back to this member
    if (newSpouseId && newSpouseId !== oldSpouseId) {
      // Check if the new spouse already has a spouse
      const { data: newSpouseData } = await supabase
        .from('family_members')
        .select('spouse_id')
        .eq('id', newSpouseId)
        .single()

      // If new spouse already has a spouse, clear that relationship first
      if (newSpouseData?.spouse_id && newSpouseData.spouse_id !== id) {
        await supabase
          .from('family_members')
          .update({ spouse_id: null })
          .eq('id', newSpouseData.spouse_id)
      }

      // Update the new spouse to point back to this member
      await supabase
        .from('family_members')
        .update({ spouse_id: id })
        .eq('id', newSpouseId)
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Update error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update family member', details: error },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get the member's spouse_id before deleting
    const { data: member } = await supabase
      .from('family_members')
      .select('spouse_id')
      .eq('id', id)
      .single()

    // Clear spouse relationship if exists
    if (member?.spouse_id) {
      await supabase
        .from('family_members')
        .update({ spouse_id: null })
        .eq('id', member.spouse_id)
    }

    // Also clear any members who have this member as their spouse
    await supabase
      .from('family_members')
      .update({ spouse_id: null })
      .eq('spouse_id', id)

    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete family member' },
      { status: 500 }
    )
  }
}

