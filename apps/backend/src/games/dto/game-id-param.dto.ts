import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

/** ESPN game ids are numeric, which also keeps `/games/:gameId` from swallowing sibling routes. */
export class GameIdParamDto {
  @ApiProperty({ example: '401585183' })
  @Matches(/^\d+$/, { message: 'gameId must be numeric' })
  gameId: string;
}
