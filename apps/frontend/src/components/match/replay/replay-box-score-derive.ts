import type {LivePlayEvent} from '@/lib/games-api'

export type DerivedPlayerLine = {
  name: string
  teamId: string
  points: number
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  threesMade: number
  threesAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  rebounds: number
  offensiveRebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
}

export type DerivedBoxScore = {
  home: DerivedPlayerLine[]
  away: DerivedPlayerLine[]
}

type ShotKind = 'ft' | '2pt' | '3pt'

const REBOUND_SEPARATORS = [' offensive rebound', ' defensive rebound'] as const

/**
 * Builds running player lines from the play text. ESPN phrasing is regular enough to read shots,
 * assists, rebounds, blocks, steals, turnovers and fouls; minutes are not in the feed at all.
 *
 * `teamId` names the team that owns the play, which is the shooter on a block, the player who lost
 * the ball on a steal, and the player who committed the foul, so those credits go to the opponent.
 */
export function deriveBoxScore(plays: LivePlayEvent[], homeTeamId: string, awayTeamId: string): DerivedBoxScore {
  const lines = new Map<string, DerivedPlayerLine>()
  const otherTeam = (teamId: string) => (teamId === homeTeamId ? awayTeamId : homeTeamId)

  const lineFor = (rawName: string, teamId: string | undefined) => {
    const name = cleanName(rawName)
    if (!name || !teamId) return null

    const existing = lines.get(name.toLowerCase())
    if (existing) return existing

    const line = emptyLine(name, teamId)
    lines.set(name.toLowerCase(), line)

    return line
  }

  for (const play of plays) {
    const text = normalizeSpaces(play.text)
    const teamId = play.teamId

    const shot = splitOnAny(text, [' makes ', ' misses '])
    if (shot) {
      const line = lineFor(shot.before, teamId)
      const kind = shotKind(shot.after)
      if (line) applyShot(line, kind, shot.separator === ' makes ')
    }

    const assist = matchInParentheses(text, 'assists')
    if (assist) {
      const line = lineFor(assist, teamId)
      if (line) line.assists += 1
    }

    const rebound = splitOnAny(text, REBOUND_SEPARATORS)
    if (rebound) {
      const line = lineFor(rebound.before, teamId)
      if (line) {
        line.rebounds += 1
        if (rebound.separator === ' offensive rebound') line.offensiveRebounds += 1
      }
    }

    const block = splitOnAny(text, [' blocks '])
    if (block && teamId) {
      const line = lineFor(block.before, otherTeam(teamId))
      if (line) line.blocks += 1
    }

    const steal = matchInParentheses(text, 'steals')
    if (steal && teamId) {
      const line = lineFor(steal, otherTeam(teamId))
      if (line) line.steals += 1
    }

    const substitution = splitOnAny(text, [' enters the game for '])
    if (substitution) {
      lineFor(substitution.before, teamId)
      lineFor(substitution.after, teamId)
    }
  }

  // Turnovers, fouls and violations lead with a name that has no delimiter after it
  // ("LeBron James Out-of-Bounds Bad Pass Turnover"), so match against the names seen so far.
  const knownNames = [...lines.values()].map(line => line.name).sort((first, second) => second.length - first.length)

  for (const play of plays) {
    const text = normalizeSpaces(play.text)
    const lowered = text.toLowerCase()
    if (!play.teamId) continue

    const leadingName = findLeadingName(text, knownNames)
    if (!leadingName) continue

    const line = lines.get(leadingName.toLowerCase())
    if (!line || line.teamId !== play.teamId) continue

    if (lowered.includes('turnover')) line.turnovers += 1
    if (lowered.includes('foul') && !lowered.startsWith(`${leadingName.toLowerCase()} draws the foul`)) line.fouls += 1
  }

  const sorted = [...lines.values()].sort(compareLines)

  return {
    home: sorted.filter(line => line.teamId === homeTeamId),
    away: sorted.filter(line => line.teamId === awayTeamId)
  }
}

function applyShot(line: DerivedPlayerLine, kind: ShotKind, made: boolean) {
  if (kind === 'ft') {
    line.freeThrowsAttempted += 1
    if (made) {
      line.freeThrowsMade += 1
      line.points += 1
    }
    return
  }

  line.fieldGoalsAttempted += 1
  if (kind === '3pt') line.threesAttempted += 1

  if (!made) return

  line.fieldGoalsMade += 1
  if (kind === '3pt') {
    line.threesMade += 1
    line.points += 3
    return
  }

  line.points += 2
}

function shotKind(shotText: string): ShotKind {
  const lowered = shotText.toLowerCase()

  if (lowered.includes('free throw')) return 'ft'
  if (lowered.includes('three point') || lowered.includes('3-pt')) return '3pt'

  return '2pt'
}

function splitOnAny(text: string, separators: readonly string[]) {
  const lowered = text.toLowerCase()

  for (const separator of separators) {
    const index = lowered.indexOf(separator)
    if (index <= 0) continue

    return {
      before: text.slice(0, index),
      after: text.slice(index + separator.length),
      separator
    }
  }

  return null
}

function matchInParentheses(text: string, keyword: string) {
  const match = new RegExp(`\\(([^)]+?)\\s+${keyword}\\)`, 'i').exec(text)
  return match?.[1] ?? null
}

function findLeadingName(text: string, knownNames: string[]) {
  const lowered = text.toLowerCase()
  return knownNames.find(name => lowered.startsWith(name.toLowerCase())) ?? null
}

function normalizeSpaces(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

function cleanName(rawName: string) {
  return normalizeSpaces(rawName).replace(/'s$/i, '').trim()
}

function compareLines(first: DerivedPlayerLine, second: DerivedPlayerLine) {
  if (second.points !== first.points) return second.points - first.points
  const firstImpact = first.rebounds + first.assists
  const secondImpact = second.rebounds + second.assists
  if (secondImpact !== firstImpact) return secondImpact - firstImpact

  return first.name.localeCompare(second.name)
}

function emptyLine(name: string, teamId: string): DerivedPlayerLine {
  return {
    name,
    teamId,
    points: 0,
    fieldGoalsMade: 0,
    fieldGoalsAttempted: 0,
    threesMade: 0,
    threesAttempted: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0,
    rebounds: 0,
    offensiveRebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fouls: 0
  }
}
