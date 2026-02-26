import { FaEdit, FaTrash } from "react-icons/fa";
import PropTypes from "prop-types";

function EditButton() {
  return (
    <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
      <FaEdit size={14} />
    </button>
  );
}

function DeleteButton({ handleDelete, gameId }) {
  return (
    <button
      onClick={() => handleDelete(gameId)}
      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
    >
      <FaTrash size={14} />
    </button>
  );
}

DeleteButton.propTypes = {
    handleDelete: PropTypes.func.isRequired,
    gameId: PropTypes.number.isRequired
}

export { EditButton, DeleteButton };
