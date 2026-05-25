const API_BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export type TeamSummary = {
  id: string
  name: string
  abbreviation: string
  displayName: string
  logo: string | null
  color: string | null
  alternateColor: string | null
  location: string
}

export type TeamDetails = TeamSummary & {
  record: string | null
}

export type TeamRosterPlayer = {
  id: string
  fullName: string
  jersey: string | null
  position: string | null
  headshot: string | null
  age: number | null
  experience: number
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function getTeams(): Promise<TeamSummary[]> {
  return request<TeamSummary[]>('/teams')
}

export async function getTeam(teamId: string): Promise<TeamDetails> {
  return request<TeamDetails>(`/teams/${teamId}`)
}

export async function getTeamRoster(teamId: string): Promise<TeamRosterPlayer[]> {
  return request<TeamRosterPlayer[]>(`/teams/${teamId}/roster`)
}
