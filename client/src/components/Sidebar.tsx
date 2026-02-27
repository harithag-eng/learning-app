import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCategory } from "../features/ui/uiSlice";

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((s) => s.categories.items);
  const selected = useAppSelector((s) => s.ui.selectedCategorySlug);

  return (
    <aside className="w-64 bg-white border-r h-screen flex flex-col">
      {/* User header */}
      <div className="bg-teal-700 text-white p-4 flex items-center gap-3">
        {/* <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
          
        </div> */}
        <div className="font-semibold">
          FullStackDevelopment Journey by Haritha Gudikandula
        </div>
      </div>

      {/* Categories */}
      <div className="p-3 space-y-2">
        {categories.length === 0 ? (
          <div className="text-gray-500 text-sm">Loading categories...</div>
        ) : (
          categories.map((c) => {
            const active = c.slug === selected;
            return (
              <button
                key={c.id}
                onClick={() => dispatch(setCategory(c.slug))}
                className={[
                  "w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition",
                  active
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "hover:bg-gray-50 text-gray-700",
                ].join(" ")}
              >
                <span className="text-blue-500">✳</span>
                <span className="font-medium">{c.name}</span>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-auto p-3 text-gray-500 border-t flex items-center gap-2">
        <span>⚙</span> <span>Settings</span>
      </div>
    </aside>
  );
}
