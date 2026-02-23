import SearchIcon from "../components/SearchIcon";

export default function Home() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "flex-start",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <SearchIcon />
    </div>
  );
}