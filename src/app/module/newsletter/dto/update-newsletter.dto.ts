import { PartialType } from '@nestjs/swagger';
import { CreatebroadcastNewsletter, CreateNewsletterDto } from './create-newsletter.dto';

export class UpdateNewsletterDto extends PartialType(CreateNewsletterDto) {}
export class UpdatebroadcastNewsletter extends PartialType(CreatebroadcastNewsletter) {}
