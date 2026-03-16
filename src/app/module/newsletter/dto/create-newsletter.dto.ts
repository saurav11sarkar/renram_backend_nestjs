import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CreateNewsletterDto {
  @ApiPropertyOptional({ example: 'exple@exemple.com' })
  @IsEmail()
  email: string;
}

export class CreatebroadcastNewsletter {
  @ApiPropertyOptional({ example: 'subject' })
  @IsString()
  subject: string;

  @ApiPropertyOptional({ example: 'html message' })
  @IsString()
  html: string;
}
