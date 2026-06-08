function Icon({
  d,
  size = 16,
  stroke = "currentColor",
  fill = "none",
  strokeWidth = 1.5,
  className,
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
export default Icon;
