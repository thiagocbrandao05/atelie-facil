export type ForecastResult = {
  predicted: number
  trend: 'up' | 'down' | 'stable'
  confidence: number // 0-1
}

/**
 * Calculates a simple moving average
 */
export function calculateMovingAverage(data: number[], window: number = 3): number {
  if (data.length < window) return 0
  const slice = data.slice(-window)
  const sum = slice.reduce((a, b) => a + b, 0)
  return sum / window
}

/**
 * Calculates linear regression to find trend and next value
 */
export function calculateLinearRegression(data: number[]): { nextValue: number; slope: number } {
  const n = data.length
  if (n === 0) return { nextValue: 0, slope: 0 }

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0

  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += data[i]
    sumXY += i * data[i]
    sumXX += i * i
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  const nextValue = slope * n + intercept

  return { nextValue, slope }
}

/**
 * Hybrid forecast: Weighted average of Moving Average and Linear Regression
 */
export function generateForecast(history: number[]): ForecastResult {
  // Need at least 2 points for trend, ideally 3+
  if (history.length < 2) {
    return {
      predicted: history.length > 0 ? history[0] : 0,
      trend: 'stable',
      confidence: 0.1,
    }
  }

  const ma = calculateMovingAverage(history, 3) || calculateMovingAverage(history, history.length)
  const { nextValue: lr, slope } = calculateLinearRegression(history)

  // Weighted: 40% MA, 60% Trend (Trend is usually better for short-term if clean)
  // But for volatile sales, MA might be safer. Let's do 50/50.
  const predicted = Math.max(0, (ma + lr) / 2)

  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (slope > 0.5) trend = 'up'
  if (slope < -0.5) trend = 'down'

  // Confidence heuristic based on variance or data points
  const confidence = Math.min(0.9, history.length * 0.15) // More data = more confidence

  return {
    predicted: Math.round(predicted),
    trend,
    confidence,
  }
}
