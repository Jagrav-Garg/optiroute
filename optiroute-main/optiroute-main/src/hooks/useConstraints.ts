import { useTrip } from '../context/TripContext';

export function useConstraints() {
  const { currentTrip } = useTrip();
  const constraints = currentTrip.constraints || [];

  const satisfiedCount = constraints.filter((c) => c.status === 'satisfied').length;
  const conflictCount = constraints.filter((c) => c.status === 'conflict_detected').length;
  const totalCount = constraints.length;

  return {
    constraints,
    satisfiedCount,
    conflictCount,
    totalCount,
    allSatisfied: conflictCount === 0 && satisfiedCount === totalCount,
    validationReport: currentTrip.validation
  };
}
