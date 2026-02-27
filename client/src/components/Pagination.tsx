import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setPage } from "../features/ui/uiSlice";

export default function Pagination() {
  const dispatch = useAppDispatch();
  const page = useAppSelector((s) => s.ui.page);
  const totalPages = useAppSelector((s) => s.questions.totalPages);

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-2">
      <button
        className={[
          "px-3 py-2 rounded border",
          page === 1
            ? "bg-white text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-50",
        ].join(" ")}
        disabled={page === 1}
        onClick={() => dispatch(setPage(page - 1))}
      >
        &lt; Prev
      </button>

      {pages.slice(0, 5).map((p) => (
        <button
          key={p}
          onClick={() => dispatch(setPage(p))}
          className={[
            "w-9 h-9 rounded border",
            p === page ? "bg-blue-600 text-white border-blue-600" : "bg-white",
          ].join(" ")}
        >
          {p}
        </button>
      ))}

      <button
        className={[
          "px-3 py-2 rounded border",
          page === totalPages
            ? "bg-white text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700",
        ].join(" ")}
        disabled={page === totalPages}
        onClick={() => dispatch(setPage(page + 1))}
      >
        Next &gt;
      </button>
    </div>
  );
}
