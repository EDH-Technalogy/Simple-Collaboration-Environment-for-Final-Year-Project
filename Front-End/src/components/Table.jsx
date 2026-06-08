import clsx from "clsx";

/**
 * Wrapper + overflow; optional toolbar surface above the grid (`TableToolbar`).
 */
function Table({ children, className, toolbar = null }) {
  return (
    <div className="table-advanced-shell">
      {toolbar}
      <div className="table-advanced-scroll no-scrollbar">
        <table className={clsx("min-w-full table-auto border-collapse", className)}>
          {children}
        </table>
      </div>
    </div>
  );
}

export default Table;
