/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
    Button,
    Spinner,
    Tab,
    TabList,
    Text,
    makeStyles,
    tokens
} from '@fluentui/react-components'
import { useState } from 'react'
import { api } from '../services/api'
import { Scenario } from '../types'

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
    padding: `${tokens.spacingVerticalXL} 0`,
  },
  header: {
    fontSize: '22px',
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground1,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
  },
  tabList: {
    marginBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
  },
  gridContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
  },
  card: {
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    minHeight: '120px',
    width: '100%',
    maxWidth: '100%',
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: tokens.shadow16,
      border: `1px solid ${tokens.colorBrandBackground}`,
    },
  },
  selected: {
    backgroundColor: tokens.colorBrandBackground2,
    border: `2px solid ${tokens.colorBrandBackground}`,
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground1,
    lineHeight: '20px',
  },
  cardDescription: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    lineHeight: '16px',
    display: '-webkit-box',
    WebkitLineClamp: '2',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  loadingCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '120px',
    width: '100%',
    maxWidth: '100%',
    textAlign: 'center',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
  },
})

interface Props {
  scenarios: Scenario[]
  selectedScenario: string | null
  onSelect: (id: string) => void
  onStart: () => void
  onScenarioGenerated?: (scenario: Scenario) => void
}

export function ScenarioList({
  scenarios,
  selectedScenario,
  onSelect,
  onStart,
  onScenarioGenerated,
}: Props) {
  const styles = useStyles()
  const [loadingGraph, setLoadingGraph] = useState(false)
  const [generatedScenario, setGeneratedScenario] = useState<Scenario | null>(
    null
  )
  const [selectedTab, setSelectedTab] = useState<string>('german')

  const handleScenarioClick = async (scenario: Scenario) => {
    if (scenario.is_graph_scenario && !scenario.generated_from_graph) {
      setLoadingGraph(true)
      try {
        const generated = await api.generateGraphScenario()
        const personalizedScenario = {
          ...generated,
          name: 'Personalized Scenario',
          description: generated.description.split('.')[0] + '.',
        }
        setGeneratedScenario(personalizedScenario)
        onScenarioGenerated?.(personalizedScenario)
        onSelect(personalizedScenario.id)
      } catch (error) {
        console.error('Failed to generate Graph scenario:', error)
      } finally {
        setLoadingGraph(false)
      }
    } else {
      onSelect(scenario.id)
    }
  }

  // Group scenarios by language
  const germanScenarios = scenarios.filter(s =>
    !s.is_graph_scenario && s.name.includes('(DE)')
  )
  const frenchScenarios = scenarios.filter(s =>
    !s.is_graph_scenario && s.name.includes('(FR)')
  )
  const englishScenarios = scenarios.filter(s =>
    !s.is_graph_scenario && s.name.includes('(EN)')
  )
  const graphScenario = generatedScenario || scenarios.find(s => s.is_graph_scenario)

  const renderScenarioCard = (scenario: Scenario) => {
    const isSelected = selectedScenario === scenario.id
    const isGraphLoading =
      scenario.is_graph_scenario &&
      loadingGraph &&
      !scenario.generated_from_graph

    if (isGraphLoading) {
      return (
        <div key="graph-loading" className={styles.loadingCard}>
          <Spinner size="medium" />
          <Text size={300}>
            Analyzing your calendar and generating personalized scenario...
          </Text>
        </div>
      )
    }

    return (
      <div
        key={scenario.id}
        className={`${styles.card} ${isSelected ? styles.selected : ''}`}
        onClick={() => handleScenarioClick(scenario)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Text className={styles.cardTitle}>
            {scenario.name}
          </Text>
          <Text className={styles.cardDescription}>
            {scenario.description}
          </Text>
        </div>
      </div>
    )
  }

  const getCurrentScenarios = () => {
    switch (selectedTab) {
      case 'german':
        return germanScenarios
      case 'french':
        return frenchScenarios
      case 'english':
        return englishScenarios
      case 'personalized':
        return graphScenario ? [graphScenario] : []
      default:
        return []
    }
  }

  const currentScenarios = getCurrentScenarios()

  return (
    <div className={styles.container}>
      <Text className={styles.header}>
        Select Training Scenario
      </Text>
      <Text size={200} style={{ marginBottom: '8px', color: tokens.colorNeutralForeground3, paddingLeft: tokens.spacingHorizontalL, paddingRight: tokens.spacingHorizontalL }}>
        You are the Swiss health insurance seller. Practice your sales skills with AI-powered customers.
      </Text>

      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_, data) => setSelectedTab(data.value as string)}
        className={styles.tabList}
        size="medium"
      >
        <Tab value="german">German ({germanScenarios.length})</Tab>
        <Tab value="french">French ({frenchScenarios.length})</Tab>
        <Tab value="english">English ({englishScenarios.length})</Tab>
        <Tab value="personalized">Personalized</Tab>
      </TabList>

      <div className={styles.gridContainer}>
        {currentScenarios.length > 0 ? (
          currentScenarios.map(renderScenarioCard)
        ) : (
          <div className={styles.emptyState}>
            <Text size={400}>No scenarios available</Text>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <Button
          appearance="primary"
          disabled={!selectedScenario || loadingGraph}
          onClick={onStart}
          size="medium"
        >
          Start Training
        </Button>
      </div>
    </div>
  )
}
