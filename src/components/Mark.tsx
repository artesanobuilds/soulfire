export function Mark({ large = false }: { large?: boolean }) {
  return (
    <svg
      className={large ? "mark large" : "mark"}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <path
        d="M42 8C20 3 8 22 13 41c4 16 22 21 37 10C31 57 19 46 21 30c1-10 9-18 21-22Z"
        fill="currentColor"
      />
      <path
        d="M35 19c6 15-9 18-6 28 2 6 12 7 16-1-9 4-10-3-5-9 4-5 3-11-5-18Z"
        fill="#B88945"
      />
    </svg>
  );
}
