import { CardSamples } from './CardSamples';
import { FormSamples } from './FormSamples';
import { ModalSamples } from './ModalSamples';

export function ComponentsShowcase() {
  return (
    <div className="space-y-12">
      <CardSamples />
      <FormSamples />
      <ModalSamples />
    </div>
  );
}