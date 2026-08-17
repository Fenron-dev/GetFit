import { useLocalSearchParams } from 'expo-router';
import RecipeDetailScreen from '../../../mahlzeiten/[id]';

/**
 * Dasselbe Rezept-Detail, aber im Pläne-Stack.
 *
 * Vorher führte ein belegter Slot mit `/mahlzeiten/<id>` in den anderen
 * Tab — und die Zurück-Taste landete dann in der Mahlzeiten-Liste statt
 * beim Plan. Der Screen liegt deshalb zusätzlich hier; die Darstellung
 * ist dieselbe, nur der Weg zurück stimmt.
 */
export default function PlanRecipeRoute() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  return <RecipeDetailScreen idOverride={recipeId} backLabel="Wochenplan" />;
}
