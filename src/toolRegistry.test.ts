import { describe, expect, it } from 'vitest'
import {
  ANIMAL_TOOL,
  getPanelToolById,
  getPassiveGuidanceTool,
  isPassiveGuidanceTool,
  NATURE_TOOL,
  PANEL_TOOLS,
  PASSIVE_GUIDANCE_INDEX_GROUPS,
  PASSIVE_GUIDANCE_REFERENCE_TOOLS,
  PASSIVE_GUIDANCE_TOOLS,
  TOOL_GROUPS,
  TOOLS,
} from './toolRegistry'

describe('toolRegistry', () => {
  it('preserves the current twenty-two-tool order and three groups', () => {
    expect(TOOLS).toHaveLength(22)
    expect(PANEL_TOOLS).toHaveLength(20)
    expect(TOOLS[0]?.id).toBe('breathing')
    expect(TOOLS[1]).toBe(NATURE_TOOL)
    expect(TOOLS.at(-1)).toBe(ANIMAL_TOOL)
    expect(TOOL_GROUPS).toEqual([
      'Session tools',
      'Preferences and data',
      'Guidance',
    ])
  })

  it('registers seven uniquely addressed passive guidance modules', () => {
    expect(PASSIVE_GUIDANCE_TOOLS).toHaveLength(7)
    expect(new Set(PASSIVE_GUIDANCE_TOOLS.map((tool) => tool.id)).size).toBe(7)
    expect(new Set(PASSIVE_GUIDANCE_TOOLS.map((tool) => tool.triggerSelector)).size).toBe(7)
    expect(new Set(PASSIVE_GUIDANCE_TOOLS.map((tool) => tool.panelSelector)).size).toBe(7)
    expect(new Set(PASSIVE_GUIDANCE_TOOLS.map((tool) => tool.closeSelector)).size).toBe(7)
    expect(PASSIVE_GUIDANCE_TOOLS.every(isPassiveGuidanceTool)).toBe(true)
    expect(PASSIVE_GUIDANCE_TOOLS.every((tool) => typeof tool.loadComponent === 'function')).toBe(true)
  })

  it('exposes six indexed references while keeping Guidance Index out of its own directory', () => {
    expect(PASSIVE_GUIDANCE_REFERENCE_TOOLS).toHaveLength(6)
    expect(PASSIVE_GUIDANCE_REFERENCE_TOOLS.map((tool) => tool.id)).not.toContain(
      'artifact-guidance-index',
    )
    expect(getPassiveGuidanceTool('artifact-guidance-index')?.indexMetadata).toBeNull()
  })

  it('keeps the six references complete and non-overlapping across three groups', () => {
    expect(PASSIVE_GUIDANCE_INDEX_GROUPS).toHaveLength(3)
    const groupedIds = PASSIVE_GUIDANCE_INDEX_GROUPS.flatMap((group) =>
      PASSIVE_GUIDANCE_REFERENCE_TOOLS
        .filter((tool) => tool.indexMetadata.groupId === group.id)
        .map((tool) => tool.id),
    )

    expect(groupedIds).toHaveLength(6)
    expect(new Set(groupedIds).size).toBe(6)
  })

  it('keeps Tool Center and Guidance Index labels on the same records', () => {
    PASSIVE_GUIDANCE_REFERENCE_TOOLS.forEach((tool) => {
      expect(getPanelToolById(tool.id)).toBe(tool)
      expect(tool.label.trim()).not.toBe('')
      expect(tool.description.trim()).not.toBe('')
      expect(tool.indexMetadata.question.trim()).not.toBe('')
      expect(tool.indexMetadata.answerSummary.trim()).not.toBe('')
      expect(tool.indexMetadata.sourceModels.length).toBeGreaterThan(0)
      expect(tool.indexMetadata.doesNotDo.length).toBeGreaterThan(0)
    })
  })

  it('returns null instead of guessing unknown tool ids', () => {
    expect(getPanelToolById('not-a-tool')).toBeNull()
    expect(getPassiveGuidanceTool('not-a-tool')).toBeNull()
  })
})
