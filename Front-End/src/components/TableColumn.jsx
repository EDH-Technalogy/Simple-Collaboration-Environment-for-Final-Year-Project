import clsx from "clsx";

function TableColumn({ children, className, colSpan, nowrap = true }) {
  return (
    <td
      className={clsx(
        "table-advanced-td",
        nowrap !== false && "whitespace-nowrap",
        className,
      )}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
}

export default TableColumn;
