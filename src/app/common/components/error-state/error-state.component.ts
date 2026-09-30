import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Shown when an async view failed. Always pairs a user-friendly message with
 * a Retry action — never a raw error dump.
 */
@Component({
  selector: 'app-error-state',
  standalone: true,
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  readonly message = input<string>('Something went wrong. Please try again.');
  readonly retry = output<void>();
}
