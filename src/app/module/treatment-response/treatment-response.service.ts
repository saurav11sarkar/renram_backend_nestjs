import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TreatmentResponse,
  TreatmentResponseDocument,
} from './entities/treatment-response.entity';
import { CreateTreatmentResponseDto } from './dto/create-treatment-response.dto';
import {
  TreatmentBenefit,
  TreatmentBenefitDocment,
} from '../treatment-benefit/entities/treatment-benefit.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import {
  Treatment,
  TreatmentDocment,
} from '../treatment/entities/treatment.entity';
import { Product, ProductDocument } from '../product/entities/product.entity';

type QuestionSource = TreatmentBenefitDocment | TreatmentDocment;
type TreatmentQuestion = QuestionSource['treatmentQuestions'][number];

type MatchSummary = {
  level: 'recommended' | 'possible' | 'low';
  statusBadge: 'Recommended Match' | 'Possible Match' | 'Low Match';
  title: string;
  text: string;
};

const RAW_SCORE_MIN = 1;
const RAW_SCORE_MAX = 7;

@Injectable()
export class TreatmentResponseService {
  constructor(
    @InjectModel(TreatmentResponse.name)
    private readonly responseModel: Model<TreatmentResponseDocument>,
    @InjectModel(TreatmentBenefit.name)
    private readonly treatmentBenefitModel: Model<TreatmentBenefitDocment>,
    @InjectModel(Treatment.name)
    private readonly treatmentModel: Model<TreatmentDocment>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private async getQuestionSource(dto: CreateTreatmentResponseDto) {
    if (dto.treatmentBenefit) {
      const treatmentBenefit = await this.treatmentBenefitModel.findById(
        dto.treatmentBenefit,
      );
      if (!treatmentBenefit) {
        throw new HttpException('Treatment benefit not found', 404);
      }

      return {
        sourceType: 'treatmentBenefit' as const,
        source: treatmentBenefit,
        sourceId: treatmentBenefit._id,
        sourceTitle: treatmentBenefit.title,
        category: treatmentBenefit.category,
      };
    }

    if (dto.treatment) {
      const treatment = await this.treatmentModel.findById(dto.treatment);
      if (!treatment) {
        throw new HttpException('Treatment not found', 404);
      }

      return {
        sourceType: 'treatment' as const,
        source: treatment,
        sourceId: treatment._id,
        sourceTitle: treatment.name,
        category: treatment.category,
      };
    }

    throw new HttpException('Treatment benefit or treatment is required', 400);
  }

  private normalizeSelectedAnswer(selectedAnswer: string) {
    return selectedAnswer
      .replace(/\s*[—-]\s*\d+\s*$/, '')
      .trim();
  }

  private convertRawScoreToPercentage(rawScore: number) {
    return Math.round(
      ((rawScore - RAW_SCORE_MIN) / (RAW_SCORE_MAX - RAW_SCORE_MIN)) * 100,
    );
  }

  private getAnswerScore(
    questionData: TreatmentQuestion | undefined,
    selectedAnswer: string,
  ) {
    const normalizedAnswer = this
      .normalizeSelectedAnswer(selectedAnswer)
      .toLowerCase();

    const weightedOption = questionData?.optionWeights?.find(
      (option) =>
        this.normalizeSelectedAnswer(option.label).toLowerCase() ===
        normalizedAnswer,
    );

    if (weightedOption?.score) {
      return weightedOption.score;
    }

    const highestPriorityAnswer = questionData?.answare
      ? this.normalizeSelectedAnswer(questionData.answare).toLowerCase()
      : undefined;
    if (highestPriorityAnswer && highestPriorityAnswer === normalizedAnswer) {
      return 7;
    }

    if (normalizedAnswer.includes('none of these apply')) {
      return 1;
    }

    return 4;
  }

  private getMatchSummary(matchPercentage: number): MatchSummary {
    if (matchPercentage >= 70) {
      return {
        level: 'recommended',
        statusBadge: 'Recommended Match',
        title: 'You may be a good fit for this treatment',
        text: `Based on your response, this treatment may align well with the symptoms you're experiencing. Your answers suggest that this option could be worth exploring further with a licensed provider.`,
      };
    }

    if (matchPercentage >= 40) {
      return {
        level: 'possible',
        statusBadge: 'Possible Match',
        title: 'This treatment may still be relevant for you',
        text: `Your response suggests some overlap with the benefits of this treatment. You may still be a potential candidate, depending on your full symptom profile and provider review.`,
      };
    }

    return {
      level: 'low',
      statusBadge: 'Low Match',
      title: 'This treatment may not be the best fit right now',
      text: `Based on your response, this treatment may not closely match your current concerns. You may benefit more from another treatment path or a broader health assessment.`,
    };
  }

  private evaluateAnswers(
    questionSource: QuestionSource,
    dto: CreateTreatmentResponseDto,
  ) {
    const evaluatedAnswers = dto.answers.map((ans) => {
      const questionData = questionSource.treatmentQuestions.find(
        (q) => q.question === ans.question,
      );

      const rawScore = this.getAnswerScore(questionData, ans.selectedAnswer);
      const score = this.convertRawScoreToPercentage(rawScore);
      const matchLevel =
        score >= 70 ? 'recommended' : score >= 40 ? 'possible' : 'low';

      return {
        question: ans.question,
        selectedAnswer: this.normalizeSelectedAnswer(ans.selectedAnswer),
        score,
        matchLevel,
      };
    });

    const totalQuestions = evaluatedAnswers.length;
    const totalScoreRaw = evaluatedAnswers.reduce(
      (sum, current) => sum + current.score,
      0,
    );
    const averageScore = totalQuestions
      ? Number((totalScoreRaw / totalQuestions).toFixed(2))
      : 0;
    const matchPercentage = averageScore;

    return {
      evaluatedAnswers,
      totalQuestions,
      totalScore: matchPercentage,
      averageScore,
      matchPercentage,
      resultSummary: this.getMatchSummary(matchPercentage),
    };
  }

  private async getRecommendedProducts(source: {
    sourceType: 'treatment' | 'treatmentBenefit';
    sourceId: unknown;
    category?: string;
  }) {
    if (!source.category?.trim()) {
      return [];
    }

    const escapedCategory = source.category
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return this.productModel
      .find({
        category: {
          $regex: `^${escapedCategory}$`,
          $options: 'i',
        },
      })
      .sort({ createdAt: -1 })
      .limit(4)
      .select('name category description whatWillYouGet price size image');
  }

  async previewResponse(dto: CreateTreatmentResponseDto) {
    const questionSource = await this.getQuestionSource(dto);
    const evaluation = this.evaluateAnswers(questionSource.source, dto);
    const recommendedProducts =
      await this.getRecommendedProducts(questionSource);

    return {
      sourceType: questionSource.sourceType,
      treatmentBenefitId:
        questionSource.sourceType === 'treatmentBenefit'
          ? questionSource.sourceId
          : undefined,
      treatmentId:
        questionSource.sourceType === 'treatment'
          ? questionSource.sourceId
          : undefined,
      treatmentTitle: questionSource.sourceTitle,
      recommendedProducts,
      ...evaluation,
    };
  }

  async submitResponse(userId: string, dto: CreateTreatmentResponseDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);

    const questionSource = await this.getQuestionSource(dto);
    const evaluation = this.evaluateAnswers(questionSource.source, dto);
    const recommendedProducts =
      await this.getRecommendedProducts(questionSource);

    const result = await this.responseModel.create({
      treatmentBenefit:
        questionSource.sourceType === 'treatmentBenefit'
          ? questionSource.sourceId
          : undefined,
      treatment:
        questionSource.sourceType === 'treatment'
          ? questionSource.sourceId
          : undefined,
      user: user._id,
      answers: evaluation.evaluatedAnswers,
      totalQuestions: evaluation.totalQuestions,
      totalScore: evaluation.totalScore,
      averageScore: evaluation.averageScore,
      matchPercentage: evaluation.matchPercentage,
      resultSummary: evaluation.resultSummary,
      isCompleted: true,
    });

    return {
      ...result.toObject(),
      recommendedProducts,
    };
  }

  async myDashboard(userId: string) {
    const responses = await this.responseModel
      .find({ user: userId })
      .populate('treatmentBenefit', 'title description category')
      .populate('treatment', 'name description category');

    return responses;
  }
}
