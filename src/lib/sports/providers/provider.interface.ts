import { Game, League } from '../types';

export interface SportsProvider {
  name: string;
  getScoreboard(league: League, date?: string): Promise<Game[]>;
  getTeamSchedule(league: League, teamKey: string): Promise<Game[]>;
}
