import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EChartsCoreOption } from 'echarts/core';
import { NgxEchartsDirective } from 'ngx-echarts';

import { Pokemon } from '../../models/pokemon.model';

const STAT_ORDER: { name: string; label: string }[] = [
  { name: 'hp', label: 'HP' },
  { name: 'attack', label: 'Attack' },
  { name: 'defense', label: 'Defense' },
  { name: 'special-attack', label: 'Sp.Atk' },
  { name: 'special-defense', label: 'Sp.Def' },
  { name: 'speed', label: 'Speed' },
];

const RADAR_MAX = 200;
// Canvas-rendered echarts can't read CSS custom properties, so the accent
// color is duplicated here from styles.scss's --color-primary token.
const CHART_ACCENT_COLOR = '#007acc';

/** Radar chart of a Pokémon's six base stats. Re-renders (and animates) whenever `pokemon` changes. */
@Component({
  selector: 'app-stat-radar-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  templateUrl: './stat-radar-chart.component.html',
  styleUrl: './stat-radar-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatRadarChartComponent {
  readonly pokemon = input.required<Pokemon>();

  protected readonly chartOptions = computed<EChartsCoreOption>(() => {
    const pokemon = this.pokemon();
    const values = STAT_ORDER.map((stat) => pokemon.stats.find((s) => s.name === stat.name)?.baseStat ?? 0);

    return {
      backgroundColor: 'transparent',
      tooltip: {},
      radar: {
        indicator: STAT_ORDER.map((stat) => ({ name: stat.label, max: RADAR_MAX })),
        axisName: { color: 'rgba(255,255,255,0.7)' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
        splitArea: { show: false },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
      },
      series: [
        {
          type: 'radar',
          data: [{ value: values, name: pokemon.name }],
          areaStyle: { opacity: 0.35, color: CHART_ACCENT_COLOR },
          lineStyle: { color: CHART_ACCENT_COLOR },
          itemStyle: { color: CHART_ACCENT_COLOR },
          animationDuration: 500,
          animationEasing: 'cubicOut',
        },
      ],
    };
  });
}
