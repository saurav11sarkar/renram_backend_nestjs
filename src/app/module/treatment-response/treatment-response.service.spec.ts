import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TreatmentResponseService } from './treatment-response.service';
import { TreatmentResponse } from './entities/treatment-response.entity';
import { TreatmentBenefit } from '../treatment-benefit/entities/treatment-benefit.entity';
import { Treatment } from '../treatment/entities/treatment.entity';
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';

describe('TreatmentResponseService', () => {
  let service: TreatmentResponseService;

  const responseModel = {
    create: jest.fn(),
    find: jest.fn(),
  };

  const treatmentBenefitModel = {
    findById: jest.fn(),
  };

  const treatmentModel = {
    findById: jest.fn(),
  };

  const productQuery = {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn(),
  };

  const productModel = {
    find: jest.fn(() => productQuery),
  };

  const userModel = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    productQuery.sort.mockReturnThis();
    productQuery.limit.mockReturnThis();
    productQuery.select.mockResolvedValue([
      { _id: 'product-1', name: 'Related Product', category: 'hormone' },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreatmentResponseService,
        {
          provide: getModelToken(TreatmentResponse.name),
          useValue: responseModel,
        },
        {
          provide: getModelToken(TreatmentBenefit.name),
          useValue: treatmentBenefitModel,
        },
        {
          provide: getModelToken(Treatment.name),
          useValue: treatmentModel,
        },
        {
          provide: getModelToken(Product.name),
          useValue: productModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
      ],
    }).compile();

    service = module.get<TreatmentResponseService>(TreatmentResponseService);
  });

  it('returns recommended match and related products from weighted treatment benefit answer', async () => {
    treatmentBenefitModel.findById.mockResolvedValue({
      _id: 'benefit-1',
      title: 'TRT',
      category: 'hormone',
      treatmentQuestions: [
        {
          question: 'Which symptom best describes you?',
          options: ['Low energy', 'None of these apply'],
          optionWeights: [
            { label: 'Low energy', score: 7 },
            { label: 'None of these apply', score: 1 },
          ],
        },
      ],
    });

    const result = await service.previewResponse({
      treatmentBenefit: '507f1f77bcf86cd799439011',
      answers: [
        {
          question: 'Which symptom best describes you?',
          selectedAnswer: 'Low energy',
        },
      ],
    });

    expect(result.sourceType).toBe('treatmentBenefit');
    expect(result.resultSummary.statusBadge).toBe('Recommended Match');
    expect(result.averageScore).toBe(100);
    expect(result.matchPercentage).toBe(100);
    expect(result.recommendedProducts).toHaveLength(1);
    expect(productModel.find).toHaveBeenCalledWith({
      category: {
        $regex: '^hormone$',
        $options: 'i',
      },
    });
  });

  it('supports legacy treatment id and returns low match for none option', async () => {
    treatmentModel.findById.mockResolvedValue({
      _id: 'treatment-1',
      name: 'Weight Loss',
      category: 'metabolic',
      treatmentQuestions: [
        {
          question: 'What are you experiencing?',
          options: ['None of these apply'],
        },
      ],
    });

    const result = await service.previewResponse({
      treatment: '507f1f77bcf86cd799439012',
      answers: [
        {
          question: 'What are you experiencing?',
          selectedAnswer: 'None of these apply',
        },
      ],
    });

    expect(result.sourceType).toBe('treatment');
    expect(result.resultSummary.statusBadge).toBe('Low Match');
    expect(result.averageScore).toBe(0);
    expect(result.matchPercentage).toBe(0);
    expect(productModel.find).toHaveBeenCalledWith({
      category: {
        $regex: '^metabolic$',
        $options: 'i',
      },
    });
  });
});
