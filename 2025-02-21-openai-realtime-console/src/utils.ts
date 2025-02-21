export function nowJst() {
	const now = new Date();
	return now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}
