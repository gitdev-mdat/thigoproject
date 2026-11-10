import { formatCount } from "../format";

type Day = { date: string; placed: number; delivered: number };

const dayMonth = (date: string) => {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
};

/** Placed and delivered orders per calendar day, straight from /admin/overview. */
export function DailyOrdersChart({ days }: { days: Day[] }) {
  const max = Math.max(
    1,
    ...days.flatMap((day) => [day.placed, day.delivered])
  );
  const placed = days.reduce((sum, day) => sum + day.placed, 0);
  const delivered = days.reduce((sum, day) => sum + day.delivered, 0);
  return (
    <figure className="chart">
      <figcaption className="chart-legend">
        <span>
          <i className="legend-swatch placed" aria-hidden="true" />
          Đơn đặt · <strong className="num">{formatCount(placed)}</strong>
        </span>
        <span>
          <i className="legend-swatch delivered" aria-hidden="true" />
          Đã giao · <strong className="num">{formatCount(delivered)}</strong>
        </span>
      </figcaption>
      <div className="chart-plot" role="list">
        {days.map((day, index) => (
          <div
            key={day.date}
            className="chart-day"
            role="listitem"
            aria-label={`${dayMonth(day.date)}: ${day.placed} đơn đặt, ${day.delivered} đơn đã giao`}
          >
            <div className="chart-bars" aria-hidden="true">
              <span
                className="chart-bar placed"
                style={{ height: `${(day.placed / max) * 100}%` }}
                title={`${day.placed} đơn đặt`}
              />
              <span
                className="chart-bar delivered"
                style={{ height: `${(day.delivered / max) * 100}%` }}
                title={`${day.delivered} đơn đã giao`}
              />
            </div>
            <span
              className={`chart-label${index === days.length - 1 ? " today" : ""}`}
            >
              {index === days.length - 1
                ? "Hôm nay"
                : (days.length - 1 - index) % 2 === 0
                  ? dayMonth(day.date)
                  : ""}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}
