// Wellness Trend Prediction using Machine Learning
// Simple linear regression and trend analysis for wellness data

export interface WellnessDataPoint {
  date: string;
  workoutReps: number;
  energyLevel: number;
  hydrationLevel: number;
  meditationMinutes: number;
  fastingHours: number;
  weight?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    biceps?: number;
    thighs?: number;
  };
}

export interface TrendPrediction {
  metric: string;
  currentValue: number;
  predicted7Days: number;
  predicted30Days: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number; // 0-100
  recommendation: string;
}

export interface WellnessPredictions {
  workoutTrend: TrendPrediction;
  energyTrend: TrendPrediction;
  hydrationTrend: TrendPrediction;
  meditationTrend: TrendPrediction;
  fastingTrend: TrendPrediction;
  weightTrend?: TrendPrediction;
  overallWellness: {
    score: number; // 0-100
    trend: 'improving' | 'declining' | 'stable';
    keyFactors: string[];
    recommendations: string[];
  };
}

class WellnessMLPredictor {
  // Simple linear regression
  private linearRegression(xValues: number[], yValues: number[]): { slope: number; intercept: number; r2: number } {
    const n = xValues.length;
    if (n === 0) return { slope: 0, intercept: 0, r2: 0 };

    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const totalSumSquares = yValues.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
    const residualSumSquares = yValues.reduce((sum, y, i) => {
      const predicted = slope * xValues[i] + intercept;
      return sum + (y - predicted) ** 2;
    }, 0);

    const r2 = totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);

