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
import getChatCompletion from 'src/app/helper/getChatCompletion';

type QuestionSource = TreatmentBenefitDocment | TreatmentDocment;
type TreatmentQuestion = QuestionSource['treatmentQuestions'][number];

type MatchSummary = {
  level: 'recommended' | 'possible' | 'low';
  statusBadge: string;
  title: string;
  text: string;
};

type MatchableSource = {
  sourceType: 'treatment' | 'treatmentBenefit';
  sourceId: string;
  sourceTitle: string;
  category?: string;
  description?: string;
  source: QuestionSource;
};

type RankedMatch = {
  sourceType: 'treatment' | 'treatmentBenefit';
  sourceId: string;
  sourceTitle: string;
  category?: string;
  description?: string;
  matchPercentage: number;
  resultSummary: MatchSummary;
};

const RAW_SCORE_MIN = 1;
const RAW_SCORE_MAX = 10;

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

  // ✅ COMBINED NAMES
  async allTreatmentNamesAndTreatmentBenefinitNames() {
    const treatmentNames = await this.treatmentModel.distinct('name');

    const treatmentBenefitNames =
      await this.treatmentBenefitModel.distinct('title');

    const treatmentBenefitNamesOnly = treatmentBenefitNames.map((title) =>
      this.normalizeSourceTitle(title),
    );

    const combined = [
      ...new Set([...treatmentNames, ...treatmentBenefitNamesOnly]),
    ].map((item) => item.trim().toLowerCase());

    const displayCombined = [
      ...new Set(
        [...treatmentNames, ...treatmentBenefitNamesOnly].map((item) =>
          item.trim(),
        ),
      ),
    ];

    return { combined, displayCombined };
  }

  // ✅ SOURCE
  private async getQuestionSource(dto: CreateTreatmentResponseDto) {
    if (dto.treatmentBenefit) {
      const tb = await this.treatmentBenefitModel.findById(
        dto.treatmentBenefit,
      );
      if (!tb) throw new HttpException('Treatment benefit not found', 404);

      return {
        sourceType: 'treatmentBenefit' as const,
        source: tb,
        sourceId: tb._id,
        sourceTitle: this.normalizeSourceTitle(tb.title),
        category: tb.category,
      };
    }

    if (dto.treatment) {
      const t = await this.treatmentModel.findById(dto.treatment);
      if (!t) throw new HttpException('Treatment not found', 404);

      return {
        sourceType: 'treatment' as const,
        source: t,
        sourceId: t._id,
        sourceTitle: t.name,
        category: t.category,
      };
    }

    throw new HttpException('Treatment or Benefit required', 400);
  }

  // ✅ NORMALIZE
  private normalizeSelectedAnswer(selectedAnswer: string) {
    return selectedAnswer.replace(/\s*[—-]\s*\d+\s*$/, '').trim();
  }

  private normalizeSourceTitle(title: string) {
    return title.includes('From ') ? title.split('From ').pop()!.trim() : title;
  }

  private normalizeText(value?: string) {
    return value?.trim().toLowerCase() || '';
  }

  private stripHtml(html?: string) {
    if (!html) return '';

    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h\d|li|ol|ul)>/gi, '\n')
      .replace(/<li>/gi, '• ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\r/g, '')
      .replace(/\n{2,}/g, '\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  private extractBenefitBullets(description?: string) {
    const cleaned = this.stripHtml(description);

    if (!cleaned) return [];

    const lines = cleaned
      .split('\n')
      .map((line) => line.replace(/^[•✓\-\d.()\s]+/, '').trim())
      .filter(Boolean);

    const prioritized = lines.filter(
      (line) =>
        line.length > 12 &&
        !/^common /i.test(line) &&
        !/^why /i.test(line) &&
        !/^how /i.test(line) &&
        !/^a simple lab test/i.test(line) &&
        !/^when prescribed/i.test(line) &&
        !/^when guided/i.test(line),
    );

    return [...new Set((prioritized.length ? prioritized : lines).slice(0, 4))];
  }

  private buildReasoningSummary(
    evaluatedAnswers: Array<{
      question: string;
      selectedAnswer: string;
      score: number;
    }>,
  ) {
    const strongestAnswers = [...evaluatedAnswers]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const answerHighlights = strongestAnswers.map(
      (item) => `${item.question} -> ${item.selectedAnswer}`,
    );

    return {
      strongestAnswers,
      answerHighlights,
    };
  }

  private getSourceLabel(sourceType: 'treatment' | 'treatmentBenefit') {
    return sourceType === 'treatmentBenefit'
      ? 'treatment benefit assessment'
      : 'treatment';
  }

  private buildGeneratedNarrative(params: {
    title: string;
    category?: string;
    sourceType: 'treatment' | 'treatmentBenefit';
    matchPercentage: number;
    keyBenefits: string[];
    answerHighlights: string[];
  }) {
    const sourceLabel = this.getSourceLabel(params.sourceType);
    const categoryText = params.category ? ` in ${params.category}` : '';
    const intro =
      params.matchPercentage >= 70
        ? `Based on your answers, ${params.title} looks like a strong-fit ${sourceLabel}${categoryText}.`
        : params.matchPercentage >= 40
          ? `Based on your answers, ${params.title} appears to be a possible-fit ${sourceLabel}${categoryText}.`
          : `Based on your answers, ${params.title} is not the strongest ${sourceLabel}${categoryText}, but it still connects to some of your current symptoms.`;

    const answerText = params.answerHighlights.length
      ? `Your response pattern points here because of ${params.answerHighlights.join(', ')}.`
      : `Your selected answers align with the symptom pattern used for ${params.title}.`;

    const benefitText = params.keyBenefits.length
      ? `${params.title} may help by ${params.keyBenefits
          .slice(0, 3)
          .map((item) => item.charAt(0).toLowerCase() + item.slice(1))
          .join(', ')}.`
      : `${params.title} may help address the concerns reflected in your answers.`;

    return `${intro} ${answerText} ${benefitText}`.trim();
  }

  private async generateAiTreatmentSummary(params: {
    treatmentTitle: string;
    category?: string;
    sourceType: 'treatment' | 'treatmentBenefit';
    matchPercentage: number;
    description?: string;
    keyBenefits: string[];
    answerHighlights: string[];
    fallbackText: string;
  }) {
    try {
      const cleanDescription = this.stripHtml(params.description).slice(0, 1200);
      const prompt = [
        `Treatment/Benefit Name: ${params.treatmentTitle}`,
        `Category: ${params.category || 'N/A'}`,
        `Type: ${params.sourceType}`,
        `Match Percentage: ${params.matchPercentage}%`,
        params.answerHighlights.length
          ? `Patient Answer Highlights: ${params.answerHighlights.join('; ')}`
          : 'Patient Answer Highlights: N/A',
        params.keyBenefits.length
          ? `Key Benefits: ${params.keyBenefits.join('; ')}`
          : 'Key Benefits: N/A',
        cleanDescription ? `Description: ${cleanDescription}` : 'Description: N/A',
      ].join('\n');

      const aiText = await getChatCompletion([
        {
          role: 'system',
          content:
            'You write short treatment result summaries for a health assessment API. Write one concise paragraph in simple, clear English. Mention the treatment or treatment benefit name naturally, explain why it matches the answers, and mention likely support/benefits. Do not promise outcomes. Do not use markdown, bullets, greetings, or disclaimers.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      return aiText?.trim() || params.fallbackText;
    } catch {
      return params.fallbackText;
    }
  }

  // ✅ 1–10 → % (20–100 STEP)
  private convertRawScoreToPercentage(rawScore: number) {
    const percentage =
      ((rawScore - RAW_SCORE_MIN) / (RAW_SCORE_MAX - RAW_SCORE_MIN)) * 100;

    const stepped = Math.round(percentage / 5) * 5;

    return Math.min(100, Math.max(20, stepped));
  }

  // ✅ SCORE LOGIC (UPDATED FOR 10 SCALE)
  private getAnswerScore(
    questionData: TreatmentQuestion | undefined,
    selectedAnswer: string,
  ) {
    const normalized =
      this.normalizeSelectedAnswer(selectedAnswer).toLowerCase();

    const weighted = questionData?.optionWeights?.find(
      (o) => this.normalizeSelectedAnswer(o.label).toLowerCase() === normalized,
    );

    if (weighted?.score) return weighted.score;

    const correct = questionData?.answare
      ? this.normalizeSelectedAnswer(questionData.answare).toLowerCase()
      : undefined;

    if (correct === normalized) return 10;

    if (normalized.includes('none')) return 1;

    return 5; // middle score (balanced)
  }

  // ✅ MATCH SUMMARY
  private getMatchSummary(matchPercentage: number): MatchSummary {
    if (matchPercentage >= 70) {
      return {
        level: 'recommended',
        statusBadge: 'Recommended Match',
        title: 'You may be a good fit for this treatment',
        text: `This treatment strongly matches your symptoms.`,
      };
    }

    if (matchPercentage >= 40) {
      return {
        level: 'possible',
        statusBadge: 'Possible Match',
        title: 'This treatment may still help you',
        text: `Partial match found based on your answers.`,
      };
    }

    return {
      level: 'low',
      statusBadge: 'Low Match',
      title: 'This may not be suitable now',
      text: `Try exploring alternative treatments.`,
    };
  }

  private toMatchableSource(
    sourceType: 'treatment' | 'treatmentBenefit',
    doc: TreatmentDocment | TreatmentBenefitDocment,
  ): MatchableSource {
    const sourceTitle =
      sourceType === 'treatment'
        ? (doc as TreatmentDocment).name
        : this.normalizeSourceTitle((doc as TreatmentBenefitDocment).title);

    return {
      sourceType,
      sourceId: String(doc._id),
      sourceTitle,
      category: doc.category,
      description: doc.description,
      source: doc,
    };
  }

  // ✅ EVALUATION (FIXED AVERAGE BUG)
  private evaluateAnswers(
    questionSource: QuestionSource,
    dto: CreateTreatmentResponseDto,
  ) {
    const evaluatedAnswers = dto.answers.map((ans) => {
      const q = questionSource.treatmentQuestions.find(
        (qq) => qq.question === ans.question,
      );

      const raw = this.getAnswerScore(q, ans.selectedAnswer);
      const score = this.convertRawScoreToPercentage(raw);

      return {
        question: ans.question,
        selectedAnswer: this.normalizeSelectedAnswer(ans.selectedAnswer),
        score,
        matchLevel:
          score >= 70 ? 'recommended' : score >= 40 ? 'possible' : 'low',
      };
    });

    const totalQuestions = evaluatedAnswers.length;

    const avg =
      totalQuestions > 0
        ? evaluatedAnswers.reduce((sum, a) => sum + a.score, 0) / totalQuestions
        : 0;

    const matchPercentage = Math.round(avg / 5) * 5;

    return {
      evaluatedAnswers,
      totalQuestions,
      totalScore: matchPercentage,
      averageScore: matchPercentage,
      matchPercentage,
      resultSummary: this.getMatchSummary(matchPercentage),
    };
  }

  private async getAllMatchableSources() {
    const [treatments, treatmentBenefits] = await Promise.all([
      this.treatmentModel
        .find()
        .select('name category description treatmentQuestions'),
      this.treatmentBenefitModel
        .find()
        .select('title category description treatmentQuestions'),
    ]);

    return [
      ...treatments.map((item) => this.toMatchableSource('treatment', item)),
      ...treatmentBenefits.map((item) =>
        this.toMatchableSource('treatmentBenefit', item),
      ),
    ];
  }

  private async getRankedMatches(
    dto: CreateTreatmentResponseDto,
    selectedSource: {
      sourceType: 'treatment' | 'treatmentBenefit';
      sourceId: unknown;
      sourceTitle: string;
      category?: string;
      source: QuestionSource;
    },
  ) {
    const allSources = await this.getAllMatchableSources();
    const selectedSourceId = String(selectedSource.sourceId);
    const selectedCategory = this.normalizeText(selectedSource.category);

    const rankedMatches = allSources
      .filter((item) => {
        if (!selectedCategory) return true;

        return this.normalizeText(item.category) === selectedCategory;
      })
      .map((item) => {
        const evaluation = this.evaluateAnswers(item.source, dto);

        return {
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          sourceTitle: item.sourceTitle,
          category: item.category,
          description: item.description,
          matchPercentage: evaluation.matchPercentage,
          resultSummary: evaluation.resultSummary,
          isSelected:
            item.sourceType === selectedSource.sourceType &&
            item.sourceId === selectedSourceId,
        };
      })
      .sort((a, b) => {
        if (b.matchPercentage !== a.matchPercentage) {
          return b.matchPercentage - a.matchPercentage;
        }

        if (a.isSelected !== b.isSelected) {
          return a.isSelected ? -1 : 1;
        }

        return a.sourceTitle.localeCompare(b.sourceTitle);
      });

    const selectedMatch =
      rankedMatches.find((item) => item.isSelected) ??
      ({
        sourceType: selectedSource.sourceType,
        sourceId: selectedSourceId,
        sourceTitle: selectedSource.sourceTitle,
        category: selectedSource.category,
        description: undefined,
        matchPercentage: 0,
        resultSummary: this.getMatchSummary(0),
        isSelected: true,
      } as const);

    const otherMatches = rankedMatches
      .filter((item) => !item.isSelected && item.matchPercentage >= 40)
      .slice(0, 8)
      .map(({ isSelected: _ignored, ...match }) => match);

    const allMatches = rankedMatches
      .slice(0, 10)
      .map(({ isSelected: _ignored, ...match }) => match);

    return {
      selectedMatch: (({ isSelected: _ignored, ...match }) => match)(
        selectedMatch,
      ),
      otherMatches,
      allMatches,
    };
  }

  private async buildAssessmentSummary(params: {
    treatmentTitle: string;
    category?: string;
    evaluation: ReturnType<TreatmentResponseService['evaluateAnswers']>;
    selectedMatch: RankedMatch;
    otherMatches: RankedMatch[];
  }) {
    const answerSummary = this.buildReasoningSummary(
      params.evaluation.evaluatedAnswers,
    );

    const primaryBenefits = this.extractBenefitBullets(
      params.selectedMatch.description,
    );
    const fallbackGeneratedText = this.buildGeneratedNarrative({
      title: params.selectedMatch.sourceTitle,
      category: params.selectedMatch.category,
      sourceType: params.selectedMatch.sourceType,
      matchPercentage: params.selectedMatch.matchPercentage,
      keyBenefits: primaryBenefits,
      answerHighlights: answerSummary.answerHighlights,
    });
    const generatedText = await this.generateAiTreatmentSummary({
      treatmentTitle: params.selectedMatch.sourceTitle,
      category: params.selectedMatch.category,
      sourceType: params.selectedMatch.sourceType,
      matchPercentage: params.selectedMatch.matchPercentage,
      description: params.selectedMatch.description,
      keyBenefits: primaryBenefits,
      answerHighlights: answerSummary.answerHighlights,
      fallbackText: fallbackGeneratedText,
    });

    const alternativeOptions = await Promise.all(
      params.otherMatches.slice(0, 3).map(async (item) => {
      const benefits = this.extractBenefitBullets(item.description);
      const fallbackAlternativeText = this.buildGeneratedNarrative({
        title: item.sourceTitle,
        category: item.category,
        sourceType: item.sourceType,
        matchPercentage: item.matchPercentage,
        keyBenefits: benefits,
        answerHighlights: answerSummary.answerHighlights,
      });

      return {
        sourceType: item.sourceType,
        title: item.sourceTitle,
        category: item.category,
        matchPercentage: item.matchPercentage,
        description: this.stripHtml(item.description),
        benefits,
        generatedText: await this.generateAiTreatmentSummary({
          treatmentTitle: item.sourceTitle,
          category: item.category,
          sourceType: item.sourceType,
          matchPercentage: item.matchPercentage,
          description: item.description,
          keyBenefits: benefits,
          answerHighlights: answerSummary.answerHighlights,
          fallbackText: fallbackAlternativeText,
        }),
      };
    }),
    );

    const overview =
      params.selectedMatch.matchPercentage >= 70
        ? `Your answers show a strong match for ${params.treatmentTitle}.`
        : params.selectedMatch.matchPercentage >= 40
          ? `Your answers show a possible match for ${params.treatmentTitle}.`
          : `Your answers do not strongly match ${params.treatmentTitle}, but they still point to related options worth reviewing.`;

    const whyItMatches = answerSummary.answerHighlights.length
      ? `This result is mainly based on: ${answerSummary.answerHighlights.join('; ')}.`
      : 'This result is based on the symptoms and severity levels selected in your answers.';

    return {
      overview,
      whyItMatches,
      basedOnCategory: params.category,
      keyBenefits:
        primaryBenefits.length > 0
          ? primaryBenefits
          : ['This option may help address the symptoms reflected in your answers.'],
      selectedTreatmentOrBenefit: {
        sourceType: params.selectedMatch.sourceType,
        title: params.selectedMatch.sourceTitle,
        category: params.selectedMatch.category,
        matchPercentage: params.selectedMatch.matchPercentage,
        description: this.stripHtml(params.selectedMatch.description),
        benefits: primaryBenefits,
        generatedText,
      },
      generatedText,
      alternativeOptions,
    };
  }

  // ✅ SMART PRODUCT MATCH
  private async getRecommendedProducts(
    sources: Array<{
      sourceTitle: string;
      category?: string;
      description?: string;
    }>,
  ) {
    const primarySource = sources[0];
    if (!primarySource) return [];

    const normalizedCategory = this.normalizeText(primarySource.category);
    const normalizedTitle = this.normalizeText(primarySource.sourceTitle);
    const titlePattern = primarySource.sourceTitle
      ? new RegExp(primarySource.sourceTitle.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      : null;
    const categoryPattern = primarySource.category
      ? new RegExp(primarySource.category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      : null;

    if (!normalizedCategory && !normalizedTitle) return [];

    return this.productModel
      .find({
        $or: [
          ...(categoryPattern
            ? [{ category: categoryPattern }]
            : []),
          ...(titlePattern
            ? [
                { category: titlePattern },
                { name: titlePattern },
              ]
            : []),
        ],
      })
      .limit(8)
      .sort({ createdAt: -1 })
      .select('name category description price image');
  }

  private buildCompactResponse(params: {
    treatmentTitle: string;
    evaluation: ReturnType<TreatmentResponseService['evaluateAnswers']>;
    assessmentSummary: Awaited<
      ReturnType<TreatmentResponseService['buildAssessmentSummary']>
    >;
    selectedMatch: RankedMatch;
    recommendedProducts: ProductDocument[];
    persistedResult?: object;
  }) {
    const topProduct = params.recommendedProducts[0] || null;

    return {
      ...(params.persistedResult || {}),
      treatmentTitle: params.treatmentTitle,
      matchPercentage: params.evaluation.matchPercentage,
      resultSummary: params.evaluation.resultSummary,
      assessmentSummary: {
        overview: params.assessmentSummary.overview,
        whyItMatches: params.assessmentSummary.whyItMatches,
        keyBenefits: params.assessmentSummary.keyBenefits,
        generatedText: params.assessmentSummary.generatedText,
      },
      bestMatch: {
        sourceType: params.selectedMatch.sourceType,
        title: params.selectedMatch.sourceTitle,
        category: params.selectedMatch.category,
        matchPercentage: params.selectedMatch.matchPercentage,
      },
      recommendedProduct: topProduct,
    };
  }

  // ✅ PREVIEW
  async previewResponse(dto: CreateTreatmentResponseDto) {
    const source = await this.getQuestionSource(dto);

    const evaluation = this.evaluateAnswers(source.source, dto);

    const rankedMatches = await this.getRankedMatches(dto, source);
    const assessmentSummary = await this.buildAssessmentSummary({
      treatmentTitle: source.sourceTitle,
      category: source.category,
      evaluation,
      selectedMatch: rankedMatches.selectedMatch,
      otherMatches: rankedMatches.otherMatches,
    });

    const products = await this.getRecommendedProducts([
      {
        sourceTitle: source.sourceTitle,
        category: source.category,
        description: assessmentSummary.selectedTreatmentOrBenefit.description,
      },
    ]);

    return this.buildCompactResponse({
      treatmentTitle: source.sourceTitle,
      evaluation,
      assessmentSummary,
      selectedMatch: rankedMatches.selectedMatch,
      recommendedProducts: products,
    });
  }

  // ✅ SUBMIT
  async submitResponse(userId: string, dto: CreateTreatmentResponseDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);

    const source = await this.getQuestionSource(dto);

    const evaluation = this.evaluateAnswers(source.source, dto);

    const rankedMatches = await this.getRankedMatches(dto, source);
    const assessmentSummary = await this.buildAssessmentSummary({
      treatmentTitle: source.sourceTitle,
      category: source.category,
      evaluation,
      selectedMatch: rankedMatches.selectedMatch,
      otherMatches: rankedMatches.otherMatches,
    });

    const products = await this.getRecommendedProducts([
      {
        sourceTitle: source.sourceTitle,
        category: source.category,
        description: assessmentSummary.selectedTreatmentOrBenefit.description,
      },
    ]);

    const result = await this.responseModel.create({
      user: user._id,
      treatment:
        source.sourceType === 'treatment' ? source.sourceId : undefined,
      treatmentBenefit:
        source.sourceType === 'treatmentBenefit' ? source.sourceId : undefined,
      answers: evaluation.evaluatedAnswers,
      totalQuestions: evaluation.totalQuestions,
      totalScore: evaluation.totalScore,
      averageScore: evaluation.averageScore,
      matchPercentage: evaluation.matchPercentage,
      resultSummary: evaluation.resultSummary,
      isCompleted: true,
    });

    return this.buildCompactResponse({
      treatmentTitle: source.sourceTitle,
      evaluation,
      assessmentSummary,
      selectedMatch: rankedMatches.selectedMatch,
      recommendedProducts: products,
      persistedResult: result.toObject(),
    });
  }

  // ✅ DASHBOARD
  async myDashboard(userId: string) {
    return this.responseModel
      .find({ user: userId })
      .populate('treatmentBenefit', 'title category')
      .populate('treatment', 'name category');
  }
}
