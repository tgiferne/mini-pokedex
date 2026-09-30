import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Shown when an async view resolved successfully but returned no data. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly message = input<string>('Nothing to show here yet.');
}
