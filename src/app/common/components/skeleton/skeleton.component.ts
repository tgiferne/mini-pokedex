import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Generic shimmering placeholder block used for loading states. Render one or
 * more of these (via `rows`) to reserve layout space while data is in flight.
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly rows = input<number>(1);
  readonly height = input<string>('1rem');
  readonly width = input<string>('100%');

  protected readonly rowIndexes = computed(() => Array.from({ length: this.rows() }));
}
