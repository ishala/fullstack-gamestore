import PropTypes from "prop-types";
import StatCard from "./StatCard";
import { cardsInfo } from "../../utils";

function Cards({ topGapGenre, summary, genreData, isSales }) {
  const cards = cardsInfo(topGapGenre, summary, genreData, isSales)
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
    </div>
  );
}

Cards.propTypes = {
  summary: PropTypes.shape({
    total_games:      PropTypes.number,
    avg_global_price: PropTypes.number,
    total_sales:      PropTypes.number,
    avg_our_price:    PropTypes.number,
  }).isRequired,
  genreData: PropTypes.arrayOf(PropTypes.object).isRequired,
  topGapGenre: PropTypes.string.isRequired,
  isSales: PropTypes.bool.isRequired
};

export default Cards;