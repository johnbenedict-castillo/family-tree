'use client'

import { FamilyMember } from '@/lib/types'
import MemberCard from './MemberCard'

interface FamilyMemberWithChildren extends FamilyMember {
  children: FamilyMemberWithChildren[]
  spouse?: FamilyMemberWithChildren
}

interface FamilyTreeProps {
  members: FamilyMember[]
  onEdit?: (member: FamilyMember) => void
  onDelete?: (id: string) => void
}

export default function FamilyTree({ members, onEdit, onDelete }: FamilyTreeProps) {
  // Build tree structure - simple recursive function
  const buildTree = (parentId: string | null = null): FamilyMemberWithChildren[] => {
    // Get all direct children of this parent, sorted by child_order
    const children = members
      .filter(m => m.parent_id === parentId)
      .sort((a, b) => (a.child_order || 0) - (b.child_order || 0))
    
    if (children.length === 0) {
      return []
    }
    
    // Process each child
    const result: FamilyMemberWithChildren[] = []
    const processed = new Set<string>()
    
    // First, identify which members are spouses of other members at this level
    // This prevents showing someone both as a child and as a spouse
    const spouseIds = new Set<string>()
    children.forEach(member => {
      if (member.spouse_id) {
        const spouseInChildren = children.find(m => m.id === member.spouse_id)
        if (spouseInChildren) {
          // Both are children of the same parent - mark the one that appears later as a spouse
          const memberIndex = children.indexOf(member)
          const spouseIndex = children.indexOf(spouseInChildren)
          if (spouseIndex > memberIndex) {
            spouseIds.add(spouseInChildren.id)
          } else {
            spouseIds.add(member.id)
          }
        }
      }
    })
    
    children.forEach(member => {
      // Skip if already processed (might be a spouse)
      if (processed.has(member.id)) return
      
      // Skip if this member is a spouse of someone else at this level
      // (they'll be shown as part of the other member's couple)
      if (spouseIds.has(member.id)) return
      
      // Get this member's spouse if they have one
      let spouse: FamilyMemberWithChildren | undefined = undefined
      if (member.spouse_id) {
        const spouseMember = members.find(m => m.id === member.spouse_id)
        if (spouseMember) {
          // Check if spouse is also a child of the same parent
          const spouseInChildren = children.find(m => m.id === member.spouse_id)
          if (spouseInChildren) {
            // Both are children of the same parent - group them together
            spouse = {
              ...spouseInChildren,
              children: [],
              spouse: undefined
            }
            processed.add(spouseInChildren.id)
          } else {
            // Spouse is not a child of this parent, but exists
            // This handles cases like Person D being spouse of Person B
            // Person D will show side by side with Person B
            spouse = {
              ...spouseMember,
              children: [],
              spouse: undefined
            }
            // Mark spouse as processed so they don't appear separately
            // This includes cases where spouse has no parent (they should appear with their partner, not as root)
            processed.add(spouseMember.id)
          }
        }
      }
      
      // Recursively get children of this member
      const memberChildren = buildTree(member.id)
      
      // If spouse exists, also get spouse's children
      const spouseChildren = spouse ? buildTree(spouse.id) : []
      
      // Merge children from both parents
      const allChildren = [...memberChildren, ...spouseChildren]
      // Remove duplicates by ID and exclude the spouse from children list
      const uniqueChildren = Array.from(
        new Map(allChildren.map(child => [child.id, child])).values()
      )
      .filter(child => child.id !== member.spouse_id) // Exclude spouse from children
      .sort((a, b) => (a.child_order || 0) - (b.child_order || 0)) // Sort by child_order
      
      // Create the member with spouse and children
      const memberWithTree: FamilyMemberWithChildren = {
        ...member,
        children: uniqueChildren,
        spouse: spouse ? {
          ...spouse,
          children: [],
          spouse: undefined
        } : undefined
      }
      
      // Set circular reference for spouse
      if (memberWithTree.spouse) {
        memberWithTree.spouse.spouse = memberWithTree
      }
      
      result.push(memberWithTree)
      processed.add(member.id)
    })
    
    return result
  }

  // Render a couple (member with optional spouse) and their children
  const renderCouple = (member: FamilyMemberWithChildren): React.JSX.Element => {
    const hasSpouse = !!member.spouse
    const hasChildren = member.children && member.children.length > 0

    return (
      <div key={member.id} className="flex flex-col items-center relative" data-member-id={member.id}>
        {/* Couple Container - Member and Spouse side by side */}
        <div className="flex items-center gap-2 sm:gap-4 mb-4 relative">
          {/* Member Card - Primary (child) */}
          <div className="relative">
            <MemberCard
              member={member}
              onEdit={onEdit}
              onDelete={onDelete}
              isPrimary={true}
            />
          </div>

          {/* Spouse Connection Line and Spouse Card */}
          {hasSpouse && (
            <>
              <div className="relative flex items-center">
                <div className="w-2 sm:w-4 h-0.5 bg-gray-400"></div>
                {/* Heart Icon */}
                <div className="flex items-center justify-center w-4 sm:w-6 h-4 sm:h-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 fill-current"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="w-2 sm:w-4 h-0.5 bg-gray-400"></div>
              </div>
              <div className="relative">
                <MemberCard
                  member={member.spouse!}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isPrimary={false}
                />
              </div>
            </>
          )}
          
          {/* Vertical Line to Children - positioned at center of couple */}
          {hasChildren && (
            <div 
              className="absolute w-0.5 bg-gray-400 top-full"
              style={{
                height: '1.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '1rem'
              }}
            ></div>
          )}
        </div>

        {/* Spacing for vertical line */}
        {hasChildren && !hasSpouse && (
          <div className="w-0.5 h-6 bg-gray-400 mb-2"></div>
        )}
        {hasChildren && hasSpouse && (
          <div className="h-6 mb-2"></div>
        )}

        {/* Children Container */}
        {hasChildren && (
          <div className="flex gap-4 sm:gap-8 justify-center items-start relative" style={{ minWidth: 'max-content' }}>
            {/* Continuous horizontal line connecting all children */}
            {member.children.length > 0 && (
              <div 
                className="absolute top-0 h-0.5 bg-gray-400"
                style={{
                  left: '0',
                  right: '0',
                  width: '100%'
                }}
              ></div>
            )}
            
            {/* Render each child */}
            {member.children.map((child, index) => (
              <div key={child.id} className="flex flex-col items-center relative">
                {/* Vertical line from horizontal line to child */}
                <div className="w-0.5 h-6 bg-gray-400 mb-2"></div>
                {/* Recursively render child couple */}
                {renderCouple(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Get root members (those with no parent)
  const allRootMembers = buildTree(null)
  
  // Track which members are shown as spouses anywhere in the tree
  const spouseIds = new Set<string>()
  const collectSpouseIds = (nodes: FamilyMemberWithChildren[]) => {
    nodes.forEach(node => {
      if (node.spouse) {
        spouseIds.add(node.spouse.id)
      }
      collectSpouseIds(node.children)
    })
  }
  collectSpouseIds(allRootMembers)
  
  // Also check: if a root member has no parent but has a spouse,
  // and that spouse has a parent (so spouse is not a root),
  // then we need to find where the spouse appears in the tree
  // and make sure the root member appears there as the spouse's partner
  const rootMembersToRemove = new Set<string>()
  allRootMembers.forEach(rootMember => {
    if (rootMember.spouse_id) {
      const spouse = members.find(m => m.id === rootMember.spouse_id)
      if (spouse && spouse.parent_id) {
        // The spouse has a parent, so they're not a root member
        // This root member should appear with their spouse, not as a separate root
        rootMembersToRemove.add(rootMember.id)
      }
    }
  })
  
  // Filter out root members that are spouses OR that should appear with their spouse
  const rootMembers = allRootMembers.filter(member => 
    !spouseIds.has(member.id) && !rootMembersToRemove.has(member.id)
  )

  if (rootMembers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No family members yet.</p>
        <p className="text-sm mt-2">Click "Add Member" to start building your family tree!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-4 sm:py-8 family-tree-print w-full overflow-x-auto overflow-y-visible" style={{ scrollbarWidth: 'thin' }}>
      <div className="flex flex-col items-center" style={{ minWidth: 'max-content', width: 'max-content', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '50%', paddingRight: '50%' }}>
        {rootMembers.map(member => renderCouple(member))}
      </div>
    </div>
  )
}