    return { slope, intercept, r2: Math.max(0, r2) };
  }

  // Moving average for smoothing data
  private movingAverage(data: number[], windowSize: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = data.slice(start, i + 1);
      const average = window.reduce((sum, val) => sum + val, 0) / window.length;
      result.push(average);
    }
    return result;
  }

  // Detect trend direction
  private getTrendDirection(slope: number, threshold: number = 0.1): 'increasing' | 'decreasing' | 'stable' {
    if (slope > threshold) return 'increasing';
    if (slope < -threshold) return 'decreasing';
    return 'stable';
  }

  // Generate confidence score based on data quality
  private calculateConfidence(dataPoints: number, r2: number, variance: number): number {
    let confidence = 0;

    // Data quantity factor (more data = higher confidence)
    const quantityFactor = Math.min(dataPoints / 30, 1) * 40; // Max 40 points

    // R-squared factor (better fit = higher confidence)
    const fitFactor = r2 * 30; // Max 30 points

    // Variance factor (less variance = higher confidence)
    const varianceFactor = Math.max(0, 30 - variance * 10); // Max 30 points

    confidence = quantityFactor + fitFactor + varianceFactor;
    return Math.min(100, Math.max(10, confidence));
  }

  // Predict single metric trend
  private predictMetricTrend(
    data: number[],
    metric: string,
    unit: string = ''
  ): TrendPrediction {
    if (data.length < 3) {
      return {
        metric,
        currentValue: data[data.length - 1] || 0,
        predicted7Days: data[data.length - 1] || 0,
        predicted30Days: data[data.length - 1] || 0,
        trend: 'stable',
        confidence: 10,
        recommendation: `Need more ${metric.toLowerCase()} data for accurate predictions. Keep logging daily!`
      };
    }

    // Create time series (days from start)
    const xValues = data.map((_, index) => index);
    const smoothedData = this.movingAverage(data, Math.min(7, Math.ceil(data.length / 3)));

    // Perform linear regression
    const { slope, intercept, r2 } = this.linearRegression(xValues, smoothedData);

    // Calculate predictions
    const currentDay = data.length - 1;
    const predicted7Days = slope * (currentDay + 7) + intercept;
    const predicted30Days = slope * (currentDay + 30) + intercept;

    // Calculate variance for confidence
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + (val - mean) ** 2, 0) / data.length;
    const normalizedVariance = variance / (mean ** 2 || 1);

    const trend = this.getTrendDirection(slope);
    const confidence = this.calculateConfidence(data.length, r2, normalizedVariance);

    // Generate recommendations
    let recommendation = '';
    switch (trend) {
      case 'increasing':
        recommendation = `Great job! Your ${metric.toLowerCase()} is trending upward. Keep up the excellent work!`;
        break;
      case 'decreasing':
        recommendation = `Your ${metric.toLowerCase()} is declining. Consider adjusting your routine to reverse this trend.`;
        break;
      case 'stable':
        recommendation = `Your ${metric.toLowerCase()} is stable. Try setting small goals to create positive momentum.`;
        break;
    }

    return {
      metric,
      currentValue: data[data.length - 1],
      predicted7Days: Math.max(0, predicted7Days),
      predicted30Days: Math.max(0, predicted30Days),
      trend,
      confidence,
      recommendation
    };
  }

  // Calculate overall wellness score
  private calculateWellnessScore(trends: Omit<WellnessPredictions, 'overallWellness'>): number {
    let score = 50; // Base score

    // Weight different metrics
    const weights = {
      workout: 0.25,
      energy: 0.20,
      hydration: 0.15,
      meditation: 0.15,
      fasting: 0.10,
      weight: 0.15
    };

    // Add points for positive trends
    if (trends.workoutTrend.trend === 'increasing') score += 15 * weights.workout / 0.25;
    else if (trends.workoutTrend.trend === 'decreasing') score -= 10 * weights.workout / 0.25;

    if (trends.energyTrend.trend === 'increasing') score += 15 * weights.energy / 0.20;
    else if (trends.energyTrend.trend === 'decreasing') score -= 10 * weights.energy / 0.20;

    if (trends.hydrationTrend.trend === 'increasing') score += 15 * weights.hydration / 0.15;
    else if (trends.hydrationTrend.trend === 'decreasing') score -= 10 * weights.hydration / 0.15;

    if (trends.meditationTrend.trend === 'increasing') score += 15 * weights.meditation / 0.15;
    else if (trends.meditationTrend.trend === 'decreasing') score -= 10 * weights.meditation / 0.15;

    if (trends.fastingTrend.trend === 'increasing') score += 15 * weights.fasting / 0.10;
    else if (trends.fastingTrend.trend === 'decreasing') score -= 10 * weights.fasting / 0.10;

    if (trends.weightTrend && trends.weightTrend.trend === 'decreasing') score += 15 * weights.weight / 0.15; // Weight loss is positive
    else if (trends.weightTrend && trends.weightTrend.trend === 'increasing') score -= 10 * weights.weight / 0.15;

    return Math.min(100, Math.max(0, score));
  }

  // Generate key factors and recommendations
  private generateInsights(trends: Omit<WellnessPredictions, 'overallWellness'>): {
    keyFactors: string[];
    recommendations: string[];
  } {
    const keyFactors: string[] = [];
    const recommendations: string[] = [];

    // Analyze trends and generate insights
    const trendEntries = Object.entries(trends) as [keyof typeof trends, TrendPrediction][];
    const improvingTrends = trendEntries.filter(([, trend]) => trend.trend === 'increasing');
    const decliningTrends = trendEntries.filter(([, trend]) => trend.trend === 'decreasing');

    if (improvingTrends.length > 0) {
      keyFactors.push(`${improvingTrends.length} metrics improving: ${improvingTrends.map(([key]) => key.replace('Trend', '')).join(', ')}`);
    }

    if (decliningTrends.length > 0) {
      keyFactors.push(`${decliningTrends.length} metrics declining: ${decliningTrends.map(([key]) => key.replace('Trend', '')).join(', ')}`);
    }

    // High confidence predictions
    const highConfidenceTrends = trendEntries.filter(([, trend]) => trend.confidence > 70);
    if (highConfidenceTrends.length > 0) {
      keyFactors.push(`High confidence predictions for: ${highConfidenceTrends.map(([key]) => key.replace('Trend', '')).join(', ')}`);
    }

    // Generate specific recommendations
    if (trends.energyTrend.trend === 'decreasing') {
      recommendations.push('Focus on sleep quality and stress management to boost energy levels');
    }

    if (trends.workoutTrend.trend === 'decreasing') {
      recommendations.push('Try varying your workout routine or reducing intensity to maintain consistency');
    }

    if (trends.hydrationTrend.trend === 'decreasing') {
      recommendations.push('Set hydration reminders throughout the day to improve water intake');
    }

    if (trends.meditationTrend.trend === 'decreasing') {
      recommendations.push('Start with just 5 minutes daily to rebuild your meditation habit');
    }

    // Positive reinforcement
    if (improvingTrends.length >= 3) {
      recommendations.push('Excellent progress! Your consistent efforts are paying off across multiple areas');
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep maintaining your current routine while gradually introducing small improvements');
    }

    return { keyFactors, recommendations };
  }

  // Main prediction method
  public predictWellnessTrends(historicalData: WellnessDataPoint[]): WellnessPredictions {
    if (historicalData.length === 0) {
      // Return empty predictions for no data
      const emptyTrend: TrendPrediction = {
        metric: '',
        currentValue: 0,
        predicted7Days: 0,
        predicted30Days: 0,
        trend: 'stable',
        confidence: 0,
        recommendation: 'Start logging your wellness data to get personalized predictions!'
      };

      return {
        workoutTrend: { ...emptyTrend, metric: 'Workout Reps' },
        energyTrend: { ...emptyTrend, metric: 'Energy Level' },
        hydrationTrend: { ...emptyTrend, metric: 'Hydration' },
        meditationTrend: { ...emptyTrend, metric: 'Meditation' },
        fastingTrend: { ...emptyTrend, metric: 'Fasting' },
        overallWellness: {
          score: 50,
          trend: 'stable',
          keyFactors: ['No data available'],
          recommendations: ['Start tracking your daily wellness activities to unlock personalized insights!']
        }
      };
    }

    // Extract time series data for each metric
    const workoutData = historicalData.map(d => d.workoutReps);
    const energyData = historicalData.map(d => d.energyLevel);
    const hydrationData = historicalData.map(d => d.hydrationLevel);
    const meditationData = historicalData.map(d => d.meditationMinutes);
    const fastingData = historicalData.map(d => d.fastingHours);
    const weightData = historicalData.map(d => d.weight).filter(w => w !== undefined) as number[];

    // Generate predictions for each metric
    const workoutTrend = this.predictMetricTrend(workoutData, 'Workout Reps');
    const energyTrend = this.predictMetricTrend(energyData, 'Energy Level');
    const hydrationTrend = this.predictMetricTrend(hydrationData, 'Hydration Level');
    const meditationTrend = this.predictMetricTrend(meditationData, 'Meditation Minutes');
    const fastingTrend = this.predictMetricTrend(fastingData, 'Fasting Hours');
    const weightTrend = weightData.length >= 3 ? this.predictMetricTrend(weightData, 'Weight', 'lbs') : undefined;

    const trends = {
      workoutTrend,
      energyTrend,
      hydrationTrend,
      meditationTrend,
      fastingTrend,
      ...(weightTrend && { weightTrend })
    };

    // Calculate overall wellness score and insights
    const wellnessScore = this.calculateWellnessScore(trends);
    const { keyFactors, recommendations } = this.generateInsights(trends);

    let overallTrend: 'improving' | 'declining' | 'stable' = 'stable';
    const improvingCount = Object.values(trends).filter(t => t.trend === 'increasing').length;
    const decliningCount = Object.values(trends).filter(t => t.trend === 'decreasing').length;

    if (improvingCount > decliningCount) overallTrend = 'improving';
    else if (decliningCount > improvingCount) overallTrend = 'declining';

    return {
      ...trends,
      overallWellness: {
        score: wellnessScore,
        trend: overallTrend,
        keyFactors,
        recommendations
      }
    };
  }
}

export const wellnessPredictor = new WellnessMLPredictor();