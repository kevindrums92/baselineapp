/**
 * WelcomeOnboardingFlow
 * Router para las 6 pantallas de Welcome Onboarding
 */

import { useParams, Navigate } from 'react-router-dom';
import Screen1_Welcome from './screens/Screen1_Welcome';
import Screen2_QuickRegister from './screens/Screen2_QuickRegister';
import Screen3_BudgetsCalm from './screens/Screen3_BudgetsCalm';
import Screen4_HabitsAnalysis from './screens/Screen4_HabitsAnalysis';
import Screen5_AutomatedMovements from './screens/Screen5_AutomatedMovements';
import Screen6_UnderstandMoney from './screens/Screen6_UnderstandMoney';

const SCREENS = [
  Screen1_Welcome,
  Screen2_QuickRegister,
  Screen3_BudgetsCalm,
  Screen4_HabitsAnalysis,
  Screen5_AutomatedMovements,
  Screen6_UnderstandMoney,
];

export default function WelcomeOnboardingFlow() {
  const { step } = useParams<{ step: string }>();
  const stepNumber = parseInt(step || '1', 10);

  // Validate step number
  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > SCREENS.length) {
    return <Navigate to="/onboarding/welcome/1" replace />;
  }

  // Render only the current screen
  // Navigation and state updates are handled by useOnboardingProgress in individual screens
  const CurrentScreen = SCREENS[stepNumber - 1];
  return <CurrentScreen />;
}
