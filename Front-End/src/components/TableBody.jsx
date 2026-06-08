import clsx from "clsx";

function TableBody({ children, className }) {
  return (
    <tbody className={clsx("table-advanced-tbody", className)}>{children}</tbody>
  );
}

export default TableBody;
