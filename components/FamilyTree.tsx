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
  focusedMemberId?: string | null
  onViewFamily?: (memberId: string) => void
  onBackToFull?: () => void
}

export default function FamilyTree({ members, onEdit, onDelete, focusedMemberId, onViewFamily, onBackToFull }: FamilyTreeProps) {
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
  const renderCouple = (member: FamilyMemberWithChildren, isRoot: boolean = false, generation: number = 0): React.JSX.Element => {
    const hasSpouse = !!member.spouse
    const hasChildren = member.children && member.children.length > 0
    
    // Show sub-family box when this person has both spouse and children (forms a family unit)
    // Don't show box for root members to avoid boxing the entire tree
    const isSubFamily = hasSpouse && hasChildren && !isRoot

    // The inner content of the family (couple + children)
    const familyContent = (
      <>
        {/* Couple Container - Member and Spouse side by side */}
        <div className={`flex items-center gap-2 sm:gap-3 ${isSubFamily ? 'mb-2' : 'mb-3'} relative`}>
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
                <div className="w-2 sm:w-3 h-0.5 bg-gray-400"></div>
                {/* Heart Icon */}
                <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 fill-current"
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
                <div className="w-2 sm:w-3 h-0.5 bg-gray-400"></div>
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
        </div>

        {/* Vertical Line to Children - inside the box */}
        {hasChildren && (
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-3 bg-gray-400"></div>
          </div>
        )}

        {/* Children Container - HORIZONTAL for first generation */}
        {hasChildren && generation < 1 && (
          <div className="flex gap-3 sm:gap-5 justify-center items-start relative" style={{ minWidth: 'max-content' }}>
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
            {member.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center relative">
                {/* Vertical line from horizontal line to child */}
                <div className="w-0.5 h-4 bg-gray-400 mb-1"></div>
                {/* Recursively render child couple */}
                {renderCouple(child, false, generation + 1)}
              </div>
            ))}
          </div>
        )}

        {/* Children Container - VERTICAL for grandchildren+ (generation >= 1) */}
        {hasChildren && generation >= 1 && (
          <div className="ml-4">
            {member.children.map((child, index) => (
              <div key={child.id} className="flex">
                {/* Tree connector */}
                <div className="flex flex-col items-center mr-2" style={{ width: '16px' }}>
                  {/* Vertical line segment */}
                  <div 
                    className="w-0.5 bg-gray-400" 
                    style={{ height: '40px' }}
                  ></div>
                  {/* Continue vertical line for non-last children */}
                  {index < member.children.length - 1 && (
                    <div className="w-0.5 bg-gray-400 flex-1"></div>
                  )}
                </div>
                {/* Horizontal branch + child */}
                <div className="flex items-start pb-3">
                  <div 
                    className="w-4 h-0.5 bg-gray-400 mt-10 mr-1"
                  ></div>
                  <div>
                    {renderCouple(child, false, generation + 1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    )

    // Determine box color based on the primary member's gender
    const getSubFamilyBoxClasses = () => {
      if (member.gender === 'male') {
        return 'border-2 border-dashed border-blue-400 rounded-xl p-2 sm:p-3 bg-blue-50/50 backdrop-blur-sm shadow-sm'
      } else if (member.gender === 'female') {
        return 'border-2 border-dashed border-pink-400 rounded-xl p-2 sm:p-3 bg-pink-50/50 backdrop-blur-sm shadow-sm'
      }
      // Default/unknown gender
      return 'border-2 border-dashed border-indigo-300 rounded-xl p-2 sm:p-3 bg-white/30 backdrop-blur-sm shadow-sm'
    }

    return (
      <div key={member.id} className="flex flex-col items-center relative" data-member-id={member.id}>
        {isSubFamily ? (
          <>
            {/* Sub-family box with rounded border - color based on primary member's gender */}
            <div className={`${getSubFamilyBoxClasses()} relative`}>
              {/* View Family Button */}
              {onViewFamily && (
                <button
                  onClick={() => onViewFamily(member.id)}
                  className="absolute -top-2 -right-2 bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-800 text-xs font-medium px-2 py-1 rounded-full shadow-md border border-gray-200 transition-colors flex items-center gap-1 z-10"
                  title={`View ${member.first_name}'s family`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  View
                </button>
              )}
              {familyContent}
            </div>
          </>
        ) : (
          <>
            {familyContent}
            {/* For non-boxed families, we need the vertical line spacing */}
            {hasChildren && !hasSpouse && !isSubFamily && (
              <div className="w-0.5 h-2 bg-gray-400"></div>
            )}
          </>
        )}
      </div>
    )
  }

  // Render the root family with special prominence
  const renderRootFamily = (member: FamilyMemberWithChildren): React.JSX.Element => {
    const hasSpouse = !!member.spouse
    const hasChildren = member.children && member.children.length > 0

    return (
      <div key={member.id} className="flex flex-col items-center" data-member-id={member.id}>
        {/* Root Family - Founding Parents with special styling */}
        <div className="relative mb-4">
          {/* Decorative background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-200/40 via-yellow-100/30 to-transparent rounded-3xl blur-xl transform scale-110"></div>
          
          {/* Root family container */}
          <div className="relative border-2 border-amber-400 rounded-2xl p-4 sm:p-6 bg-gradient-to-b from-amber-50/80 to-white/60 backdrop-blur-sm shadow-lg">
            {/* Crown/Star decoration */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-400 rounded-full p-1.5 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            
            {/* Founding Parents label */}
            <div className="text-center mb-3">
              <span className="text-xs sm:text-sm font-semibold text-amber-700 tracking-wide uppercase">Founding Parents</span>
            </div>
            
            {/* Couple Container */}
            <div className="flex items-center gap-2 sm:gap-3 relative justify-center">
              {/* Member Card - Primary */}
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
                    <div className="w-2 sm:w-3 h-0.5 bg-amber-400"></div>
                    {/* Heart Icon */}
                    <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-red-400 to-pink-500 shadow-md">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-4 sm:w-4 text-white fill-current"
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
                    <div className="w-2 sm:w-3 h-0.5 bg-amber-400"></div>
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
            </div>
          </div>
        </div>

        {/* Vertical Line to Children */}
        {hasChildren && (
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-gradient-to-b from-amber-400 to-gray-400"></div>
          </div>
        )}

        {/* Children Container */}
        {hasChildren && (
          <div className="flex gap-3 sm:gap-5 justify-center items-start relative" style={{ minWidth: 'max-content' }}>
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
            {member.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center relative">
                {/* Vertical line from horizontal line to child */}
                <div className="w-0.5 h-4 bg-gray-400 mb-1"></div>
                {/* Recursively render child couple */}
                {renderCouple(child, false, 1)}
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

  if (rootMembers.length === 0 && !focusedMemberId) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No family members yet.</p>
        <p className="text-sm mt-2">Click "Add Member" to start building your family tree!</p>
      </div>
    )
  }

  // Find a member by ID in the tree structure
  const findMemberInTree = (nodes: FamilyMemberWithChildren[], id: string): FamilyMemberWithChildren | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.spouse?.id === id) return node // Return the couple if spouse is selected
      const found = findMemberInTree(node.children, id)
      if (found) return found
    }
    return null
  }

  // If viewing a focused family, find that member and render them as root
  if (focusedMemberId) {
    const focusedMember = findMemberInTree(allRootMembers, focusedMemberId)
    
    if (!focusedMember) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Family member not found.</p>
          {onBackToFull && (
            <button
              onClick={onBackToFull}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
            >
              ← Back to Full Tree
            </button>
          )}
        </div>
      )
    }

    const focusedName = focusedMember.spouse 
      ? `${focusedMember.first_name} & ${focusedMember.spouse.first_name}'s Family`
      : `${focusedMember.first_name}'s Family`

    return (
      <div className="flex flex-col items-center py-4 sm:py-8 family-tree-print w-full overflow-x-auto overflow-y-visible" style={{ scrollbarWidth: 'thin' }}>
        {/* Back button and family name */}
        <div className="mb-6 flex flex-col items-center gap-3">
          {onBackToFull && (
            <button
              onClick={onBackToFull}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Full Tree
            </button>
          )}
          <h2 className="text-xl sm:text-2xl font-bold text-gray-700">{focusedName}</h2>
        </div>
        
        <div className="flex flex-col items-center" style={{ minWidth: 'max-content', width: 'max-content', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '50%', paddingRight: '50%' }}>
          {renderRootFamily(focusedMember)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-4 sm:py-8 family-tree-print w-full overflow-x-auto overflow-y-visible" style={{ scrollbarWidth: 'thin' }}>
      <div className="flex flex-col items-center" style={{ minWidth: 'max-content', width: 'max-content', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '50%', paddingRight: '50%' }}>
        {rootMembers.map(member => renderRootFamily(member))}
      </div>
    </div>
  )
}
