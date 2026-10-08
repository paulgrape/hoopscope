import { ApiProperty } from '@nestjs/swagger';

export class TeamRecordDto {
  @ApiProperty() season: number;
  @ApiProperty() seasonLabel: string;
  @ApiProperty({ nullable: true }) summary: string | null;
  @ApiProperty({ nullable: true }) home: string | null;
  @ApiProperty({ nullable: true }) road: string | null;
  @ApiProperty({ nullable: true }) divisionRecord: string | null;
  @ApiProperty({ nullable: true }) conferenceRecord: string | null;
  @ApiProperty({ nullable: true }) pointsPerGame: string | null;
  @ApiProperty({ nullable: true }) opponentPointsPerGame: string | null;
  @ApiProperty({ nullable: true }) streak: string | null;
  @ApiProperty({ nullable: true }) playoffSeed: string | null;
}

export class TeamDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() abbreviation: string;
  @ApiProperty() displayName: string;
  @ApiProperty() logo: string;
  @ApiProperty() color: string;
  @ApiProperty() alternateColor: string;
  @ApiProperty() location: string;
  @ApiProperty({ type: TeamRecordDto }) record: TeamRecordDto;
  @ApiProperty({ nullable: true }) conference: string | null;
  @ApiProperty({ nullable: true }) division: string | null;
  @ApiProperty({ nullable: true }) venue: string | null;
  @ApiProperty({ nullable: true }) venueLocation: string | null;
  @ApiProperty({ nullable: true }) coach: string | null;
}
