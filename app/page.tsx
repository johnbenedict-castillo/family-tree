'use client'

import { FamilyMember, FamilyMemberFormData } from '@/lib/types'
import { useEffect, useState, useRef } from 'react'
import FamilyTree from '@/components/FamilyTree'
import MemberForm from '@/components/MemberForm'
import { toPng } from 'html-to-image'

export default function Home() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [treeTitle, setTreeTitle] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('familyTreeTitle') || 'Family Tree'
    }
    return 'Family Tree'
  })
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const treeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members')
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = () => {
    setEditingMember(null)
    setShowForm(true)
  }

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member)
    setShowForm(true)
  }

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to delete this family member?')) {
      return
    }

    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMembers(members.filter(m => m.id !== id))
      } else {
        alert('Failed to delete member')
      }
    } catch (error) {
      console.error('Error deleting member:', error)
      alert('Failed to delete member')
    }
  }

  const handleSubmitForm = async (data: FamilyMemberFormData) => {
    try {
      const formData = new FormData()
      formData.append('first_name', data.first_name)
      if (data.middle_name) formData.append('middle_name', data.middle_name)
      formData.append('last_name', data.last_name)
      if (data.maiden_middle_name) formData.append('maiden_middle_name', data.maiden_middle_name)
      if (data.nick_name) formData.append('nick_name', data.nick_name)
      if (data.birthdate) formData.append('birthdate', data.birthdate)
      if (data.deathdate) formData.append('deathdate', data.deathdate)
      if (data.parent_id) formData.append('parent_id', data.parent_id)
      if (data.spouse_id) formData.append('spouse_id', data.spouse_id)
      if (data.child_order !== undefined) formData.append('child_order', data.child_order.toString())
      if (data.gender) formData.append('gender', data.gender)
      if (data.photo) formData.append('photo', data.photo)

      const url = editingMember ? `/api/members/${editingMember.id}` : '/api/members'
      const method = editingMember ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        body: formData,
      })

      if (response.ok) {
        const newMember = await response.json()
        if (editingMember) {
          setMembers(members.map(m => m.id === editingMember.id ? newMember : m))
        } else {
          setMembers([...members, newMember])
        }
        setShowForm(false)
        setEditingMember(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save member')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Failed to save member')
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingMember(null)
  }

  const handleDownloadTree = async () => {
    if (!treeRef.current) return

    setIsDownloading(true)
    try {
      // Hide buttons and form before capturing
      const buttons = document.querySelector('.mb-6.flex.justify-center')
      const form = document.querySelector('[data-member-form]')
      const originalButtonDisplay = buttons ? (buttons as HTMLElement).style.display : ''
      const originalFormDisplay = form ? (form as HTMLElement).style.display : ''
      
      if (buttons) (buttons as HTMLElement).style.display = 'none'
      if (form) (form as HTMLElement).style.display = 'none'

      // Show the title for download
      const downloadTitle = treeRef.current.querySelector('[data-download-title]') as HTMLElement
      if (downloadTitle) {
        downloadTitle.classList.remove('hidden')
      }

      // Hide all Edit and Delete buttons
      const editDeleteButtons = treeRef.current.querySelectorAll('button')
      const originalButtonDisplays: { element: HTMLElement; display: string }[] = []
      editDeleteButtons.forEach(btn => {
        const htmlBtn = btn as HTMLElement
        originalButtonDisplays.push({
          element: htmlBtn,
          display: htmlBtn.style.display || ''
        })
        htmlBtn.style.display = 'none'
      })

      // Wait a bit for DOM to update
      await new Promise(resolve => setTimeout(resolve, 200))

      try {
        // Find the inner tree container that has the actual scrollable content
        const treeContainer = treeRef.current.querySelector('.family-tree-print') as HTMLElement
        const innerTree = treeContainer?.querySelector('.min-w-max') as HTMLElement
        
        // Store original styles
        const originalOverflow = treeRef.current.style.overflow
        const originalOverflowX = treeRef.current.style.overflowX
        const originalOverflowY = treeRef.current.style.overflowY
        const originalMaxWidth = treeRef.current.style.maxWidth
        const originalMaxHeight = treeRef.current.style.maxHeight
        const originalWidth = treeRef.current.style.width
        const originalHeight = treeRef.current.style.height
        
        let dataUrl: string
        
        if (treeContainer && innerTree) {
          const containerOriginalOverflow = treeContainer.style.overflow
          const containerOriginalOverflowX = treeContainer.style.overflowX
          const containerOriginalOverflowY = treeContainer.style.overflowY
          const containerOriginalWidth = treeContainer.style.width
          const containerOriginalHeight = treeContainer.style.height
          
          // Get the actual full dimensions by measuring the inner content
          // First, temporarily make everything visible to get accurate measurements
          treeRef.current.style.overflow = 'visible'
          treeRef.current.style.overflowX = 'visible'
          treeRef.current.style.overflowY = 'visible'
          treeRef.current.style.maxWidth = 'none'
          treeRef.current.style.maxHeight = 'none'
          treeRef.current.style.width = 'auto'
          treeRef.current.style.height = 'auto'
          
          treeContainer.style.overflow = 'visible'
          treeContainer.style.overflowX = 'visible'
          treeContainer.style.overflowY = 'visible'
          treeContainer.style.width = 'auto'
          treeContainer.style.height = 'auto'
          
          // Wait for layout to recalculate
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Get the actual rendered dimensions
          const rect = innerTree.getBoundingClientRect()
          const scrollWidth = Math.max(
            innerTree.scrollWidth,
            innerTree.offsetWidth,
            rect.width,
            treeContainer.scrollWidth,
            treeRef.current.scrollWidth
          )
          const scrollHeight = Math.max(
            innerTree.scrollHeight,
            innerTree.offsetHeight,
            rect.height,
            treeContainer.scrollHeight,
            treeRef.current.scrollHeight
          )
          
          // Set explicit dimensions to ensure full capture
          treeRef.current.style.width = `${scrollWidth + 100}px` // Add padding
          treeRef.current.style.height = `${scrollHeight + 100}px`
          
          // Wait again for layout
          await new Promise(resolve => setTimeout(resolve, 300))

          // Use html-to-image which handles modern CSS better
          dataUrl = await toPng(treeRef.current, {
            backgroundColor: '#e0e7ff',
            pixelRatio: 2,
            quality: 1,
            // Don't specify width/height, let it capture the full element
            filter: (node) => {
              // Hide buttons
              if (node instanceof HTMLElement) {
                return !(
                  node.tagName === 'BUTTON' || 
                  node.textContent?.trim() === 'Edit' || 
                  node.textContent?.trim() === 'Delete' ||
                  node.classList.contains('print:hidden') || 
                  node.hasAttribute('data-member-form')
                )
              }
              return true
            }
          })

          // Restore original styles
          treeRef.current.style.overflow = originalOverflow
          treeRef.current.style.overflowX = originalOverflowX
          treeRef.current.style.overflowY = originalOverflowY
          treeRef.current.style.maxWidth = originalMaxWidth
          treeRef.current.style.maxHeight = originalMaxHeight
          treeRef.current.style.width = originalWidth
          treeRef.current.style.height = originalHeight
          
          treeContainer.style.overflow = containerOriginalOverflow
          treeContainer.style.overflowX = containerOriginalOverflowX
          treeContainer.style.overflowY = containerOriginalOverflowY
          treeContainer.style.width = containerOriginalWidth
          treeContainer.style.height = containerOriginalHeight
        } else {
          // Fallback if structure is different
          dataUrl = await toPng(treeRef.current, {
            backgroundColor: '#e0e7ff',
            pixelRatio: 2,
            quality: 1,
            filter: (node) => {
              if (node instanceof HTMLElement) {
                return !(
                  node.tagName === 'BUTTON' || 
                  node.textContent?.trim() === 'Edit' || 
                  node.textContent?.trim() === 'Delete' ||
                  node.classList.contains('print:hidden') || 
                  node.hasAttribute('data-member-form')
                )
              }
              return true
            }
          })
        }

        // Hide the download title again
        if (downloadTitle) {
          downloadTitle.classList.add('hidden')
        }

        // Restore button and form visibility
        if (buttons) (buttons as HTMLElement).style.display = originalButtonDisplay
        if (form) (form as HTMLElement).style.display = originalFormDisplay
        originalButtonDisplays.forEach(({ element, display }) => {
          element.style.display = display
        })

        // Download the image
        const link = document.createElement('a')
        link.href = dataUrl
        const sanitizedTitle = (treeTitle || 'Family Tree').replace(/[^a-z0-9]/gi, '_').toLowerCase()
        link.download = `${sanitizedTitle}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (captureError) {
        // Hide the download title again
        if (downloadTitle) {
          downloadTitle.classList.add('hidden')
        }
        // Restore buttons
        originalButtonDisplays.forEach(({ element, display }) => {
          element.style.display = display
        })
        // Restore button and form visibility
        if (buttons) (buttons as HTMLElement).style.display = originalButtonDisplay
        if (form) (form as HTMLElement).style.display = originalFormDisplay
        throw captureError
      }
    } catch (error) {
      console.error('Error downloading tree:', error)
      alert('Failed to download family tree. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading family tree...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          {isEditingTitle ? (
            <input
              type="text"
              value={treeTitle}
              onChange={(e) => setTreeTitle(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false)
                if (typeof window !== 'undefined') {
                  localStorage.setItem('familyTreeTitle', treeTitle)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false)
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('familyTreeTitle', treeTitle)
                  }
                }
                if (e.key === 'Escape') {
                  setIsEditingTitle(false)
                  setTreeTitle(localStorage.getItem('familyTreeTitle') || 'Family Tree')
                }
              }}
              className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2 text-center bg-transparent border-2 border-blue-500 rounded px-2 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              autoFocus
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2 cursor-pointer hover:text-blue-600 transition-colors px-2"
              title="Click to edit title"
            >
              {treeTitle}
            </h1>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
          <button
            onClick={handleAddMember}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Family Member
          </button>
          <button
            onClick={handleDownloadTree}
            disabled={isDownloading}
            className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            {isDownloading ? 'Downloading...' : 'Download Family Tree'}
          </button>
        </div>

        {/* Family Tree */}
        <div ref={treeRef} className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4 sm:p-8">
          {/* Title for download - hidden in normal view */}
          <div className="text-center mb-4 sm:mb-8 hidden" data-download-title>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800">
              {treeTitle}
            </h1>
          </div>
          <FamilyTree
            members={members}
            onEdit={handleEditMember}
            onDelete={handleDeleteMember}
          />
        </div>

        {/* Member Form Modal */}
        {showForm && (
          <MemberForm
            member={editingMember}
            members={members}
            onSubmit={handleSubmitForm}
            onCancel={handleCancelForm}
          />
        )}
      </div>
    </div>
  )
}
