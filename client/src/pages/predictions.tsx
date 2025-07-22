import React from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, RefreshCw, AlertCircle, Target, Lightbulb } from 'lucide-react';
import { useLocation } from 'wouter';
import { useWellnessPredictionsV2 } from '@/hooks/use-wellness-predictions-v2';

export function PredictionsPage() {
  const [, navigate] = useLocation();
  const { predictions, isLoading, refreshPredictions } = useWellnessPredictionsV2();

  const handleBackClick = () => {
    navigate('/?dashboard=open');
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getTrendColor = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return 'text-green-400';
      case 'decreasing':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-green-400';
    if (confidence >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getWellnessScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div style={{ background: "hsl(222, 47%, 11%)" }} className="min-h-screen text-white p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={handleBackClick} className="flex items-center space-x-2 px-3 py-2 hover:bg-slate-700 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
              <span className="text-white text-sm">Back</span>
            </button>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              <h1 className="text-xl font-bold">Wellness Predictions</h1>
            </div>
            <div className="w-10" />
          </div>

          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Analyzing your wellness data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!predictions) {
    return (
      <div style={{ background: "hsl(222, 47%, 11%)" }} className="min-h-screen text-white p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={handleBackClick} className="flex items-center space-x-2 px-3 py-2 hover:bg-slate-700 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
              <span className="text-white text-sm">Back</span>
            </button>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              <h1 className="text-xl font-bold">Wellness Predictions</h1>
            </div>
            <button
              onClick={refreshPredictions}
              className="p-2 hover:bg-slate-700 rounded-xl transition-colors"
            >
              <RefreshCw className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium mb-2">Unable to Generate Predictions</h2>
            <p className="text-slate-400 mb-4">
              There was an error analyzing your wellness data. Please try refreshing or check back later.
            </p>
            <button
              onClick={refreshPredictions}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "hsl(222, 47%, 11%)" }} className="min-h-screen text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={handleBackClick} className="flex items-center space-x-2 px-3 py-2 hover:bg-slate-700 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
            <span className="text-white text-sm">Back</span>
          </button>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold">Wellness Predictions</h1>
          </div>
          <button
            onClick={refreshPredictions}
            className="p-2 hover:bg-slate-700 rounded-xl transition-colors"
            title="Refresh predictions"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Overall Wellness Score */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <div className="text-center mb-4">
            <h2 className="text-lg font-medium mb-2">Overall Wellness Score</h2>
            <div className="flex items-center justify-center space-x-4">
              <div className={`text-3xl font-bold ${getWellnessScoreColor(predictions.overallWellness.score)}`}>
                {Math.round(predictions.overallWellness.score)}
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(predictions.overallWellness.trend === 'improving' ? 'increasing' : 
                               predictions.overallWellness.trend === 'declining' ? 'decreasing' : 'stable')}
                <span className={`text-sm ${getTrendColor(predictions.overallWellness.trend === 'improving' ? 'increasing' : 
                                                          predictions.overallWellness.trend === 'declining' ? 'decreasing' : 'stable')}`}>
                  {predictions.overallWellness.trend}
                </span>
              </div>
            </div>
          </div>

          {/* Key Factors */}
          <div className="mb-4">
            <h3 className="font-medium mb-2 flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span>Key Factors</span>
            </h3>
            {predictions.overallWellness.keyFactors.map((factor, index) => (
              <div key={index} className="text-sm text-slate-300 mb-1">
                • {factor}
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="font-medium mb-2 flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span>Recommendations</span>
            </h3>
            {predictions.overallWellness.recommendations.map((recommendation, index) => (
              <div key={index} className="text-sm text-slate-300 mb-1">
                • {recommendation}
              </div>
            ))}
          </div>
        </div>

        {/* Individual Predictions */}
        <div className="space-y-4">
          {/* Workout Trend */}
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">{predictions.workoutTrend.metric}</h3>
              <div className="flex items-center space-x-2">
                {getTrendIcon(predictions.workoutTrend.trend)}
                <span className={`text-sm ${getConfidenceColor(predictions.workoutTrend.confidence)}`}>
                  {Math.round(predictions.workoutTrend.confidence)}% confidence
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{Math.round(predictions.workoutTrend.currentValue)}</div>
                <div className="text-xs text-slate-400">Current</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-400">{Math.round(predictions.workoutTrend.predicted7Days)}</div>
                <div className="text-xs text-slate-400">7 Days</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-400">{Math.round(predictions.workoutTrend.predicted30Days)}</div>
                <div className="text-xs text-slate-400">30 Days</div>
              </div>
            </div>
            <p className="text-sm text-slate-300">{predictions.workoutTrend.recommendation}</p>
          </div>

          {/* Energy Trend */}
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">{predictions.energyTrend.metric}</h3>
              <div className="flex items-center space-x-2">
                {getTrendIcon(predictions.energyTrend.trend)}
                <span className={`text-sm ${getConfidenceColor(predictions.energyTrend.confidence)}`}>
                  {Math.round(predictions.energyTrend.confidence)}% confidence
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{predictions.energyTrend.currentValue.toFixed(1)}</div>
                <div className="text-xs text-slate-400">Current</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-400">{predictions.energyTrend.predicted7Days.toFixed(1)}</div>
                <div className="text-xs text-slate-400">7 Days</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-400">{predictions.energyTrend.predicted30Days.toFixed(1)}</div>
                <div className="text-xs text-slate-400">30 Days</div>
              </div>
            </div>
            <p className="text-sm text-slate-300">{predictions.energyTrend.recommendation}</p>
          </div>

          {/* Hydration Trend */}
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">{predictions.hydrationTrend.metric}</h3>
              <div className="flex items-center space-x-2">
                {getTrendIcon(predictions.hydrationTrend.trend)}
                <span className={`text-sm ${getConfidenceColor(predictions.hydrationTrend.confidence)}`}>
                  {Math.round(predictions.hydrationTrend.confidence)}% confidence
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{Math.round(predictions.hydrationTrend.currentValue)}</div>
                <div className="text-xs text-slate-400">Current</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-400">{Math.round(predictions.hydrationTrend.predicted7Days)}</div>
                <div className="text-xs text-slate-400">7 Days</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-400">{Math.round(predictions.hydrationTrend.predicted30Days)}</div>
                <div className="text-xs text-slate-400">30 Days</div>
              </div>
            </div>
            <p className="text-sm text-slate-300">{predictions.hydrationTrend.recommendation}</p>
          </div>

          {/* Meditation Trend */}
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">{predictions.meditationTrend.metric}</h3>
              <div className="flex items-center space-x-2">
                {getTrendIcon(predictions.meditationTrend.trend)}
                <span className={`text-sm ${getConfidenceColor(predictions.meditationTrend.confidence)}`}>
                  {Math.round(predictions.meditationTrend.confidence)}% confidence
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{Math.round(predictions.meditationTrend.currentValue)}</div>
                <div className="text-xs text-slate-400">Current</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-400">{Math.round(predictions.meditationTrend.predicted7Days)}</div>
                <div className="text-xs text-slate-400">7 Days</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-400">{Math.round(predictions.meditationTrend.predicted30Days)}</div>
                <div className="text-xs text-slate-400">30 Days</div>
              </div>
            </div>
            <p className="text-sm text-slate-300">{predictions.meditationTrend.recommendation}</p>
          </div>

          {/* Fasting Trend */}
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">{predictions.fastingTrend.metric}</h3>
              <div className="flex items-center space-x-2">
                {getTrendIcon(predictions.fastingTrend.trend)}
                <span className={`text-sm ${getConfidenceColor(predictions.fastingTrend.confidence)}`}>
                  {Math.round(predictions.fastingTrend.confidence)}% confidence
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{predictions.fastingTrend.currentValue.toFixed(1)}</div>
                <div className="text-xs text-slate-400">Current</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-400">{predictions.fastingTrend.predicted7Days.toFixed(1)}</div>
                <div className="text-xs text-slate-400">7 Days</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-400">{predictions.fastingTrend.predicted30Days.toFixed(1)}</div>
                <div className="text-xs text-slate-400">30 Days</div>
              </div>
            </div>
            <p className="text-sm text-slate-300">{predictions.fastingTrend.recommendation}</p>
          </div>

          {/* Weight Trend (if available) */}
          {predictions.weightTrend && (
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">{predictions.weightTrend.metric}</h3>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(predictions.weightTrend.trend)}
                  <span className={`text-sm ${getConfidenceColor(predictions.weightTrend.confidence)}`}>
                    {Math.round(predictions.weightTrend.confidence)}% confidence
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">{predictions.weightTrend.currentValue.toFixed(1)}</div>
                  <div className="text-xs text-slate-400">Current</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-400">{predictions.weightTrend.predicted7Days.toFixed(1)}</div>
                  <div className="text-xs text-slate-400">7 Days</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-400">{predictions.weightTrend.predicted30Days.toFixed(1)}</div>
                  <div className="text-xs text-slate-400">30 Days</div>
                </div>
              </div>
              <p className="text-sm text-slate-300">{predictions.weightTrend.recommendation}</p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-slate-800 rounded-xl">
          <p className="text-xs text-slate-400 text-center">
            Predictions are based on your historical wellness data using machine learning algorithms. 
            Results improve with more consistent data logging.
          </p>
        </div>
      </div>
    </div>
  );
}