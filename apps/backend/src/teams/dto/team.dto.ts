import { ApiProperty } from '@nestjs/swagger';

export class TeamDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() abbreviation: string;
  @ApiProperty() displayName: string;
  @ApiProperty() logo: string;
  @ApiProperty() color: string;
  @ApiProperty() alternateColor: string;
  @ApiProperty() location: string;
}
