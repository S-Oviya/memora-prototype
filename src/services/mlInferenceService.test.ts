// @ts-nocheck
import { CognitiveMLInferenceService } from './mlInferenceService';

function runTests() {
  console.log('Testing ML Inference Service...');

  const rawFeatures = [70, 1, 30, 1, 0, 0, 3, 0];
  const result = CognitiveMLInferenceService.predictFromFeatures(rawFeatures);

  // 1. predicted difficulty is between 1 and 5
  if (!(result.predictedDifficulty >= 1 && result.predictedDifficulty <= 5)) {
    throw new Error(`Test 1 Failed: predictedDifficulty was ${result.predictedDifficulty}`);
  }
  console.log('✔ Test 1 passed: predicted difficulty is between 1 and 5');

  // 2. exactly 5 probabilities are returned
  if (!Array.isArray(result.probabilities) || result.probabilities.length !== 5) {
    throw new Error(`Test 2 Failed: expected 5 probabilities, got ${result.probabilities?.length}`);
  }
  console.log('✔ Test 2 passed: exactly 5 probabilities returned');

  // 3. probabilities are valid and sum approximately to 1
  let sum = 0;
  for (const prob of result.probabilities) {
    if (typeof prob !== 'number' || isNaN(prob) || prob < 0 || prob > 1) {
      throw new Error(`Test 3 Failed: invalid probability value ${prob}`);
    }
    sum += prob;
  }
  if (Math.abs(sum - 1.0) > 1e-4) {
    throw new Error(`Test 3 Failed: probabilities sum to ${sum}, expected ~1.0`);
  }
  console.log('✔ Test 3 passed: probabilities are valid and sum to ~1.0');

  console.log('\nAll 3 tests passed successfully!');
}

runTests();

