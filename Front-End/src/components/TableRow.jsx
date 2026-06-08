import clsx from "clsx";

function TableRow({ children, onClick, className }) {
  const interactive = typeof onClick === "function";

  return (
    <tr
      onClick={onClick}
      className={clsx(
        "table-advanced-tr",
        interactive && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export default TableRow;
