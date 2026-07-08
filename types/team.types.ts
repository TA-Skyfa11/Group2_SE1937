export interface Team {
  id: string;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  country: string;
  venue: { name: string; city: string; capacity: number } | null;
  leagueIds: string[];
  followerCount: number;
  externalId: string;
}

export interface Player {
  id: string;
  name: string;
  dateOfBirth: string;
  nationality: string;
  position: "Goalkeeper" | "Defender" | "Midfielder" | "Forward";
  shirtNumber: number | null;
  photo: string | null;
  stats: {
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
}
